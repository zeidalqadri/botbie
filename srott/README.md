# SROTT - Personal Port Sniffer

A powerful port scanning and process management tool for personal use. SROTT allows you to scan both active and inactive ports on your machine and provides the ability to manage processes running on those ports.

## Features

- **Comprehensive Port Scanning**: Scan all ports (1-65535) or specific ranges
- **Process Identification**: Automatically identifies processes running on open ports
- **Process Management**: Start, pause, or kill processes (requires sudo)
- **Interactive CLI Mode**: Manage processes interactively through the command line
- **Web Dashboard**: Beautiful web interface for visual port monitoring
- **Real-time Updates**: Live progress tracking during scans
- **JSON Export**: Save scan results for analysis
- **Quick Scan Mode**: Scan only common ports for faster results

## Installation

1. Clone or download the SROTT directory
2. Run the setup script:
```bash
cd srott
chmod +x setup.sh
./setup.sh
```

Or manually install:
```bash
pip install -r requirements.txt
chmod +x srott.py
```

## Usage

### Basic Port Scan
```bash
# Scan all ports
./srott.py

# Scan specific port range
./srott.py -p 80-8080

# Scan specific ports
./srott.py -p 80,443,8080

# Quick scan (common ports only)
./srott.py -q
```

### Interactive Mode (Process Management)
```bash
# Run with sudo for full process management capabilities
sudo ./srott.py -i

# Commands available in interactive mode:
# - list: Show all open ports
# - start: Resume a paused process
# - pause: Pause a running process
# - kill: Terminate a process
# - refresh: Rescan ports
# - exit: Exit interactive mode
```

### Advanced Options
```bash
# Set custom timeout (faster but less accurate)
./srott.py -t 0.1

# Increase concurrent workers for faster scanning
./srott.py -w 200

# Save results to JSON
./srott.py -j scan_results.json

# Combine options
sudo ./srott.py -p 1-10000 -t 0.3 -i -j results.json
```

### Web Dashboard
```bash
# Start the web interface
python3 srott_web.py

# Then open http://localhost:5000 in your browser
```

## Safety Notes

- **System Ports**: Ports below 1024 are system ports. Be extremely careful when managing processes on these ports
- **Sudo Access**: Process management features require sudo access
- **Confirmation**: The tool will ask for confirmation before modifying system ports
- **Force Kill**: Use force kill (-9) only as a last resort

## Port Types

- **System Ports (1-1023)**: Reserved for system services (shown in red)
- **User Ports (1024-65535)**: Available for user applications (shown in green)

## Examples

1. **Find what's using port 8080**:
   ```bash
   ./srott.py -p 8080
   ```

2. **Scan web development ports**:
   ```bash
   ./srott.py -p 3000-3010,8080-8090,5000
   ```

3. **Kill a process on port 3000**:
   ```bash
   sudo ./srott.py -i
   # Then: kill
   # Enter port: 3000
   ```

4. **Export scan for documentation**:
   ```bash
   ./srott.py -q -j quick_scan_$(date +%Y%m%d).json
   ```

## Technical Details

- **Language**: Python 3.6+
- **Concurrency**: Multi-threaded port scanning for speed
- **Process Detection**: Uses psutil for cross-platform process information
- **Web Framework**: Flask with Socket.IO for real-time updates

## Limitations

- Requires elevated privileges (sudo) for process management
- Some processes may show as "Access Denied" without sudo
- Scanning all 65535 ports can take several minutes

## Security Considerations

This tool is designed for personal use on your own machine. Do not use it to scan networks or systems you don't own. Port scanning can be detected and may be against the terms of service of your network provider.

## License

Personal use only. Use responsibly and ethically.