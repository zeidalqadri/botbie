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
// Note: tree-sitter-python would need to be properly installed
// This is a TypeScript-compatible implementation
let Parser: any;
let PythonLanguage: any;
try {
  Parser = require('tree-sitter');
  PythonLanguage = require('tree-sitter-python');
} catch (error) {
  console.warn('tree-sitter-python not available, using fallback parser');
}

export class PythonParser extends BaseLanguageParser implements ILanguageParser {
  readonly language = 'python';
  readonly extensions = ['py', 'pyw', 'pyi'];
  
  private parser: any | null = null;
  
  constructor() {
    super();
    this.initializeParser();
  }
  
  private initializeParser(): void {
    if (Parser && PythonLanguage) {
      try {
        this.parser = new Parser();
        this.parser.setLanguage(PythonLanguage);
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
      console.error('Error parsing Python file:', error);
      return this.fallbackParse(content, filePath, parseStartTime);
    }
  }
  
  async parseContent(content: string, fileName = 'unknown.py'): Promise<ParseResult> {
    return this.parseFile(fileName, content);
  }
  
  async extractRelationships(nodes: CodeNode[]): Promise<Relationship[]> {
    const relationships: Relationship[] = [];
    
    // Create inheritance relationships
    for (const node of nodes) {
      if (node.type === 'class' && node.content.includes('(')) {
        const baseClasses = this.extractBaseClasses(node.content);
        for (const baseClass of baseClasses) {
          const baseNode = nodes.find(n => n.name === baseClass && n.type === 'class');
          if (baseNode) {
            relationships.push({
              type: 'extends',
              sourceId: node.id,
              targetId: baseNode.id,
              metadata: { baseClass, confidence: 0.9 }
            });
          }
        }
      }
      
      // Create method-to-class relationships
      if (node.type === 'function') {
        const classNode = nodes.find(n => 
          n.type === 'class' && 
          n.startLine <= node.startLine && 
          n.endLine >= node.endLine
        );
        if (classNode) {
          relationships.push({
            type: 'defines',
            sourceId: classNode.id,
            targetId: node.id,
            metadata: { memberType: 'method', confidence: 1.0 }
          });
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
      testCoverage: 0, // Would require test analysis
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
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Handle different import patterns
      const importMatch = trimmed.match(/^import\s+([^\s#]+)/);
      if (importMatch) {
        dependencies.push({
          name: importMatch[1],
          type: 'import',
          isExternal: !importMatch[1].startsWith('.'),
          position: { line: index + 1, column: 1 }
        });
      }
      
      const fromImportMatch = trimmed.match(/^from\s+([^\s]+)\s+import\s+(.+)/);
      if (fromImportMatch) {
        const module = fromImportMatch[1];
        const imports = fromImportMatch[2].split(',').map(s => s.trim());
        
        dependencies.push({
          name: module,
          type: 'from',
          isExternal: !module.startsWith('.'),
          importedSymbols: imports,
          position: { line: index + 1, column: 1 }
        });
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
        
        // Simple word boundary check
        const isWordStart = index === 0 || !/\w/.test(line[index - 1]);
        const isWordEnd = index + symbolName.length >= line.length || 
                         !/\w/.test(line[index + symbolName.length]);
        
        if (isWordStart && isWordEnd) {
          const pos = { line: lineIndex + 1, column: index + 1 };
          references.push({
            position: pos,
            range: {
              start: pos,
              end: { line: lineIndex + 1, column: index + symbolName.length + 1 }
            },
            isDefinition: line.includes('def ' + symbolName) || line.includes('class ' + symbolName),
            isDeclaration: line.includes('def ' + symbolName) || line.includes('class ' + symbolName),
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
    
    // Simple symbol extraction at position
    const char = line[position.column - 1];
    if (!/\w/.test(char)) return null;
    
    // Find word boundaries
    let start = position.column - 1;
    let end = position.column - 1;
    
    while (start > 0 && /\w/.test(line[start - 1])) start--;
    while (end < line.length - 1 && /\w/.test(line[end + 1])) end++;
    
    const symbol = line.substring(start, end + 1);
    const kind = this.determineSymbolKind(line, symbol);
    
    return {
      name: symbol,
      kind,
      position: { line: position.line, column: start + 1 },
      range: {
        start: { line: position.line, column: start + 1 },
        end: { line: position.line, column: end + 2 }
      },
      modifiers: this.extractModifiers(line)
    };
  }
  
  async extractComments(content: string): Promise<Comment[]> {
    const comments: Comment[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Single line comments
      const hashIndex = line.indexOf('#');
      if (hashIndex !== -1) {
        const commentText = line.substring(hashIndex + 1).trim();
        comments.push({
          text: commentText,
          type: 'line',
          position: { line: index + 1, column: hashIndex + 1 },
          range: {
            start: { line: index + 1, column: hashIndex + 1 },
            end: { line: index + 1, column: line.length + 1 }
          },
          isDocumentation: false
        });
      }
      
      // Docstrings (simplified detection)
      if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
        const quote = trimmed.startsWith('"""') ? '"""' : "'''";
        const endIndex = trimmed.indexOf(quote, 3);
        
        if (endIndex !== -1) {
          // Single line docstring
          const docText = trimmed.substring(3, endIndex);
          comments.push({
            text: docText,
            type: 'doc',
            position: { line: index + 1, column: 1 },
            range: {
              start: { line: index + 1, column: 1 },
              end: { line: index + 1, column: line.length + 1 }
            },
            isDocumentation: true,
            tags: this.parseDocTags(docText)
          });
        }
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
      'function_definition': 'function',
      'class_definition': 'class',
      'module': 'module',
      'assignment': 'variable',
      'import_statement': 'module',
      'import_from_statement': 'module'
    };
    
    return typeMap[nodeType] || null;
  }
  
  private extractNodeName(node: any, content: string): string | null {
    // Extract name based on node type
    switch (node.type) {
      case 'function_definition':
      case 'class_definition':
        const nameNode = node.childForFieldName('name');
        return nameNode ? content.substring(nameNode.startIndex, nameNode.endIndex) : null;
      
      case 'assignment':
        const targetNode = node.childForFieldName('left');
        return targetNode ? content.substring(targetNode.startIndex, targetNode.endIndex) : null;
      
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
  
  private extractBaseClasses(classContent: string): string[] {
    const match = classContent.match(/class\s+\w+\(([^)]+)\)/);
    if (!match) return [];
    
    return match[1].split(',').map(base => base.trim());
  }
  
  private calculateComplexity(content: string): number {
    // Simplified cyclomatic complexity calculation
    const complexityKeywords = [
      'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally',
      'with', 'and', 'or', 'not', 'break', 'continue', 'return'
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
    const commentLines = lines.filter(line => line.trim().startsWith('#'));
    
    const commentRatio = commentLines.length / lines.length;
    const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
    
    // Simple maintainability score (0-100)
    let score = 100;
    score -= Math.max(0, avgLineLength - 80) * 0.5; // Penalize long lines
    score += commentRatio * 20; // Reward comments
    
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateTestability(content: string): number {
    // Check for testability indicators
    const hasDocstrings = content.includes('"""') || content.includes("'''");
    const hasTypeHints = content.includes(':') && content.includes('->');
    const functionCount = (content.match(/def\s+\w+/g) || []).length;
    const classCount = (content.match(/class\s+\w+/g) || []).length;
    
    let score = 50; // Base score
    if (hasDocstrings) score += 20;
    if (hasTypeHints) score += 20;
    if (functionCount > 0) score += 10;
    if (classCount > 0) score += 10;
    
    return Math.min(100, score);
  }
  
  private calculateReliability(content: string): number {
    // Check for reliability indicators
    const hasErrorHandling = content.includes('try') && content.includes('except');
    const hasAssertions = content.includes('assert');
    const hasLogging = content.includes('logging') || content.includes('log.');
    
    let score = 60; // Base score
    if (hasErrorHandling) score += 20;
    if (hasAssertions) score += 10;
    if (hasLogging) score += 10;
    
    return Math.min(100, score);
  }
  
  private calculateDocumentationScore(content: string): number {
    const hasDocstrings = content.includes('"""') || content.includes("'''");
    const lines = content.split('\n');
    const commentLines = lines.filter(line => line.trim().startsWith('#'));
    const commentRatio = commentLines.length / lines.length;
    
    let score = commentRatio * 100;
    if (hasDocstrings) score += 20;
    
    return Math.min(100, score);
  }
  
  private determineSymbolKind(line: string, symbol: string): SymbolKind {
    if (line.includes(`def ${symbol}`)) return SymbolKind.Function;
    if (line.includes(`class ${symbol}`)) return SymbolKind.Class;
    if (line.includes(`${symbol} =`)) return SymbolKind.Variable;
    if (line.includes(`import ${symbol}`) || line.includes(`from ${symbol}`)) return SymbolKind.Module;
    
    return SymbolKind.Variable;
  }
  
  private extractModifiers(line: string): string[] {
    const modifiers: string[] = [];
    
    if (line.includes('async ')) modifiers.push('async');
    if (line.includes('static')) modifiers.push('static');
    if (line.includes('@property')) modifiers.push('property');
    if (line.includes('@classmethod')) modifiers.push('classmethod');
    if (line.includes('@staticmethod')) modifiers.push('staticmethod');
    
    return modifiers;
  }
  
  private parseDocTags(docText: string): DocTag[] {
    const tags: DocTag[] = [];
    const lines = docText.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Simple tag parsing
      const paramMatch = trimmed.match(/^:param\s+(\w+):\s*(.+)/);
      if (paramMatch) {
        tags.push({
          name: 'param',
          value: paramMatch[1],
          description: paramMatch[2]
        });
      }
      
      const returnMatch = trimmed.match(/^:return:\s*(.+)/);
      if (returnMatch) {
        tags.push({
          name: 'return',
          description: returnMatch[1]
        });
      }
      
      const raisesMatch = trimmed.match(/^:raises\s+(\w+):\s*(.+)/);
      if (raisesMatch) {
        tags.push({
          name: 'raises',
          value: raisesMatch[1],
          description: raisesMatch[2]
        });
      }
    }
    
    return tags;
  }
  
  private fallbackParse(content: string, filePath: string, parseStartTime: number): ParseResult {
    // Fallback parsing using regex when tree-sitter is not available
    const nodes: CodeNode[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const lineNumber = index + 1;
      
      // Extract functions
      const funcMatch = trimmed.match(/^def\s+(\w+)/);
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
      
      // Extract classes
      const classMatch = trimmed.match(/^class\s+(\w+)/);
      if (classMatch) {
        nodes.push(this.createCodeNode(
          classMatch[1],
          'class',
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
    
    // Basic Python syntax checks
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Check for basic syntax errors
      if (trimmed.endsWith(':') && !trimmed.match(/^(if|else|elif|for|while|def|class|try|except|finally|with)\b/)) {
        errors.push({
          message: 'Unexpected colon',
          position: { line: index + 1, column: line.indexOf(':') + 1 },
          severity: 'warning'
        });
      }
      
      // Check for unmatched parentheses (simplified)
      const openParens = (line.match(/\(/g) || []).length;
      const closeParens = (line.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        errors.push({
          message: 'Unmatched parentheses',
          position: { line: index + 1, column: 1 },
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