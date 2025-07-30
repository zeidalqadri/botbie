import { CodeNode, Relationship, KnowledgeGraph } from '@earth-agents/core';
import { Project, SourceFile, Node, SyntaxKind } from 'ts-morph';
import { glob } from 'glob';
import { readFileSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import ignore from 'ignore';

export class CodeParser {
  private project: Project;
  private ignorePatterns: any;
  
  constructor() {
    this.project = new Project({
      skipAddingFilesFromTsConfig: true,
      compilerOptions: {
        allowJs: true,
        target: 99, // Latest
        module: 99  // Latest
      }
    });
    
    // Default ignore patterns
    this.ignorePatterns = ignore().add([
      'node_modules',
      'dist',
      'build',
      '.git',
      '*.min.js',
      '*.map'
    ]);
  }
  
  async findSourceFiles(rootPath: string): Promise<string[]> {
    const patterns = [
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx',
      '**/*.py',
      '**/*.java',
      '**/*.go',
      '**/*.rs',
      '**/*.rb'
    ];
    
    const files: string[] = [];
    
    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        cwd: rootPath,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
      });
      
      files.push(...matches.filter(file => !this.ignorePatterns.ignores(path.relative(rootPath, file))));
    }
    
    return files;
  }
  
  async parseFile(filePath: string): Promise<CodeNode[]> {
    const nodes: CodeNode[] = [];
    const ext = path.extname(filePath);
    
    // For now, focus on TypeScript/JavaScript
    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      return this.parseTypeScriptFile(filePath);
    }
    
    // For other languages, create a basic file node
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    nodes.push({
      id: uuidv4(),
      name: path.basename(filePath),
      type: 'module',
      filePath,
      startLine: 1,
      endLine: lines.length,
      language: this.getLanguageFromExt(ext),
      content: content.substring(0, 1000), // First 1000 chars
      relationships: []
    });
    
    return nodes;
  }
  
  private async parseTypeScriptFile(filePath: string): Promise<CodeNode[]> {
    const nodes: CodeNode[] = [];
    const sourceFile = this.project.addSourceFileAtPath(filePath);
    
    // Create module node
    const moduleNode: CodeNode = {
      id: uuidv4(),
      name: path.basename(filePath, path.extname(filePath)),
      type: 'module',
      filePath,
      startLine: 1,
      endLine: sourceFile.getEndLineNumber(),
      language: 'typescript',
      content: sourceFile.getText().substring(0, 1000),
      relationships: []
    };
    nodes.push(moduleNode);
    
    // Parse classes
    sourceFile.getClasses().forEach(classDecl => {
      const classNode: CodeNode = {
        id: uuidv4(),
        name: classDecl.getName() || 'Anonymous',
        type: 'class',
        filePath,
        startLine: classDecl.getStartLineNumber(),
        endLine: classDecl.getEndLineNumber(),
        language: 'typescript',
        content: classDecl.getText().substring(0, 500),
        relationships: []
      };
      nodes.push(classNode);
      
      // Add relationship
      moduleNode.relationships.push({
        type: 'defines',
        sourceId: moduleNode.id,
        targetId: classNode.id
      });
      
      // Parse methods
      classDecl.getMethods().forEach(method => {
        const methodNode: CodeNode = {
          id: uuidv4(),
          name: method.getName() || 'Anonymous',
          type: 'function',
          filePath,
          startLine: method.getStartLineNumber(),
          endLine: method.getEndLineNumber(),
          language: 'typescript',
          content: method.getText().substring(0, 300),
          relationships: []
        };
        nodes.push(methodNode);
        
        classNode.relationships.push({
          type: 'defines',
          sourceId: classNode.id,
          targetId: methodNode.id
        });
      });
    });
    
    // Parse functions
    sourceFile.getFunctions().forEach(func => {
      const funcNode: CodeNode = {
        id: uuidv4(),
        name: func.getName() || 'Anonymous',
        type: 'function',
        filePath,
        startLine: func.getStartLineNumber(),
        endLine: func.getEndLineNumber(),
        language: 'typescript',
        content: func.getText().substring(0, 500),
        relationships: []
      };
      nodes.push(funcNode);
      
      moduleNode.relationships.push({
        type: 'defines',
        sourceId: moduleNode.id,
        targetId: funcNode.id
      });
    });
    
    // Parse interfaces
    sourceFile.getInterfaces().forEach(iface => {
      const ifaceNode: CodeNode = {
        id: uuidv4(),
        name: iface.getName(),
        type: 'interface',
        filePath,
        startLine: iface.getStartLineNumber(),
        endLine: iface.getEndLineNumber(),
        language: 'typescript',
        content: iface.getText().substring(0, 500),
        relationships: []
      };
      nodes.push(ifaceNode);
      
      moduleNode.relationships.push({
        type: 'defines',
        sourceId: moduleNode.id,
        targetId: ifaceNode.id
      });
    });
    
    // Parse type aliases
    sourceFile.getTypeAliases().forEach(typeAlias => {
      const typeNode: CodeNode = {
        id: uuidv4(),
        name: typeAlias.getName(),
        type: 'type',
        filePath,
        startLine: typeAlias.getStartLineNumber(),
        endLine: typeAlias.getEndLineNumber(),
        language: 'typescript',
        content: typeAlias.getText(),
        relationships: []
      };
      nodes.push(typeNode);
      
      moduleNode.relationships.push({
        type: 'defines',
        sourceId: moduleNode.id,
        targetId: typeNode.id
      });
    });
    
    return nodes;
  }
  
  async buildRelationships(graph: KnowledgeGraph): Promise<void> {
    // Build import relationships
    for (const sourceFile of this.project.getSourceFiles()) {
      const moduleNode = Array.from(graph['graph'].nodes.values())
        .find(n => n.filePath === sourceFile.getFilePath() && n.type === 'module');
      
      if (!moduleNode) continue;
      
      // Process imports
      sourceFile.getImportDeclarations().forEach(importDecl => {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        
        // Find target module
        const targetPath = this.resolveImportPath(sourceFile.getFilePath(), moduleSpecifier);
        const targetNode = Array.from(graph['graph'].nodes.values())
          .find(n => n.filePath === targetPath && n.type === 'module');
        
        if (targetNode) {
          graph.addRelationship({
            type: 'imports',
            sourceId: moduleNode.id,
            targetId: targetNode.id
          });
        }
      });
    }
    
    // Build call relationships (simplified)
    // This would require more sophisticated analysis in production
  }
  
  private resolveImportPath(sourcePath: string, importPath: string): string {
    if (importPath.startsWith('.')) {
      const resolved = path.resolve(path.dirname(sourcePath), importPath);
      
      // Try different extensions
      const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
      for (const ext of extensions) {
        const fullPath = resolved + ext;
        if (this.project.getSourceFile(fullPath)) {
          return fullPath;
        }
      }
    }
    
    return importPath;
  }
  
  private getLanguageFromExt(ext: string): string {
    const langMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
      '.rb': 'ruby',
      '.php': 'php',
      '.cs': 'csharp',
      '.cpp': 'cpp',
      '.c': 'c'
    };
    
    return langMap[ext] || 'unknown';
  }
}