import { BaseFixProvider } from './BaseFixProvider';
import { Fix, FixContext, FileChange } from '../types';
import { CodeIssue } from '../../Botbie';
import * as ts from 'typescript';

export class RefactoringFixer extends BaseFixProvider {
  name = 'RefactoringFixer';
  supportedIssueTypes = [
    'simplify-boolean-expression',
    'unnecessary-else',
    'merge-if-statements',
    'extract-magic-number',
    'replace-var-with-let',
    'use-template-literals',
    'remove-dead-code',
    'simplify-conditionals'
  ];
  
  async generateFix(issue: CodeIssue, context: FixContext): Promise<Fix | null> {
    if (context.language !== 'typescript' && context.language !== 'javascript') {
      return null;
    }
    
    try {
      const sourceFile = ts.createSourceFile(
        context.filePath,
        context.fileContent,
        ts.ScriptTarget.Latest,
        true
      );
      
      switch (issue.type) {
        case 'simplify-boolean-expression':
          return this.simplifyBooleanExpression(issue, context, sourceFile);
        case 'unnecessary-else':
          return this.removeUnnecessaryElse(issue, context, sourceFile);
        case 'merge-if-statements':
          return this.mergeIfStatements(issue, context, sourceFile);
        case 'extract-magic-number':
          return this.extractMagicNumber(issue, context, sourceFile);
        case 'replace-var-with-let':
          return this.replaceVarWithLet(issue, context, sourceFile);
        case 'use-template-literals':
          return this.useTemplateLiterals(issue, context, sourceFile);
        case 'remove-dead-code':
          return this.removeDeadCode(issue, context, sourceFile);
        case 'simplify-conditionals':
          return this.simplifyConditionals(issue, context, sourceFile);
        default:
          return null;
      }
    } catch (error) {
      console.error('Failed to generate refactoring fix:', error);
      return null;
    }
  }
  
  /**
   * Simplify boolean expressions like `!!value` or `value === true`
   */
  private simplifyBooleanExpression(
    issue: CodeIssue,
    context: FixContext,
    sourceFile: ts.SourceFile
  ): Fix | null {
    const node = this.findNodeAtLine(sourceFile, issue.line || 1);
    if (!node) return null;
    
    const changes: FileChange[] = [];
    
    const visit = (n: ts.Node) => {
      // Simplify `!!value` to `Boolean(value)`
      if (ts.isPrefixUnaryExpression(n) && 
          n.operator === ts.SyntaxKind.ExclamationToken &&
          ts.isPrefixUnaryExpression(n.operand) &&
          n.operand.operator === ts.SyntaxKind.ExclamationToken) {
        
        const original = n.getText();
        const simplified = `Boolean(${n.operand.operand.getText()})`;
        
        changes.push({
          filePath: context.filePath,
          original,
          modified: simplified,
          startLine: sourceFile.getLineAndCharacterOfPosition(n.pos).line + 1
        });
      }
      
      // Simplify `value === true` to `value`
      if (ts.isBinaryExpression(n) && 
          n.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken &&
          ((n.right.kind === ts.SyntaxKind.TrueKeyword) || 
           (n.left.kind === ts.SyntaxKind.TrueKeyword))) {
        
        const original = n.getText();
        const valueExpr = n.right.kind === ts.SyntaxKind.TrueKeyword ? n.left : n.right;
        const simplified = valueExpr.getText();
        
        changes.push({
          filePath: context.filePath,
          original,
          modified: simplified,
          startLine: sourceFile.getLineAndCharacterOfPosition(n.pos).line + 1
        });
      }
      
      // Simplify `value === false` to `!value`
      if (ts.isBinaryExpression(n) && 
          n.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken &&
          ((n.right.kind === ts.SyntaxKind.FalseKeyword) || 
           (n.left.kind === ts.SyntaxKind.FalseKeyword))) {
        
        const original = n.getText();
        const valueExpr = n.right.kind === ts.SyntaxKind.FalseKeyword ? n.left : n.right;
        const simplified = `!${valueExpr.getText()}`;
        
        changes.push({
          filePath: context.filePath,
          original,
          modified: simplified,
          startLine: sourceFile.getLineAndCharacterOfPosition(n.pos).line + 1
        });
      }
      
      ts.forEachChild(n, visit);
    };
    
    visit(node);
    
    if (changes.length === 0) return null;
    
    return this.createFix(
      issue.id,
      `Simplify ${changes.length} boolean expression${changes.length > 1 ? 's' : ''}`,
      changes,
      0.9,
      'low'
    );
  }
  
