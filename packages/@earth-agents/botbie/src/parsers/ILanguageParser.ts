import { CodeNode, Relationship, QualityMetrics } from '@earth-agents/core';

/**
 * Abstract interface for language-specific parsers
 */
export interface ILanguageParser {
  /**
   * The language this parser supports
   */
  readonly language: string;
  
  /**
   * File extensions this parser can handle
   */
  readonly extensions: string[];
  
  /**
   * Parse a source file and extract code nodes
   */
  parseFile(filePath: string, content: string): Promise<ParseResult>;
  
  /**
   * Parse source code content directly
   */
  parseContent(content: string, fileName?: string): Promise<ParseResult>;
  
  /**
   * Extract relationships between code elements
   */
  extractRelationships(nodes: CodeNode[]): Promise<Relationship[]>;
  
  /**
   * Calculate quality metrics for code elements
   */
  calculateQualityMetrics(node: CodeNode, content: string): Promise<QualityMetrics>;
  
  /**
   * Validate syntax of the source code
   */
  validateSyntax(content: string): Promise<SyntaxValidationResult>;
  
  /**
   * Extract imports/dependencies from the file
   */
  extractDependencies(content: string): Promise<Dependency[]>;
  
  /**
   * Find references to a symbol
   */
  findReferences(content: string, symbolName: string, position?: Position): Promise<Reference[]>;
  
  /**
   * Get symbols at a specific position
   */
  getSymbolAtPosition(content: string, position: Position): Promise<SymbolInfo | null>;
  
  /**
   * Extract comments and documentation
   */
  extractComments(content: string): Promise<Comment[]>;
  
  /**
   * Check if this parser can handle the given file
   */
  canParse(filePath: string): boolean;
}

/**
 * Result of parsing a source file
 */
export interface ParseResult {
  nodes: CodeNode[];
  relationships: Relationship[];
  dependencies: Dependency[];
  comments: Comment[];
  errors: ParseError[];
  metadata: ParseMetadata;
}

/**
 * Position in source code
 */
export interface Position {
  line: number;
  column: number;
  offset?: number;
}

/**
 * Range in source code
 */
export interface Range {
  start: Position;
  end: Position;
}

/**
 * Parse error information
 */
export interface ParseError {
  message: string;
  position: Position;
  severity: 'error' | 'warning' | 'info';
  code?: string;
}

/**
 * Syntax validation result
 */
export interface SyntaxValidationResult {
  isValid: boolean;
  errors: ParseError[];
  warnings: ParseError[];
}

/**
 * Dependency information
 */
export interface Dependency {
  name: string;
  path?: string;
  type: 'import' | 'require' | 'include' | 'using' | 'from';
  isExternal: boolean;
  isTypeOnly?: boolean;
  importedSymbols?: string[];
  alias?: string;
  position: Position;
}

/**
 * Reference to a symbol
 */
export interface Reference {
  position: Position;
  range: Range;
  isDefinition: boolean;
  isDeclaration: boolean;
  context: string;
}

/**
 * Symbol information
 */
export interface SymbolInfo {
  name: string;
  kind: SymbolKind;
  type?: string;
  documentation?: string;
  position: Position;
  range: Range;
  modifiers: string[];
  containerName?: string;
}

/**
 * Types of symbols
 */
export enum SymbolKind {
  File = 'file',
  Module = 'module',
  Namespace = 'namespace',
  Package = 'package',
  Class = 'class',
  Method = 'method',
  Property = 'property',
  Field = 'field',
  Constructor = 'constructor',
  Enum = 'enum',
  Interface = 'interface',
  Function = 'function',
  Variable = 'variable',
  Constant = 'constant',
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Array = 'array',
  Object = 'object',
  Key = 'key',
  Null = 'null',
  EnumMember = 'enumMember',
  Struct = 'struct',
  Event = 'event',
  Operator = 'operator',
  TypeParameter = 'typeParameter'
}

/**
 * Comment information
 */
export interface Comment {
  text: string;
  type: 'line' | 'block' | 'doc';
  position: Position;
  range: Range;
  isDocumentation: boolean;
  associatedSymbol?: string;
  tags?: DocTag[];
}

/**
 * Documentation tag
 */
export interface DocTag {
  name: string;
  value?: string;
  description?: string;
}

/**
 * Parse metadata
 */
export interface ParseMetadata {
  parserVersion: string;
  parseTime: number;
  sourceLength: number;
  nodeCount: number;
  language: string;
  encoding?: string;
  lineCount: number;
}

/**
 * Abstract base class for language parsers
 */
