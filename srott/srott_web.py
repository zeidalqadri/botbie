#!/usr/bin/env python3
"""
SROTT Web Interface - Browser-based port sniffer dashboard
"""

from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit
import threading
import json
from srott import PortSniffer, ProcessManager
import psutil
import time
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'srott-secret-key'
socketio = SocketIO(app, cors_allowed_origins="*")

# Global state
scan_status = {
    'is_scanning': False,
    'progress': 0,
    'total': 0,
    'results': None,
    'last_scan': None
}

@app.route('/')
def index():
    """Serve the main dashboard page"""
    return render_template('index.html')

@app.route('/api/scan', methods=['POST'])
def start_scan():
    """Start a new port scan"""
    global scan_status
    
    if scan_status['is_scanning']:
        return jsonify({'error': 'Scan already in progress'}), 400
    
    data = request.json
    start_port = data.get('start_port', 1)
    end_port = data.get('end_port', 65535)
    timeout = data.get('timeout', 0.5)
    
    # Start scan in background thread
    thread = threading.Thread(
        target=run_scan, 
        args=(start_port, end_port, timeout)
    )
    thread.daemon = True
    thread.start()
    
    return jsonify({'status': 'started'})

def run_scan(start_port, end_port, timeout):
    """Run the port scan and emit progress updates"""
    global scan_status
    
    scan_status['is_scanning'] = True
    scan_status['progress'] = 0
    scan_status['total'] = end_port - start_port + 1
    
    def progress_callback(completed, total):
        scan_status['progress'] = completed
        socketio.emit('scan_progress', {
            'completed': completed,
            'total': total,
            'percentage': (completed / total) * 100
        })
    
    sniffer = PortSniffer(start_port, end_port, timeout)
    results = sniffer.scan_ports(progress_callback)
    
    # Process results for web display
    processed_results = {
        'open_ports': [],
        'statistics': {
            'total_scanned': results['total_scanned'],
            'open_count': len(results['open']),
            'closed_count': len(results['closed']),
            'scan_time': datetime.now().isoformat()
        }
    }
    
    for port, info in sorted(results['open'].items()):
        port_data = {
            'port': port,
            'is_system': port < 1024,
            'process': {}
        }
        
        if info:
            port_data['process'] = {
                'pid': info.get('pid'),
                'name': info.get('name', 'Unknown'),
                'user': info.get('user', 'N/A'),
                'status': info.get('status', 'N/A'),
                'cmdline': info.get('cmdline', '')
            }
        
        processed_results['open_ports'].append(port_data)
    
    scan_status['results'] = processed_results
    scan_status['last_scan'] = datetime.now()
    scan_status['is_scanning'] = False
    
    socketio.emit('scan_complete', processed_results)

@app.route('/api/results')
def get_results():
    """Get the latest scan results"""
    if scan_status['results']:
        return jsonify(scan_status['results'])
    return jsonify({'error': 'No scan results available'}), 404

@app.route('/api/process/<int:pid>', methods=['POST'])
def manage_process(pid):
    """Manage a process (start, pause, kill)"""
    action = request.json.get('action')
    manager = ProcessManager()
    
    if action == 'start':
        success, msg = manager.start_process(pid)
    elif action == 'pause':
        success, msg = manager.pause_process(pid)
    elif action == 'kill':
        force = request.json.get('force', False)
        success, msg = manager.kill_process(pid, force)
    else:
        return jsonify({'error': 'Invalid action'}), 400
    
    return jsonify({'success': success, 'message': msg})

@app.route('/api/system/info')
def system_info():
    """Get system information"""
    return jsonify({
        'cpu_percent': psutil.cpu_percent(interval=1),
        'memory': {
            'total': psutil.virtual_memory().total,
            'used': psutil.virtual_memory().used,
            'percent': psutil.virtual_memory().percent
        },
        'network_connections': len(psutil.net_connections()),
        'boot_time': psutil.boot_time()
    })

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    emit('connected', {'status': 'Connected to SROTT server'})