  /**
   * Remove unnecessary else after return statement
   */
  private removeUnnecessaryElse(
    issue: CodeIssue,
    context: FixContext,
    sourceFile: ts.SourceFile
  ): Fix | null {
    const node = this.findNodeAtLine(sourceFile, issue.line || 1);
    if (!node || !ts.isIfStatement(node)) return null;
    
    // Check if the if statement has an else and the if block ends with return
    if (!node.elseStatement || !this.blockEndsWithReturn(node.thenStatement)) {
      return null;
    }
    
    const original = node.getText();
    const ifPart = node.thenStatement.getText();
    const elsePart = ts.isBlock(node.elseStatement) 
      ? node.elseStatement.statements.map(s => s.getText()).join('\n')
      : node.elseStatement.getText();
    
    const condition = node.expression.getText();
    const simplified = `if (${condition}) ${ifPart}\n${elsePart}`;
    
    const change: FileChange = {
      filePath: context.filePath,
      original,
      modified: simplified,
      startLine: sourceFile.getLineAndCharacterOfPosition(node.pos).line + 1
    };
    
    return this.createFix(
      issue.id,
      'Remove unnecessary else after return',
      [change],
      0.85,
      'medium'
    );
  }
  
  /**
   * Merge nested if statements with same condition
   */
  private mergeIfStatements(
    issue: CodeIssue,
    context: FixContext,
    sourceFile: ts.SourceFile
  ): Fix | null {
    const node = this.findNodeAtLine(sourceFile, issue.line || 1);
    if (!node || !ts.isIfStatement(node)) return null;
    
    // Check for nested if with same condition
    if (!ts.isBlock(node.thenStatement) || 
        node.thenStatement.statements.length !== 1 ||
        !ts.isIfStatement(node.thenStatement.statements[0])) {
      return null;
    }
    
    const outerIf = node;
    const innerIf = node.thenStatement.statements[0] as ts.IfStatement;
    
    // Check if conditions are the same (simplified check)
    if (outerIf.expression.getText() !== innerIf.expression.getText()) {
      return null;
    }
    
    const original = outerIf.getText();
    const mergedBody = innerIf.thenStatement.getText();
    const condition = outerIf.expression.getText();
    const simplified = `if (${condition}) ${mergedBody}`;
    
    const change: FileChange = {
      filePath: context.filePath,
      original,
      modified: simplified,
      startLine: sourceFile.getLineAndCharacterOfPosition(outerIf.pos).line + 1
    };
    
    return this.createFix(
      issue.id,
      'Merge nested if statements',
      [change],
      0.8,
      'medium'
    );
  }
  
  /**
   * Extract magic numbers to named constants
   */
  private extractMagicNumber(
    issue: CodeIssue,
    context: FixContext,
    sourceFile: ts.SourceFile
  ): Fix | null {
    const node = this.findNodeAtLine(sourceFile, issue.line || 1);
    if (!node) return null;
    
    const changes: FileChange[] = [];
    const magicNumbers: { value: number; node: ts.NumericLiteral }[] = [];
    
    const visit = (n: ts.Node) => {
      if (ts.isNumericLiteral(n)) {
        const value = parseFloat(n.text);
        // Consider numbers > 1 as magic numbers (excluding 0, 1, -1)
        if (Math.abs(value) > 1 && !this.isCommonNumber(value)) {
          magicNumbers.push({ value, node: n });
        }
      }
      ts.forEachChild(n, visit);
    };
    
    visit(node);
    
    if (magicNumbers.length === 0) return null;
    
    // Generate constant names and values
    const constants = magicNumbers.map(({ value }) => {
      const name = this.generateConstantName(value);
      return { name, value };
    });
    
    // Add constants at the top of the file
    const constantDeclarations = constants
      .map(({ name, value }) => `const ${name} = ${value};`)
      .join('\n') + '\n\n';
    
    // Replace magic numbers with constant references
    magicNumbers.forEach(({ node }, index) => {
      const original = node.getText();
      const constantName = constants[index].name;
      
      changes.push({
        filePath: context.filePath,
        original,
        modified: constantName,
        startLine: sourceFile.getLineAndCharacterOfPosition(node.pos).line + 1
      });
    });
    
    // Add constants at the beginning
    changes.unshift({
      filePath: context.filePath,
      original: '',
      modified: constantDeclarations,
      startLine: 1
    });
    
    return this.createFix(
      issue.id,
      `Extract ${magicNumbers.length} magic number${magicNumbers.length > 1 ? 's' : ''} to constants`,
      changes,
      0.7,
      'medium'
    );
  }
  
