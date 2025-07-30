import { CodeNode, KnowledgeGraph, QualityMetrics, CodeSmell } from '@earth-agents/core';
import { CodeIssue } from '../Botbie';
import { v4 as uuidv4 } from 'uuid';

export class QualityAnalyzer {
  private knowledgeGraph: KnowledgeGraph;
  
  constructor(knowledgeGraph: KnowledgeGraph) {
    this.knowledgeGraph = knowledgeGraph;
  }
  
  async analyzeNode(node: CodeNode): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    
    // Calculate quality metrics
    const metrics = await this.calculateQualityMetrics(node);
    node.quality = metrics;
    
    // Check for code smells
    if (metrics.codeSmells.length > 0) {
      metrics.codeSmells.forEach((smell: CodeSmell) => {
        issues.push({
          id: uuidv4(),
          type: smell.type,
          severity: smell.severity,
          file: node.filePath,
          line: smell.line || node.startLine,
          description: smell.description,
          suggestion: smell.suggestion,
          autoFixAvailable: this.canAutoFix(smell.type)
        });
      });
    }
    
    // Check complexity
    if (metrics.complexity > 10) {
      issues.push({
        id: uuidv4(),
        type: 'high-complexity',
        severity: metrics.complexity > 20 ? 'high' : 'medium',
        file: node.filePath,
        line: node.startLine,
        description: `${node.type} '${node.name}' has high cyclomatic complexity (${metrics.complexity})`,
        suggestion: 'Consider breaking this into smaller, more focused functions',
        autoFixAvailable: false
      });
    }
    
    // Check function length
    const lineCount = node.endLine - node.startLine + 1;
    if (node.type === 'function' && lineCount > 50) {
      issues.push({
        id: uuidv4(),
        type: 'long-function',
        severity: lineCount > 100 ? 'high' : 'medium',
        file: node.filePath,
        line: node.startLine,
        description: `Function '${node.name}' is too long (${lineCount} lines)`,
        suggestion: 'Extract smaller functions to improve readability',
        autoFixAvailable: false
      });
    }
    
    // Check documentation
    if (metrics.documentationScore < 0.3) {
      issues.push({
        id: uuidv4(),
        type: 'missing-documentation',
        severity: 'low',
        file: node.filePath,
        line: node.startLine,
        description: `${node.type} '${node.name}' lacks proper documentation`,
        suggestion: 'Add JSDoc comments to describe purpose and parameters',
        autoFixAvailable: true
      });
    }
    
