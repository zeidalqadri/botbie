import {
  BaseLanguageParser,
  ILanguageParser,
  ParseResult,
  Position,
  Range,
  ParseError,
  SyntaxValidationResult,
  Dependency,
  Reference,
  SymbolInfo,
  SymbolKind,
  Comment,
  DocTag
} from './ILanguageParser';
import { CodeNode, Relationship, QualityMetrics } from '@earth-agents/core';
// Note: tree-sitter-go would need to be properly installed
let Parser: any;
let GoLanguage: any;
try {
  Parser = require('tree-sitter');
  GoLanguage = require('tree-sitter-go');
} catch (error) {
  console.warn('tree-sitter-go not available, using fallback parser');
}

export class GoParser extends BaseLanguageParser implements ILanguageParser {
  readonly language = 'go';
  readonly extensions = ['go'];
  
  private parser: any | null = null;
  
  constructor() {
    super();
    this.initializeParser();
  }
  
  private initializeParser(): void {
    if (Parser && GoLanguage) {
      try {
        this.parser = new Parser();
        this.parser.setLanguage(GoLanguage);
      } catch (error) {
        console.warn('Failed to initialize tree-sitter parser:', error);
        this.parser = null;
      }
    }
  }
  
  async parseFile(filePath: string, content: string): Promise<ParseResult> {
    const parseStartTime = Date.now();
    
    if (!this.parser) {
      return this.fallbackParse(content, filePath, parseStartTime);
    }
    
    try {
      const tree = this.parser.parse(content);
      const nodes = await this.extractNodes(tree.rootNode, filePath, content);
      const relationships = await this.extractRelationships(nodes);
      const dependencies = await this.extractDependencies(content);
      const comments = await this.extractComments(content);
      const errors = this.extractErrors(tree);
      
      return {
        nodes,
        relationships,
        dependencies,
        comments,
        errors,
        metadata: this.createParseMetadata(content, parseStartTime, nodes.length)
      };
    } catch (error) {
      console.error('Error parsing Go file:', error);
      return this.fallbackParse(content, filePath, parseStartTime);
    }
  }
  
  async parseContent(content: string, fileName = 'unknown.go'): Promise<ParseResult> {
    return this.parseFile(fileName, content);
  }
  
  async extractRelationships(nodes: CodeNode[]): Promise<Relationship[]> {
    const relationships: Relationship[] = [];
    
    // Create struct-to-method relationships
    for (const node of nodes) {
      if (node.type === 'function' && this.isMethodDeclaration(node.content)) {
        const receiverType = this.extractReceiverType(node.content);
        if (receiverType) {
          const structNode = nodes.find(n => n.name === receiverType && n.type === 'class');
          if (structNode) {
            relationships.push({
              type: 'defines',
              sourceId: structNode.id,
              targetId: node.id,
              metadata: { memberType: 'method', receiverType, confidence: 1.0 }
            });
          }
        }
      }
      
      // Create interface implementation relationships
      if (node.type === 'class' && node.content.includes('interface')) {
        const interfaceMethods = this.extractInterfaceMethods(node.content);
        for (const methodName of interfaceMethods) {
          const methodNode = nodes.find(n => 
            n.name === methodName && 
            n.type === 'function'
          );
          if (methodNode) {
            relationships.push({
              type: 'implements',
              sourceId: methodNode.id,
              targetId: node.id,
              metadata: { interfaceMethod: methodName, confidence: 0.8 }
            });
          }
        }
      }
      
      // Create package relationships
      if (node.type === 'module') {
        const packageName = this.extractPackageName(node.content);
        if (packageName) {
          // All nodes in the same file belong to the same package
          for (const otherNode of nodes) {
            if (otherNode.id !== node.id && otherNode.filePath === node.filePath) {
              relationships.push({
                type: 'defines',
                sourceId: node.id,
                targetId: otherNode.id,
                metadata: { packageName, confidence: 1.0 }
              });
            }
          }
        }
      }
    }
    
    return relationships;
  }
  
  async calculateQualityMetrics(node: CodeNode, content: string): Promise<QualityMetrics> {
    const lines = content.split('\n').slice(node.startLine - 1, node.endLine);
    const nodeContent = lines.join('\n');
    
    return {
      complexity: this.calculateComplexity(nodeContent),
      maintainability: this.calculateMaintainability(nodeContent),
      testCoverage: 0,
      documentationScore: this.calculateDocumentationScore(nodeContent),
      linesOfCode: lines.length,
      codeSmells: []
    };
  }
  
