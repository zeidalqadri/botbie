import * as vscode from 'vscode';
import { DebugEarthManager } from '../DebugEarthManager';
import { DebugSession } from 'debugearth';

export class SessionTreeProvider implements vscode.TreeDataProvider<SessionItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SessionItem | undefined | null | void> = new vscode.EventEmitter<SessionItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SessionItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private debugEarthManager: DebugEarthManager) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: SessionItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SessionItem): Thenable<SessionItem[]> {
        if (!element) {
            // Root level - show all sessions
            const sessions = this.debugEarthManager.getSessions();
            return Promise.resolve(sessions.map(session => new SessionItem(session)));
        } else if (element.session) {
            // Session level - show session details
            return Promise.resolve(this.getSessionDetails(element.session));
        }
        return Promise.resolve([]);
    }

    private getSessionDetails(session: DebugSession): SessionItem[] {
        const items: SessionItem[] = [];

        // Add evidence count
        items.push(new SessionItem(
            `📊 Evidence: ${session.evidence.length}`,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            'evidence-count'
        ));

        // Add hypotheses count
        items.push(new SessionItem(
            `💡 Hypotheses: ${session.hypotheses.length}`,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            'hypotheses-count'
        ));

        // Add attempts count
        items.push(new SessionItem(
            `🔧 Attempts: ${session.attempts.length}`,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            'attempts-count'
        ));

        // Add duration
        const duration = Date.now() - session.startTime.getTime();
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        items.push(new SessionItem(
            `⏱️ Duration: ${minutes}m ${seconds}s`,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            'duration'
        ));

        // Add root cause if found
        if (session.rootCause) {
            items.push(new SessionItem(
                `🎯 Root Cause Found (${Math.round(session.rootCause.confidence * 100)}%)`,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                'root-cause'
            ));
        }

        return items;
    }
}

export class SessionItem extends vscode.TreeItem {
    public sessionId?: string;
    public session?: DebugSession;

    constructor(
        labelOrSession: string | DebugSession,
        collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Collapsed,
        session?: DebugSession,
        contextValue?: string
    ) {
        if (typeof labelOrSession === 'string') {
            super(labelOrSession, collapsibleState);
            this.session = session;
            this.contextValue = contextValue;
        } else {
            const sessionData = labelOrSession;
            const statusIcon = sessionData.status === 'active' ? '🟢' : 
                              sessionData.status === 'resolved' ? '✅' : '🔍';
            
            super(
                `${statusIcon} ${sessionData.id.substring(0, 8)}`,
                collapsibleState
            );
            
            this.session = sessionData;
            this.description = sessionData.bugDescription;
            this.tooltip = `Status: ${sessionData.status}\nBug: ${sessionData.bugDescription}\nStarted: ${sessionData.startTime.toLocaleString()}`;
            this.contextValue = sessionData.status === 'active' ? 'session-active' : 'session-inactive';
        }

        // Add session ID for commands
        if (this.session) {
            this.sessionId = this.session.id;
        }

        this.iconPath = this.getIconPath();
    }

    private getIconPath(): vscode.ThemeIcon | undefined {
        if (this.session) {
            switch (this.session.status) {
                case 'active':
                    return new vscode.ThemeIcon('debug-start');
                case 'resolved':
                    return new vscode.ThemeIcon('check');
                case 'exploring':
                    return new vscode.ThemeIcon('search');
                default:
                    return new vscode.ThemeIcon('bug');
            }
        }

        // For detail items
        if (this.contextValue === 'evidence-count') {
            return new vscode.ThemeIcon('database');
        } else if (this.contextValue === 'hypotheses-count') {
            return new vscode.ThemeIcon('lightbulb');
        } else if (this.contextValue === 'attempts-count') {
            return new vscode.ThemeIcon('tools');
        } else if (this.contextValue === 'duration') {
            return new vscode.ThemeIcon('clock');
        } else if (this.contextValue === 'root-cause') {
            return new vscode.ThemeIcon('target');
        }

        return undefined;
    }
}