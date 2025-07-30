import { BaseFixProvider } from './BaseFixProvider';
import { Fix, FixContext, FileChange } from '../types';
import { CodeIssue } from '../../Botbie';
import * as ts from 'typescript';

export class DocumentationFixer extends BaseFixProvider {
  name = 'DocumentationFixer';
  supportedIssueTypes = ['missing-documentation'];
  
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
      
      // Find the node at the issue line
      const node = this.findNodeAtLine(sourceFile, issue.line || 1);
      if (!node) return null;
      
      // Generate appropriate documentation
      let documentation: string | null = null;
      
      if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
        documentation = this.generateFunctionDoc(node, sourceFile);
      } else if (ts.isClassDeclaration(node)) {
        documentation = this.generateClassDoc(node);
      } else if (ts.isInterfaceDeclaration(node)) {
        documentation = this.generateInterfaceDoc(node);
      } else if (ts.isPropertyDeclaration(node) || ts.isPropertySignature(node)) {
        documentation = this.generatePropertyDoc(node);
      }
      
      if (!documentation) return null;
      
      // Create the fix
      const startLine = sourceFile.getLineAndCharacterOfPosition(node.pos).line + 1;
      const originalLine = this.extractLines(context.fileContent, startLine);
      const indentation = this.getIndentation(originalLine);
      
      const change: FileChange = {
        filePath: context.filePath,
        original: originalLine,
        modified: documentation + '\n' + originalLine,
        startLine
      };
      
      return this.createFix(
        issue.id,
        `Add JSDoc documentation for ${node.kind === ts.SyntaxKind.FunctionDeclaration ? 'function' : 'class'} ${this.getNodeName(node)}`,
        [change],
        0.9,
        'low'
      );
      
    } catch (error) {
      console.error('Failed to generate documentation fix:', error);
      return null;
    }
  }
  
  /**
   * Find the AST node at a specific line
   */
  private findNodeAtLine(sourceFile: ts.SourceFile, targetLine: number): ts.Node | null {
    let foundNode: ts.Node | null = null;
    
    const visit = (node: ts.Node) => {
      const start = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
      
      if (start <= targetLine && targetLine <= end) {
        // Check if this is a declaration node we can document
        if (
          ts.isFunctionDeclaration(node) ||
          ts.isMethodDeclaration(node) ||
          ts.isClassDeclaration(node) ||
          ts.isInterfaceDeclaration(node) ||
          ts.isPropertyDeclaration(node) ||
          ts.isPropertySignature(node)
        ) {
          foundNode = node;
        }
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    return foundNode;
  }
  
  /**
   * Generate JSDoc for a function or method
   */
  private generateFunctionDoc(
    node: ts.FunctionDeclaration | ts.MethodDeclaration,
    sourceFile: ts.SourceFile
  ): string {
    const name = node.name ? node.name.getText() : 'anonymous';
    const lines: string[] = ['/**'];
    
    // Add description
    lines.push(` * ${this.generateDescription(name, 'function')}`);
    
    // Add parameters
    if (node.parameters && node.parameters.length > 0) {
      node.parameters.forEach(param => {
        const paramName = param.name.getText();
        const paramType = this.getParameterType(param, sourceFile);
        const isOptional = param.questionToken ? ' (optional)' : '';
        lines.push(` * @param ${paramName} - ${this.generateParamDescription(paramName)}${isOptional}`);
        if (paramType && paramType !== 'any') {
          lines.push(` * @param {${paramType}} ${paramName}`);
        }
      });
    }
    
    // Add return type
    if (node.type) {
      const returnType = node.type.getText();
      if (returnType !== 'void') {
        lines.push(` * @returns {${returnType}} ${this.generateReturnDescription(name)}`);
      }
    } else if (this.hasReturnStatement(node)) {
      lines.push(` * @returns ${this.generateReturnDescription(name)}`);
    }
    
    // Add throws if there are throw statements
    if (this.hasThrowStatement(node)) {
      lines.push(` * @throws {Error} When an error occurs`);
    }
    
    // Add example
    if (node.parameters.length <= 2) {
      lines.push(` * @example`);
      lines.push(` * ${this.generateExample(node)}`);
    }
    
    lines.push(' */');
    
    const indentation = this.getNodeIndentation(node, sourceFile);
    return lines.map(line => indentation + line).join('\n');
  }
  
  /**
   * Generate JSDoc for a class
   */
  private generateClassDoc(node: ts.ClassDeclaration): string {
    const name = node.name ? node.name.getText() : 'Class';
    const lines: string[] = [
      '/**',
      ` * ${this.generateDescription(name, 'class')}`,
      ' */',
    ];
    
    return lines.join('\n');
  }
  
  /**
   * Generate JSDoc for an interface
   */
  private generateInterfaceDoc(node: ts.InterfaceDeclaration): string {
    const name = node.name.getText();
    const lines: string[] = [
      '/**',
      ` * ${this.generateDescription(name, 'interface')}`,
      ' */',
    ];
    
    return lines.join('\n');
  }
  
  /**
   * Generate JSDoc for a property
   */
  private generatePropertyDoc(node: ts.PropertyDeclaration | ts.PropertySignature): string {
    const name = node.name ? node.name.getText() : 'property';
    const lines: string[] = [
      '/**',
      ` * ${this.generateDescription(name, 'property')}`,
      ' */',
    ];
    
    return lines.join('\n');
  }
  
  /**
   * Generate a description based on the name and type
   */
  private generateDescription(name: string, type: string): string {
    // Convert camelCase/PascalCase to readable text
    const readable = name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
    
    const templates: Record<string, string[]> = {
      function: [
        `${readable}`,
        `Performs ${readable.toLowerCase()} operation`,
        `Handles ${readable.toLowerCase()}`,
      ],
      class: [
        `${readable} class`,
        `Represents a ${readable.toLowerCase()}`,
        `Manages ${readable.toLowerCase()} functionality`,
      ],
      interface: [
        `${readable} interface`,
        `Defines the contract for ${readable.toLowerCase()}`,
        `Represents the structure of ${readable.toLowerCase()}`,
      ],
      property: [
        `The ${readable.toLowerCase()}`,
        `Stores the ${readable.toLowerCase()}`,
        `Contains ${readable.toLowerCase()} information`,
      ],
    };
    
    const typeTemplates = templates[type] || [`${readable}`];
    return typeTemplates[0];
  }
  
  /**
   * Generate parameter description
   */
  private generateParamDescription(paramName: string): string {
    const commonParams: Record<string, string> = {
      id: 'The unique identifier',
      name: 'The name',
      value: 'The value',
      data: 'The data to process',
      options: 'Configuration options',
      callback: 'The callback function',
      error: 'The error object',
      index: 'The index position',
      item: 'The item to process',
      items: 'The array of items',
      config: 'The configuration object',
      context: 'The execution context',
      path: 'The file path',
      content: 'The content',
      message: 'The message',
      type: 'The type',
      key: 'The key',
      result: 'The result',
    };
    
    return commonParams[paramName.toLowerCase()] || `The ${paramName}`;
  }
  
  /**
   * Generate return description
   */
  private generateReturnDescription(functionName: string): string {
    const name = functionName.toLowerCase();
    
    if (name.startsWith('get')) {
      return 'The requested value';
    } else if (name.startsWith('is') || name.startsWith('has')) {
      return 'True if the condition is met, false otherwise';
    } else if (name.startsWith('create') || name.startsWith('make')) {
      return 'The newly created instance';
    } else if (name.startsWith('find') || name.startsWith('search')) {
      return 'The found item or null if not found';
    } else if (name.startsWith('calculate') || name.startsWith('compute')) {
      return 'The calculated result';
    }
    
    return 'The result';
  }
  
  /**
   * Generate example usage
   */
  private generateExample(node: ts.FunctionDeclaration | ts.MethodDeclaration): string {
    const name = node.name ? node.name.getText() : 'function';
    const params = node.parameters.map(p => {
      const paramName = p.name.getText();
      const paramType = this.getParameterType(p, null);
      
      // Generate example values based on type
      if (paramType === 'string') return `'example'`;
      if (paramType === 'number') return '42';
      if (paramType === 'boolean') return 'true';
      if (paramType?.includes('[]')) return '[]';
      if (paramType === 'object' || paramType?.includes('{')) return '{}';
      
      return paramName;
    }).join(', ');
    
    return `${name}(${params})`;
  }
  
  /**
   * Get parameter type as string
   */
  private getParameterType(param: ts.ParameterDeclaration, sourceFile: ts.SourceFile | null): string {
    if (param.type) {
      return param.type.getText();
    }
    
    // Try to infer type from initializer
    if (param.initializer) {
      const init = param.initializer;
      if (ts.isStringLiteral(init)) return 'string';
      if (ts.isNumericLiteral(init)) return 'number';
      if (init.kind === ts.SyntaxKind.TrueKeyword || init.kind === ts.SyntaxKind.FalseKeyword) {
        return 'boolean';
      }
      if (ts.isArrayLiteralExpression(init)) return 'any[]';
      if (ts.isObjectLiteralExpression(init)) return 'object';
    }
    
    return 'any';
  }
  
  /**
   * Check if function has return statements
   */
  private hasReturnStatement(node: ts.FunctionDeclaration | ts.MethodDeclaration): boolean {
    let hasReturn = false;
    
    const visit = (child: ts.Node) => {
      if (ts.isReturnStatement(child) && child.expression) {
        hasReturn = true;
      }
      ts.forEachChild(child, visit);
    };
    
    if (node.body) {
      ts.forEachChild(node.body, visit);
    }
    
    return hasReturn;
  }
  
  /**
   * Check if function has throw statements
   */
  private hasThrowStatement(node: ts.FunctionDeclaration | ts.MethodDeclaration): boolean {
    let hasThrow = false;
    
    const visit = (child: ts.Node) => {
      if (ts.isThrowStatement(child)) {
        hasThrow = true;
      }
      ts.forEachChild(child, visit);
    };
    
    if (node.body) {
      ts.forEachChild(node.body, visit);
    }
    
    return hasThrow;
  }
  
  /**
   * Get node name safely
   */
  private getNodeName(node: ts.Node): string {
    if ('name' in node && node.name) {
      return (node.name as ts.Identifier).getText();
    }
    return 'unnamed';
  }
  
  /**
   * Get node indentation
   */
  private getNodeIndentation(node: ts.Node, sourceFile: ts.SourceFile): string {
    const start = node.getStart();
    const lineStart = sourceFile.getLineStarts();
    const line = sourceFile.getLineAndCharacterOfPosition(start).line;
    
    if (line > 0 && line < lineStart.length) {
      const lineText = sourceFile.text.substring(lineStart[line], start);
      const match = lineText.match(/^(\s*)/);
      return match ? match[1] : '';
    }
    
    return '';
  }
}