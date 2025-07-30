import { FixProvider, Fix, FixContext } from '../types';
import { CodeIssue } from '../../Botbie';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@earth-agents/core';

export abstract class BaseFixProvider implements FixProvider {
  abstract name: string;
  abstract supportedIssueTypes: string[];
  
  canFix(issue: CodeIssue): boolean {
    return this.supportedIssueTypes.includes(issue.type);
  }
  
  abstract generateFix(issue: CodeIssue, context: FixContext): Promise<Fix | null>;
  
  async validateFix(fix: Fix): Promise<boolean> {
    try {
      // Basic validation - can be overridden by subclasses
      if (!fix.changes || fix.changes.length === 0) {
        return false;
      }
      
      for (const change of fix.changes) {
        if (!change.filePath || !change.modified) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.error(`Fix validation failed for ${fix.id}:`, error);
      return false;
    }
  }
  
  /**
   * Create a fix object with common properties
   */
  protected createFix(
    issueId: string,
    description: string,
    changes: any[],
    confidence: number = 0.8,
    risk: 'low' | 'medium' | 'high' = 'low'
  ): Fix {
    return {
      id: uuidv4(),
      issueId,
      description,
      changes,
      confidence,
      risk,
      provider: this.name
    };
  }
  
  /**
   * Extract code at specific line range
   */
  protected extractLines(
    content: string, 
    startLine: number, 
    endLine?: number
  ): string {
    const lines = content.split('\n');
    const end = endLine || startLine;
    return lines.slice(startLine - 1, end).join('\n');
  }
  
  /**
   * Replace code at specific line range
   */
  protected replaceLines(
    content: string,
    startLine: number,
    endLine: number,
    replacement: string
  ): string {
    const lines = content.split('\n');
    lines.splice(startLine - 1, endLine - startLine + 1, replacement);
    return lines.join('\n');
  }
  
  /**
   * Get indentation of a line
   */
  protected getIndentation(line: string): string {
    const match = line.match(/^(\s*)/);
    return match ? match[1] : '';
  }
  
  /**
   * Detect indentation style (spaces vs tabs)
   */
  protected detectIndentation(content: string): { type: 'spaces' | 'tabs'; size: number } {
    const lines = content.split('\n');
    const indentations: Map<string, number> = new Map();
    
    for (const line of lines) {
      const match = line.match(/^(\s+)/);
      if (match) {
        const indent = match[1];
        if (indent.includes('\t')) {
          return { type: 'tabs', size: 1 };
        }
        indentations.set(indent, (indentations.get(indent) || 0) + 1);
      }
    }
    
    // Find most common space indent
    let mostCommon = 2;
    let maxCount = 0;
    
    for (const [indent, count] of indentations) {
      if (count > maxCount && indent.length % 2 === 0) {
        maxCount = count;
        mostCommon = indent.length;
      }
    }
    
    return { type: 'spaces', size: mostCommon };
  }
}