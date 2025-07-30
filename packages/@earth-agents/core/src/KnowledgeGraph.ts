import { CodeNode, CodeGraph, Relationship, QualityMetrics, CodeSmell } from './types';
import { logger } from './utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class KnowledgeGraph {
  private graph: CodeGraph;
  
  constructor() {
    this.graph = {
      nodes: new Map(),
      edges: [],
      metadata: {
        totalFiles: 0,
        languages: [],
        createdAt: new Date(),
        version: '1.0.0'
      }
    };
  }
  
  // Add a node to the graph
  addNode(node: CodeNode): void {
    this.graph.nodes.set(node.id, node);
    
    // Update metadata
    if (!this.graph.metadata.languages.includes(node.language)) {
      this.graph.metadata.languages.push(node.language);
    }
    
    logger.debug(`Added node: ${node.type} ${node.name} (${node.id})`);
  }
  
  // Add a relationship between nodes
  addRelationship(relationship: Relationship): void {
    // Validate nodes exist
    if (!this.graph.nodes.has(relationship.sourceId) || !this.graph.nodes.has(relationship.targetId)) {
      logger.warn(`Skipping relationship: nodes not found`);
      return;
    }
    
    this.graph.edges.push(relationship);
    
    // Update node relationships
    const sourceNode = this.graph.nodes.get(relationship.sourceId)!;
    sourceNode.relationships.push(relationship);
    
    logger.debug(`Added relationship: ${relationship.type} from ${relationship.sourceId} to ${relationship.targetId}`);
  }
  
  // Get node by ID
  getNode(nodeId: string): CodeNode | undefined {
    return this.graph.nodes.get(nodeId);
  }
  
  // Get nodes by type
  getNodesByType(type: CodeNode['type']): CodeNode[] {
    return Array.from(this.graph.nodes.values()).filter(node => node.type === type);
  }
  
  // Find nodes by name (fuzzy search)
  findNodesByName(name: string): CodeNode[] {
    const nameLower = name.toLowerCase();
    return Array.from(this.graph.nodes.values()).filter(node => 
      node.name.toLowerCase().includes(nameLower)
    );
  }
  
  // Get related nodes
  getRelatedNodes(nodeId: string, relationshipType?: Relationship['type']): CodeNode[] {
    const node = this.graph.nodes.get(nodeId);
    if (!node) return [];
    
    const relatedNodeIds = new Set<string>();
    
    // Find relationships where this node is source or target
    this.graph.edges.forEach(edge => {
      if (!relationshipType || edge.type === relationshipType) {
        if (edge.sourceId === nodeId) {
          relatedNodeIds.add(edge.targetId);
        } else if (edge.targetId === nodeId) {
          relatedNodeIds.add(edge.sourceId);
        }
      }
    });
    
    return Array.from(relatedNodeIds)
      .map(id => this.graph.nodes.get(id))
      .filter((node): node is CodeNode => node !== undefined);
  }
  
  // Find dependencies of a node
  getDependencies(nodeId: string): CodeNode[] {
    return this.getRelatedNodes(nodeId, 'imports');
  }
  
  // Find dependents of a node
  getDependents(nodeId: string): CodeNode[] {
    const dependents: CodeNode[] = [];
    
    this.graph.edges.forEach(edge => {
      if (edge.type === 'imports' && edge.targetId === nodeId) {
        const dependent = this.graph.nodes.get(edge.sourceId);
        if (dependent) dependents.push(dependent);
      }
    });
    
    return dependents;
  }
  
  // Calculate node importance based on connections
  calculateNodeImportance(nodeId: string): number {
    const incomingEdges = this.graph.edges.filter(e => e.targetId === nodeId).length;
    const outgoingEdges = this.graph.edges.filter(e => e.sourceId === nodeId).length;
    
    // PageRank-inspired simple importance score
    return (incomingEdges * 2) + outgoingEdges;
  }
  
  // Find code smells across the graph
  findGlobalCodeSmells(): Map<string, CodeSmell[]> {
    const smells = new Map<string, CodeSmell[]>();
    
    // God Class detection
    this.graph.nodes.forEach((node, id) => {
      if (node.type === 'class') {
        const methods = this.getRelatedNodes(id, 'defines').filter(n => n.type === 'function');
        if (methods.length > 20) {
          const nodeSmells = smells.get(id) || [];
          nodeSmells.push({
            type: 'god-class',
            severity: 'high',
            description: `Class has ${methods.length} methods, consider splitting`,
            suggestion: 'Apply Single Responsibility Principle'
          });
          smells.set(id, nodeSmells);
        }
      }
    });
    
    // Circular dependency detection
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const dependencies = this.getDependencies(nodeId);
      for (const dep of dependencies) {
        if (!visited.has(dep.id)) {
          if (hasCycle(dep.id)) return true;
        } else if (recursionStack.has(dep.id)) {
          return true;
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    this.graph.nodes.forEach((node, id) => {
      if (!visited.has(id) && hasCycle(id)) {
        const nodeSmells = smells.get(id) || [];
        nodeSmells.push({
          type: 'circular-dependency',
          severity: 'critical',
          description: 'Part of a circular dependency chain',
          suggestion: 'Refactor to remove circular dependencies'
        });
        smells.set(id, nodeSmells);
      }
    });
    
    return smells;
  }
  
  // Export graph for visualization
  exportForVisualization(): any {
    const nodes = Array.from(this.graph.nodes.values()).map(node => ({
      id: node.id,
      label: node.name,
      type: node.type,
      group: node.language,
      size: this.calculateNodeImportance(node.id)
    }));
    
    const edges = this.graph.edges.map(edge => ({
      source: edge.sourceId,
      target: edge.targetId,
      type: edge.type
    }));
    
    return { nodes, edges };
  }
  
  // Query the graph with natural language (simplified version)
  async query(question: string): Promise<any> {
    const questionLower = question.toLowerCase();
    
    // Simple pattern matching for common queries
    if (questionLower.includes('find') && questionLower.includes('class')) {
      const className = question.match(/class\s+(\w+)/i)?.[1];
      if (className) {
        return this.findNodesByName(className).filter(n => n.type === 'class');
      }
    }
    
    if (questionLower.includes('dependencies') && questionLower.includes('of')) {
      const nodeName = question.match(/of\s+(\w+)/i)?.[1];
      if (nodeName) {
        const nodes = this.findNodesByName(nodeName);
        if (nodes.length > 0) {
          return this.getDependencies(nodes[0].id);
        }
      }
    }
    
    if (questionLower.includes('code smells')) {
      return Array.from(this.findGlobalCodeSmells().entries()).map(([nodeId, smells]) => ({
        node: this.getNode(nodeId),
        smells
      }));
    }
    
    return null;
  }
  
  // Get graph statistics
  getStatistics(): any {
    const nodesByType = new Map<string, number>();
    const relationshipsByType = new Map<string, number>();
    
    this.graph.nodes.forEach(node => {
      nodesByType.set(node.type, (nodesByType.get(node.type) || 0) + 1);
    });
    
    this.graph.edges.forEach(edge => {
      relationshipsByType.set(edge.type, (relationshipsByType.get(edge.type) || 0) + 1);
    });
    
    return {
      totalNodes: this.graph.nodes.size,
      totalEdges: this.graph.edges.length,
      nodesByType: Object.fromEntries(nodesByType),
      relationshipsByType: Object.fromEntries(relationshipsByType),
      languages: this.graph.metadata.languages,
      avgConnections: this.graph.edges.length / this.graph.nodes.size
    };
  }
  
  // Get all nodes
  getAllNodes(): CodeNode[] {
    return Array.from(this.graph.nodes.values());
  }
  
  // Get all edges
  getAllEdges(): Relationship[] {
    return this.graph.edges;
  }
  
  // Clear the graph
  clear(): void {
    this.graph.nodes.clear();
    this.graph.edges = [];
    this.graph.metadata.totalFiles = 0;
    this.graph.metadata.languages = [];
  }
}