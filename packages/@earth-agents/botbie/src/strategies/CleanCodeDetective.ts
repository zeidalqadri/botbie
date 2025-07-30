import { Strategy, StrategyResult, CodeNode, KnowledgeGraph } from '@earth-agents/core';
import { CodeIssue } from '../Botbie';
import { v4 as uuidv4 } from 'uuid';

export class CleanCodeDetective implements Strategy {
  name = 'CleanCodeDetective';
  description = 'Enforces clean code principles and detects readability issues';

  async execute(context: { graph: KnowledgeGraph; config?: any }): Promise<StrategyResult> {
    const findings: CodeIssue[] = [];
    
    try {
      const nodes = Array.from(context.graph['graph'].nodes.values()) as CodeNode[];
      
      for (const node of nodes) {
        // Check naming conventions
        const namingIssues = this.checkNamingConventions(node);
        findings.push(...namingIssues);
        
        // Check function complexity
        if (node.type === 'function') {
          const complexityIssues = this.checkFunctionComplexity(node);
          findings.push(...complexityIssues);
        }
        
        // Check code organization
        const organizationIssues = this.checkCodeOrganization(node);
        findings.push(...organizationIssues);
        
        // Check for code duplication signals
        const duplicationSignals = this.checkDuplicationSignals(node);
        findings.push(...duplicationSignals);
      }
      
      // Check file-level issues
      const fileIssues = this.checkFileOrganization(context.graph);
      findings.push(...fileIssues);
      
      return {
        success: true,
        findings,
        suggestions: this.generateCleanCodeSuggestions(findings),
        confidence: 0.9
      };
    } catch (error) {
      return {
        success: false,
        findings: [],
        suggestions: [`Failed to analyze clean code: ${error}`],
        confidence: 0
      };
    }
  }

  canHandle(context: any): boolean {
    return context.graph && context.graph.getStatistics().totalNodes > 0;
  }

  private checkNamingConventions(node: CodeNode): CodeIssue[] {
    const issues: CodeIssue[] = [];
    
    // Check variable/function naming
    if (node.type === 'function' || node.type === 'variable') {
      // Check for single letter names (except common ones like i, j in loops)
      if (node.name.length === 1 && !['i', 'j', 'k', 'x', 'y', 'z'].includes(node.name)) {
        issues.push({
          id: uuidv4(),
          type: 'poor-naming',
          severity: 'medium',
          file: node.filePath,
          line: node.startLine,
          description: `Single letter name '${node.name}' is not descriptive`,
          suggestion: 'Use descriptive names that explain the purpose'
        });
      }
      
      // Check for abbreviations
      const commonAbbreviations = ['temp', 'var', 'val', 'num', 'str', 'obj', 'arr'];
      if (commonAbbreviations.some(abbr => node.name.toLowerCase().startsWith(abbr))) {
        issues.push({
          id: uuidv4(),
          type: 'abbreviated-naming',
          severity: 'low',
          file: node.filePath,
          line: node.startLine,
          description: `Name '${node.name}' uses unclear abbreviation`,
          suggestion: 'Use full, descriptive words instead of abbreviations'
        });
      }
      
      // Check for misleading names
      if (node.type === 'function') {
        const isBooleanReturn = node.content.includes('return true') || node.content.includes('return false');
        const hasQuestionPrefix = node.name.startsWith('is') || node.name.startsWith('has') || 
                                 node.name.startsWith('can') || node.name.startsWith('should');
        
        if (isBooleanReturn && !hasQuestionPrefix && !node.name.includes('check')) {
          issues.push({
            id: uuidv4(),
            type: 'misleading-naming',
            severity: 'medium',
            file: node.filePath,
            line: node.startLine,
            description: `Boolean function '${node.name}' should start with is/has/can/should`,
            suggestion: 'Rename to indicate boolean return (e.g., isValid, hasPermission)'
          });
        }
      }
    }
    
    // Check class naming
    if (node.type === 'class') {
      if (!node.name.match(/^[A-Z]/)) {
        issues.push({
          id: uuidv4(),
          type: 'naming-convention',
          severity: 'medium',
          file: node.filePath,
          line: node.startLine,
          description: `Class name '${node.name}' should start with uppercase`,
          suggestion: 'Use PascalCase for class names'
        });
      }
      
      // Check for generic names
      const genericClassNames = ['Manager', 'Handler', 'Processor', 'Data', 'Info'];
      if (genericClassNames.includes(node.name)) {
        issues.push({
          id: uuidv4(),
          type: 'generic-naming',
          severity: 'low',
          file: node.filePath,
          line: node.startLine,
          description: `Class name '${node.name}' is too generic`,
          suggestion: 'Use more specific names that describe the class responsibility'
        });
      }
    }
    
    return issues;
  }

