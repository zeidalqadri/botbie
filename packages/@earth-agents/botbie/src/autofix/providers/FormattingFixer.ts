import { BaseFixProvider } from './BaseFixProvider';
import { Fix, FixContext, FileChange } from '../types';
import { CodeIssue } from '../../Botbie';
import * as ts from 'typescript';

export class FormattingFixer extends BaseFixProvider {
  name = 'FormattingFixer';
  supportedIssueTypes = [
    'inconsistent-indentation',
    'trailing-whitespace',
    'missing-semicolon',
    'extra-semicolon',
    'inconsistent-quotes',
    'missing-newline-eof',
    'extra-blank-lines',
    'spacing-issues'
  ];
  
  async generateFix(issue: CodeIssue, context: FixContext): Promise<Fix | null> {
    try {
      switch (issue.type) {
        case 'inconsistent-indentation':
          return this.fixIndentation(issue, context);
        case 'trailing-whitespace':
          return this.fixTrailingWhitespace(issue, context);
        case 'missing-semicolon':
          return this.fixMissingSemicolon(issue, context);
        case 'extra-semicolon':
          return this.fixExtraSemicolon(issue, context);
        case 'inconsistent-quotes':
          return this.fixInconsistentQuotes(issue, context);
        case 'missing-newline-eof':
          return this.fixMissingNewlineEOF(issue, context);
        case 'extra-blank-lines':
          return this.fixExtraBlankLines(issue, context);
        case 'spacing-issues':
          return this.fixSpacingIssues(issue, context);
        default:
          return null;
      }
    } catch (error) {
      console.error('Failed to generate formatting fix:', error);
      return null;
    }
  }
  
