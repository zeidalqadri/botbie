// Core exports for Earth Agents ecosystem

export * from './types';
export * from './Agent';
export * from './KnowledgeGraph';
export * from './SessionManager';
export * from './LearningEngine';
export * from './utils/logger';

// Re-export commonly used types for convenience
export type {
  Evidence,
  Hypothesis,
  Session,
  CrossAgentInsight,
  AgentConfig,
  CodeNode,
  CodeGraph,
  Relationship,
  QualityMetrics,
  CodeSmell,
  Strategy,
  StrategyResult,
  Agent,
  MCPTool,
  MCPResource,
  MCPPrompt
} from './types';