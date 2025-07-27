import * as vscode from 'vscode';
import { DebugSession } from 'debugearth';
import { DebugEarthManager } from '../DebugEarthManager';

export class DebugPanel {
    public static currentPanel: DebugPanel | undefined;
    public static readonly viewType = 'debugearthPanel';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, session: DebugSession, manager: DebugEarthManager) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (DebugPanel.currentPanel) {
            DebugPanel.currentPanel._update(session, manager);
            DebugPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            DebugPanel.viewType,
            `🌍 DebugEarth - ${session.id.substring(0, 8)}`,
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                    vscode.Uri.joinPath(extensionUri, 'out', 'compiled')
                ]
            }
        );

        DebugPanel.currentPanel = new DebugPanel(panel, extensionUri, session, manager);
    }

    public static kill() {
        DebugPanel.currentPanel?.dispose();
        DebugPanel.currentPanel = undefined;
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, session: DebugSession, manager: DebugEarthManager) {
        DebugPanel.currentPanel = new DebugPanel(panel, extensionUri, session, manager);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, private session: DebugSession, private manager: DebugEarthManager) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content
        this._update(session, manager);

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'analyze':
                        this.handleAnalyze();
                        return;
                    case 'addEvidence':
                        this.handleAddEvidence(message.type, message.data);
                        return;
                    case 'stopSession':
                        this.handleStopSession();
                        return;
                    case 'refreshSession':
                        this.handleRefreshSession();
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    private async handleAnalyze() {
        const rootCause = await this.manager.analyze(this.session.id);
        this.session = this.manager.getSession(this.session.id) || this.session;
        this._update(this.session, this.manager);
        
        if (rootCause) {
            vscode.window.showInformationMessage(`🎯 Root cause found! Confidence: ${Math.round(rootCause.confidence * 100)}%`);
        }
    }

    private async handleAddEvidence(type: string, data: any) {
        await this.manager.addEvidence(this.session.id, type as any, data);
        this.session = this.manager.getSession(this.session.id) || this.session;
        this._update(this.session, this.manager);
    }

    private handleStopSession() {
        this.manager.endSession(this.session.id);
        this.session = this.manager.getSession(this.session.id) || this.session;
        this._update(this.session, this.manager);
        vscode.window.showInformationMessage('🛑 Debug session ended');
    }

    private handleRefreshSession() {
        this.session = this.manager.getSession(this.session.id) || this.session;
        this._update(this.session, this.manager);
    }

    public dispose() {
        DebugPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update(session: DebugSession, manager: DebugEarthManager) {
        this.session = session;
        this.manager = manager;
        this._panel.title = `🌍 DebugEarth - ${session.id.substring(0, 8)}`;
        this._panel.webview.html = this._getHtmlForWebview(session);
    }

    private _getHtmlForWebview(session: DebugSession) {
        const statusIcon = session.status === 'active' ? '🟢' : 
                          session.status === 'resolved' ? '✅' : '🔍';
        
        const duration = Date.now() - session.startTime.getTime();
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DebugEarth Session</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            line-height: 1.6;
        }
        
        .header {
            border-bottom: 2px solid var(--vscode-panel-border);
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        
        .session-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .session-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .info-card {
            background: var(--vscode-panel-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 15px;
        }
        
        .info-label {
            font-weight: bold;
            color: var(--vscode-textPreformat-foreground);
            margin-bottom: 5px;
        }
        
        .actions {
            margin: 20px 0;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 14px;
        }
        
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .section {
            margin: 30px 0;
            padding: 20px;
            background: var(--vscode-panel-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .evidence-item, .hypothesis-item, .attempt-item {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 10px;
            margin: 10px 0;
        }
        
        .evidence-header, .hypothesis-header, .attempt-header {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .evidence-data, .hypothesis-data, .attempt-data {
            font-family: monospace;
            background: var(--vscode-textCodeBlock-background);
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            margin-top: 10px;
        }
        
        .root-cause {
            background: linear-gradient(135deg, rgba(0, 255, 0, 0.1), rgba(0, 200, 0, 0.1));
            border: 2px solid #00ff00;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .root-cause-title {
            font-size: 20px;
            font-weight: bold;
            color: #00ff00;
            margin-bottom: 15px;
        }
        
        .confidence-bar {
            background: var(--vscode-panel-border);
            border-radius: 10px;
            height: 10px;
            margin: 10px 0;
            overflow: hidden;
        }
        
        .confidence-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff4444, #ffaa00, #00ff00);
            transition: width 0.3s ease;
        }
        
        .proof-chain {
            margin-top: 15px;
        }
        
        .proof-step {
            margin: 5px 0;
            padding: 5px 10px;
            background: var(--vscode-textCodeBlock-background);
            border-left: 3px solid #00ff00;
        }
        
        .add-evidence-form {
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            padding: 15px;
            margin-top: 15px;
        }
        
        select, input, textarea {
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            padding: 8px;
            width: 100%;
            margin: 5px 0;
        }
        
        .quick-evidence {
            display: flex;
            gap: 10px;
            margin: 10px 0;
            flex-wrap: wrap;
        }
        
        .quick-evidence button {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            font-size: 12px;
            padding: 5px 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="session-title">
            ${statusIcon} DebugEarth Session
        </div>
        <div class="session-info">
            <div class="info-card">
                <div class="info-label">Session ID</div>
                <div>${session.id.substring(0, 8)}</div>
            </div>
            <div class="info-card">
                <div class="info-label">Status</div>
                <div>${session.status}</div>
            </div>
            <div class="info-card">
                <div class="info-label">Duration</div>
                <div>${minutes}m ${seconds}s</div>
            </div>
            <div class="info-card">
                <div class="info-label">Evidence</div>
                <div>${session.evidence.length} items</div>
            </div>
        </div>
        <div style="font-weight: bold; margin-bottom: 10px;">Bug Description:</div>
        <div style="background: var(--vscode-textCodeBlock-background); padding: 10px; border-radius: 4px;">
            ${session.bugDescription}
        </div>
    </div>

    <div class="actions">
        <button onclick="analyzeSession()" ${session.status !== 'active' ? 'disabled' : ''}>
            🧩 Analyze Session
        </button>
        <button onclick="stopSession()" ${session.status !== 'active' ? 'disabled' : ''}>
            🛑 Stop Session
        </button>
        <button onclick="refreshSession()">
            🔄 Refresh
        </button>
    </div>

    ${session.rootCause ? `
    <div class="root-cause">
        <div class="root-cause-title">🎯 Root Cause Found!</div>
        <div><strong>Description:</strong> ${session.rootCause.description}</div>
        <div style="margin: 10px 0;"><strong>Confidence:</strong></div>
        <div class="confidence-bar">
            <div class="confidence-fill" style="width: ${session.rootCause.confidence * 100}%"></div>
        </div>
        <div>${Math.round(session.rootCause.confidence * 100)}%</div>
        
        <div style="margin-top: 15px;"><strong>Solution:</strong></div>
        <div style="background: var(--vscode-textCodeBlock-background); padding: 10px; border-radius: 4px; margin-top: 5px;">
            ${session.rootCause.solution}
        </div>
        
        <div style="margin-top: 15px;"><strong>Detailed Explanation:</strong></div>
        <div style="background: var(--vscode-textCodeBlock-background); padding: 10px; border-radius: 4px; margin-top: 5px;">
            ${session.rootCause.explanation}
        </div>
        
        ${session.rootCause.proofChain.length > 0 ? `
        <div class="proof-chain">
            <strong>📐 Mathematical Proof Chain:</strong>
            ${session.rootCause.proofChain.map((step, i) => `
                <div class="proof-step">${i + 1}. ${step}</div>
            `).join('')}
        </div>
        ` : ''}
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">
            📎 Add Evidence
        </div>
        <div class="quick-evidence">
            <button onclick="addQuickEvidence('console', 'Console error occurred')">Console Error</button>
            <button onclick="addQuickEvidence('network', 'Network request failed')">Network Issue</button>
            <button onclick="addQuickEvidence('ui', 'Button click not working')">UI Problem</button>
            <button onclick="addQuickEvidence('performance', 'Application is slow')">Performance Issue</button>
        </div>
        <div class="add-evidence-form">
            <select id="evidenceType">
                <option value="console">Console Log</option>
                <option value="stack-trace">Stack Trace</option>
                <option value="network">Network Request</option>
                <option value="performance">Performance Data</option>
                <option value="ui">UI Event</option>
                <option value="user-report">User Report</option>
            </select>
            <textarea id="evidenceData" placeholder="Enter evidence details..." rows="3"></textarea>
            <button onclick="addCustomEvidence()">Add Evidence</button>
        </div>
    </div>

    <div class="section">
        <div class="section-title">
            📊 Evidence (${session.evidence.length})
        </div>
        ${session.evidence.length === 0 ? '<p>No evidence collected yet.</p>' : 
            session.evidence.map(evidence => `
                <div class="evidence-item">
                    <div class="evidence-header">
                        ${this.getEvidenceIcon(evidence.type)} ${evidence.type} - ${evidence.timestamp.toLocaleString()}
                    </div>
                    <div class="evidence-data">${JSON.stringify(evidence.data, null, 2)}</div>
                </div>
            `).join('')
        }
    </div>

    <div class="section">
        <div class="section-title">
            💡 Hypotheses (${session.hypotheses.length})
        </div>
        ${session.hypotheses.length === 0 ? '<p>No hypotheses generated yet. Run analysis to generate hypotheses.</p>' : 
            session.hypotheses.map(hypothesis => `
                <div class="hypothesis-item">
                    <div class="hypothesis-header">
                        ${hypothesis.tested ? (hypothesis.result === 'confirmed' ? '✅' : hypothesis.result === 'rejected' ? '❌' : '❓') : '⏳'} 
                        ${hypothesis.description} (${Math.round(hypothesis.confidence * 100)}% confidence)
                    </div>
                    ${hypothesis.result ? `<div><strong>Result:</strong> ${hypothesis.result}</div>` : ''}
                </div>
            `).join('')
        }
    </div>

    <div class="section">
        <div class="section-title">
            🔧 Debug Attempts (${session.attempts.length})
        </div>
        ${session.attempts.length === 0 ? '<p>No debug attempts yet. Run analysis to start debugging strategies.</p>' : 
            session.attempts.map(attempt => `
                <div class="attempt-item">
                    <div class="attempt-header">
                        ${attempt.success ? '✅' : '❌'} ${attempt.strategy} - ${attempt.timestamp.toLocaleString()}
                    </div>
                    <div><strong>Actions:</strong> ${attempt.actions.join(', ')}</div>
                    <div><strong>Result:</strong> ${attempt.result}</div>
                </div>
            `).join('')
        }
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function analyzeSession() {
            vscode.postMessage({
                command: 'analyze'
            });
        }

        function addQuickEvidence(type, data) {
            vscode.postMessage({
                command: 'addEvidence',
                type: type,
                data: { message: data, timestamp: new Date().toISOString() }
            });
        }

        function addCustomEvidence() {
            const type = document.getElementById('evidenceType').value;
            const data = document.getElementById('evidenceData').value;
            
            if (!data.trim()) {
                alert('Please enter evidence details');
                return;
            }

            vscode.postMessage({
                command: 'addEvidence',
                type: type,
                data: { message: data, timestamp: new Date().toISOString() }
            });

            document.getElementById('evidenceData').value = '';
        }

        function stopSession() {
            vscode.postMessage({
                command: 'stopSession'
            });
        }

        function refreshSession() {
            vscode.postMessage({
                command: 'refreshSession'
            });
        }
    </script>
</body>
</html>`;
    }

    private getEvidenceIcon(type: string): string {
        switch (type) {
            case 'console': return '💻';
            case 'stack-trace': return '📚';
            case 'network': return '🌐';
            case 'performance': return '📊';
            case 'ui': return '🖼️';
            case 'user-report': return '👤';
            default: return '📄';
        }
    }
}