  /**
   * Fix inconsistent indentation
   */
  private fixIndentation(issue: CodeIssue, context: FixContext): Fix {
    const lines = context.fileContent.split('\n');
    const indentStyle = this.detectIndentation(context.fileContent);
    const targetIndent = indentStyle.type === 'spaces' ? ' '.repeat(indentStyle.size) : '\t';
    
    const changes: FileChange[] = [];
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trimStart();
      
      if (trimmedLine === '') return; // Skip empty lines
      
      const currentIndent = line.substring(0, line.length - trimmedLine.length);
      const indentLevel = this.calculateIndentLevel(line, context.fileContent);
      const expectedIndent = targetIndent.repeat(indentLevel);
      
      if (currentIndent !== expectedIndent) {
        const correctedLine = expectedIndent + trimmedLine;
        
        changes.push({
          filePath: context.filePath,
          original: line,
          modified: correctedLine,
          startLine: lineNumber
        });
      }
    });
    
    return this.createFix(
      issue.id,
      `Fix indentation for ${changes.length} line${changes.length > 1 ? 's' : ''}`,
      changes,
      0.95,
      'low'
    );
  }
  
  /**
   * Fix trailing whitespace
   */
  private fixTrailingWhitespace(issue: CodeIssue, context: FixContext): Fix {
    const lines = context.fileContent.split('\n');
    const changes: FileChange[] = [];
    
    lines.forEach((line, index) => {
      if (line.match(/\s+$/)) {
        const lineNumber = index + 1;
        const trimmedLine = line.trimEnd();
        
        changes.push({
          filePath: context.filePath,
          original: line,
          modified: trimmedLine,
          startLine: lineNumber
        });
      }
    });
    
    return this.createFix(
      issue.id,
      `Remove trailing whitespace from ${changes.length} line${changes.length > 1 ? 's' : ''}`,
      changes,
      0.98,
      'low'
    );
  }
  
  /**
   * Fix missing semicolons
   */
  private fixMissingSemicolon(issue: CodeIssue, context: FixContext): Fix | null {
    if (context.language !== 'typescript' && context.language !== 'javascript') {
      return null;
    }
    
    const sourceFile = ts.createSourceFile(
      context.filePath,
      context.fileContent,
      ts.ScriptTarget.Latest,
      true
    );
    
    const changes: FileChange[] = [];
    const missingSemicolons = this.findMissingSemicolons(sourceFile);
    
    missingSemicolons.forEach(position => {
      const lineInfo = sourceFile.getLineAndCharacterOfPosition(position);
      const lineNumber = lineInfo.line + 1;
      const line = this.extractLines(context.fileContent, lineNumber);
      const modifiedLine = line + ';';
      
      changes.push({
        filePath: context.filePath,
        original: line,
        modified: modifiedLine,
        startLine: lineNumber
      });
    });
    
    return this.createFix(
      issue.id,
      `Add ${changes.length} missing semicolon${changes.length > 1 ? 's' : ''}`,
      changes,
      0.9,
      'low'
    );
  }
  
  /**
   * Fix extra semicolons
   */
  private fixExtraSemicolon(issue: CodeIssue, context: FixContext): Fix {
    const lines = context.fileContent.split('\n');
    const changes: FileChange[] = [];
    
    lines.forEach((line, index) => {
      // Look for double semicolons or semicolons after braces
      const extraSemicolonRegex = /;;+|}\s*;(?=\s*$)/g;
      if (extraSemicolonRegex.test(line)) {
        const lineNumber = index + 1;
        const correctedLine = line
          .replace(/;;+/g, ';')  // Replace multiple semicolons with single
          .replace(/}\s*;(?=\s*$)/g, '}'); // Remove semicolon after closing brace
        
        changes.push({
          filePath: context.filePath,
          original: line,
          modified: correctedLine,
          startLine: lineNumber
        });
      }
    });
    
    return this.createFix(
      issue.id,
      `Remove extra semicolons from ${changes.length} line${changes.length > 1 ? 's' : ''}`,
      changes,
      0.9,
      'low'
    );
  }
  
  /**
   * Fix inconsistent quotes
   */
  private fixInconsistentQuotes(issue: CodeIssue, context: FixContext): Fix {
    const preferredQuote = this.detectPreferredQuote(context.fileContent);
    const otherQuote = preferredQuote === '"' ? "'" : '"';
    
    const lines = context.fileContent.split('\n');
    const changes: FileChange[] = [];
    
    lines.forEach((line, index) => {
      // Simple regex to find string literals (not perfect but good enough)
      const stringRegex = new RegExp(`${this.escapeRegex(otherQuote)}([^${this.escapeRegex(otherQuote)}\\\\]|\\\\.)*${this.escapeRegex(otherQuote)}`, 'g');
      
      if (stringRegex.test(line)) {
        const lineNumber = index + 1;
        const correctedLine = line.replace(stringRegex, match => {
          // Replace outer quotes and escape inner quotes if needed
          const content = match.slice(1, -1);
          const escapedContent = content.replace(new RegExp(this.escapeRegex(preferredQuote), 'g'), '\\' + preferredQuote);
          return preferredQuote + escapedContent + preferredQuote;
        });
        
        changes.push({
          filePath: context.filePath,
          original: line,
          modified: correctedLine,
          startLine: lineNumber
        });
      }
    });
    
    return this.createFix(
      issue.id,
      `Standardize quotes to ${preferredQuote === '"' ? 'double' : 'single'} quotes`,
      changes,
      0.85,
      'low'
    );
  }
  
  /**
   * Fix missing newline at end of file
   */
  private fixMissingNewlineEOF(issue: CodeIssue, context: FixContext): Fix {
    if (!context.fileContent.endsWith('\n')) {
      const change: FileChange = {
        filePath: context.filePath,
        original: context.fileContent,
        modified: context.fileContent + '\n',
        startLine: context.fileContent.split('\n').length
      };
      
      return this.createFix(
        issue.id,
        'Add newline at end of file',
        [change],
        0.98,
        'low'
      );
    }
    
    return this.createFix(issue.id, 'No fix needed', [], 1.0, 'low');
  }
  
  /**
   * Fix extra blank lines
   */
  private fixExtraBlankLines(issue: CodeIssue, context: FixContext): Fix {
    const lines = context.fileContent.split('\n');
    const maxConsecutiveBlankLines = 1;
    const changes: FileChange[] = [];
    
    let consecutiveBlankLines = 0;
    const newLines: string[] = [];
    
    lines.forEach((line, index) => {
      if (line.trim() === '') {
        consecutiveBlankLines++;
        if (consecutiveBlankLines <= maxConsecutiveBlankLines) {
          newLines.push(line);
        }
      } else {
        consecutiveBlankLines = 0;
        newLines.push(line);
      }
    });
    
    const newContent = newLines.join('\n');
    
    if (newContent !== context.fileContent) {
      const change: FileChange = {
        filePath: context.filePath,
        original: context.fileContent,
        modified: newContent,
        startLine: 1
      };
      
      changes.push(change);
    }
    
    return this.createFix(
      issue.id,
      'Remove extra blank lines',
      changes,
      0.9,
      'low'
    );
  }
  
  /**
   * Fix spacing issues around operators and keywords
   */
  private fixSpacingIssues(issue: CodeIssue, context: FixContext): Fix {
    const lines = context.fileContent.split('\n');
    const changes: FileChange[] = [];
    
    lines.forEach((line, index) => {
      let correctedLine = line;
      
      // Fix spacing around operators
      correctedLine = correctedLine
        .replace(/([^=!<>])=([^=])/g, '$1 = $2')    // = operator
        .replace(/([^=!<>])==([^=])/g, '$1 == $2')  // == operator
        .replace(/([^=!<>])===([^=])/g, '$1 === $2') // === operator
        .replace(/([^!])!=([^=])/g, '$1 != $2')      // != operator
        .replace(/([^!])!==([^=])/g, '$1 !== $2')    // !== operator
        .replace(/([^<>])<=([^=])/g, '$1 <= $2')     // <= operator
        .replace(/([^<>])>=([^=])/g, '$1 >= $2')     // >= operator
        .replace(/([^+])\+([^+=])/g, '$1 + $2')      // + operator
        .replace(/([^-])-([^-=])/g, '$1 - $2')       // - operator
        .replace(/([^*])\*([^*=])/g, '$1 * $2')      // * operator
        .replace(/([^/])\/([^/=])/g, '$1 / $2')      // / operator
        .replace(/([^%])%([^=])/g, '$1 % $2');       // % operator
      
      // Fix spacing around keywords
      correctedLine = correctedLine
        .replace(/\bif\(/g, 'if (')
        .replace(/\bfor\(/g, 'for (')
        .replace(/\bwhile\(/g, 'while (')
        .replace(/\bswitch\(/g, 'switch (')
        .replace(/\bcatch\(/g, 'catch (')
        .replace(/}\s*else\s*{/g, '} else {')
        .replace(/}\s*else\s+if\s*\(/g, '} else if (');
      
      // Fix spacing around braces
      correctedLine = correctedLine
        .replace(/\){/g, ') {')
        .replace(/\s+{/g, ' {')
        .replace(/{(?!\s)/g, '{ ')
        .replace(/(?<!\s)}/g, ' }');
      
      if (correctedLine !== line) {
        const lineNumber = index + 1;
        changes.push({
          filePath: context.filePath,
          original: line,
          modified: correctedLine,
          startLine: lineNumber
        });
      }
    });
    
    return this.createFix(
      issue.id,
      `Fix spacing issues in ${changes.length} line${changes.length > 1 ? 's' : ''}`,
      changes,
      0.8,
      'low'
    );
  }
  
  /**
   * Calculate expected indent level for a line
   */
  private calculateIndentLevel(line: string, fullContent: string): number {
    // This is a simplified implementation
    // In reality, you'd need to parse the AST to get accurate indent levels
    const lines = fullContent.split('\n');
    const currentIndex = lines.indexOf(line);
    
    let level = 0;
    
    for (let i = 0; i < currentIndex; i++) {
      const prevLine = lines[i].trim();
      
      // Increase level for opening braces, function declarations, etc.
      if (prevLine.endsWith('{') || 
          prevLine.endsWith('(') ||
          prevLine.includes('if (') ||
          prevLine.includes('for (') ||
          prevLine.includes('while (') ||
          prevLine.includes('function ')) {
        level++;
      }
      
      // Decrease level for closing braces
      if (prevLine.startsWith('}') || prevLine.startsWith(')')) {
        level = Math.max(0, level - 1);
      }
    }
    
    // Adjust for current line
    const currentTrimmed = line.trim();
    if (currentTrimmed.startsWith('}') || currentTrimmed.startsWith(')')) {
      level = Math.max(0, level - 1);
    }
    
    return level;
  }
  
  /**
   * Find missing semicolons in TypeScript/JavaScript
   */
  private findMissingSemicolons(sourceFile: ts.SourceFile): number[] {
    const positions: number[] = [];
    
    const visit = (node: ts.Node) => {
      // Check if this statement should end with a semicolon
      if (this.shouldHaveSemicolon(node) && !this.hasSemicolon(node, sourceFile)) {
        positions.push(node.end);
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    return positions;
  }
  
  /**
   * Check if a node should have a semicolon
   */
  private shouldHaveSemicolon(node: ts.Node): boolean {
    return ts.isExpressionStatement(node) ||
           ts.isVariableStatement(node) ||
           ts.isReturnStatement(node) ||
           ts.isBreakStatement(node) ||
           ts.isContinueStatement(node) ||
           ts.isThrowStatement(node);
  }
  
  /**
   * Check if a node already has a semicolon
   */
  private hasSemicolon(node: ts.Node, sourceFile: ts.SourceFile): boolean {
    const nodeText = sourceFile.text.substring(node.pos, node.end);
    return nodeText.trim().endsWith(';');
  }
  
  /**
   * Detect preferred quote style in the file
   */
  private detectPreferredQuote(content: string): '"' | "'" {
    const doubleQuotes = (content.match(/"/g) || []).length;
    const singleQuotes = (content.match(/'/g) || []).length;
    
    return doubleQuotes >= singleQuotes ? '"' : "'";
  }
  
  /**
   * Escape regex special characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}