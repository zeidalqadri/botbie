import { Strategy, StrategyResult, CodeNode, KnowledgeGraph } from '@earth-agents/core';
import { CodeIssue } from '../Botbie';
import { v4 as uuidv4 } from 'uuid';

export class PerformanceOptimizer implements Strategy {
  name = 'PerformanceOptimizer';
  description = 'Detects performance bottlenecks and suggests optimizations';

  async execute(context: { graph: KnowledgeGraph; config?: any }): Promise<StrategyResult> {
    const findings: CodeIssue[] = [];

    try {
      const nodes = Array.from(context.graph['graph'].nodes.values()) as CodeNode[];

      for (const node of nodes) {
        // Check for inefficient loops
        const loopIssues = this.checkInefficientLoops(node);
        findings.push(...loopIssues);

        // Check for memory leaks
        const memoryIssues = this.checkMemoryLeaks(node);
        findings.push(...memoryIssues);

        // Check for inefficient algorithms
        const algorithmIssues = this.checkInefficientAlgorithms(node);
        findings.push(...algorithmIssues);

        // Check for blocking operations
        const blockingIssues = this.checkBlockingOperations(node);
        findings.push(...blockingIssues);

        // Check for unnecessary computations
        const computationIssues = this.checkUnnecessaryComputations(node);
        findings.push(...computationIssues);

        // Check React-specific performance issues
        if (this.isReactFile(node.filePath)) {
          const reactIssues = this.checkReactPerformance(node);
          findings.push(...reactIssues);
        }
      }

      // Check for bundle size issues
      const bundleIssues = this.checkBundleSize(context.graph);
      findings.push(...bundleIssues);

      return {
        success: true,
        findings,
        suggestions: this.generatePerformanceSuggestions(findings),
        confidence: 0.85
      };
    } catch (error) {
      return {
        success: false,
        findings: [],
        suggestions: [`Failed to analyze performance: ${error}`],
        confidence: 0
      };
    }
  }

  canHandle(context: any): boolean {
    return context.graph && context.graph.getStatistics().totalNodes > 0;
  }