    return issues;
  }
  
  async findGlobalIssues(): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    
    // Check for circular dependencies
    const circularDeps = this.findCircularDependencies();
    circularDeps.forEach((cycle: string[]) => {
      issues.push({
        id: uuidv4(),
        type: 'circular-dependency',
        severity: 'critical',
        file: cycle[0],
        description: `Circular dependency detected: ${cycle.join(' → ')} → ${cycle[0]}`,
        suggestion: 'Refactor to remove circular dependencies, consider using dependency injection',
        autoFixAvailable: false
      });
    });
    
    // Check for god classes
    const godClasses = this.findGodClasses();
    godClasses.forEach(({ node, methodCount }: { node: CodeNode; methodCount: number }) => {
      issues.push({
        id: uuidv4(),
        type: 'god-class',
        severity: 'high',
        file: node.filePath,
        line: node.startLine,
        description: `Class '${node.name}' has too many responsibilities (${methodCount} methods)`,
        suggestion: 'Apply Single Responsibility Principle - split into multiple focused classes',
        autoFixAvailable: false
      });
    });
    
    // Check for duplicate code
    const duplicates = this.findDuplicateCode();
    duplicates.forEach((dup: { file1: string; line1: number; file2: string; line2: number }) => {
      issues.push({
        id: uuidv4(),
        type: 'duplicate-code',
        severity: 'medium',
        file: dup.file1,
        line: dup.line1,
        description: `Duplicate code found in ${dup.file1} and ${dup.file2}`,
        suggestion: 'Extract common functionality into a shared utility',
        autoFixAvailable: false
      });
    });
    
    // Check for unused code
    const unusedCode = this.findUnusedCode();
    unusedCode.forEach((node: CodeNode) => {
      issues.push({
        id: uuidv4(),
        type: 'unused-code',
        severity: 'low',
        file: node.filePath,
        line: node.startLine,
        description: `${node.type} '${node.name}' appears to be unused`,
        suggestion: 'Remove unused code to improve maintainability',
        autoFixAvailable: true
      });
    });
    
    return issues;
  }
  
  private async calculateQualityMetrics(node: CodeNode): Promise<QualityMetrics> {
    const smells: CodeSmell[] = [];
    
    // Simple heuristics for now
    const lines = node.content.split('\n');
    const linesOfCode = lines.filter(l => l.trim().length > 0).length;
    
    // Calculate cyclomatic complexity (simplified)
    let complexity = 1;
    const complexityKeywords = ['if', 'else', 'for', 'while', 'case', 'catch'];
    const specialPatterns = ['&&', '||', '\\?'];
    
    complexityKeywords.forEach((keyword: string) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      complexity += (node.content.match(regex) || []).length;
    });
    
    specialPatterns.forEach((pattern: string) => {
      const regex = new RegExp(pattern, 'g');
      complexity += (node.content.match(regex) || []).length;
    });
    
    // Calculate documentation score
    const hasJSDoc = node.content.includes('/**');
    const hasComments = node.content.includes('//') || node.content.includes('/*');
    const documentationScore = hasJSDoc ? 1 : (hasComments ? 0.5 : 0);
    
    // Detect common code smells
    if (node.type === 'function') {
      // Check parameter count
      const params = this.extractParameters(node.content);
      if (params.length > 5) {
        smells.push({
          type: 'too-many-parameters',
          severity: params.length > 8 ? 'high' : 'medium',
          description: `Function has ${params.length} parameters`,
          suggestion: 'Consider using an options object or builder pattern'
        });
      }
      
      // Check for nested callbacks (callback hell)
      const callbackDepth = this.calculateCallbackDepth(node.content);
      if (callbackDepth > 3) {
        smells.push({
          type: 'callback-hell',
          severity: 'high',
          description: 'Deeply nested callbacks detected',
          suggestion: 'Use async/await or Promises to flatten the structure'
        });
      }
    }
    
    // Check for magic numbers
    const magicNumbers = this.findMagicNumbers(node.content);
    if (magicNumbers.length > 3) {
      smells.push({
        type: 'magic-numbers',
        severity: 'low',
        description: `Found ${magicNumbers.length} magic numbers`,
        suggestion: 'Extract magic numbers to named constants'
      });
    }
    
    // Calculate maintainability index (simplified Microsoft formula)
    const volume = Math.log2(linesOfCode + 1) * complexity;
    const maintainability = Math.max(0, 171 - 5.2 * Math.log(volume) - 0.23 * complexity - 16.2 * Math.log(linesOfCode));
    
    return {
      complexity,
      maintainability: Math.round(maintainability),
      testCoverage: 0, // Would need integration with coverage tools
      documentationScore,
      linesOfCode,
      codeSmells: smells
    };
  }
  
  private findCircularDependencies(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];
    
    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      const node = this.knowledgeGraph.getNode(nodeId);
      if (node) path.push(node.filePath);
      
      const dependencies = this.knowledgeGraph.getDependencies(nodeId);
      for (const dep of dependencies) {
        if (!visited.has(dep.id)) {
          if (hasCycle(dep.id)) return true;
        } else if (recursionStack.has(dep.id)) {
          // Found cycle
          const cycleStart = path.indexOf(dep.filePath);
          if (cycleStart !== -1) {
            cycles.push(path.slice(cycleStart));
          }
          return true;
        }
      }
      
      recursionStack.delete(nodeId);
      path.pop();
      return false;
    };
    
    // Check each module for cycles
    const modules = this.knowledgeGraph.getNodesByType('module');
    modules.forEach((module: CodeNode) => {
      if (!visited.has(module.id)) {
        hasCycle(module.id);
      }
    });
    
    return cycles;
  }
  
  private findGodClasses(): Array<{ node: CodeNode; methodCount: number }> {
    const godClasses: Array<{ node: CodeNode; methodCount: number }> = [];
    const classes = this.knowledgeGraph.getNodesByType('class');
    
    classes.forEach((classNode: CodeNode) => {
      const methods = this.knowledgeGraph.getRelatedNodes(classNode.id, 'defines')
        .filter((n: CodeNode) => n.type === 'function');
      
      if (methods.length > 20) {
        godClasses.push({ node: classNode, methodCount: methods.length });
      }
    });
    
    return godClasses;
  }
  
  private findDuplicateCode(): Array<{ file1: string; line1: number; file2: string; line2: number }> {
    // Simplified duplicate detection - in production, use more sophisticated algorithms
    const duplicates: Array<{ file1: string; line1: number; file2: string; line2: number }> = [];
    const functionNodes = this.knowledgeGraph.getNodesByType('function');
    
    // Compare function signatures and first few lines
    for (let i = 0; i < functionNodes.length; i++) {
      for (let j = i + 1; j < functionNodes.length; j++) {
        const similarity = this.calculateSimilarity(
          functionNodes[i].content,
          functionNodes[j].content
        );
        
        if (similarity > 0.8) {
          duplicates.push({
            file1: functionNodes[i].filePath,
            line1: functionNodes[i].startLine,
            file2: functionNodes[j].filePath,
            line2: functionNodes[j].startLine
          });
        }
      }
    }
    
    return duplicates;
  }
  
  private findUnusedCode(): CodeNode[] {
    const unused: CodeNode[] = [];
    const allNodes = Array.from(this.knowledgeGraph['graph'].nodes.values()) as CodeNode[];
    
    allNodes.forEach((node: CodeNode) => {
      if (node.type === 'function' || node.type === 'class') {
        // Check if anything references this node
        const references = this.knowledgeGraph['graph'].edges
          .filter((e: any) => e.targetId === node.id && e.type !== 'defines')
          .length;
        
        // Exclude exported/public members (simplified check)
        const isExported = node.content.includes('export') || 
                          node.content.includes('public') ||
                          node.name.startsWith('_') === false;
        
        if (references === 0 && !isExported) {
          unused.push(node);
        }
      }
    });
    
    return unused;
  }
  
  private extractParameters(functionContent: string): string[] {
    const match = functionContent.match(/\(([^)]*)\)/);
    if (!match) return [];
    
    return match[1]
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }
  
  private calculateCallbackDepth(content: string): number {
    let maxDepth = 0;
    let currentDepth = 0;
    
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '{') currentDepth++;
      if (content[i] === '}') currentDepth--;
      maxDepth = Math.max(maxDepth, currentDepth);
    }
    
    return Math.floor(maxDepth / 2); // Rough estimate
  }
  
  private findMagicNumbers(content: string): string[] {
    const magicNumberRegex = /\b\d+\b/g;
    const matches = content.match(magicNumberRegex) || [];
    
    return matches.filter((num: string) => {
      const n = parseInt(num);
      // Exclude common non-magic numbers
      return n !== 0 && n !== 1 && n !== -1 && n !== 2;
    });
  }
  
  private calculateSimilarity(str1: string, str2: string): number {
    // Simple Jaccard similarity
    const tokens1 = new Set(str1.split(/\s+/));
    const tokens2 = new Set(str2.split(/\s+/));
    
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    
    return intersection.size / union.size;
  }
  
  private canAutoFix(issueType: string): boolean {
    const autoFixableTypes = [
      'missing-documentation',
      'unused-code',
      'missing-semicolon',
      'inconsistent-naming',
      'unused-import'
    ];
    
    return autoFixableTypes.includes(issueType);
  }
}