import { BaseFixProvider } from './BaseFixProvider';
import { Fix, FixContext, FileChange } from '../types';
import { CodeIssue } from '../../Botbie';
import * as ts from 'typescript';

export class ImportFixer extends BaseFixProvider {
  name = 'ImportFixer';
  supportedIssueTypes = ['unused-import', 'missing-import', 'duplicate-import', 'import-order'];
  
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
        case 'unused-import':
          return this.fixUnusedImport(issue, context, sourceFile);
        case 'missing-import':
          return this.fixMissingImport(issue, context, sourceFile);
        case 'duplicate-import':
          return this.fixDuplicateImport(issue, context, sourceFile);
        case 'import-order':
          return this.fixImportOrder(issue, context, sourceFile);
        default:
          return null;
      }
    } catch (error) {
      console.error('Failed to generate import fix:', error);
      return null;
    }
  }
  
  /**
   * Remove unused imports
   */
  private fixUnusedImport(
    issue: CodeIssue,
    context: FixContext,
    sourceFile: ts.SourceFile
  ): Fix {
    const imports = this.extractImports(sourceFile);
    const usedIdentifiers = this.findUsedIdentifiers(sourceFile);
    
    const changes: FileChange[] = [];
    
    for (const importInfo of imports) {
      if (this.isImportUnused(importInfo, usedIdentifiers)) {
        const importText = this.getImportText(sourceFile, importInfo.node);
        const startLine = sourceFile.getLineAndCharacterOfPosition(importInfo.node.pos).line + 1;
        
        changes.push({
          filePath: context.filePath,
          original: importText,
          modified: '',
          startLine
        });
      }
    }
    
    return this.createFix(
      issue.id,
      `Remove ${changes.length} unused import${changes.length > 1 ? 's' : ''}`,
      changes,
      0.95,
      'low'
    );
  }
  
  /**
   * Add missing imports
   */
  private fixMissingImport(
    issue: CodeIssue,
    context: FixContext,
    sourceFile: ts.SourceFile
  ): Fix | null {
    const missingIdentifier = this.extractMissingIdentifier(issue);
    if (!missingIdentifier) return null;
    
    // Simple heuristic to suggest import source
    const suggestedImport = this.suggestImportSource(missingIdentifier, context);
    if (!suggestedImport) return null;
    
    const imports = this.extractImports(sourceFile);
    const insertPosition = this.getInsertPosition(imports, sourceFile);
    
    const importStatement = this.generateImportStatement(missingIdentifier, suggestedImport);
    const indentation = this.getNodeIndentation(sourceFile.statements[0], sourceFile);
    
    const change: FileChange = {
      filePath: context.filePath,
      original: '',
      modified: indentation + importStatement + '\n',
      startLine: insertPosition
    };
    
    return this.createFix(
      issue.id,
      `Add missing import for '${missingIdentifier}'`,
      [change],
      0.7,
      'medium'
    );
  }
  
  /**
   * Remove duplicate imports
   */
  private fixDuplicateImport(
    issue: CodeIssue,
    context: FixContext,
    sourceFile: ts.SourceFile
  ): Fix {
    const imports = this.extractImports(sourceFile);
    const duplicateGroups = this.findDuplicateImports(imports);
    const changes: FileChange[] = [];
    
    for (const group of duplicateGroups) {
      // Keep the first import, remove the rest
      const [keep, ...remove] = group;
      
      for (const importInfo of remove) {
        const importText = this.getImportText(sourceFile, importInfo.node);
        const startLine = sourceFile.getLineAndCharacterOfPosition(importInfo.node.pos).line + 1;
        
        changes.push({
          filePath: context.filePath,
          original: importText,
          modified: '',
          startLine
        });
      }
    }
    
    return this.createFix(
      issue.id,
      `Remove ${changes.length} duplicate import${changes.length > 1 ? 's' : ''}`,
      changes,
      0.9,
      'low'
    );
  }
  
  /**
   * Fix import order according to conventions
   */
  private fixImportOrder(
    issue: CodeIssue,
    context: FixContext,
    sourceFile: ts.SourceFile
  ): Fix {
    const imports = this.extractImports(sourceFile);
    const sortedImports = this.sortImports(imports);
    
    // Generate the reordered import section
    const newImportSection = sortedImports
      .map(importInfo => this.getImportText(sourceFile, importInfo.node).trim())
      .join('\n') + '\n';
    
    // Find the range of all imports
    const firstImport = imports[0];
    const lastImport = imports[imports.length - 1];
    
    const startLine = sourceFile.getLineAndCharacterOfPosition(firstImport.node.pos).line + 1;
    const endLine = sourceFile.getLineAndCharacterOfPosition(lastImport.node.end).line + 1;
    
    const originalSection = this.extractLines(context.fileContent, startLine, endLine);
    
    const change: FileChange = {
      filePath: context.filePath,
      original: originalSection,
      modified: newImportSection,
      startLine
    };
    
    return this.createFix(
      issue.id,
      'Reorder imports according to conventions',
      [change],
      0.8,
      'low'
    );
  }
  
  /**
   * Extract import information from source file
   */
  private extractImports(sourceFile: ts.SourceFile): ImportInfo[] {
    const imports: ImportInfo[] = [];
    
    sourceFile.statements.forEach(statement => {
      if (ts.isImportDeclaration(statement)) {
        const moduleSpecifier = statement.moduleSpecifier as ts.StringLiteral;
        const importClause = statement.importClause;
        
        let importedNames: string[] = [];
        let defaultImport: string | undefined;
        let namespaceImport: string | undefined;
        
        if (importClause) {
          if (importClause.name) {
            defaultImport = importClause.name.text;
          }
          
          if (importClause.namedBindings) {
            if (ts.isNamespaceImport(importClause.namedBindings)) {
              namespaceImport = importClause.namedBindings.name.text;
            } else if (ts.isNamedImports(importClause.namedBindings)) {
              importedNames = importClause.namedBindings.elements.map(
                element => element.name.text
              );
            }
          }
        }
        
        imports.push({
          node: statement,
          module: moduleSpecifier.text,
          defaultImport,
          namespaceImport,
          namedImports: importedNames,
          isTypeOnly: statement.importClause?.isTypeOnly || false
        });
      }
    });
    
    return imports;
  }
  
  /**
   * Find all used identifiers in the source file
   */
  private findUsedIdentifiers(sourceFile: ts.SourceFile): Set<string> {
    const used = new Set<string>();
    
    const visit = (node: ts.Node) => {
      if (ts.isIdentifier(node)) {
        used.add(node.text);
      }
      ts.forEachChild(node, visit);
    };
    
    // Skip import declarations when collecting used identifiers
    sourceFile.statements.forEach(statement => {
      if (!ts.isImportDeclaration(statement)) {
        visit(statement);
      }
    });
    
    return used;
  }
  
  /**
   * Check if an import is unused
   */
  private isImportUnused(importInfo: ImportInfo, usedIdentifiers: Set<string>): boolean {
    // Check default import
    if (importInfo.defaultImport && usedIdentifiers.has(importInfo.defaultImport)) {
      return false;
    }
    
    // Check namespace import
    if (importInfo.namespaceImport && usedIdentifiers.has(importInfo.namespaceImport)) {
      return false;
    }
    
    // Check named imports
    for (const namedImport of importInfo.namedImports) {
      if (usedIdentifiers.has(namedImport)) {
        return false;
      }
    }
    
    // Check for side-effect imports (no bindings)
    if (!importInfo.defaultImport && 
        !importInfo.namespaceImport && 
        importInfo.namedImports.length === 0) {
      return false; // Keep side-effect imports
    }
    
    return true;
  }
  
  /**
   * Extract missing identifier from issue
   */
  private extractMissingIdentifier(issue: CodeIssue): string | null {
    // Simple regex to extract identifier from error message
    const match = issue.message?.match(/'([^']+)' is not defined/);
    return match ? match[1] : null;
  }
  
  /**
   * Suggest import source for an identifier
   */
  private suggestImportSource(identifier: string, context: FixContext): string | null {
    // Common library mappings
    const commonImports: Record<string, string> = {
      React: 'react',
      Component: 'react',
      useState: 'react',
      useEffect: 'react',
      useCallback: 'react',
      useMemo: 'react',
      Express: 'express',
      Router: 'express',
      lodash: 'lodash',
      _: 'lodash',
      moment: 'moment',
      axios: 'axios',
      fs: 'fs',
      path: 'path',
      util: 'util'
    };
    
    return commonImports[identifier] || null;
  }
  
  /**
   * Find duplicate imports
   */
  private findDuplicateImports(imports: ImportInfo[]): ImportInfo[][] {
    const groups = new Map<string, ImportInfo[]>();
    
    for (const importInfo of imports) {
      const key = importInfo.module;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(importInfo);
    }
    
    return Array.from(groups.values()).filter(group => group.length > 1);
  }
  
  /**
   * Sort imports according to conventions
   */
  private sortImports(imports: ImportInfo[]): ImportInfo[] {
    return imports.sort((a, b) => {
      // 1. Built-in modules first
      const aBuiltIn = this.isBuiltInModule(a.module);
      const bBuiltIn = this.isBuiltInModule(b.module);
      if (aBuiltIn !== bBuiltIn) {
        return aBuiltIn ? -1 : 1;
      }
      
      // 2. External modules next
      const aExternal = this.isExternalModule(a.module);
      const bExternal = this.isExternalModule(b.module);
      if (aExternal !== bExternal) {
        return aExternal ? -1 : 1;
      }
      
      // 3. Internal modules last
      // 4. Alphabetical within each group
      return a.module.localeCompare(b.module);
    });
  }
  
  /**
   * Check if module is built-in (Node.js)
   */
  private isBuiltInModule(module: string): boolean {
    const builtInModules = [
      'fs', 'path', 'util', 'crypto', 'os', 'http', 'https', 'url', 'querystring',
      'events', 'stream', 'buffer', 'child_process', 'cluster', 'net', 'tls'
    ];
    return builtInModules.includes(module);
  }
  
  /**
   * Check if module is external (from node_modules)
   */
  private isExternalModule(module: string): boolean {
    return !module.startsWith('.') && !module.startsWith('/');
  }
  
  /**
   * Get insert position for new import
   */
  private getInsertPosition(imports: ImportInfo[], sourceFile: ts.SourceFile): number {
    if (imports.length === 0) {
      return 1; // Insert at beginning
    }
    
    const lastImport = imports[imports.length - 1];
    return sourceFile.getLineAndCharacterOfPosition(lastImport.node.end).line + 2;
  }
  
  /**
   * Generate import statement
   */
  private generateImportStatement(identifier: string, source: string): string {
    // Simple heuristic for import type
    if (identifier === identifier.toLowerCase()) {
      return `import ${identifier} from '${source}';`;
    } else {
      return `import { ${identifier} } from '${source}';`;
    }
  }
  
  /**
   * Get import text from node
   */
  private getImportText(sourceFile: ts.SourceFile, node: ts.ImportDeclaration): string {
    const start = node.getFullStart();
    const end = node.end;
    return sourceFile.text.substring(start, end) + '\n';
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

interface ImportInfo {
  node: ts.ImportDeclaration;
  module: string;
  defaultImport?: string;
  namespaceImport?: string;
  namedImports: string[];
  isTypeOnly: boolean;
}