  private checkInefficientLoops(node: CodeNode): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Check for nested loops with array methods
    const nestedLoopPattern = /for\s*\([^)]+\)\s*{[^}]*\.(forEach|map|filter|find|reduce)\s*\(/gs;
    const nestedLoops = node.content.match(nestedLoopPattern);

    if (nestedLoops) {
      issues.push({
        id: uuidv4(),
        type: 'nested-loops',
        severity: 'high',
        file: node.filePath,
        line: node.startLine,
        description: 'Nested loops detected - potential O(n²) complexity',
        suggestion: 'Consider using Map/Set for lookups or optimizing the algorithm'
      });
    }

    // Check for array operations inside loops
    const loopArrayOpsPattern = /for\s*\([^)]+\)\s*{[^}]*\.(push|unshift|splice)\s*\(/gs;
    const loopArrayOps = node.content.match(loopArrayOpsPattern);

    if (loopArrayOps) {
      issues.push({
        id: uuidv4(),
        type: 'array-mutation-in-loop',
        severity: 'medium',
        file: node.filePath,
        line: node.startLine,
        description: 'Array mutations inside loop can be inefficient',
        suggestion: 'Build a new array instead of mutating in loop, or use appropriate data structure'
      });
    }

    // Check for repeated DOM queries in loops
    const domInLoopPattern = /(for|while|forEach|map)\s*\([^)]*\)\s*{[^}]*(querySelector|getElementById|getElementsBy)/gs;
    const domInLoop = node.content.match(domInLoopPattern);

    if (domInLoop) {
      issues.push({
        id: uuidv4(),
        type: 'dom-query-in-loop',
        severity: 'high',
        file: node.filePath,
        line: node.startLine,
        description: 'DOM queries inside loops are expensive',
        suggestion: 'Cache DOM queries outside the loop'
      });
    }

    // Check for indexOf inside loops (could use Set)
    const indexOfInLoopPattern = /(for|while|forEach|map)\s*\([^)]*\)\s*{[^}]*\.indexOf\s*\(/gs;
    const indexOfInLoop = node.content.match(indexOfInLoopPattern);

    if (indexOfInLoop) {
      issues.push({
        id: uuidv4(),
        type: 'inefficient-lookup',
        severity: 'medium',
        file: node.filePath,
        line: node.startLine,
        description: 'Using indexOf inside loop - O(n) lookup',
        suggestion: 'Use Set or Map for O(1) lookups'
      });
    }

    return issues;
  }

  private checkMemoryLeaks(node: CodeNode): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Check for event listeners without cleanup
    const addListenerPattern = /addEventListener\s*\([^)]+\)/g;
    const removeListenerPattern = /removeEventListener\s*\([^)]+\)/g;
    
    const addListeners = node.content.match(addListenerPattern) || [];
    const removeListeners = node.content.match(removeListenerPattern) || [];

    if (addListeners.length > removeListeners.length && node.type === 'class') {
      issues.push({
        id: uuidv4(),
        type: 'potential-memory-leak',
        severity: 'high',
        file: node.filePath,
        line: node.startLine,
        description: 'Event listeners added without corresponding cleanup',
        suggestion: 'Remove event listeners in cleanup/unmount methods'
      });
    }

    // Check for setInterval without clearInterval
    const setIntervalPattern = /setInterval\s*\(/g;
    const clearIntervalPattern = /clearInterval\s*\(/g;
    
    const setIntervals = node.content.match(setIntervalPattern) || [];
    const clearIntervals = node.content.match(clearIntervalPattern) || [];

    if (setIntervals.length > clearIntervals.length) {
      issues.push({
        id: uuidv4(),
        type: 'uncleaned-interval',
        severity: 'high',
        file: node.filePath,
        line: node.startLine,
        description: 'setInterval without corresponding clearInterval',
        suggestion: 'Clear intervals in cleanup methods to prevent memory leaks'
      });
    }

    // Check for large object retention
    const closurePattern = /function\s*\([^)]*\)\s*{[^}]*}\s*\)/;
    const largeClosure = node.content.match(closurePattern);
    
    if (largeClosure && node.content.length > 5000) {
      issues.push({
        id: uuidv4(),
        type: 'large-closure',
        severity: 'medium',
        file: node.filePath,
        line: node.startLine,
        description: 'Large closure may retain unnecessary memory',
        suggestion: 'Minimize closure scope and nullify references when done'
      });
    }

    return issues;
  }

  private checkInefficientAlgorithms(node: CodeNode): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Check for array includes/indexOf with large datasets
    const arraySearchPattern = /\.(includes|indexOf)\s*\([^)]+\)/g;
    const arraySearches = node.content.match(arraySearchPattern) || [];
    
    if (arraySearches.length > 3) {
      issues.push({
        id: uuidv4(),
        type: 'inefficient-search',
        severity: 'medium',
        file: node.filePath,
        line: node.startLine,
        description: 'Multiple array searches - consider using Set for lookups',
        suggestion: 'Convert array to Set for O(1) lookup performance'
      });
    }

    // Check for repeated string concatenation in loops
    const stringConcatInLoopPattern = /(for|while)\s*\([^)]+\)\s*{[^}]*(str|string|text)\s*\+=/gs;
    const stringConcatInLoop = node.content.match(stringConcatInLoopPattern);

    if (stringConcatInLoop) {
      issues.push({
        id: uuidv4(),
        type: 'string-concat-in-loop',
        severity: 'medium',
        file: node.filePath,
        line: node.startLine,
        description: 'String concatenation in loop is inefficient',
        suggestion: 'Use array.join() or template literals for better performance'
      });
    }

    // Check for multiple array operations that could be combined
    const chainedArrayOps = /\.(filter|map|reduce)\s*\([^)]+\)\s*\.(filter|map|reduce)/g;
    const chainedOps = node.content.match(chainedArrayOps) || [];

    if (chainedOps.length > 2) {
      issues.push({
        id: uuidv4(),
        type: 'multiple-array-iterations',
        severity: 'medium',
        file: node.filePath,
        line: node.startLine,
        description: 'Multiple array iterations could be combined',
        suggestion: 'Combine array operations into single iteration for better performance'
      });
    }

    // Check for sorting inside render methods
    if (node.name && node.name.includes('render')) {
      const sortPattern = /\.sort\s*\(/g;
      if (sortPattern.test(node.content)) {
        issues.push({
          id: uuidv4(),
          type: 'sort-in-render',
          severity: 'high',
          file: node.filePath,
          line: node.startLine,
          description: 'Sorting inside render method causes unnecessary re-computations',
          suggestion: 'Memoize sorted results or sort in state/props'
        });
      }
    }

    return issues;
  }

  private checkBlockingOperations(node: CodeNode): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Check for synchronous file operations
    const syncOpsPattern = /\.(readFileSync|writeFileSync|existsSync|mkdirSync|readdirSync)\s*\(/g;
    const syncOps = node.content.match(syncOpsPattern);

    if (syncOps) {
      issues.push({
        id: uuidv4(),
        type: 'blocking-io',
        severity: 'high',
        file: node.filePath,
        line: node.startLine,
        description: 'Synchronous I/O operations block the event loop',
        suggestion: 'Use async versions of file system operations'
      });
    }

    // Check for large synchronous JSON operations
    const largeJsonPattern = /JSON\.(parse|stringify)\s*\([^)]{200,}\)/g;
    const largeJson = node.content.match(largeJsonPattern);

    if (largeJson) {
      issues.push({
        id: uuidv4(),
        type: 'large-json-operation',
        severity: 'medium',
        file: node.filePath,
        line: node.startLine,
        description: 'Large JSON operations can block the event loop',
        suggestion: 'Consider streaming JSON parsing or moving to worker thread'
      });
    }

    // Check for long-running loops
    const whileTrue = /while\s*\(\s*true\s*\)/g;
    if (whileTrue.test(node.content)) {
      issues.push({
        id: uuidv4(),
        type: 'infinite-loop-risk',
        severity: 'critical',
        file: node.filePath,
        line: node.startLine,
        description: 'Potential infinite loop detected',
        suggestion: 'Add proper exit conditions or use async patterns'
      });
    }

    return issues;
  }

  private checkUnnecessaryComputations(node: CodeNode): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Check for repeated calculations
    const functionCalls = this.extractFunctionCalls(node.content);
    const callCounts = new Map<string, number>();
    
    functionCalls.forEach((call: string) => {
      callCounts.set(call, (callCounts.get(call) || 0) + 1);
    });

    callCounts.forEach((count: number, call: string) => {
      if (count > 3 && !this.isCheapOperation(call)) {
        issues.push({
          id: uuidv4(),
          type: 'repeated-computation',
          severity: 'medium',
          file: node.filePath,
          line: node.startLine,
          description: `Function '${call}' called ${count} times - consider caching`,
          suggestion: 'Memoize expensive computations or cache results'
        });
      }
    });

    // Check for unnecessary object creation
    const objectCreationInLoop = /(for|while|map|forEach)\s*\([^)]+\)\s*{[^}]*new\s+\w+\s*\(/gs;
    if (objectCreationInLoop.test(node.content)) {
      issues.push({
        id: uuidv4(),
        type: 'object-creation-in-loop',
        severity: 'medium',
        file: node.filePath,
        line: node.startLine,
        description: 'Creating objects inside loops can impact performance',
        suggestion: 'Consider object pooling or creating objects outside loops'
      });
    }

    return issues;
  }

  private checkReactPerformance(node: CodeNode): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Check for missing React.memo
    if (node.type === 'function' && node.content.includes('props') && !node.content.includes('memo')) {
      const renderCount = (node.content.match(/props\./g) || []).length;
      if (renderCount > 3) {
        issues.push({
          id: uuidv4(),
          type: 'missing-memo',
          severity: 'medium',
          file: node.filePath,
          line: node.startLine,
          description: 'Component with multiple props could benefit from React.memo',
          suggestion: 'Wrap component with React.memo to prevent unnecessary re-renders'
        });
      }
    }

    // Check for inline functions in render
    const inlineFunctionPattern = /(?:onClick|onChange|onSubmit)\s*=\s*\{(?:\s*\(\s*\)\s*=>|\s*function)/g;
    const inlineFunctions = node.content.match(inlineFunctionPattern);

    if (inlineFunctions && inlineFunctions.length > 2) {
      issues.push({
        id: uuidv4(),
        type: 'inline-functions',
        severity: 'medium',
        file: node.filePath,
        line: node.startLine,
        description: 'Inline functions in render cause unnecessary re-renders',
        suggestion: 'Use useCallback for event handlers or define outside render'
      });
    }

    // Check for missing keys in lists
    const mapWithoutKey = /\.map\s*\([^)]+\)\s*=>\s*[^}]+(?!key\s*=)/g;
    if (mapWithoutKey.test(node.content)) {
      issues.push({
        id: uuidv4(),
        type: 'missing-key',
        severity: 'high',
        file: node.filePath,
        line: node.startLine,
        description: 'List items missing key prop affects reconciliation performance',
        suggestion: 'Add unique key prop to list items'
      });
    }

    // Check for large component
    if (node.endLine - node.startLine > 200) {
      issues.push({
        id: uuidv4(),
        type: 'large-component',
        severity: 'medium',
        file: node.filePath,
        line: node.startLine,
        description: 'Large component may have performance issues',
        suggestion: 'Split into smaller components for better performance and code reuse'
      });
    }

    return issues;
  }

  private checkBundleSize(graph: KnowledgeGraph): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const imports = new Map<string, number>();

    // Count imports
    const nodes = Array.from(graph['graph'].nodes.values()) as CodeNode[];
    nodes.forEach((node: CodeNode) => {
      const importMatches = node.content.match(/import\s+.*from\s+['"]([^'"]+)['"]/g) || [];
      importMatches.forEach((match: string) => {
        const module = match.match(/from\s+['"]([^'"]+)['"]/)?.[1];
        if (module && !module.startsWith('.')) {
          imports.set(module, (imports.get(module) || 0) + 1);
        }
      });
    });

    // Check for large libraries
    const largeLibraries = ['lodash', 'moment', 'jquery'];
    imports.forEach((count: number, module: string) => {
      if (largeLibraries.some((lib: string) => module.includes(lib))) {
        issues.push({
          id: uuidv4(),
          type: 'large-import',
          severity: 'medium',
          file: 'package.json',
          description: `Large library '${module}' imported - impacts bundle size`,
          suggestion: `Consider lighter alternatives or import specific functions`
        });
      }
    });

    return issues;
  }

  private isReactFile(filePath: string): boolean {
    return filePath.endsWith('.jsx') || filePath.endsWith('.tsx');
  }

  private extractFunctionCalls(content: string): string[] {
    const functionCallPattern = /(\w+)\s*\(/g;
    const matches = content.match(functionCallPattern) || [];
    return matches.map((m: string) => m.replace('(', '').trim());
  }

  private isCheapOperation(functionName: string): boolean {
    const cheapOps = ['console', 'log', 'push', 'pop', 'shift', 'length'];
    return cheapOps.some(op => functionName.includes(op));
  }

  private generatePerformanceSuggestions(issues: CodeIssue[]): string[] {
    const suggestions: string[] = [];

    if (issues.filter(i => i.type === 'nested-loops').length > 0) {
      suggestions.push('Consider using more efficient data structures like Map or Set for lookups');
    }

    if (issues.filter(i => i.type.includes('memory')).length > 0) {
      suggestions.push('Implement proper cleanup in componentWillUnmount or useEffect cleanup');
    }

    if (issues.filter(i => i.type === 'blocking-io').length > 0) {
      suggestions.push('Use async/await patterns and non-blocking I/O operations');
    }

    if (issues.filter(i => i.type.includes('react')).length > 0) {
      suggestions.push('Use React DevTools Profiler to identify performance bottlenecks');
      suggestions.push('Consider implementing React.lazy for code splitting');
    }

    if (issues.filter(i => i.severity === 'high').length > 3) {
      suggestions.push('Run performance profiling to identify actual bottlenecks');
    }

    return suggestions;
  }
}