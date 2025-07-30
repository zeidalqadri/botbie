import { CodeIssue } from '../Botbie';

export interface Fix {
  id: string;
  issueId: string;
  description: string;
  changes: FileChange[];
  confidence: number; // 0-1 confidence score
  risk: 'low' | 'medium' | 'high';
  provider: string;
}

export interface FileChange {
  filePath: string;
  original: string;
  modified: string;
  startLine?: number;
  endLine?: number;
  startColumn?: number;
  endColumn?: number;
}

export interface FileBackup {
  filePath: string;
  content: string;
  stats: {
    mode: number;
    mtime: Date;
  };
}

export interface FixTransaction {
  id: string;
  timestamp: Date;
  fixes: Fix[];
  backup: FileBackup[];
  status: 'pending' | 'applied' | 'rolled-back' | 'failed';
  error?: string;
  applyFixes(): Promise<void>;
  rollback(): Promise<void>;
  validate(): Promise<boolean>;
}

export interface FixProvider {
  name: string;
  supportedIssueTypes: string[];
  
  canFix(issue: CodeIssue): boolean;
  generateFix(issue: CodeIssue, context: FixContext): Promise<Fix | null>;
  validateFix(fix: Fix): Promise<boolean>;
}

export interface FixContext {
  fileContent: string;
  filePath: string;
  language: string;
  issue: CodeIssue;
  config: any;
}

export interface FixResult {
  success: boolean;
  transactionId: string;
  appliedFixes: Fix[];
  failedFixes: Fix[];
  errors: Array<{
    fixId: string;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    rolledBack: number;
  };
}

export interface FixOptions {
  dryRun: boolean;
  interactive: boolean;
  categories: string[];
  maxRisk: 'low' | 'medium' | 'high';
  minConfidence: number;
  createBackup: boolean;
  validateAfterFix: boolean;
}