import { Strategy, StrategyResult, CodeNode, KnowledgeGraph } from '@earth-agents/core';
import { CodeIssue, Suggestion } from '../Botbie';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

export class DocumentationLibrarian implements Strategy {
  name = 'DocumentationLibrarian';
  description = 'Checks documentation completeness and quality';

  async execute(context: { graph: KnowledgeGraph; config?: any }): Promise<StrategyResult> {
    const findings: CodeIssue[] = [];
    const suggestions: Suggestion[] = [];

    try {
      const nodes = Array.from(context.graph['graph'].nodes.values()) as CodeNode[];

      // Check function documentation
      const functionNodes = nodes.filter((n: CodeNode) => n.type === 'function');
      for (const func of functionNodes) {
        const docIssues = this.checkFunctionDocumentation(func);
        findings.push(...docIssues);
      }

      // Check class documentation
      const classNodes = nodes.filter((n: CodeNode) => n.type === 'class');
      for (const cls of classNodes) {
        const docIssues = this.checkClassDocumentation(cls);
        findings.push(...docIssues);
      }

      // Check module documentation
      const moduleNodes = nodes.filter((n: CodeNode) => n.type === 'module');
      for (const mod of moduleNodes) {
        const docIssues = this.checkModuleDocumentation(mod);
        findings.push(...docIssues);
      }

      // Check README files
      const readmeIssues = this.checkReadmeFiles(context.graph);
      findings.push(...readmeIssues);

      // Check for API documentation
      const apiDocIssues = this.checkAPIDocumentation(nodes);
      findings.push(...apiDocIssues);

      // Generate documentation suggestions
      const docSuggestions = this.generateDocumentationSuggestions(findings, nodes);
      suggestions.push(...docSuggestions);

      return {
        success: true,
        findings,
        suggestions: suggestions.map(s => s.description),
        confidence: 0.95
      };
    } catch (error) {
      return {
        success: false,
        findings: [],
        suggestions: [`Failed to analyze documentation: ${error}`],
        confidence: 0
      };
    }
  }

  canHandle(context: any): boolean {
    return context.graph && context.graph.getStatistics().totalNodes > 0;
  }

  private checkFunctionDocumentation(func: CodeNode): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Check if function has any documentation
    const hasJSDoc = /\/\*\*[\s\S]*?\*\/\s*$/.test(
      func.content.substring(0, func.content.indexOf(func.name))
    );
    const hasComment = /\/\/.*\n\s*$/.test(
      func.content.substring(0, func.content.indexOf(func.name))
    );

    if (!hasJSDoc && !hasComment) {
      // Determine if this function needs documentation
      const isPublic = this.isPublicFunction(func);
      const isComplex = this.isFunctionComplex(func);
      const isExported = func.content.includes('export');

      if (isPublic || isComplex || isExported) {
        issues.push({
          id: uuidv4(),
          type: 'missing-function-doc',
          severity: isExported ? 'medium' : 'low',
          file: func.filePath,
          line: func.startLine,
          description: `Function '${func.name}' lacks documentation`,
          suggestion: 'Add JSDoc comment describing purpose, parameters, and return value',
          autoFixAvailable: true
        });
      }
    } else if (hasJSDoc) {
      // Check JSDoc quality
      const jsdocMatch = func.content.match(/\/\*\*([\s\S]*?)\*\//);
      if (jsdocMatch) {
        const jsdocContent = jsdocMatch[1];
        const docIssues = this.checkJSDocQuality(jsdocContent, func);
        issues.push(...docIssues);
      }
    }

    // Check for complex functions without examples
    if (this.isFunctionComplex(func) && !func.content.includes('@example')) {
      issues.push({
        id: uuidv4(),
        type: 'missing-example',
        severity: 'low',
        file: func.filePath,
        line: func.startLine,
        description: `Complex function '${func.name}' lacks usage example`,
        suggestion: 'Add @example tag with usage demonstration'
      });
    }

    return issues;
  }

  private checkClassDocumentation(cls: CodeNode): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Check if class has documentation
    const hasClassDoc = /\/\*\*[\s\S]*?\*\/\s*class/.test(cls.content);
    
    if (!hasClassDoc) {
      issues.push({
        id: uuidv4(),
        type: 'missing-class-doc',
        severity: 'medium',
        file: cls.filePath,
        line: cls.startLine,
        description: `Class '${cls.name}' lacks documentation`,
        suggestion: 'Add JSDoc comment describing the class purpose and usage',
        autoFixAvailable: true
      });
    }

