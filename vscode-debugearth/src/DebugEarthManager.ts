import { createDebugEarth, DebugSession, Evidence, RootCause } from 'debugearth';
import * as vscode from 'vscode';

export class DebugEarthManager {
    private debugEarth: any;
    private sessions: Map<string, DebugSession> = new Map();

    constructor() {
        const config = vscode.workspace.getConfiguration('debugearth');
        
        this.debugEarth = createDebugEarth({
            verbose: config.get('verbose', true),
            maxAttempts: config.get('maxAttempts', 10),
            enableVisualDebugging: config.get('enableVisualDebugging', true),
            logLevel: 'info',
            persistence: true,
            webhooks: {
                onEvidence: (evidence: Evidence) => {
                    this.onEvidenceCollected(evidence);
                },
                onRootCause: (rootCause: RootCause) => {
                    this.onRootCauseFound(rootCause);
                }
            }
        });
    }

    async startDebugging(bugDescription: string): Promise<DebugSession> {
        try {
            const session = await this.debugEarth.startDebugging(bugDescription);
            this.sessions.set(session.id, session);
            
            // Show output channel for this session
            this.showSessionOutput(session);
            
            return session;
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to start debugging session: ${error}`);
            throw error;
        }
    }

    async analyze(sessionId: string): Promise<RootCause | null> {
        try {
            const rootCause = await this.debugEarth.analyze(sessionId);
            
            // Update local session cache
            const session = this.debugEarth.getSession(sessionId);
            if (session) {
                this.sessions.set(sessionId, session);
            }
            
            return rootCause;
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to analyze session: ${error}`);
            return null;
        }
    }

    async addEvidence(sessionId: string, type: Evidence['type'], data: any): Promise<void> {
        try {
            await this.debugEarth.addEvidence(sessionId, type, data);
            
            // Update local session cache
            const session = this.debugEarth.getSession(sessionId);
            if (session) {
                this.sessions.set(sessionId, session);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to add evidence: ${error}`);
        }
    }

    endSession(sessionId: string): void {
        try {
            this.debugEarth.endSession(sessionId);
            
            // Update local session cache
            const session = this.debugEarth.getSession(sessionId);
            if (session) {
                this.sessions.set(sessionId, session);
            } else {
                this.sessions.delete(sessionId);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to end session: ${error}`);
        }
    }

    getSession(sessionId: string): DebugSession | undefined {
        // Try local cache first, then fallback to debugEarth
        return this.sessions.get(sessionId) || this.debugEarth.getSession(sessionId);
    }

    getSessions(): DebugSession[] {
        // Get all sessions from debugEarth and update local cache
        const allSessions = this.debugEarth.getSessions();
        allSessions.forEach((session: DebugSession) => {
            this.sessions.set(session.id, session);
        });
        return allSessions;
    }

    clearSessions(): void {
        // End all active sessions first
        const activeSessions = this.getSessions().filter(s => s.status === 'active');
        activeSessions.forEach(session => {
            this.endSession(session.id);
        });
        
        this.sessions.clear();
    }

    private onEvidenceCollected(evidence: Evidence): void {
        // Show evidence in output channel
        const outputChannel = this.getOutputChannel();
        outputChannel.appendLine(`📎 Evidence collected: ${evidence.type} - ${JSON.stringify(evidence.data)}`);
    }

    private onRootCauseFound(rootCause: RootCause): void {
        // Show root cause notification
        vscode.window.showInformationMessage(
            `🎯 Root cause found! ${rootCause.description}`,
            'Show Details'
        ).then(selection => {
            if (selection === 'Show Details') {
                this.showRootCauseDetails(rootCause);
            }
        });
    }

    private showSessionOutput(session: DebugSession): void {
        const outputChannel = this.getOutputChannel();
        outputChannel.show();
        outputChannel.appendLine(`\n🚀 Started debugging session: ${session.id.substring(0, 8)}`);
        outputChannel.appendLine(`Bug: ${session.bugDescription}`);
        outputChannel.appendLine(`Time: ${session.startTime.toLocaleString()}`);
        outputChannel.appendLine('━'.repeat(50));
    }

    private showRootCauseDetails(rootCause: RootCause): void {
        const outputChannel = this.getOutputChannel();
        outputChannel.show();
        outputChannel.appendLine('\n🎉 ROOT CAUSE FOUND!');
        outputChannel.appendLine('═'.repeat(50));
        outputChannel.appendLine(`🎯 Root Cause: ${rootCause.description}`);
        outputChannel.appendLine(`📊 Confidence: ${Math.round(rootCause.confidence * 100)}%`);
        outputChannel.appendLine(`✅ Solution: ${rootCause.solution}`);
        outputChannel.appendLine('\n📐 Proof Chain:');
        rootCause.proofChain.forEach((step, i) => {
            outputChannel.appendLine(`  ${i + 1}. ${step}`);
        });
        outputChannel.appendLine('═'.repeat(50));
    }

    private getOutputChannel(): vscode.OutputChannel {
        if (!this.outputChannel) {
            this.outputChannel = vscode.window.createOutputChannel('DebugEarth');
        }
        return this.outputChannel;
    }

    private outputChannel?: vscode.OutputChannel;
}