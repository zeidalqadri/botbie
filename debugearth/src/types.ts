export interface DebugSession {
  id: string;
  startTime: Date;
  bugDescription: string;
  hypotheses: Hypothesis[];
  evidence: Evidence[];
  attempts: DebugAttempt[];
  rootCause?: RootCause;
  status: 'active' | 'resolved' | 'exploring';
}

export interface Hypothesis {
  id: string;
  description: string;
  confidence: number;
  evidence: string[];
  tested: boolean;
  result?: 'confirmed' | 'rejected' | 'partial';
}

export interface Evidence {
  id: string;
  type: 'console' | 'stack-trace' | 'network' | 'performance' | 'ui' | 'user-report';
  timestamp: Date;
  data: any;
  context: Record<string, any>;
  correlationId?: string;
}

export interface DebugAttempt {
  id: string;
  strategy: string;
  timestamp: Date;
  actions: string[];
  result: string;
  success: boolean;
}

export interface RootCause {
  description: string;
  evidence: Evidence[];
  explanation: string;
  solution: string;
  confidence: number;
  proofChain: string[];
}

export interface DebugStrategy {
  name: string;
  description: string;
  execute(session: DebugSession): Promise<DebugAttempt>;
  canHandle(session: DebugSession): boolean;
}

export interface DebugEarthConfig {
  verbose?: boolean;
  maxAttempts?: number;
  enableVisualDebugging?: boolean;
  enableBrowserDebugging?: boolean;
  logLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  persistence?: boolean;
  webhooks?: {
    onHypothesis?: (hypothesis: Hypothesis) => void;
    onEvidence?: (evidence: Evidence) => void;
    onRootCause?: (rootCause: RootCause) => void;
  };
}