    // Check for undocumented public methods
    const publicMethodPattern = /(?:public\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\w+)?\s*{/g;
    const methods = cls.content.match(publicMethodPattern) || [];
    
    methods.forEach((method: string) => {
      const methodName = method.match(/(\w+)\s*\(/)?.[1];
      if (methodName && !this.isConstructor(methodName) && !this.isPrivateMethod(methodName)) {
        const methodIndex = cls.content.indexOf(method);
        const beforeMethod = cls.content.substring(Math.max(0, methodIndex - 200), methodIndex);
        
        if (!beforeMethod.includes('/**')) {
          issues.push({
            id: uuidv4(),
            type: 'missing-method-doc',
            severity: 'low',
            file: cls.filePath,
            line: cls.startLine,
            description: `Method '${methodName}' in class '${cls.name}' lacks documentation`,
            suggestion: 'Document public methods with JSDoc comments'
          });
        }
      }
    });

    return issues;
  }

  private checkModuleDocumentation(mod: CodeNode): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Check for file header documentation
    const firstLines = mod.content.split('\n').slice(0, 10).join('\n');
    const hasFileDoc = firstLines.includes('/**') || firstLines.includes('//');

    if (!hasFileDoc) {
      // Check if this is a significant module
      const isSignificant = mod.content.length > 500 || 
                           mod.content.includes('export') ||
                           !mod.filePath.includes('index');

      if (isSignificant) {
        issues.push({
          id: uuidv4(),
          type: 'missing-file-doc',
          severity: 'low',
          file: mod.filePath,
          line: 1,
          description: 'File lacks header documentation',
          suggestion: 'Add file header describing the module purpose',
          autoFixAvailable: true
        });
      }
    }

    // Check for exports without documentation
    const exportPattern = /export\s+(?:const|function|class)\s+(\w+)/g;
    let match;
    while ((match = exportPattern.exec(mod.content)) !== null) {
      const exportName = match[1];
      const exportIndex = match.index;
      const beforeExport = mod.content.substring(Math.max(0, exportIndex - 200), exportIndex);
      
      if (!beforeExport.includes('/**') && !beforeExport.includes('//')) {
        issues.push({
          id: uuidv4(),
          type: 'undocumented-export',
          severity: 'medium',
          file: mod.filePath,
          line: mod.startLine,
          description: `Exported '${exportName}' lacks documentation`,
          suggestion: 'Document all public exports'
        });
      }
    }

    return issues;
  }

  private checkReadmeFiles(graph: KnowledgeGraph): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const modules = graph.getNodesByType('module');
    
    // Find all directories
    const directories = new Set<string>();
    modules.forEach((mod: CodeNode) => {
      const dir = path.dirname(mod.filePath);
      directories.add(dir);
    });

    // Check for README in important directories
    const importantDirs = Array.from(directories).filter(dir => {
      const depth = dir.split('/').length;
      const isRoot = depth <= 2;
      const hasMultipleFiles = modules.filter(m => m.filePath.startsWith(dir)).length > 5;
      return isRoot || hasMultipleFiles;
    });

    importantDirs.forEach((dir: string) => {
      const hasReadme = modules.some((m: CodeNode) => 
        m.filePath.toLowerCase().includes(path.join(dir, 'readme'))
      );

      if (!hasReadme) {
        issues.push({
          id: uuidv4(),
          type: 'missing-readme',
          severity: 'medium',
          file: dir,
          description: `Directory '${path.basename(dir)}' lacks README`,
          suggestion: 'Add README.md to document the module/directory purpose'
        });
      }
    });

    // Check README quality
    const readmeFiles = modules.filter((m: CodeNode) => 
      path.basename(m.filePath).toLowerCase().includes('readme')
    );

    readmeFiles.forEach((readme: CodeNode) => {
      const content = readme.content.toLowerCase();
      const requiredSections = ['installation', 'usage', 'api'];
      const missingSections = requiredSections.filter((section: string) => !content.includes(section));

      if (missingSections.length > 0) {
        issues.push({
          id: uuidv4(),
          type: 'incomplete-readme',
          severity: 'low',
          file: readme.filePath,
          description: `README missing sections: ${missingSections.join(', ')}`,
          suggestion: 'Add standard sections for better documentation'
        });
      }
    });