  async validateSyntax(content: string): Promise<SyntaxValidationResult> {
    if (!this.parser) {
      return this.fallbackSyntaxValidation(content);
    }
    
    try {
      const tree = this.parser.parse(content);
      const errors = this.extractErrors(tree);
      
      return {
        isValid: errors.length === 0,
        errors: errors.filter(e => e.severity === 'error'),
        warnings: errors.filter(e => e.severity === 'warning')
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          message: `Parse error: ${error}`,
          position: { line: 1, column: 1 },
          severity: 'error' as const
        }],
        warnings: []
      };
    }
  }
  
  async extractDependencies(content: string): Promise<Dependency[]> {
    const dependencies: Dependency[] = [];
    const lines = content.split('\n');
    
    let inImportBlock = false;
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Handle import blocks
      if (trimmed === 'import (') {
        inImportBlock = true;
        return;
      }
      
      if (inImportBlock && trimmed === ')') {
        inImportBlock = false;
        return;
      }
      
      // Single import statement
      const singleImportMatch = trimmed.match(/^import\s+"([^"]+)"/);
      if (singleImportMatch) {
        dependencies.push({
          name: singleImportMatch[1],
          type: 'import',
          isExternal: !singleImportMatch[1].startsWith('.'),
          position: { line: index + 1, column: 1 }
        });
      }
      
      // Import within block
      if (inImportBlock) {
        const blockImportMatch = trimmed.match(/^"([^"]+)"/);
        if (blockImportMatch) {
          dependencies.push({
            name: blockImportMatch[1],
            type: 'import',
            isExternal: !blockImportMatch[1].startsWith('.'),
            position: { line: index + 1, column: 1 }
          });
        }
        
        // Aliased import
        const aliasImportMatch = trimmed.match(/^(\w+)\s+"([^"]+)"/);
        if (aliasImportMatch) {
          dependencies.push({
            name: aliasImportMatch[2],
            alias: aliasImportMatch[1],
            type: 'import',
            isExternal: !aliasImportMatch[2].startsWith('.'),
            position: { line: index + 1, column: 1 }
          });
        }
      }
    });
    
    return dependencies;
  }
  
  async findReferences(content: string, symbolName: string, position?: Position): Promise<Reference[]> {
    const references: Reference[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, lineIndex) => {
      let columnIndex = 0;
      while (true) {
        const index = line.indexOf(symbolName, columnIndex);
        if (index === -1) break;
        
        // Go-specific word boundary check
        const isWordStart = index === 0 || !/[a-zA-Z0-9_]/.test(line[index - 1]);
        const isWordEnd = index + symbolName.length >= line.length || 
                         !/[a-zA-Z0-9_]/.test(line[index + symbolName.length]);
        
        if (isWordStart && isWordEnd) {
          const pos = { line: lineIndex + 1, column: index + 1 };
          references.push({
            position: pos,
            range: {
              start: pos,
              end: { line: lineIndex + 1, column: index + symbolName.length + 1 }
            },
            isDefinition: this.isDefinition(line, symbolName),
            isDeclaration: this.isDeclaration(line, symbolName),
            context: line.trim()
          });
        }
        
        columnIndex = index + 1;
      }
    });
    
    return references;
  }
  
  async getSymbolAtPosition(content: string, position: Position): Promise<SymbolInfo | null> {
    const lines = content.split('\n');
    if (position.line > lines.length) return null;
    
    const line = lines[position.line - 1];
    if (position.column > line.length) return null;
    
    const char = line[position.column - 1];
    if (!/[a-zA-Z0-9_]/.test(char)) return null;
    
    // Find Go identifier boundaries
    let start = position.column - 1;
    let end = position.column - 1;
    
    while (start > 0 && /[a-zA-Z0-9_]/.test(line[start - 1])) start--;
    while (end < line.length - 1 && /[a-zA-Z0-9_]/.test(line[end + 1])) end++;
    
    const symbol = line.substring(start, end + 1);
    const kind = this.determineSymbolKind(line, symbol);
    
    return {
      name: symbol,
      kind,
      type: this.extractType(line, symbol),
      position: { line: position.line, column: start + 1 },
      range: {
        start: { line: position.line, column: start + 1 },
        end: { line: position.line, column: end + 2 }
      },
      modifiers: this.extractModifiers(line, symbol)
    };
  }
  
  async extractComments(content: string): Promise<Comment[]> {
    const comments: Comment[] = [];
    const lines = content.split('\n');
    
    let inBlockComment = false;
    let blockCommentStart = 0;
    let blockCommentText = '';
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Handle block comments /* */
      if (!inBlockComment && line.includes('/*')) {
        const startIndex = line.indexOf('/*');
        const endIndex = line.indexOf('*/', startIndex);
        
        if (endIndex !== -1) {
          // Single line block comment
          const commentText = line.substring(startIndex + 2, endIndex);
          comments.push({
            text: commentText,
            type: 'block',
            position: { line: index + 1, column: startIndex + 1 },
            range: {
              start: { line: index + 1, column: startIndex + 1 },
              end: { line: index + 1, column: endIndex + 3 }
            },
            isDocumentation: false
          });
        } else {
          // Start of multi-line block comment
          inBlockComment = true;
          blockCommentStart = index + 1;
          blockCommentText = line.substring(startIndex + 2);
        }
      } else if (inBlockComment) {
        const endIndex = line.indexOf('*/');
        if (endIndex !== -1) {
          // End of multi-line block comment
          blockCommentText += '\n' + line.substring(0, endIndex);
          comments.push({
            text: blockCommentText,
            type: 'block',
            position: { line: blockCommentStart, column: 1 },
            range: {
              start: { line: blockCommentStart, column: 1 },
              end: { line: index + 1, column: endIndex + 3 }
            },
            isDocumentation: false
          });
          inBlockComment = false;
          blockCommentText = '';
        } else {
          blockCommentText += '\n' + line;
        }
      }
      
      // Handle line comments //
      const slashIndex = line.indexOf('//');
      if (slashIndex !== -1 && !inBlockComment) {
        const commentText = line.substring(slashIndex + 2).trim();
        const isDoc = commentText.startsWith(' ') && 
                     (!!lines[index + 1]?.trim().match(/^(func|type|var|const)\b/) || 
                      lines[index - 1]?.trim() === '');
        
        comments.push({
          text: commentText,
          type: 'line',
          position: { line: index + 1, column: slashIndex + 1 },
          range: {
            start: { line: index + 1, column: slashIndex + 1 },
            end: { line: index + 1, column: line.length + 1 }
          },
          isDocumentation: isDoc,
          tags: isDoc ? this.parseGoDocTags(commentText) : []
        });
      }
    });
    
    return comments;
  }
  
  private async extractNodes(node: any, filePath: string, content: string): Promise<CodeNode[]> {
    const nodes: CodeNode[] = [];
    
    const traverse = (n: any) => {
      const nodeType = this.mapTreeSitterNodeType(n.type);
      if (nodeType) {
        const startPos = this.offsetToPosition(content, n.startIndex);
        const endPos = this.offsetToPosition(content, n.endIndex);
        const nodeContent = content.substring(n.startIndex, n.endIndex);
        const name = this.extractNodeName(n, content);
        
        if (name) {
          const codeNode = this.createCodeNode(
            name,
            nodeType,
            filePath,
            startPos.line,
            endPos.line,
            nodeContent
          );
          nodes.push(codeNode);
        }
      }
      
      // Recursively process children
      for (let i = 0; i < n.childCount; i++) {
        traverse(n.child(i));
      }
    };
    
    traverse(node);
    return nodes;
  }
  
  private mapTreeSitterNodeType(nodeType: string): CodeNode['type'] | null {
    const typeMap: Record<string, CodeNode['type']> = {
      'function_declaration': 'function',
      'method_declaration': 'function',
      'type_declaration': 'class',
      'struct_type': 'class',
      'interface_type': 'interface',
      'package_clause': 'module',
      'var_declaration': 'variable',
      'const_declaration': 'constant'
    };
    
    return typeMap[nodeType] || null;
  }
  
  private extractNodeName(node: any, content: string): string | null {
    switch (node.type) {
      case 'function_declaration':
      case 'method_declaration':
        const nameNode = node.childForFieldName('name');
        return nameNode ? content.substring(nameNode.startIndex, nameNode.endIndex) : null;
      
      case 'type_declaration':
        const typeNameNode = node.childForFieldName('name');
        return typeNameNode ? content.substring(typeNameNode.startIndex, typeNameNode.endIndex) : null;
      
      case 'package_clause':
        const packageNameNode = node.childForFieldName('name');
        return packageNameNode ? content.substring(packageNameNode.startIndex, packageNameNode.endIndex) : null;
      
      case 'var_declaration':
      case 'const_declaration':
        // Go variables can have multiple names in one declaration
        const specNode = node.child(1); // Skip the keyword
        if (specNode && specNode.childForFieldName) {
          const varNameNode = specNode.childForFieldName('name');
          return varNameNode ? content.substring(varNameNode.startIndex, varNameNode.endIndex) : null;
        }
        return null;
      
      default:
        return null;
    }
  }
  
  private extractErrors(tree: any): ParseError[] {
    const errors: ParseError[] = [];
    
    const traverse = (node: any) => {
      if (node.hasError()) {
        errors.push({
          message: `Syntax error at ${node.type}`,
          position: { line: node.startPosition.row + 1, column: node.startPosition.column + 1 },
          severity: 'error'
        });
      }
      
      for (let i = 0; i < node.childCount; i++) {
        traverse(node.child(i));
      }
    };
    
    traverse(tree.rootNode);
    return errors;
  }
  
  private isMethodDeclaration(content: string): boolean {
    return /func\s*\(\s*\w+\s+\*?\w+\s*\)/.test(content);
  }
  
  private extractReceiverType(content: string): string | null {
    const match = content.match(/func\s*\(\s*\w+\s+\*?(\w+)\s*\)/);
    return match ? match[1] : null;
  }
  
  private extractInterfaceMethods(content: string): string[] {
    const methods: string[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Simple method signature detection in interface
      const methodMatch = trimmed.match(/^(\w+)\s*\(/);
      if (methodMatch && !trimmed.includes('type') && !trimmed.includes('interface')) {
        methods.push(methodMatch[1]);
      }
    }
    
    return methods;
  }
  
  private extractPackageName(content: string): string | null {
    const match = content.match(/package\s+(\w+)/);
    return match ? match[1] : null;
  }
  
  private isDefinition(line: string, symbol: string): boolean {
    return line.includes(`func ${symbol}`) ||
           line.includes(`type ${symbol}`) ||
           line.includes(`var ${symbol}`) ||
           line.includes(`const ${symbol}`);
  }
  
  private isDeclaration(line: string, symbol: string): boolean {
    return this.isDefinition(line, symbol);
  }
  
  private determineSymbolKind(line: string, symbol: string): SymbolKind {
    if (line.includes(`func ${symbol}`)) return SymbolKind.Function;
    if (line.includes(`type ${symbol} struct`)) return SymbolKind.Struct;
    if (line.includes(`type ${symbol} interface`)) return SymbolKind.Interface;
    if (line.includes(`var ${symbol}`)) return SymbolKind.Variable;
    if (line.includes(`const ${symbol}`)) return SymbolKind.Constant;
    if (line.includes(`package ${symbol}`)) return SymbolKind.Package;
    
    return SymbolKind.Variable;
  }
  
  private extractType(line: string, symbol: string): string | undefined {
    // Extract type information from Go declarations
    const varMatch = line.match(new RegExp(`var\\s+${symbol}\\s+(\\w+)`));
    if (varMatch) return varMatch[1];
    
    const funcMatch = line.match(new RegExp(`func\\s+${symbol}\\s*\\([^)]*\\)\\s*(\\w+)`));
    if (funcMatch) return funcMatch[1];
    
    return undefined;
  }
  
  private extractModifiers(line: string, symbol: string): string[] {
    const modifiers: string[] = [];
    
    // Go doesn't have traditional modifiers, but we can detect patterns
    if (symbol[0] === symbol[0].toUpperCase()) {
      modifiers.push('exported'); // Public in Go
    } else {
      modifiers.push('unexported'); // Private in Go
    }
    
    if (line.includes('*' + symbol)) {
      modifiers.push('pointer');
    }
    
    return modifiers;
  }
  
  private parseGoDocTags(commentText: string): DocTag[] {
    const tags: DocTag[] = [];
    
    // Go documentation conventions
    if (commentText.includes('TODO:')) {
      tags.push({
        name: 'todo',
        description: commentText.substring(commentText.indexOf('TODO:') + 5).trim()
      });
    }
    
    if (commentText.includes('FIXME:')) {
      tags.push({
        name: 'fixme',
        description: commentText.substring(commentText.indexOf('FIXME:') + 6).trim()
      });
    }
    
    if (commentText.includes('Deprecated:')) {
      tags.push({
        name: 'deprecated',
        description: commentText.substring(commentText.indexOf('Deprecated:') + 11).trim()
      });
    }
    
    return tags;
  }
  
  private calculateComplexity(content: string): number {
    // Go-specific cyclomatic complexity
    const complexityKeywords = [
      'if', 'else', 'for', 'switch', 'case', 'select', 'go', 'defer',
      'range', 'break', 'continue', 'return', 'goto', '&&', '||'
    ];
    
    let complexity = 1; // Base complexity
    
    for (const keyword of complexityKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }
    
    return complexity;
  }
  
  private calculateMaintainability(content: string): number {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const commentLines = lines.filter(line => line.trim().startsWith('//'));
    
    const commentRatio = commentLines.length / lines.length;
    const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
    const hasErrorHandling = content.includes('error') && content.includes('return');
    
    let score = 100;
    score -= Math.max(0, avgLineLength - 100) * 0.3; // Go allows longer lines
    score += commentRatio * 25; // Reward good documentation
    if (hasErrorHandling) score += 10; // Reward error handling
    
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateTestability(content: string): number {
    const hasDocComments = content.includes('// ');
    const hasStructs = content.includes('type ') && content.includes('struct');
    const hasInterfaces = content.includes('interface');
    const hasErrorReturns = content.includes('error');
    const functionCount = (content.match(/func\s+\w+/g) || []).length;
    
    let score = 50;
    if (hasDocComments) score += 15;
    if (hasStructs) score += 15;
    if (hasInterfaces) score += 15;
    if (hasErrorReturns) score += 10;
    if (functionCount > 0) score += 5;
    
    return Math.min(100, score);
  }
  
  private calculateReliability(content: string): number {
    const hasErrorHandling = content.includes('if err != nil');
    const hasPanicRecovery = content.includes('recover()');
    const hasDefer = content.includes('defer');
    const hasTests = content.includes('func Test') || content.includes('testing.');
    
    let score = 60;
    if (hasErrorHandling) score += 25; // Go's explicit error handling
    if (hasPanicRecovery) score += 10;
    if (hasDefer) score += 5; // Resource cleanup
    if (hasTests) score += 10;
    
    return Math.min(100, score);
  }
  
  private calculateDocumentationScore(content: string): number {
    const lines = content.split('\n');
    const commentLines = lines.filter(line => line.trim().startsWith('//'));
    const commentRatio = commentLines.length / lines.length;
    
    let score = commentRatio * 100;
    
    return Math.min(100, score);
  }
  
  private fallbackParse(content: string, filePath: string, parseStartTime: number): ParseResult {
    const nodes: CodeNode[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const lineNumber = index + 1;
      
      // Extract functions
      const funcMatch = trimmed.match(/^func\s+(\w+)/);
      if (funcMatch) {
        nodes.push(this.createCodeNode(
          funcMatch[1],
          'function',
          filePath,
          lineNumber,
          lineNumber,
          line
        ));
      }
      
      // Extract types/structs
      const typeMatch = trimmed.match(/^type\s+(\w+)/);
      if (typeMatch) {
        nodes.push(this.createCodeNode(
          typeMatch[1],
          'class',
          filePath,
          lineNumber,
          lineNumber,
          line
        ));
      }
      
      // Extract package
      const packageMatch = trimmed.match(/^package\s+(\w+)/);
      if (packageMatch) {
        nodes.push(this.createCodeNode(
          packageMatch[1],
          'module',
          filePath,
          lineNumber,
          lineNumber,
          line
        ));
      }
    });
    
    return {
      nodes,
      relationships: [],
      dependencies: [],
      comments: [],
      errors: [],
      metadata: this.createParseMetadata(content, parseStartTime, nodes.length)
    };
  }
  
  private fallbackSyntaxValidation(content: string): SyntaxValidationResult {
    const errors: ParseError[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Basic Go syntax checks
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      if (openBraces !== closeBraces) {
        errors.push({
          message: 'Unmatched braces',
          position: { line: index + 1, column: 1 },
          severity: 'warning'
        });
      }
      
      // Check for missing semicolons in certain contexts
      if (trimmed.includes('for') && !trimmed.includes('{') && !trimmed.endsWith(';')) {
        errors.push({
          message: 'Missing semicolon in for statement',
          position: { line: index + 1, column: line.length },
          severity: 'error'
        });
      }
    });
    
    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors: errors.filter(e => e.severity === 'error'),
      warnings: errors.filter(e => e.severity === 'warning')
    };
  }
}