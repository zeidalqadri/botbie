import * as vscode from 'vscode';
import { DebugEarthManager } from '../DebugEarthManager';
import { DebugSession, Evidence } from 'debugearth';

export class EvidenceTreeProvider implements vscode.TreeDataProvider<EvidenceItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<EvidenceItem | undefined | null | void> = new vscode.EventEmitter<EvidenceItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<EvidenceItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private debugEarthManager: DebugEarthManager) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: EvidenceItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: EvidenceItem): Thenable<EvidenceItem[]> {
        if (!element) {
            // Root level - show sessions with evidence
            const sessions = this.debugEarthManager.getSessions()
                .filter(session => session.evidence.length > 0);
            return Promise.resolve(sessions.map(session => new EvidenceItem(session)));
        } else if (element.session) {
            // Session level - show evidence
            return Promise.resolve(element.session.evidence.map(evidence => new EvidenceItem(evidence, element.session)));
        } else if (element.evidence) {
            // Evidence level - show evidence details
            return Promise.resolve(this.getEvidenceDetails(element.evidence));
        }
        
        return Promise.resolve([]);
    }

    private getEvidenceDetails(evidence: Evidence): EvidenceItem[] {
        const items: EvidenceItem[] = [];

        // Add timestamp
        items.push(new EvidenceItem(
            `🕐 ${evidence.timestamp.toLocaleString()}`,
            undefined,
            undefined,
            vscode.TreeItemCollapsibleState.None,
            'timestamp'
        ));

        // Add type
        items.push(new EvidenceItem(
            `📋 Type: ${evidence.type}`,
            undefined,
            undefined,
            vscode.TreeItemCollapsibleState.None,
            'type'
        ));

        // Add correlation ID if exists
        if (evidence.correlationId) {
            items.push(new EvidenceItem(
                `🔗 Correlation: ${evidence.correlationId.substring(0, 8)}`,
                undefined,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                'correlation'
            ));
        }

        // Add data preview
        const dataPreview = this.formatDataPreview(evidence.data);
        items.push(new EvidenceItem(
            `📄 Data: ${dataPreview}`,
            undefined,
            undefined,
            vscode.TreeItemCollapsibleState.None,
            'data'
        ));

        return items;
    }

    private formatDataPreview(data: any): string {
        if (typeof data === 'string') {
            return data.length > 50 ? data.substring(0, 50) + '...' : data;
        } else if (typeof data === 'object') {
            const jsonStr = JSON.stringify(data);
            return jsonStr.length > 50 ? jsonStr.substring(0, 50) + '...' : jsonStr;
        } else {
            return String(data);
        }
    }
}

export class EvidenceItem extends vscode.TreeItem {
    public session?: DebugSession;
    public evidence?: Evidence;

    constructor(
        labelOrSessionOrEvidence: string | DebugSession | Evidence,
        session?: DebugSession,
        evidence?: Evidence,
        collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Collapsed,
        contextValue?: string
    ) {
        if (typeof labelOrSessionOrEvidence === 'string') {
            // Detail item
            super(labelOrSessionOrEvidence, collapsibleState);
            this.session = session;
            this.evidence = evidence;
            this.contextValue = contextValue;
        } else if ('bugDescription' in labelOrSessionOrEvidence) {
            // Session item
            const sessionData = labelOrSessionOrEvidence as DebugSession;
            super(
                `${sessionData.id.substring(0, 8)} (${sessionData.evidence.length} evidence)`,
                collapsibleState
            );
            this.session = sessionData;
            this.description = sessionData.bugDescription;
            this.tooltip = `Session: ${sessionData.id}\nEvidence count: ${sessionData.evidence.length}`;
        } else {
            // Evidence item
            const evidenceData = labelOrSessionOrEvidence as Evidence;
            const icon = EvidenceItem.getStaticEvidenceIcon(evidenceData.type);
            super(
                `${icon} ${evidenceData.type}`,
                collapsibleState
            );
            this.evidence = evidenceData;
            this.description = this.formatEvidenceDescription(evidenceData);
            this.tooltip = `Type: ${evidenceData.type}\nTime: ${evidenceData.timestamp.toLocaleString()}\nData: ${JSON.stringify(evidenceData.data)}`;
            this.contextValue = 'evidence';
        }

        this.iconPath = this.getIconPath();
    }

    private getIconPath(): vscode.ThemeIcon | undefined {
        if (this.session) {
            return new vscode.ThemeIcon('folder');
        }

        if (this.evidence) {
            switch (this.evidence.type) {
                case 'console':
                    return new vscode.ThemeIcon('terminal');
                case 'stack-trace':
                    return new vscode.ThemeIcon('call-hierarchy');
                case 'network':
                    return new vscode.ThemeIcon('cloud');
                case 'performance':
                    return new vscode.ThemeIcon('graph');
                case 'ui':
                    return new vscode.ThemeIcon('preview');
                case 'user-report':
                    return new vscode.ThemeIcon('person');
                default:
                    return new vscode.ThemeIcon('file');
            }
        }

        // Detail items
        if (this.contextValue === 'timestamp') {
            return new vscode.ThemeIcon('clock');
        } else if (this.contextValue === 'type') {
            return new vscode.ThemeIcon('tag');
        } else if (this.contextValue === 'correlation') {
            return new vscode.ThemeIcon('link');
        } else if (this.contextValue === 'data') {
            return new vscode.ThemeIcon('json');
        }

        return undefined;
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

    private formatEvidenceDescription(evidence: Evidence): string {
        if (evidence.data?.message) {
            const message = evidence.data.message;
            return message.length > 30 ? message.substring(0, 30) + '...' : message;
        } else if (evidence.data?.error) {
            const error = evidence.data.error;
            return error.length > 30 ? error.substring(0, 30) + '...' : error;
        } else {
            return evidence.timestamp.toLocaleTimeString();
        }
    }

    static getStaticEvidenceIcon(type: string): string {
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