  private checkFunctionComplexity(node: CodeNode): CodeIssue[] {
    const issues: CodeIssue[] = [];
    
    // Check function length
    const lines = node.endLine - node.startLine + 1;
    if (lines > 30) {
      issues.push({
        id: uuidv4(),
        type: 'long-function',
        severity: lines > 50 ? 'high' : 'medium',
        file: node.filePath,
        line: node.startLine,
        description: `Function '${node.name}' is too long (${lines} lines)`,
        suggestion: 'Extract smaller functions to improve readability',
        autoFixAvailable: false
      });
    }
    
    // Check nesting depth
    let maxNesting = 0;
    let currentNesting = 0;
    const content = node.content;
    
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '{') {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (content[i] === '}') {
        currentNesting--;
      }
    }
    
    if (maxNesting > 4) {
      issues.push({
        id: uuidv4(),
        type: 'deep-nesting',
        severity: 'high',
        file: node.filePath,
        line: node.startLine,
        description: `Function '${node.name}' has deeply nested code (${maxNesting} levels)`,
        suggestion: 'Use early returns or extract nested logic into separate functions'
      });
    }
    
    // Check number of parameters
    const params = this.extractParameters(node.content);
    if (params.length > 3) {
      issues.push({
        id: uuidv4(),
        type: 'too-many-parameters',
        severity: params.length > 5 ? 'high' : 'medium',
        file: node.filePath,
        line: node.startLine,
        description: `Function '${node.name}' has too many parameters (${params.length})`,
        suggestion: 'Use parameter objects or builder pattern',
        autoFixAvailable: true
      });
    }
    
    // Check for flag arguments
    params.forEach((param: string) => {
      if (param.toLowerCase().includes('flag') || param.toLowerCase().includes('is')) {
        issues.push({
          id: uuidv4(),
          type: 'flag-argument',
          severity: 'medium',
          file: node.filePath,
          line: node.startLine,
          description: `Function '${node.name}' uses flag argument '${param}'`,
          suggestion: 'Split into separate functions instead of using boolean flags'
        });
      }
    });
    
