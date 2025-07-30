import { Strategy, StrategyResult, CodeNode, KnowledgeGraph } from '@earth-agents/core';
import { CodeIssue, Suggestion } from '../Botbie';
import { v4 as uuidv4 } from 'uuid';

export class ArchitectureArcheologist implements Strategy {
  name = 'ArchitectureArcheologist';
  description = 'Analyzes project architecture and identifies structural issues';

  async execute(context: { graph: KnowledgeGraph; config?: any }): Promise<StrategyResult> {
    const findings: CodeIssue[] = [];
    const suggestions: Suggestion[] = [];
    
    try {
      // Analyze module dependencies
      const moduleIssues = await this.analyzeModuleDependencies(context.graph);
      findings.push(...moduleIssues);
      
      // Check for layering violations
      const layerViolations = await this.checkLayeringViolations(context.graph);
      findings.push(...layerViolations);
      
      // Analyze coupling and cohesion
      const couplingIssues = await this.analyzeCoupling(context.graph);
      findings.push(...couplingIssues);
      
      // Check SOLID principles
      const solidViolations = await this.checkSOLIDPrinciples(context.graph);
      findings.push(...solidViolations);
      
      // Generate architecture suggestions
      const archSuggestions = await this.generateArchitectureSuggestions(context.graph, findings);
      suggestions.push(...archSuggestions);
      
      return {
        success: true,
        findings,
        suggestions: suggestions.map(s => s.description),
        confidence: 0.85
      };
    } catch (error) {
      return {
        success: false,
        findings: [],
        suggestions: [`Failed to analyze architecture: ${error}`],
        confidence: 0
      };
    }
  }

  canHandle(context: any): boolean {
    return context.graph && context.graph.getStatistics().totalNodes > 0;
  }

  private async analyzeModuleDependencies(graph: KnowledgeGraph): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    const modules = graph.getNodesByType('module');
    
    // Build dependency map
    const dependencyMap = new Map<string, Set<string>>();
    
    modules.forEach((module: CodeNode) => {
      const deps = graph.getDependencies(module.id);
      dependencyMap.set(module.id, new Set(deps.map((d: CodeNode) => d.id)));
    });
    