    return issues;
  }

  private checkAPIDocumentation(nodes: CodeNode[]): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Find API endpoints
    const apiEndpoints = nodes.filter((n: CodeNode) => 
      n.content.match(/\.(get|post|put|delete|patch)\s*\(['"`]\/\w+/i)
    );

    apiEndpoints.forEach((endpoint: CodeNode) => {
      const routes = endpoint.content.match(/\.(get|post|put|delete|patch)\s*\(['"`](\/[^'"`)]+)/gi) || [];
      
      routes.forEach((route: string) => {
        const method = route.match(/\.(get|post|put|delete|patch)/i)?.[1];
        const path = route.match(/['"`](\/[^'"`)]+)/)?.[1];
        
        // Check if route has documentation
        const routeIndex = endpoint.content.indexOf(route);
        const beforeRoute = endpoint.content.substring(Math.max(0, routeIndex - 300), routeIndex);
        
        if (!beforeRoute.includes('/**') && !beforeRoute.includes('@api')) {
          issues.push({
            id: uuidv4(),
            type: 'undocumented-api',
            severity: 'high',
            file: endpoint.filePath,
            line: endpoint.startLine,
            description: `API endpoint ${method?.toUpperCase()} ${path} lacks documentation`,
            suggestion: 'Add OpenAPI/Swagger documentation for API endpoints'
          });
        }
      });
    });

    return issues;
  }

  private checkJSDocQuality(jsdocContent: string, func: CodeNode): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Check for description
    const hasDescription = jsdocContent.trim().split('\n')[0].trim().length > 5;
    if (!hasDescription) {
      issues.push({
        id: uuidv4(),
        type: 'empty-jsdoc',
        severity: 'low',
        file: func.filePath,
        line: func.startLine,
        description: `JSDoc for '${func.name}' lacks description`,
        suggestion: 'Add meaningful description to JSDoc'
      });
    }

    // Extract function parameters
    const funcParams = this.extractParameters(func.content);
    const docParams = [...jsdocContent.matchAll(/@param\s+(?:\{[^}]+\}\s+)?(\w+)/g)]
      .map((m: RegExpMatchArray) => m[1]);

    // Check for missing parameter documentation
    const missingParams = funcParams.filter((p: string) => !docParams.includes(p));
    if (missingParams.length > 0) {
      issues.push({
        id: uuidv4(),
        type: 'missing-param-doc',
        severity: 'medium',
        file: func.filePath,
        line: func.startLine,
        description: `JSDoc missing @param for: ${missingParams.join(', ')}`,
        suggestion: 'Document all function parameters',
        autoFixAvailable: true
      });
    }

    // Check for return documentation
    const hasReturn = func.content.includes('return ') && !func.content.includes('return;');
    const hasReturnDoc = jsdocContent.includes('@return') || jsdocContent.includes('@returns');
    
    if (hasReturn && !hasReturnDoc) {
      issues.push({
        id: uuidv4(),
        type: 'missing-return-doc',
        severity: 'low',
        file: func.filePath,
        line: func.startLine,
        description: `JSDoc missing @returns documentation`,
        suggestion: 'Document the return value'
      });
    }

    // Check for type information
    if (!jsdocContent.includes('{')) {
      issues.push({
        id: uuidv4(),
        type: 'missing-type-info',
        severity: 'low',
        file: func.filePath,
        line: func.startLine,
        description: `JSDoc lacks type information`,
        suggestion: 'Add type annotations to @param and @returns'
      });
    }

    return issues;
  }

  private isPublicFunction(func: CodeNode): boolean {
    return !func.name.startsWith('_') && 
           !func.name.startsWith('private') &&
           func.content.includes('export');
  }

  private isFunctionComplex(func: CodeNode): boolean {
    const lines = func.endLine - func.startLine;
    const params = this.extractParameters(func.content).length;
    const hasConditionals = (func.content.match(/if|switch|for|while/g) || []).length;
    
    return lines > 20 || params > 3 || hasConditionals > 3;
  }

  private isConstructor(methodName: string): boolean {
    return methodName === 'constructor' || methodName === 'init';
  }

  private isPrivateMethod(methodName: string): boolean {
    return methodName.startsWith('_') || methodName.startsWith('private');
  }

  private extractParameters(functionContent: string): string[] {
    const match = functionContent.match(/\(([^)]*)\)/);
    if (!match) return [];
    
    return match[1]
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map((p: string) => p.split(/[:\s=]/)[0]);
  }

  private generateDocumentationSuggestions(issues: CodeIssue[], nodes: CodeNode[]): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Suggest documentation standards
    if (issues.length > 10) {
      suggestions.push({
        type: 'documentation',
        description: 'Establish documentation standards and enforce them in code reviews',
        impact: 'high',
        effort: 'low'
      });
    }

    // Suggest documentation generation
    const missingDocs = issues.filter((i: CodeIssue) => i.type.includes('missing'));
    if (missingDocs.length > 20) {
      suggestions.push({
        type: 'documentation',
        description: 'Use documentation generation tools to create initial documentation',
        impact: 'medium',
        effort: 'low'
      });
    }

    // Suggest API documentation
    const apiIssues = issues.filter((i: CodeIssue) => i.type === 'undocumented-api');
    if (apiIssues.length > 0) {
      suggestions.push({
        type: 'documentation',
        description: 'Implement OpenAPI/Swagger for comprehensive API documentation',
        impact: 'high',
        effort: 'medium'
      });
    }

    // Suggest README templates
    const readmeIssues = issues.filter((i: CodeIssue) => i.type.includes('readme'));
    if (readmeIssues.length > 0) {
      suggestions.push({
        type: 'documentation',
        description: 'Create README templates for consistent documentation across modules',
        impact: 'medium',
        effort: 'low'
      });
    }

    // Suggest documentation automation
    if (issues.filter((i: CodeIssue) => i.autoFixAvailable).length > 10) {
      suggestions.push({
        type: 'documentation',
        description: 'Set up pre-commit hooks to ensure documentation standards',
        impact: 'high',
        effort: 'medium'
      });
    }

    return suggestions;
  }
}