    return issues;
  }

  private checkCodeOrganization(node: CodeNode): CodeIssue[] {
    const issues: CodeIssue[] = [];
    
    // Check for commented-out code
    const commentedCodePattern = /^\s*\/\/.*[;{}()]|\/\*[\s\S]*?\*\/.*[;{}()]/gm;
    const matches = node.content.match(commentedCodePattern);
    
    if (matches && matches.length > 2) {
      issues.push({
        id: uuidv4(),
        type: 'commented-code',
        severity: 'low',
        file: node.filePath,
        line: node.startLine,
        description: 'Contains commented-out code',
        suggestion: 'Remove commented code - use version control instead',
        autoFixAvailable: true
      });
    }
    
    // Check for TODO/FIXME comments
    const todoPattern = /\/\/\s*(TODO|FIXME|HACK|XXX|BUG)/gi;
    const todos = node.content.match(todoPattern);
    
    if (todos && todos.length > 0) {
      issues.push({
        id: uuidv4(),
        type: 'unresolved-todo',
        severity: 'low',
        file: node.filePath,
        line: node.startLine,
        description: `Contains ${todos.length} TODO/FIXME comments`,
        suggestion: 'Address TODOs or create tracking issues'
      });
    }
    
    // Check for inconsistent spacing/formatting
    const inconsistentSpacing = this.checkInconsistentSpacing(node.content);
    if (inconsistentSpacing) {
      issues.push({
        id: uuidv4(),
        type: 'inconsistent-formatting',
        severity: 'low',
        file: node.filePath,
        line: node.startLine,
        description: 'Inconsistent code formatting detected',
        suggestion: 'Use a code formatter like Prettier',
        autoFixAvailable: true
      });
    }
    
    return issues;
  }

  private checkDuplicationSignals(node: CodeNode): CodeIssue[] {
    const issues: CodeIssue[] = [];
    
    // Look for copy-paste indicators
    const lines = node.content.split('\n');
    const similarLines = new Map<string, number>();
    
    lines.forEach((line: string) => {
      const trimmed = line.trim();
      if (trimmed.length > 20 && !trimmed.startsWith('//') && !trimmed.startsWith('*')) {
        // Normalize the line for comparison
        const normalized = trimmed.replace(/['"`]/g, '').replace(/\d+/g, 'N');
        similarLines.set(normalized, (similarLines.get(normalized) || 0) + 1);
      }
    });
    
    // Check for repeated patterns
    const duplicates = Array.from(similarLines.entries())
      .filter(([_, count]: [string, number]) => count > 2)
      .map(([line, count]: [string, number]) => ({ line, count }));
    
    if (duplicates.length > 0) {
      issues.push({
        id: uuidv4(),
        type: 'possible-duplication',
        severity: 'medium',
        file: node.filePath,
        line: node.startLine,
        description: `Possible code duplication detected (${duplicates.length} repeated patterns)`,
        suggestion: 'Extract common logic into reusable functions'
      });
    }
    
    return issues;
  }

  private checkFileOrganization(graph: KnowledgeGraph): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const modules = graph.getNodesByType('module');
    
    // Group modules by directory
    const filesByDir = new Map<string, CodeNode[]>();
    modules.forEach((module: CodeNode) => {
      const dir = module.filePath.substring(0, module.filePath.lastIndexOf('/'));
      const files = filesByDir.get(dir) || [];
      files.push(module);
      filesByDir.set(dir, files);
    });
    
    // Check for inconsistent file organization
    filesByDir.forEach((files: CodeNode[], dir: string) => {
      // Check for mixed types in same directory
      const types = new Set<string>();
      files.forEach((file: CodeNode) => {
        if (file.filePath.includes('test') || file.filePath.includes('spec')) types.add('test');
        else if (file.filePath.includes('component')) types.add('component');
        else if (file.filePath.includes('service')) types.add('service');
        else if (file.filePath.includes('util')) types.add('util');
        else types.add('other');
      });
      
      if (types.size > 2 && !dir.includes('src')) {
        issues.push({
          id: uuidv4(),
          type: 'mixed-file-types',
          severity: 'low',
          file: dir,
          description: `Directory contains mixed file types`,
          suggestion: 'Organize files by type or feature for better structure'
        });
      }
      
      // Check for too many files in one directory
      if (files.length > 20) {
        issues.push({
          id: uuidv4(),
          type: 'crowded-directory',
          severity: 'medium',
          file: dir,
          description: `Directory contains too many files (${files.length})`,
          suggestion: 'Consider organizing into subdirectories'
        });
      }
    });
    
    return issues;
  }

  private extractParameters(functionContent: string): string[] {
    const match = functionContent.match(/\(([^)]*)\)/);
    if (!match) return [];
    
    return match[1]
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map((p: string) => p.split(/[:\s]/)[0]); // Get parameter name only
  }

  private checkInconsistentSpacing(content: string): boolean {
    // Simple check for inconsistent indentation
    const lines = content.split('\n');
    const indentations = new Set<number>();
    
    lines.forEach((line: string) => {
      if (line.trim().length > 0) {
        const indent = line.length - line.trimStart().length;
        if (indent > 0) {
          indentations.add(indent % 4); // Check if using consistent 2 or 4 spaces
        }
      }
    });
    
    return indentations.size > 1;
  }

  private generateCleanCodeSuggestions(issues: CodeIssue[]): string[] {
    const suggestions: string[] = [];
    
    if (issues.filter(i => i.type === 'long-function').length > 3) {
      suggestions.push('Consider adopting a maximum function length policy (e.g., 20-30 lines)');
    }
    
    if (issues.filter(i => i.type.includes('naming')).length > 5) {
      suggestions.push('Establish and document naming conventions for your team');
    }
    
    if (issues.filter(i => i.type === 'inconsistent-formatting').length > 0) {
      suggestions.push('Set up automatic code formatting with tools like Prettier or ESLint');
    }
    
    if (issues.filter(i => i.type === 'deep-nesting').length > 2) {
      suggestions.push('Refactor complex logic using early returns and guard clauses');
    }
    
    return suggestions;
  }
}