    // Check for circular dependencies at module level
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (nodeId: string, path: string[] = []): string[] | null => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);
      
      const deps = dependencyMap.get(nodeId) || new Set();
      for (const depId of deps) {
        if (!visited.has(depId)) {
          const cyclePath = hasCycle(depId, [...path]);
          if (cyclePath) return cyclePath;
        } else if (recursionStack.has(depId)) {
          const cycleStart = path.indexOf(depId);
          return path.slice(cycleStart);
        }
      }
      
      recursionStack.delete(nodeId);
      return null;
    };
    
    // Check each module for cycles
    modules.forEach((module: CodeNode) => {
      if (!visited.has(module.id)) {
        const cyclePath = hasCycle(module.id);
        if (cyclePath) {
          const moduleNames = cyclePath.map((id: string) => {
            const node = graph.getNode(id);
            return node ? node.name : 'unknown';
          });
          
          issues.push({
            id: uuidv4(),
            type: 'circular-dependency',
            severity: 'critical',
            file: module.filePath,
            description: `Circular dependency detected: ${moduleNames.join(' → ')} → ${moduleNames[0]}`,
            suggestion: 'Break the cycle by introducing an interface or moving shared code to a common module'
          });
        }
      }
    });
    
    // Check for too many dependencies
    modules.forEach((module: CodeNode) => {
      const deps = dependencyMap.get(module.id) || new Set();
      if (deps.size > 10) {
        issues.push({
          id: uuidv4(),
          type: 'high-coupling',
          severity: 'high',
          file: module.filePath,
          description: `Module '${module.name}' has too many dependencies (${deps.size})`,
          suggestion: 'Consider splitting this module or reducing its dependencies'
        });
      }
    });
    
    return issues;
  }

  private async checkLayeringViolations(graph: KnowledgeGraph): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    const modules = graph.getNodesByType('module');
    
    // Define common architectural layers
    const layers = {
      'presentation': ['ui', 'view', 'component', 'page'],
      'business': ['service', 'usecase', 'business', 'domain'],
      'data': ['repository', 'dao', 'model', 'entity'],
      'infrastructure': ['config', 'util', 'helper', 'lib']
    };
    
    const getLayer = (modulePath: string): string | null => {
      const lowerPath = modulePath.toLowerCase();
      for (const [layer, patterns] of Object.entries(layers)) {
        if (patterns.some(pattern => lowerPath.includes(pattern))) {
          return layer;
        }
      }
      return null;
    };
    
    // Check for violations (e.g., data layer depending on presentation)
    const layerHierarchy = ['infrastructure', 'data', 'business', 'presentation'];
    
    modules.forEach((module: CodeNode) => {
      const moduleLayer = getLayer(module.filePath);
      if (!moduleLayer) return;
      
      const deps = graph.getDependencies(module.id);
      deps.forEach((dep: CodeNode) => {
        const depLayer = getLayer(dep.filePath);
        if (!depLayer) return;
        
        const moduleIndex = layerHierarchy.indexOf(moduleLayer);
        const depIndex = layerHierarchy.indexOf(depLayer);
        
        if (moduleIndex < depIndex) {
          issues.push({
            id: uuidv4(),
            type: 'layer-violation',
            severity: 'high',
            file: module.filePath,
            description: `Layer violation: ${moduleLayer} layer depends on ${depLayer} layer`,
            suggestion: `Reverse the dependency or move the code to the appropriate layer`
          });
        }
      });
    });
    
    return issues;
  }

  private async analyzeCoupling(graph: KnowledgeGraph): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    const nodes = Array.from(graph['graph'].nodes.values()) as CodeNode[];
    
    // Calculate afferent and efferent coupling
    nodes.forEach((node: CodeNode) => {
      if (node.type === 'class' || node.type === 'module') {
        const efferent = graph.getDependencies(node.id).length; // What this depends on
        const afferent = graph.getDependents(node.id).length;   // What depends on this
        
        // Check for high efferent coupling (depends on too many things)
        if (efferent > 7) {
          issues.push({
            id: uuidv4(),
            type: 'high-efferent-coupling',
            severity: 'medium',
            file: node.filePath,
            line: node.startLine,
            description: `${node.type} '${node.name}' depends on too many other components (${efferent})`,
            suggestion: 'Apply Dependency Inversion Principle or use dependency injection'
          });
        }
        
        // Check for inappropriate afferent coupling
        if (node.type === 'class' && afferent > 10) {
          issues.push({
            id: uuidv4(),
            type: 'high-afferent-coupling',
            severity: 'medium',
            file: node.filePath,
            line: node.startLine,
            description: `${node.type} '${node.name}' is depended upon by too many components (${afferent})`,
            suggestion: 'Consider if this class has too many responsibilities'
          });
        }
      }
    });
    
    return issues;
  }

  private async checkSOLIDPrinciples(graph: KnowledgeGraph): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    const classes = graph.getNodesByType('class');
    
    classes.forEach((classNode: CodeNode) => {
      // Single Responsibility Principle
      const methods = graph.getRelatedNodes(classNode.id, 'defines')
        .filter((n: CodeNode) => n.type === 'function');
      
      if (methods.length > 10) {
        // Analyze method names for different responsibilities
        const responsibilities = new Set<string>();
        methods.forEach((method: CodeNode) => {
          const words = method.name.toLowerCase().split(/(?=[A-Z])|_/);
          if (words[0]) responsibilities.add(words[0]);
        });
        
        if (responsibilities.size > 3) {
          issues.push({
            id: uuidv4(),
            type: 'srp-violation',
            severity: 'high',
            file: classNode.filePath,
            line: classNode.startLine,
            description: `Class '${classNode.name}' appears to have multiple responsibilities`,
            suggestion: 'Split this class into smaller, focused classes with single responsibilities'
          });
        }
      }
      
      // Interface Segregation Principle (simplified check)
      const implementsMatches = classNode.content.match(/implements\s+(\w+)/g);
      if (implementsMatches && implementsMatches.length > 3) {
        issues.push({
          id: uuidv4(),
          type: 'isp-violation',
          severity: 'medium',
          file: classNode.filePath,
          line: classNode.startLine,
          description: `Class '${classNode.name}' implements too many interfaces`,
          suggestion: 'Consider if all interfaces are necessary or if they can be segregated'
        });
      }
    });
    
    return issues;
  }

  private async generateArchitectureSuggestions(
    graph: KnowledgeGraph,
    issues: CodeIssue[]
  ): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];
    const stats = graph.getStatistics();
    
    // Suggest modularization
    if (stats.totalNodes > 500 && stats.nodesByType['module'] < 10) {
      suggestions.push({
        type: 'architecture',
        description: 'Consider breaking down your codebase into more modules for better organization',
        impact: 'high',
        effort: 'high'
      });
    }
    
    // Suggest dependency injection
    const couplingIssues = issues.filter(i => i.type.includes('coupling'));
    if (couplingIssues.length > 5) {
      suggestions.push({
        type: 'architecture',
        description: 'Implement dependency injection to reduce coupling between components',
        impact: 'high',
        effort: 'medium'
      });
    }
    
    // Suggest layer architecture
    const layerViolations = issues.filter(i => i.type === 'layer-violation');
    if (layerViolations.length > 0) {
      suggestions.push({
        type: 'architecture',
        description: 'Enforce a clear layered architecture (presentation → business → data → infrastructure)',
        impact: 'high',
        effort: 'high'
      });
    }
    
    // Suggest design patterns
    const godClasses = (Array.from(graph['graph'].nodes.values()) as CodeNode[])
      .filter((n: CodeNode) => n.type === 'class')
      .filter((n: CodeNode) => {
        const methods = graph.getRelatedNodes(n.id, 'defines')
          .filter((m: CodeNode) => m.type === 'function');
        return methods.length > 20;
      });
    
    if (godClasses.length > 0) {
      suggestions.push({
        type: 'architecture',
        description: 'Apply design patterns like Strategy, Factory, or Observer to break down large classes',
        impact: 'high',
        effort: 'medium'
      });
    }
    
    return suggestions;
  }
}