  /**
   * Replace var declarations with let/const
   */
  private replaceVarWithLet(
    issue: CodeIssue,
    context: FixContext,
    sourceFile: ts.SourceFile
  ): Fix | null {
    const changes: FileChange[] = [];
    
    const visit = (node: ts.Node) => {
      if (ts.isVariableStatement(node) && 
          !(node.declarationList.flags & ts.NodeFlags.Let) &&
          !(node.declarationList.flags & ts.NodeFlags.Const)) {
        
        // This is a var declaration
        const original = node.getText();
        const isReassigned = this.isVariableReassigned(node.declarationList, sourceFile);
        const replacement = isReassigned ? 'let' : 'const';
        const modified = original.replace(/^\s*var\b/, replacement);
        
        changes.push({
          filePath: context.filePath,
          original,
          modified,
          startLine: sourceFile.getLineAndCharacterOfPosition(node.pos).line + 1
        });
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    
    if (changes.length === 0) return null;
    
    return this.createFix(
      issue.id,
      `Replace var with let/const in ${changes.length} declaration${changes.length > 1 ? 's' : ''}`,
      changes,
      0.9,
      'low'
    );
  }
  
  /**
   * Convert string concatenation to template literals
   */
  private useTemplateLiterals(
    issue: CodeIssue,
    context: FixContext,
    sourceFile: ts.SourceFile
  ): Fix | null {
    const node = this.findNodeAtLine(sourceFile, issue.line || 1);
    if (!node) return null;
    
    const changes: FileChange[] = [];
    
    const visit = (n: ts.Node) => {
      if (ts.isBinaryExpression(n) && 
          n.operatorToken.kind === ts.SyntaxKind.PlusToken &&
          this.isStringConcatenation(n)) {
        
        const original = n.getText();
        const templateLiteral = this.convertToTemplateLiteral(n);
        
        changes.push({
          filePath: context.filePath,
          original,
          modified: templateLiteral,
          startLine: sourceFile.getLineAndCharacterOfPosition(n.pos).line + 1
        });
      }
      
      ts.forEachChild(n, visit);
    };
    
    visit(node);
    
    if (changes.length === 0) return null;
    
    return this.createFix(
      issue.id,
      `Convert ${changes.length} string concatenation${changes.length > 1 ? 's' : ''} to template literals`,
      changes,
      0.85,
      'low'
    );
  }
  
  /**
   * Remove unreachable code
   */
  private removeDeadCode(
    issue: CodeIssue,
    context: FixContext,
    sourceFile: ts.SourceFile
  ): Fix | null {
    const node = this.findNodeAtLine(sourceFile, issue.line || 1);
    if (!node) return null;
    
    // Simple dead code detection: code after return/throw statements
    const changes: FileChange[] = [];
    
    const visit = (n: ts.Node) => {
      if (ts.isBlock(n)) {
        const statements = n.statements;
        
        for (let i = 0; i < statements.length - 1; i++) {
          const stmt = statements[i];
          
          if (ts.isReturnStatement(stmt) || ts.isThrowStatement(stmt)) {
            // Everything after this is unreachable
            const unreachableStatements = statements.slice(i + 1);
            
            if (unreachableStatements.length > 0) {
              const original = unreachableStatements.map(s => s.getText()).join('\n');
              
              changes.push({
                filePath: context.filePath,
                original,
                modified: '',
                startLine: sourceFile.getLineAndCharacterOfPosition(unreachableStatements[0].pos).line + 1
              });
            }
            break;
          }
        }
      }
      
      ts.forEachChild(n, visit);
    };
    
    visit(node);
    
    if (changes.length === 0) return null;
    
    return this.createFix(
      issue.id,
      'Remove unreachable code',
      changes,
      0.95,
      'low'
    );
  }
  
  /**
   * Simplify conditional expressions
   */
  private simplifyConditionals(
    issue: CodeIssue,
    context: FixContext,
    sourceFile: ts.SourceFile
  ): Fix | null {
    const node = this.findNodeAtLine(sourceFile, issue.line || 1);
    if (!node) return null;
    
    const changes: FileChange[] = [];
    
    const visit = (n: ts.Node) => {
      // Simplify `condition ? true : false` to `condition`
      if (ts.isConditionalExpression(n) &&
          n.whenTrue.kind === ts.SyntaxKind.TrueKeyword &&
          n.whenFalse.kind === ts.SyntaxKind.FalseKeyword) {
        
        const original = n.getText();
        const simplified = n.condition.getText();
        
        changes.push({
          filePath: context.filePath,
          original,
          modified: simplified,
          startLine: sourceFile.getLineAndCharacterOfPosition(n.pos).line + 1
        });
      }
      
      // Simplify `condition ? false : true` to `!condition`
      if (ts.isConditionalExpression(n) &&
          n.whenTrue.kind === ts.SyntaxKind.FalseKeyword &&
          n.whenFalse.kind === ts.SyntaxKind.TrueKeyword) {
        
        const original = n.getText();
        const simplified = `!(${n.condition.getText()})`;
        
        changes.push({
          filePath: context.filePath,
          original,
          modified: simplified,
          startLine: sourceFile.getLineAndCharacterOfPosition(n.pos).line + 1
        });
      }
      
      ts.forEachChild(n, visit);
    };
    
    visit(node);
    
    if (changes.length === 0) return null;
    
    return this.createFix(
      issue.id,
      `Simplify ${changes.length} conditional expression${changes.length > 1 ? 's' : ''}`,
      changes,
      0.9,
      'low'
    );
  }
  
  /**
   * Find node at specific line
   */
  private findNodeAtLine(sourceFile: ts.SourceFile, targetLine: number): ts.Node | null {
    let foundNode: ts.Node | null = null;
    
    const visit = (node: ts.Node) => {
      const start = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
      
      if (start <= targetLine && targetLine <= end) {
        foundNode = node;
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    return foundNode;
  }
  
  /**
   * Check if a block ends with a return statement
   */
  private blockEndsWithReturn(statement: ts.Statement): boolean {
    if (ts.isReturnStatement(statement)) {
      return true;
    }
    
    if (ts.isBlock(statement)) {
      const lastStatement = statement.statements[statement.statements.length - 1];
      return lastStatement && ts.isReturnStatement(lastStatement);
    }
    
    return false;
  }
  
  /**
   * Check if a number is commonly used (not magic)
   */
  private isCommonNumber(value: number): boolean {
    const common = [0, 1, -1, 2, 10, 100, 1000];
    return common.includes(value);
  }
  
  /**
   * Generate a constant name for a magic number
   */
  private generateConstantName(value: number): string {
    const intValue = Math.floor(value);
    return `MAGIC_NUMBER_${Math.abs(intValue)}`;
  }
  
  /**
   * Check if a variable is reassigned after declaration
   */
  private isVariableReassigned(
    declarationList: ts.VariableDeclarationList,
    sourceFile: ts.SourceFile
  ): boolean {
    // Simple heuristic: if there's no initializer, assume it's reassigned
    const declarations = declarationList.declarations;
    return declarations.some(decl => !decl.initializer);
  }
  
  /**
   * Check if binary expression is string concatenation
   */
  private isStringConcatenation(expr: ts.BinaryExpression): boolean {
    const hasStringLiteral = (node: ts.Node): boolean => {
      return ts.isStringLiteral(node) || ts.isTemplateExpression(node);
    };
    
    return hasStringLiteral(expr.left) || hasStringLiteral(expr.right);
  }
  
  /**
   * Convert string concatenation to template literal
   */
  private convertToTemplateLiteral(expr: ts.BinaryExpression): string {
    const convertPart = (node: ts.Node): string => {
      if (ts.isStringLiteral(node)) {
        return node.text;
      } else if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
        return convertPart(node.left) + convertPart(node.right);
      } else {
        return '${' + node.getText() + '}';
      }
    };
    
    const content = convertPart(expr);
    return '`' + content + '`';
  }
}