if __name__ == '__main__':
    # Create templates directory if it doesn't exist
    import os
    os.makedirs('templates', exist_ok=True)
    
    # Create a basic HTML template if it doesn't exist
    template_path = 'templates/index.html'
    if not os.path.exists(template_path):
        with open(template_path, 'w') as f:
            f.write('''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SROTT - Port Sniffer Dashboard</title>
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: #1a1a2e;
            color: #eee;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #00d4ff;
            font-size: 3em;
            margin-bottom: 10px;
        }
        .controls {
            background: #16213e;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .control-group {
            display: flex;
            gap: 15px;
            align-items: center;
            margin-bottom: 15px;
        }
        input, button {
            padding: 10px 15px;
            border-radius: 5px;
            border: 1px solid #0f3460;
            background: #0f3460;
            color: white;
            font-size: 16px;
        }
        button {
            cursor: pointer;
            background: #00d4ff;
            color: #1a1a2e;
            font-weight: bold;
            transition: all 0.3s;
        }
        button:hover {
            background: #00b4d8;
            transform: translateY(-2px);
        }
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .progress {
            background: #0f3460;
            border-radius: 10px;
            height: 30px;
            margin: 20px 0;
            overflow: hidden;
            display: none;
        }
        .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #00d4ff 0%, #00b4d8 100%);
            width: 0%;
            transition: width 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #1a1a2e;
            font-weight: bold;
        }
        .results {
            background: #16213e;
            padding: 20px;
            border-radius: 10px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: #0f3460;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-card h3 {
            margin: 0;
            color: #00d4ff;
            font-size: 2em;
        }
        .stat-card p {
            margin: 5px 0 0 0;
            opacity: 0.8;
        }
        .ports-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .ports-table th, .ports-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #0f3460;
        }
        .ports-table th {
            background: #0f3460;
            color: #00d4ff;
        }
        .ports-table tr:hover {
            background: #0f3460;
        }
        .system-port {
            color: #ff6b6b;
        }
        .user-port {
            color: #4ecdc4;
        }
        .process-actions {
            display: flex;
            gap: 5px;
        }
        .action-btn {
            padding: 5px 10px;
            font-size: 12px;
            border-radius: 3px;
        }
        .action-btn.pause { background: #ffd93d; }
        .action-btn.start { background: #4ecdc4; }
        .action-btn.kill { background: #ff6b6b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SROTT</h1>
            <p>Personal Port Sniffer Dashboard</p>
        </div>
        
        <div class="controls">
            <div class="control-group">
                <label>Port Range:</label>
                <input type="number" id="startPort" value="1" min="1" max="65535">
                <span>to</span>
                <input type="number" id="endPort" value="65535" min="1" max="65535">
                <button id="scanBtn" onclick="startScan()">Start Scan</button>
            </div>
            <div class="progress" id="progressBar">
                <div class="progress-bar" id="progressFill">0%</div>
            </div>
        </div>
        
        <div class="results" id="results" style="display: none;">
            <h2>Scan Results</h2>
            <div class="stats" id="stats"></div>
            <table class="ports-table" id="portsTable">
                <thead>
                    <tr>
                        <th>Port</th>
                        <th>Type</th>
                        <th>Process</th>
                        <th>PID</th>
                        <th>User</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="portsBody"></tbody>
            </table>
        </div>
    </div>
    
    <script>
        const socket = io();
        let isScanning = false;
        
        socket.on('connect', () => {
            console.log('Connected to SROTT server');
        });
        
        socket.on('scan_progress', (data) => {
            updateProgress(data.percentage);
        });
        
        socket.on('scan_complete', (data) => {
            displayResults(data);
            isScanning = false;
            document.getElementById('scanBtn').disabled = false;
            document.getElementById('scanBtn').textContent = 'Start Scan';
            document.getElementById('progressBar').style.display = 'none';
        });
        
        function startScan() {
            if (isScanning) return;
            
            const startPort = parseInt(document.getElementById('startPort').value);
            const endPort = parseInt(document.getElementById('endPort').value);
            
            if (startPort > endPort) {
                alert('Start port must be less than end port');
                return;
            }
            
            isScanning = true;
            document.getElementById('scanBtn').disabled = true;
            document.getElementById('scanBtn').textContent = 'Scanning...';
            document.getElementById('progressBar').style.display = 'block';
            document.getElementById('results').style.display = 'none';
            
            fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ start_port: startPort, end_port: endPort })
            });
        }
        
        function updateProgress(percentage) {
            const progressFill = document.getElementById('progressFill');
            progressFill.style.width = percentage + '%';
            progressFill.textContent = Math.round(percentage) + '%';
        }
        
        function displayResults(data) {
            // Update statistics
            const statsHtml = `
                <div class="stat-card">
                    <h3>${data.statistics.total_scanned}</h3>
                    <p>Ports Scanned</p>
                </div>
                <div class="stat-card">
                    <h3>${data.statistics.open_count}</h3>
                    <p>Open Ports</p>
                </div>
                <div class="stat-card">
                    <h3>${data.statistics.closed_count}</h3>
                    <p>Closed Ports</p>
                </div>
            `;
            document.getElementById('stats').innerHTML = statsHtml;
            
            // Update ports table
            const tbody = document.getElementById('portsBody');
            tbody.innerHTML = '';
            
            data.open_ports.forEach(port => {
                const row = document.createElement('tr');
                const portClass = port.is_system ? 'system-port' : 'user-port';
                
                row.innerHTML = `
                    <td class="${portClass}">${port.port}</td>
                    <td>${port.is_system ? 'System' : 'User'}</td>
                    <td>${port.process.name || 'Unknown'}</td>
                    <td>${port.process.pid || 'N/A'}</td>
                    <td>${port.process.user || 'N/A'}</td>
                    <td>${port.process.status || 'N/A'}</td>
                    <td>
                        ${port.process.pid ? `
                            <div class="process-actions">
                                <button class="action-btn pause" onclick="manageProcess(${port.process.pid}, 'pause')">Pause</button>
                                <button class="action-btn start" onclick="manageProcess(${port.process.pid}, 'start')">Start</button>
                                <button class="action-btn kill" onclick="manageProcess(${port.process.pid}, 'kill')">Kill</button>
                            </div>
                        ` : 'N/A'}
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            document.getElementById('results').style.display = 'block';
        }
        
        function manageProcess(pid, action) {
            if (!confirm(`Are you sure you want to ${action} process ${pid}?`)) return;
            
            fetch(`/api/process/${pid}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: action })
            })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                if (data.success) {
                    // Optionally refresh the scan
                    startScan();
                }
            })
            .catch(err => alert('Error: ' + err));
        }
    </script>
</body>
</html>
''')
    
    print("Starting SROTT Web Interface on http://localhost:5000")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)