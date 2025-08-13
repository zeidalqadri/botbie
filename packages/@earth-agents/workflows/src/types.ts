/**
 * Workflow Template Types
 */

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  tier: 'starter' | 'professional' | 'enterprise';
  tags: string[];
  industry?: string[];
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  nodes: WorkflowNode[];
  config: WorkflowConfig;
  triggers?: WorkflowTrigger[];
  outputs: WorkflowOutput[];
  metrics?: WorkflowMetrics;
}

export type WorkflowCategory = 
  | 'development'
  | 'modernization'
  | 'compliance'
  | 'performance'
  | 'design-system'
  | 'prototyping'
  | 'security'
  | 'migration'
  | 'collaboration'
  | 'mobile'
  | 'documentation'
  | 'testing'
  | 'internationalization'
  | 'microservices';

export interface WorkflowNode {
  id: string;
  name: string;
  description: string;
  type: 'analysis' | 'action' | 'decision' | 'parallel' | 'merge' | 'loop';
  agent: 'botbie' | 'debugearth' | 'sketchie' | 'orchestrator';
  action: string;
  inputs?: Record<string, any>;
  conditions?: WorkflowCondition[];
  dependsOn?: string[];
  retryPolicy?: RetryPolicy;
  timeout?: number;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'regex';
  value: any;
  action: 'continue' | 'skip' | 'fail' | 'retry';
}

export interface WorkflowConfig {
  parallelExecution: boolean;
  maxRetries: number;
  timeoutMinutes: number;
  notificationChannels?: NotificationChannel[];
  environmentVariables?: Record<string, string>;
  customSettings?: Record<string, any>;
}

export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'webhook' | 'git-hook' | 'file-change';
  config: Record<string, any>;
}

export interface WorkflowOutput {
  name: string;
  type: 'report' | 'artifact' | 'metric' | 'notification';
  format?: string;
  destination?: string;
}

export interface WorkflowMetrics {
  successRate?: number;
  averageExecutionTime?: number;
  totalExecutions?: number;
  lastExecuted?: Date;
  userRating?: number;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelayMs: number;
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'discord' | 'webhook';
  config: Record<string, any>;
  events: ('start' | 'success' | 'failure' | 'warning')[];
}

export interface WorkflowExecution {
  id: string;
  templateId: string;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentNode?: string;
  results: Record<string, any>;
  errors?: WorkflowError[];
  logs: WorkflowLog[];
}

export interface WorkflowError {
  nodeId: string;
  timestamp: Date;
  message: string;
  stack?: string;
  recoverable: boolean;
}

export interface WorkflowLog {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  nodeId?: string;
  message: string;
  data?: any;
}

export interface WorkflowCustomization {
  templateId: string;
  overrides: {
    nodes?: Partial<WorkflowNode>[];
    config?: Partial<WorkflowConfig>;
    triggers?: WorkflowTrigger[];
  };
  variables: Record<string, any>;
}