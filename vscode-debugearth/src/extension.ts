import * as vscode from 'vscode';
import { DebugEarthManager } from './DebugEarthManager';
import { SessionTreeProvider } from './providers/SessionTreeProvider';
import { EvidenceTreeProvider } from './providers/EvidenceTreeProvider';
import { DebugPanel } from './panels/DebugPanel';

export function activate(context: vscode.ExtensionContext) {
    console.log('🌍 DebugEarth extension activated!');

    const debugEarthManager = new DebugEarthManager();
    const sessionProvider = new SessionTreeProvider(debugEarthManager);
    const evidenceProvider = new EvidenceTreeProvider(debugEarthManager);

    // Register tree views
    const sessionTreeView = vscode.window.createTreeView('debugearthSessions', {
        treeDataProvider: sessionProvider,
        showCollapseAll: true
    });

    const evidenceTreeView = vscode.window.createTreeView('debugearthEvidence', {
        treeDataProvider: evidenceProvider,
        showCollapseAll: true
    });

    // Set context for when there are active sessions
    vscode.commands.executeCommand('setContext', 'debugearth.hasActiveSessions', false);

    // Register commands
    const startDebuggingCommand = vscode.commands.registerCommand('debugearth.startDebugging', async () => {
        const bugDescription = await vscode.window.showInputBox({
            prompt: 'Describe the bug you want to debug',
            placeHolder: 'e.g., Button click not working, API timeout errors...'
        });

        if (bugDescription) {
            const session = await debugEarthManager.startDebugging(bugDescription);
            sessionProvider.refresh();
            vscode.commands.executeCommand('setContext', 'debugearth.hasActiveSessions', true);
            
            vscode.window.showInformationMessage(
                `🚀 DebugEarth session started: ${session.id.substring(0, 8)}`,
                'Show Panel'
            ).then(selection => {
                if (selection === 'Show Panel') {
                    DebugPanel.createOrShow(context.extensionUri, session, debugEarthManager);
                }
            });
        }
    });

    const analyzeSessionCommand = vscode.commands.registerCommand('debugearth.analyzeSession', async (item?) => {
        const sessionId = item?.sessionId || await selectActiveSession(debugEarthManager);
        if (sessionId) {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "🧩 DebugEarth analyzing session...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Collecting evidence..." });
                
                const rootCause = await debugEarthManager.analyze(sessionId);
                
                progress.report({ increment: 100, message: "Analysis complete!" });
                
                if (rootCause) {
                    const session = debugEarthManager.getSession(sessionId);
                    DebugPanel.createOrShow(context.extensionUri, session!, debugEarthManager);
                    vscode.window.showInformationMessage(
                        `🎯 Root cause found! Confidence: ${Math.round(rootCause.confidence * 100)}%`
                    );
                } else {
                    vscode.window.showWarningMessage('❓ Root cause not yet determined. Need more evidence!');
                }
                
                sessionProvider.refresh();
                evidenceProvider.refresh();
            });
        }
    });

    const addEvidenceCommand = vscode.commands.registerCommand('debugearth.addEvidence', async (item?) => {
        const sessionId = item?.sessionId || await selectActiveSession(debugEarthManager);
        if (!sessionId) return;

        const evidenceType = await vscode.window.showQuickPick([
            { label: 'Console Log', value: 'console' },
            { label: 'Stack Trace', value: 'stack-trace' },
            { label: 'Network Request', value: 'network' },
            { label: 'Performance Data', value: 'performance' },
            { label: 'UI Event', value: 'ui' },
            { label: 'User Report', value: 'user-report' }
        ], { placeHolder: 'Select evidence type' });

        if (!evidenceType) return;

        const evidenceData = await vscode.window.showInputBox({
            prompt: `Enter ${evidenceType.label} evidence`,
            placeHolder: 'Describe the evidence or paste error message...'
        });

        if (evidenceData) {
            await debugEarthManager.addEvidence(sessionId, evidenceType.value as any, {
                message: evidenceData,
                timestamp: new Date().toISOString()
            });
            
            evidenceProvider.refresh();
            vscode.window.showInformationMessage(`📎 ${evidenceType.label} evidence added to session`);
        }
    });

    const stopSessionCommand = vscode.commands.registerCommand('debugearth.stopSession', async (item?) => {
        const sessionId = item?.sessionId || await selectActiveSession(debugEarthManager);
        if (sessionId) {
            debugEarthManager.endSession(sessionId);
            sessionProvider.refresh();
            evidenceProvider.refresh();
            
            const activeSessions = debugEarthManager.getSessions().filter(s => s.status === 'active');
            vscode.commands.executeCommand('setContext', 'debugearth.hasActiveSessions', activeSessions.length > 0);
            
            vscode.window.showInformationMessage('🛑 Debug session ended');
        }
    });

    const showSessionsCommand = vscode.commands.registerCommand('debugearth.showSessions', () => {
        const sessions = debugEarthManager.getSessions();
        if (sessions.length === 0) {
            vscode.window.showInformationMessage('No debug sessions found');
            return;
        }

        const items = sessions.map(session => ({
            label: `${session.status === 'active' ? '🟢' : session.status === 'resolved' ? '✅' : '🔍'} ${session.id.substring(0, 8)}`,
            detail: session.bugDescription,
            sessionId: session.id
        }));

        vscode.window.showQuickPick(items, {
            placeHolder: 'Select a debug session'
        }).then(selected => {
            if (selected) {
                const session = debugEarthManager.getSession(selected.sessionId);
                if (session) {
                    DebugPanel.createOrShow(context.extensionUri, session, debugEarthManager);
                }
            }
        });
    });

    const clearSessionsCommand = vscode.commands.registerCommand('debugearth.clearSessions', async () => {
        const response = await vscode.window.showWarningMessage(
            'Are you sure you want to clear all debug sessions?',
            'Yes', 'No'
        );
        
        if (response === 'Yes') {
            debugEarthManager.clearSessions();
            sessionProvider.refresh();
            evidenceProvider.refresh();
            vscode.commands.executeCommand('setContext', 'debugearth.hasActiveSessions', false);
            vscode.window.showInformationMessage('🧹 All debug sessions cleared');
        }
    });

    const refreshSessionsCommand = vscode.commands.registerCommand('debugearth.refreshSessions', () => {
        sessionProvider.refresh();
        evidenceProvider.refresh();
    });

    // Auto-refresh if enabled
    const config = vscode.workspace.getConfiguration('debugearth');
    if (config.get('autoRefresh', true)) {
        setInterval(() => {
            sessionProvider.refresh();
            evidenceProvider.refresh();
        }, 5000);
    }

    // Register disposables
    context.subscriptions.push(
        startDebuggingCommand,
        analyzeSessionCommand,
        addEvidenceCommand,
        stopSessionCommand,
        showSessionsCommand,
        clearSessionsCommand,
        refreshSessionsCommand,
        sessionTreeView,
        evidenceTreeView
    );

    // Show welcome message
    vscode.window.showInformationMessage(
        '🌍 DebugEarth is ready to dig deep into your bugs!',
        'Start Debugging'
    ).then(selection => {
        if (selection === 'Start Debugging') {
            vscode.commands.executeCommand('debugearth.startDebugging');
        }
    });
}

async function selectActiveSession(manager: DebugEarthManager): Promise<string | undefined> {
    const activeSessions = manager.getSessions().filter(s => s.status === 'active');
    
    if (activeSessions.length === 0) {
        vscode.window.showWarningMessage('No active debug sessions found');
        return undefined;
    }
    
    if (activeSessions.length === 1) {
        return activeSessions[0].id;
    }
    
    const items = activeSessions.map(session => ({
        label: session.id.substring(0, 8),
        detail: session.bugDescription,
        sessionId: session.id
    }));
    
    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select an active debug session'
    });
    
    return selected?.sessionId;
}

export function deactivate() {
    console.log('🌍 DebugEarth extension deactivated');
}