export abstract class BaseLanguageParser implements ILanguageParser {
  abstract readonly language: string;
  abstract readonly extensions: string[];
  
  abstract parseFile(filePath: string, content: string): Promise<ParseResult>;
  abstract parseContent(content: string, fileName?: string): Promise<ParseResult>;
  abstract extractRelationships(nodes: CodeNode[]): Promise<Relationship[]>;
  abstract calculateQualityMetrics(node: CodeNode, content: string): Promise<QualityMetrics>;
  abstract validateSyntax(content: string): Promise<SyntaxValidationResult>;
  abstract extractDependencies(content: string): Promise<Dependency[]>;
  abstract findReferences(content: string, symbolName: string, position?: Position): Promise<Reference[]>;
  abstract getSymbolAtPosition(content: string, position: Position): Promise<SymbolInfo | null>;
  abstract extractComments(content: string): Promise<Comment[]>;
  
  /**
   * Check if this parser can handle the given file
   */
  canParse(filePath: string): boolean {
    const extension = this.getFileExtension(filePath);
    return this.extensions.includes(extension);
  }
  
  /**
   * Get file extension from path
   */
  protected getFileExtension(filePath: string): string {
    const lastDot = filePath.lastIndexOf('.');
    return lastDot >= 0 ? filePath.substring(lastDot + 1).toLowerCase() : '';
  }
  
  /**
   * Create a code node with common properties
   */
  protected createCodeNode(
    name: string,
    type: CodeNode['type'],
    filePath: string,
    startLine: number,
    endLine: number,
    content: string,
    language: string = this.language
  ): CodeNode {
    return {
      id: this.generateNodeId(name, type, filePath, startLine),
      name,
      type,
      filePath,
      startLine,
      endLine,
      language,
      content,
      relationships: []
    };
  }
  
  /**
   * Generate a unique ID for a code node
   */
  protected generateNodeId(
    name: string,
    type: string,
    filePath: string,
    startLine: number
  ): string {
    const hash = this.simpleHash(`${filePath}:${type}:${name}:${startLine}`);
    return `${this.language}-${type}-${hash}`;
  }
  
  /**
   * Simple hash function for generating IDs
   */
  protected simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  /**
   * Create default parse metadata
   */
  protected createParseMetadata(
    content: string,
    parseStartTime: number,
    nodeCount: number
  ): ParseMetadata {
    return {
      parserVersion: '1.0.0',
      parseTime: Date.now() - parseStartTime,
      sourceLength: content.length,
      nodeCount,
      language: this.language,
      lineCount: content.split('\n').length
    };
  }
  
  /**
   * Extract line content at specific line number
   */
  protected getLineContent(content: string, lineNumber: number): string {
    const lines = content.split('\n');
    return lines[lineNumber - 1] || '';
  }
  
  /**
   * Convert offset to line/column position
   */
  protected offsetToPosition(content: string, offset: number): Position {
    const lines = content.substring(0, offset).split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
      offset
    };
  }
  
  /**
   * Convert line/column position to offset
   */
  protected positionToOffset(content: string, position: Position): number {
    const lines = content.split('\n');
    let offset = 0;
    
    for (let i = 0; i < position.line - 1; i++) {
      offset += lines[i].length + 1; // +1 for newline
    }
    
    offset += position.column - 1;
    return offset;
  }
}

/**
 * Parser registry for managing multiple language parsers
 */
export class ParserRegistry {
  private parsers: Map<string, ILanguageParser> = new Map();
  
  /**
   * Register a parser for a language
   */
  register(parser: ILanguageParser): void {
    this.parsers.set(parser.language, parser);
  }
  
  /**
   * Get parser for a specific language
   */
  getParser(language: string): ILanguageParser | undefined {
    return this.parsers.get(language);
  }
  
  /**
   * Get parser that can handle a specific file
   */
  getParserForFile(filePath: string): ILanguageParser | undefined {
    for (const parser of this.parsers.values()) {
      if (parser.canParse(filePath)) {
        return parser;
      }
    }
    return undefined;
  }
  
  /**
   * Get all registered parsers
   */
  getAllParsers(): ILanguageParser[] {
    return Array.from(this.parsers.values());
  }
  
  /**
   * Get all supported languages
   */
  getSupportedLanguages(): string[] {
    return Array.from(this.parsers.keys());
  }
  
  /**
   * Get all supported file extensions
   */
  getSupportedExtensions(): string[] {
    const extensions: string[] = [];
    for (const parser of this.parsers.values()) {
      extensions.push(...parser.extensions);
    }
    return [...new Set(extensions)].sort();
  }
}

// Default global registry instance
export const globalParserRegistry = new ParserRegistry();