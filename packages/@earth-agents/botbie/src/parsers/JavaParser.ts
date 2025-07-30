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
// Note: tree-sitter-java would need to be properly installed
let Parser: any;
let JavaLanguage: any;
try {
  Parser = require('tree-sitter');
  JavaLanguage = require('tree-sitter-java');
} catch (error) {
  console.warn('tree-sitter-java not available, using fallback parser');
}

export class JavaParser extends BaseLanguageParser implements ILanguageParser {
  readonly language = 'java';
  readonly extensions = ['java'];
  
  private parser: any | null = null;
  
  constructor() {
    super();
    this.initializeParser();
  }
  
  private initializeParser(): void {
    if (Parser && JavaLanguage) {
      try {
        this.parser = new Parser();
        this.parser.setLanguage(JavaLanguage);
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
      console.error('Error parsing Java file:', error);
      return this.fallbackParse(content, filePath, parseStartTime);
    }
  }
  
  async parseContent(content: string, fileName = 'Unknown.java'): Promise<ParseResult> {
    return this.parseFile(fileName, content);
  }
  
  async extractRelationships(nodes: CodeNode[]): Promise<Relationship[]> {
    const relationships: Relationship[] = [];
    
    // Create inheritance relationships
    for (const node of nodes) {
      if (node.type === 'class') {
        const extendsClass = this.extractExtendsClass(node.content);
        if (extendsClass) {
          const parentNode = nodes.find(n => n.name === extendsClass && n.type === 'class');
          if (parentNode) {
            relationships.push({
              type: 'extends',
              sourceId: node.id,
              targetId: parentNode.id,
              metadata: { parentClass: extendsClass, confidence: 0.95 }
            });
          }
        }
        
        // Interface implementations
        const interfaces = this.extractImplementedInterfaces(node.content);
        for (const interfaceName of interfaces) {
          const interfaceNode = nodes.find(n => n.name === interfaceName && n.type === 'interface');
          if (interfaceNode) {
            relationships.push({
              type: 'implements',
              sourceId: node.id,
              targetId: interfaceNode.id,
              metadata: { interface: interfaceName, confidence: 0.9 }
            });
          }
        }
      }
      
      // Create method-to-class relationships
      if (node.type === 'function') {
        const classNode = nodes.find(n => 
          n.type === 'class' && 
          n.startLine <= node.startLine && 
          n.endLine >= node.endLine &&
          n.filePath === node.filePath
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
      
      // Create field-to-class relationships
      if (node.type === 'variable') {
        const classNode = nodes.find(n => 
          n.type === 'class' && 
          n.startLine <= node.startLine && 
          n.endLine >= node.endLine &&
          n.filePath === node.filePath
        );
        if (classNode) {
          relationships.push({
            type: 'defines',
            sourceId: classNode.id,
            targetId: node.id,
            metadata: { memberType: 'field', confidence: 1.0 }
          });
        }
      }
      
      // Create package relationships
      if (node.type === 'module') {
        const packageName = this.extractPackageName(node.content);
        if (packageName) {
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
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Single import
      const singleImportMatch = trimmed.match(/^import\s+(static\s+)?([^;]+);/);
      if (singleImportMatch) {
        const isStatic = !!singleImportMatch[1];
        const importPath = singleImportMatch[2].trim();
        
        dependencies.push({
          name: importPath,
          type: 'import',
          isExternal: !importPath.startsWith('java.') && !importPath.includes('.'),
          position: { line: index + 1, column: 1 },
          importedSymbols: isStatic ? [this.extractLastPart(importPath)] : undefined
        });
      }
      
      // Package declaration
      const packageMatch = trimmed.match(/^package\s+([^;]+);/);
      if (packageMatch) {
        dependencies.push({
          name: packageMatch[1],
          type: 'using',
          isExternal: false,
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
        
        // Java identifier boundary check
        const isWordStart = index === 0 || !/[a-zA-Z0-9_$]/.test(line[index - 1]);
        const isWordEnd = index + symbolName.length >= line.length || 
                         !/[a-zA-Z0-9_$]/.test(line[index + symbolName.length]);
        
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
    if (!/[a-zA-Z0-9_$]/.test(char)) return null;
    
    // Find Java identifier boundaries
    let start = position.column - 1;
    let end = position.column - 1;
    
    while (start > 0 && /[a-zA-Z0-9_$]/.test(line[start - 1])) start--;
    while (end < line.length - 1 && /[a-zA-Z0-9_$]/.test(line[end + 1])) end++;
    
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
    let inJavaDoc = false;
    let blockCommentStart = 0;
    let blockCommentText = '';
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Handle JavaDoc comments /** */
      if (!inBlockComment && !inJavaDoc && line.includes('/**')) {
        const startIndex = line.indexOf('/**');
        const endIndex = line.indexOf('*/', startIndex);
        
        if (endIndex !== -1) {
          // Single line JavaDoc
          const commentText = line.substring(startIndex + 3, endIndex);
          comments.push({
            text: commentText,
            type: 'doc',
            position: { line: index + 1, column: startIndex + 1 },
            range: {
              start: { line: index + 1, column: startIndex + 1 },
              end: { line: index + 1, column: endIndex + 3 }
            },
            isDocumentation: true,
            tags: this.parseJavaDocTags(commentText)
          });
        } else {
          // Start of multi-line JavaDoc
          inJavaDoc = true;
          blockCommentStart = index + 1;
          blockCommentText = line.substring(startIndex + 3);
        }
      }
      // Handle regular block comments /* */
      else if (!inBlockComment && !inJavaDoc && line.includes('/*')) {
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
      } else if (inBlockComment || inJavaDoc) {
        const endIndex = line.indexOf('*/');
        if (endIndex !== -1) {
          blockCommentText += '\n' + line.substring(0, endIndex);
          comments.push({
            text: blockCommentText,
            type: inJavaDoc ? 'doc' : 'block',
            position: { line: blockCommentStart, column: 1 },
            range: {
              start: { line: blockCommentStart, column: 1 },
              end: { line: index + 1, column: endIndex + 3 }
            },
            isDocumentation: inJavaDoc,
            tags: inJavaDoc ? this.parseJavaDocTags(blockCommentText) : []
          });
          inBlockComment = false;
          inJavaDoc = false;
          blockCommentText = '';
        } else {
          blockCommentText += '\n' + line;
        }
      }
      
      // Handle line comments //
      const slashIndex = line.indexOf('//');
      if (slashIndex !== -1 && !inBlockComment && !inJavaDoc) {
        const commentText = line.substring(slashIndex + 2).trim();
        
        comments.push({
          text: commentText,
          type: 'line',
          position: { line: index + 1, column: slashIndex + 1 },
          range: {
            start: { line: index + 1, column: slashIndex + 1 },
            end: { line: index + 1, column: line.length + 1 }
          },
          isDocumentation: false
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
      'class_declaration': 'class',
      'interface_declaration': 'interface',
      'method_declaration': 'function',
      'constructor_declaration': 'function',
      'field_declaration': 'variable',
      'local_variable_declaration': 'variable',
      'package_declaration': 'module',
      'enum_declaration': 'class',
      'annotation_type_declaration': 'interface'
    };
    
    return typeMap[nodeType] || null;
  }
  
  private extractNodeName(node: any, content: string): string | null {
    switch (node.type) {
      case 'class_declaration':
      case 'interface_declaration':
      case 'enum_declaration':
      case 'method_declaration':
      case 'constructor_declaration':
        const nameNode = node.childForFieldName('name');
        return nameNode ? content.substring(nameNode.startIndex, nameNode.endIndex) : null;
      
      case 'field_declaration':
      case 'local_variable_declaration':
        // Java field declarations can have multiple variables
        const declaratorNode = node.child(node.childCount - 1);
        if (declaratorNode && declaratorNode.childForFieldName) {
          const varNameNode = declaratorNode.childForFieldName('name');
          return varNameNode ? content.substring(varNameNode.startIndex, varNameNode.endIndex) : null;
        }
        return null;
      
      case 'package_declaration':
        const packageNameNode = node.childForFieldName('name');
        return packageNameNode ? content.substring(packageNameNode.startIndex, packageNameNode.endIndex) : null;
      
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
  
  private extractExtendsClass(classContent: string): string | null {
    const match = classContent.match(/class\s+\w+\s+extends\s+(\w+)/);
    return match ? match[1] : null;
  }
  
  private extractImplementedInterfaces(classContent: string): string[] {
    const match = classContent.match(/implements\s+([^{]+)/);
    if (!match) return [];
    
    return match[1].split(',').map(iface => iface.trim());
  }
  
  private extractPackageName(content: string): string | null {
    const match = content.match(/package\s+([^;]+);/);
    return match ? match[1].trim() : null;
  }
  
  private extractLastPart(path: string): string {
    const parts = path.split('.');
    return parts[parts.length - 1];
  }
  
  private isDefinition(line: string, symbol: string): boolean {
    return line.includes(`class ${symbol}`) ||
           line.includes(`interface ${symbol}`) ||
           line.includes(`enum ${symbol}`) ||
           line.includes(`${symbol}(`) && (line.includes('public') || line.includes('private') || line.includes('protected')) ||
           (line.includes(`${symbol} =`) && !line.includes('=='));
  }
  
  private isDeclaration(line: string, symbol: string): boolean {
    return this.isDefinition(line, symbol) ||
           !!line.match(new RegExp(`\\b(public|private|protected|static|final)\\b.*\\b${symbol}\\b`));
  }
  
  private determineSymbolKind(line: string, symbol: string): SymbolKind {
    if (line.includes(`class ${symbol}`)) return SymbolKind.Class;
    if (line.includes(`interface ${symbol}`)) return SymbolKind.Interface;
    if (line.includes(`enum ${symbol}`)) return SymbolKind.Enum;
    if (line.includes(`${symbol}(`) && !line.includes('=')) return SymbolKind.Method;
    if (line.includes(`${symbol} =`) || !!line.match(new RegExp(`\\w+\\s+${symbol}\\s*[;,]`))) return SymbolKind.Variable;
    if (line.includes(`package ${symbol}`)) return SymbolKind.Package;
    
    return SymbolKind.Variable;
  }
  
  private extractType(line: string, symbol: string): string | undefined {
    // Extract type from Java declarations
    const fieldMatch = line.match(new RegExp(`(\\w+)\\s+${symbol}\\s*[=;]`));
    if (fieldMatch) return fieldMatch[1];
    
    const methodMatch = line.match(new RegExp(`(\\w+)\\s+${symbol}\\s*\\(`));
    if (methodMatch) return methodMatch[1];
    
    return undefined;
  }
  
  private extractModifiers(line: string, symbol: string): string[] {
    const modifiers: string[] = [];
    const javaModifiers = ['public', 'private', 'protected', 'static', 'final', 'abstract', 'synchronized', 'volatile', 'transient', 'native'];
    
    for (const modifier of javaModifiers) {
      if (line.includes(modifier)) {
        modifiers.push(modifier);
      }
    }
    
    return modifiers;
  }
  
  private parseJavaDocTags(commentText: string): DocTag[] {
    const tags: DocTag[] = [];
    const lines = commentText.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim().replace(/^\*+\s*/, ''); // Remove leading asterisks
      
      // @param tag
      const paramMatch = trimmed.match(/^@param\s+(\w+)\s*(.+)?/);
      if (paramMatch) {
        tags.push({
          name: 'param',
          value: paramMatch[1],
          description: paramMatch[2] || ''
        });
      }
      
      // @return tag
      const returnMatch = trimmed.match(/^@return\s*(.+)?/);
      if (returnMatch) {
        tags.push({
          name: 'return',
          description: returnMatch[1] || ''
        });
      }
      
      // @throws/@exception tag
      const throwsMatch = trimmed.match(/^@(?:throws|exception)\s+(\w+)\s*(.+)?/);
      if (throwsMatch) {
        tags.push({
          name: 'throws',
          value: throwsMatch[1],
          description: throwsMatch[2] || ''
        });
      }
      
      // @author tag
      const authorMatch = trimmed.match(/^@author\s*(.+)?/);
      if (authorMatch) {
        tags.push({
          name: 'author',
          description: authorMatch[1] || ''
        });
      }
      
      // @version tag
      const versionMatch = trimmed.match(/^@version\s*(.+)?/);
      if (versionMatch) {
        tags.push({
          name: 'version',
          description: versionMatch[1] || ''
        });
      }
      
      // @since tag
      const sinceMatch = trimmed.match(/^@since\s*(.+)?/);
      if (sinceMatch) {
        tags.push({
          name: 'since',
          description: sinceMatch[1] || ''
        });
      }
      
      // @deprecated tag
      const deprecatedMatch = trimmed.match(/^@deprecated\s*(.+)?/);
      if (deprecatedMatch) {
        tags.push({
          name: 'deprecated',
          description: deprecatedMatch[1] || ''
        });
      }
      
      // @see tag
      const seeMatch = trimmed.match(/^@see\s*(.+)?/);
      if (seeMatch) {
        tags.push({
          name: 'see',
          description: seeMatch[1] || ''
        });
      }
    }
    
    return tags;
  }
  
  private calculateComplexity(content: string): number {
    // Java-specific cyclomatic complexity
    const complexityKeywords = [
      'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch', 'finally',
      'break', 'continue', 'return', 'throw', '&&', '||', '?', 'try'
    ];
    
    let complexity = 1; // Base complexity
    
    for (const keyword of complexityKeywords) {
      let regex: RegExp;
      if (keyword === '&&' || keyword === '||' || keyword === '?') {
        regex = new RegExp(`\\${keyword}`, 'g');
      } else {
        regex = new RegExp(`\\b${keyword}\\b`, 'g');
      }
      
      const matches = content.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }
    
    return complexity;
  }
  
  private calculateMaintainability(content: string): number {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const commentLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
    });
    
    const commentRatio = commentLines.length / lines.length;
    const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
    const hasJavaDoc = content.includes('/**');
    const hasGoodNaming = this.hasDescriptiveNames(content);
    
    let score = 100;
    score -= Math.max(0, avgLineLength - 120) * 0.3; // Java allows longer lines
    score += commentRatio * 20; // Reward comments
    if (hasJavaDoc) score += 15; // Reward JavaDoc
    if (hasGoodNaming) score += 10; // Reward descriptive naming
    
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateTestability(content: string): number {
    const hasPublicMethods = content.includes('public') && content.includes('(');
    const hasInterfaces = content.includes('interface') || content.includes('implements');
    const hasDependencyInjection = content.includes('@Inject') || content.includes('@Autowired');
    const hasGoodConstructors = content.includes('public ') && content.includes('(');
    const hasGettersSetters = content.includes('get') || content.includes('set');
    const hasJavaDoc = content.includes('/**');
    
    let score = 50;
    if (hasPublicMethods) score += 15;
    if (hasInterfaces) score += 15;
    if (hasDependencyInjection) score += 15;
    if (hasGoodConstructors) score += 10;
    if (hasGettersSetters) score += 5;
    if (hasJavaDoc) score += 10;
    
    return Math.min(100, score);
  }
  
  private calculateReliability(content: string): number {
    const hasExceptionHandling = content.includes('try') && content.includes('catch');
    const hasFinally = content.includes('finally');
    const hasNullChecks = content.includes('!= null') || content.includes('== null');
    const hasLogging = content.includes('log.') || content.includes('Logger');
    const hasValidation = content.includes('assert') || content.includes('validate');
    const hasTests = content.includes('@Test') || content.includes('junit');
    
    let score = 60;
    if (hasExceptionHandling) score += 20;
    if (hasFinally) score += 5;
    if (hasNullChecks) score += 10;
    if (hasLogging) score += 5;
    if (hasValidation) score += 5;
    if (hasTests) score += 10;
    
    return Math.min(100, score);
  }
  
  private hasDescriptiveNames(content: string): boolean {
    // Simple heuristic: check for descriptive method and variable names
    const shortNames = (content.match(/\b[a-z]{1,2}\b/g) || []).length;
    const longNames = (content.match(/\b[a-zA-Z]{5,}\b/g) || []).length;
    
    return longNames > shortNames;
  }
  
  private calculateDocumentationScore(content: string): number {
    const hasJavaDoc = content.includes('/**');
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const commentLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
    });
    
    const commentRatio = commentLines.length / lines.length;
    let score = commentRatio * 100;
    if (hasJavaDoc) score += 20;
    
    return Math.min(100, score);
  }
  
  private fallbackParse(content: string, filePath: string, parseStartTime: number): ParseResult {
    const nodes: CodeNode[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const lineNumber = index + 1;
      
      // Extract classes
      const classMatch = trimmed.match(/(?:public|private|protected)?\s*class\s+(\w+)/);
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
      
      // Extract interfaces
      const interfaceMatch = trimmed.match(/(?:public|private|protected)?\s*interface\s+(\w+)/);
      if (interfaceMatch) {
        nodes.push(this.createCodeNode(
          interfaceMatch[1],
          'interface',
          filePath,
          lineNumber,
          lineNumber,
          line
        ));
      }
      
      // Extract methods
      const methodMatch = trimmed.match(/(?:public|private|protected)\s+(?:static\s+)?(?:\w+\s+)?(\w+)\s*\(/);
      if (methodMatch && !trimmed.includes('class') && !trimmed.includes('interface')) {
        nodes.push(this.createCodeNode(
          methodMatch[1],
          'function',
          filePath,
          lineNumber,
          lineNumber,
          line
        ));
      }
      
      // Extract package
      const packageMatch = trimmed.match(/^package\s+([^;]+);/);
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
      
      // Basic Java syntax checks
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      if (openBraces !== closeBraces) {
        errors.push({
          message: 'Unmatched braces',
          position: { line: index + 1, column: 1 },
          severity: 'warning'
        });
      }
      
      const openParens = (line.match(/\(/g) || []).length;
      const closeParens = (line.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        errors.push({
          message: 'Unmatched parentheses',
          position: { line: index + 1, column: 1 },
          severity: 'error'
        });
      }
      
      // Check for missing semicolons
      if (trimmed.length > 0 && 
          !trimmed.endsWith(';') && 
          !trimmed.endsWith('{') && 
          !trimmed.endsWith('}') && 
          !trimmed.startsWith('//') &&
          !trimmed.startsWith('/*') &&
          !trimmed.startsWith('*') &&
          !trimmed.startsWith('@') &&
          !trimmed.includes('if (') &&
          !trimmed.includes('for (') &&
          !trimmed.includes('while (') &&
          !trimmed.includes('else') &&
          !trimmed.includes('try') &&
          !trimmed.includes('catch') &&
          trimmed.includes('=') || trimmed.includes('return')) {
        errors.push({
          message: 'Missing semicolon',
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