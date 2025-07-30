import { readFileSync, writeFileSync, statSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@earth-agents/core';
import chalk from 'chalk';
import { 
  Fix, 
  FixTransaction, 
  FixProvider, 
  FixResult, 
  FixOptions, 
  FileBackup,
  FileChange,
  FixContext
} from './types';
import { CodeIssue } from '../Botbie';

export class AutoFixEngine {
  private providers: Map<string, FixProvider> = new Map();
  private transactions: Map<string, FixTransaction> = new Map();
  private backupDir: string = '.botbie/backups';
  
  constructor(private workingDirectory: string = process.cwd()) {
    this.ensureBackupDirectory();
  }
  
  /**
   * Register a fix provider
   */
  registerProvider(provider: FixProvider): void {
    this.providers.set(provider.name, provider);
    logger.info(`Registered fix provider: ${provider.name}`);
  }
  
  /**
   * Generate fixes for given issues
   */
  async generateFixes(
    issues: CodeIssue[], 
    options: Partial<FixOptions> = {}
  ): Promise<Fix[]> {
    const opts: FixOptions = {
      dryRun: false,
      interactive: false,
      categories: [],
      maxRisk: 'medium',
      minConfidence: 0.7,
      createBackup: true,
      validateAfterFix: true,
      ...options
    };
    
    const fixes: Fix[] = [];
    
    for (const issue of issues) {
      if (!issue.autoFixAvailable) continue;
      
      // Find providers that can fix this issue
      const providers = Array.from(this.providers.values())
        .filter(p => p.canFix(issue));
      
      if (providers.length === 0) continue;
      
      // Use the first matching provider (could be enhanced with scoring)
      const provider = providers[0];
      
      try {
        const context = await this.createFixContext(issue);
        const fix = await provider.generateFix(issue, context);
        
        if (fix && this.shouldApplyFix(fix, opts)) {
          fixes.push(fix);
        }
      } catch (error) {
        logger.error(`Failed to generate fix for issue ${issue.id}:`, error);
      }
    }
    
    return fixes;
  }
  
  /**
   * Apply fixes to the codebase
   */
  async applyFixes(
    fixes: Fix[], 
    options: Partial<FixOptions> = {}
  ): Promise<FixResult> {
    const opts: FixOptions = {
      dryRun: false,
      interactive: false,
      categories: [],
      maxRisk: 'medium',
      minConfidence: 0.7,
      createBackup: true,
      validateAfterFix: true,
      ...options
    };
    
    const transaction = this.createTransaction(fixes);
    this.transactions.set(transaction.id, transaction);
    
    const result: FixResult = {
      success: true,
      transactionId: transaction.id,
      appliedFixes: [],
      failedFixes: [],
      errors: [],
      summary: {
        total: fixes.length,
        successful: 0,
        failed: 0,
        rolledBack: 0
      }
    };
    
    try {
      // Create backups if enabled
      if (opts.createBackup && !opts.dryRun) {
        await this.createBackups(transaction);
      }
      
      // Apply fixes
      for (const fix of fixes) {
        if (opts.interactive) {
          const shouldApply = await this.promptForFix(fix);
          if (!shouldApply) continue;
        }
        
        try {
          if (!opts.dryRun) {
            await this.applyFix(fix);
            
            // Validate if enabled
            if (opts.validateAfterFix) {
              const provider = this.providers.get(fix.provider);
              if (provider && !(await provider.validateFix(fix))) {
                throw new Error('Fix validation failed');
              }
            }
          }
          
          result.appliedFixes.push(fix);
          result.summary.successful++;
          
          this.printFixApplied(fix, opts.dryRun);
        } catch (error: any) {
          result.failedFixes.push(fix);
          result.errors.push({
            fixId: fix.id,
            error: error.message
          });
          result.summary.failed++;
          
          logger.error(`Failed to apply fix ${fix.id}:`, error);
        }
      }
      
      transaction.status = 'applied';
    } catch (error) {
      // Rollback on failure
      if (!opts.dryRun && opts.createBackup) {
        await transaction.rollback();
        result.summary.rolledBack = result.appliedFixes.length;
      }
      
      transaction.status = 'failed';
      result.success = false;
      throw error;
    }
    
    return result;
  }
  
  /**
   * Create a transaction for atomic fix application
   */
  private createTransaction(fixes: Fix[]): FixTransaction {
    const transaction: FixTransaction = {
      id: uuidv4(),
      timestamp: new Date(),
      fixes,
      backup: [],
      status: 'pending',
      
      async applyFixes(): Promise<void> {
        // Applied through the engine
      },
      
      async rollback(): Promise<void> {
        logger.info(`Rolling back transaction ${this.id}...`);
        
        for (const backup of this.backup) {
          try {
            writeFileSync(backup.filePath, backup.content);
            // Restore file stats
            const { mode, mtime } = backup.stats;
            const fs = require('fs');
            fs.chmodSync(backup.filePath, mode);
            fs.utimesSync(backup.filePath, mtime, mtime);
          } catch (error) {
            logger.error(`Failed to restore ${backup.filePath}:`, error);
          }
        }
        
        this.status = 'rolled-back';
      },
      
      async validate(): Promise<boolean> {
        // Validate all fixes were applied correctly
        return true;
      }
    };
    
    return transaction;
  }
  
  /**
   * Create backups for files that will be modified
   */
  private async createBackups(transaction: FixTransaction): Promise<void> {
    const filesToBackup = new Set<string>();
    
    // Collect all files that will be modified
    for (const fix of transaction.fixes) {
      for (const change of fix.changes) {
        filesToBackup.add(change.filePath);
      }
    }
    
    // Create backups
    for (const filePath of filesToBackup) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        const stats = statSync(filePath);
        
        transaction.backup.push({
          filePath,
          content,
          stats: {
            mode: stats.mode,
            mtime: stats.mtime
          }
        });
        
        // Also save to backup directory
        const backupPath = this.getBackupPath(filePath, transaction.id);
        const backupDir = dirname(backupPath);
        
        if (!existsSync(backupDir)) {
          mkdirSync(backupDir, { recursive: true });
        }
        
        writeFileSync(backupPath, content);
      } catch (error) {
        logger.error(`Failed to backup ${filePath}:`, error);
        throw error;
      }
    }
  }
  
  /**
   * Apply a single fix
   */
  private async applyFix(fix: Fix): Promise<void> {
    for (const change of fix.changes) {
      const currentContent = readFileSync(change.filePath, 'utf-8');
      
      // Verify the original content matches
      if (change.original && !currentContent.includes(change.original)) {
        throw new Error(
          `Original content not found in ${change.filePath}. File may have been modified.`
        );
      }
      
      // Apply the change
      let newContent: string;
      if (change.original) {
        newContent = currentContent.replace(change.original, change.modified);
      } else {
        // If no original provided, replace entire file
        newContent = change.modified;
      }
      
      writeFileSync(change.filePath, newContent);
    }
  }
  
  /**
   * Create fix context for providers
   */
  private async createFixContext(issue: CodeIssue): Promise<FixContext> {
    const fileContent = readFileSync(issue.file, 'utf-8');
    
    return {
      fileContent,
      filePath: issue.file,
      language: this.detectLanguage(issue.file),
      issue,
      config: {} // TODO: Load from ConfigManager
    };
  }
  
  /**
   * Check if a fix should be applied based on options
   */
  private shouldApplyFix(fix: Fix, options: FixOptions): boolean {
    // Check risk level
    const riskLevels = { low: 1, medium: 2, high: 3 };
    if (riskLevels[fix.risk] > riskLevels[options.maxRisk]) {
      return false;
    }
    
    // Check confidence
    if (fix.confidence < options.minConfidence) {
      return false;
    }
    
    // Check categories if specified
    if (options.categories.length > 0) {
      const provider = this.providers.get(fix.provider);
      if (!provider || !options.categories.includes(provider.name)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Prompt user for fix confirmation (interactive mode)
   */
  private async promptForFix(fix: Fix): Promise<boolean> {
    console.log(chalk.cyan('\n─────────────────────────────────────'));
    console.log(chalk.yellow(`Fix: ${fix.description}`));
    console.log(chalk.gray(`Provider: ${fix.provider}`));
    console.log(chalk.gray(`Confidence: ${(fix.confidence * 100).toFixed(0)}%`));
    console.log(chalk.gray(`Risk: ${fix.risk}`));
    
    for (const change of fix.changes) {
      console.log(chalk.blue(`\nFile: ${change.filePath}`));
      if (change.original && change.modified) {
        console.log(chalk.red('- ' + change.original.trim()));
        console.log(chalk.green('+ ' + change.modified.trim()));
      }
    }
    
    // TODO: Implement actual prompt
    return true;
  }
  
  /**
   * Print fix application result
   */
  private printFixApplied(fix: Fix, dryRun: boolean): void {
    const prefix = dryRun ? '[DRY RUN] ' : '';
    console.log(
      chalk.green(`✓ ${prefix}Applied fix: ${fix.description}`)
    );
  }
  
  /**
   * Get backup file path
   */
  private getBackupPath(originalPath: string, transactionId: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = originalPath.replace(/[/\\]/g, '_');
    return join(this.backupDir, transactionId, `${timestamp}_${filename}`);
  }
  
  /**
   * Ensure backup directory exists
   */
  private ensureBackupDirectory(): void {
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }
  }
  
  /**
   * Detect language from file extension
   */
  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      go: 'go',
      java: 'java',
      rb: 'ruby',
      rs: 'rust'
    };
    
    return languageMap[ext] || 'unknown';
  }
  
  /**
   * Get transaction by ID
   */
  getTransaction(id: string): FixTransaction | undefined {
    return this.transactions.get(id);
  }
  
  /**
   * Get all registered providers
   */
  getProviders(): FixProvider[] {
    return Array.from(this.providers.values());
  }
}