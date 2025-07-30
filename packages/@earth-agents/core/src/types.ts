// Core types shared across Earth Agents ecosystem

export interface Evidence {
  id: string;
  type: 'console' | 'stack-trace' | 'network' | 'performance' | 'ui' | 'user-report' | 'code-quality' | 'architecture' | 'security';
  timestamp: Date;
  data: any;
  context: Record<string, any>;
  correlationId?: string;
}

export interface Hypothesis {
  id: string;
  description: string;
  confidence: number;
  evidence: string[];
  tested: boolean;
  result?: 'confirmed' | 'rejected' | 'partial';
}

export interface Session {
  id: string;
  startTime: Date;
  description: string;
  hypotheses: Hypothesis[];
  evidence: Evidence[];
  status: 'active' | 'resolved' | 'exploring';
}

export interface AgentConfig {
  name: string;
  description: string;
  verbose?: boolean;
  maxAttempts?: number;
  logLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  webhooks?: {
    onHypothesis?: (hypothesis: Hypothesis) => void;
    onEvidence?: (evidence: Evidence) => void;
    onComplete?: (result: any) => void;
  };
}

// Knowledge Graph types inspired by Potpie
export interface CodeNode {
  id: string;
  name: string;
  type: 'class' | 'function' | 'module' | 'variable' | 'interface' | 'type' | 'constant';
  filePath: string;
  startLine: number;
  endLine: number;
  language: string;
  content: string;
  quality?: QualityMetrics;
  relationships: Relationship[];
}

export interface Relationship {
  type: 'imports' | 'extends' | 'implements' | 'calls' | 'uses' | 'defines' | 'references';
  sourceId: string;
  targetId: string;
  metadata?: Record<string, any>;
}

export interface QualityMetrics {
  complexity: number;
  maintainability: number;
  testCoverage: number;
  documentationScore: number;
  linesOfCode: number;
  codeSmells: CodeSmell[];
}

export interface CodeSmell {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  line?: number;
  suggestion?: string;
}

export interface CodeGraph {
  nodes: Map<string, CodeNode>;
  edges: Relationship[];
  metadata: {
    totalFiles: number;
    languages: string[];
    createdAt: Date;
    version: string;
  };
}

// Strategy pattern for different analysis approaches
export interface Strategy {
  name: string;
  description: string;
  execute(context: any): Promise<StrategyResult>;
  canHandle(context: any): boolean;
}

export interface StrategyResult {
  success: boolean;
  findings: any[];
  suggestions: string[];
  confidence: number;
}

// Agent base interface
export interface Agent {
  name: string;
  config: AgentConfig;
  strategies: Strategy[];
  
  initialize(): Promise<void>;
  execute(input: any): Promise<any>;
  shutdown(): Promise<void>;
}

// MCP (Model Context Protocol) types
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  handler: (input: any) => Promise<any>;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required?: boolean;
  }>;
}