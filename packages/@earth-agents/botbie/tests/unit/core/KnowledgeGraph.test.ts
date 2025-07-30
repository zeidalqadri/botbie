import { describe, it, expect, beforeEach } from '@jest/globals';
import { KnowledgeGraph, CodeNode, Relationship } from '@earth-agents/core';

describe('KnowledgeGraph', () => {
  let knowledgeGraph: KnowledgeGraph;

  beforeEach(() => {
    knowledgeGraph = new KnowledgeGraph();
  });

  describe('addNode', () => {
    it('should add a node to the graph', () => {
      const node: CodeNode = {
        id: 'node1',
        name: 'TestClass',
        type: 'class',
        filePath: '/test/file.ts',
        startLine: 1,
        endLine: 10,
        language: 'typescript',
        content: 'class TestClass {}',
        relationships: []
      };

      knowledgeGraph.addNode(node);
      
      expect(knowledgeGraph.getNode('node1')).toEqual(node);
    });

    it('should update metadata when adding nodes', () => {
      const node: CodeNode = {
        id: 'node1',
        name: 'TestClass',
        type: 'class',
        filePath: '/test/file.ts',
        startLine: 1,
        endLine: 10,
        language: 'typescript',
        content: 'class TestClass {}',
        relationships: []
      };

      knowledgeGraph.addNode(node);
      const stats = knowledgeGraph.getStatistics();
      
      expect(stats.languages).toContain('typescript');
      expect(stats.totalNodes).toBe(1);
    });
  });

  describe('addRelationship', () => {
    beforeEach(() => {
      const node1: CodeNode = {
        id: 'node1',
        name: 'ClassA',
        type: 'class',
        filePath: '/test/a.ts',
        startLine: 1,
        endLine: 10,
        language: 'typescript',
        content: 'class ClassA {}',
        relationships: []
      };

      const node2: CodeNode = {
        id: 'node2',
        name: 'ClassB',
        type: 'class',
        filePath: '/test/b.ts',
        startLine: 1,
        endLine: 10,
        language: 'typescript',
        content: 'class ClassB {}',
        relationships: []
      };

      knowledgeGraph.addNode(node1);
      knowledgeGraph.addNode(node2);
    });

    it('should add a relationship between existing nodes', () => {
      const relationship: Relationship = {
        id: 'rel1',
        sourceId: 'node1',
        targetId: 'node2',
        type: 'imports'
      };

      knowledgeGraph.addRelationship(relationship);
      const stats = knowledgeGraph.getStatistics();
      
      expect(stats.totalEdges).toBe(1);
    });

    it('should not add relationship if nodes do not exist', () => {
      const relationship: Relationship = {
        id: 'rel1',
        sourceId: 'nonexistent1',
        targetId: 'nonexistent2',
        type: 'imports'
      };

      knowledgeGraph.addRelationship(relationship);
      const stats = knowledgeGraph.getStatistics();
      
      expect(stats.totalEdges).toBe(0);
    });
  });

  describe('getNodesByType', () => {
    beforeEach(() => {
      const classNode: CodeNode = {
        id: 'node1',
        name: 'TestClass',
        type: 'class',
        filePath: '/test/file.ts',
        startLine: 1,
        endLine: 10,
        language: 'typescript',
        content: 'class TestClass {}',
        relationships: []
      };

      const functionNode: CodeNode = {
        id: 'node2',
        name: 'testFunction',
        type: 'function',
        filePath: '/test/file.ts',
        startLine: 15,
        endLine: 20,
        language: 'typescript',
        content: 'function testFunction() {}',
        relationships: []
      };

      knowledgeGraph.addNode(classNode);
      knowledgeGraph.addNode(functionNode);
    });

    it('should return nodes of specific type', () => {
      const classes = knowledgeGraph.getNodesByType('class');
      const functions = knowledgeGraph.getNodesByType('function');
      
      expect(classes).toHaveLength(1);
      expect(classes[0].name).toBe('TestClass');
      expect(functions).toHaveLength(1);
      expect(functions[0].name).toBe('testFunction');
    });
  });

  describe('findNodesByName', () => {
    beforeEach(() => {
      const nodes: CodeNode[] = [
        {
          id: 'node1',
          name: 'UserService',
          type: 'class',
          filePath: '/test/user.ts',
          startLine: 1,
          endLine: 10,
          language: 'typescript',
          content: 'class UserService {}',
          relationships: []
        },
        {
          id: 'node2',
          name: 'getUserById',
          type: 'function',
          filePath: '/test/user.ts',
          startLine: 15,
          endLine: 20,
          language: 'typescript',
          content: 'function getUserById() {}',
          relationships: []
        },
        {
          id: 'node3',
          name: 'AdminService',
          type: 'class',
          filePath: '/test/admin.ts',
          startLine: 1,
          endLine: 10,
          language: 'typescript',
          content: 'class AdminService {}',
          relationships: []
        }
      ];

      nodes.forEach(node => knowledgeGraph.addNode(node));
    });

    it('should find nodes by partial name match', () => {
      const userNodes = knowledgeGraph.findNodesByName('user');
      
      expect(userNodes).toHaveLength(2);
      expect(userNodes.map(n => n.name)).toContain('UserService');
      expect(userNodes.map(n => n.name)).toContain('getUserById');
    });

    it('should be case-insensitive', () => {
      const serviceNodes = knowledgeGraph.findNodesByName('SERVICE');
      
      expect(serviceNodes).toHaveLength(2);
      expect(serviceNodes.map(n => n.name)).toContain('UserService');
      expect(serviceNodes.map(n => n.name)).toContain('AdminService');
    });
  });

  describe('getDependencies and getDependents', () => {
    beforeEach(() => {
      const moduleA: CodeNode = {
        id: 'moduleA',
        name: 'ModuleA',
        type: 'module',
        filePath: '/test/a.ts',
        startLine: 1,
        endLine: 10,
        language: 'typescript',
        content: 'export class ModuleA {}',
        relationships: []
      };

      const moduleB: CodeNode = {
        id: 'moduleB',
        name: 'ModuleB',
        type: 'module',
        filePath: '/test/b.ts',
        startLine: 1,
        endLine: 10,
        language: 'typescript',
        content: 'import { ModuleA } from "./a"',
        relationships: []
      };

      knowledgeGraph.addNode(moduleA);
      knowledgeGraph.addNode(moduleB);

      const importRelation: Relationship = {
        id: 'rel1',
        sourceId: 'moduleB',
        targetId: 'moduleA',
        type: 'imports'
      };

      knowledgeGraph.addRelationship(importRelation);
    });

    it('should get dependencies of a node', () => {
      const deps = knowledgeGraph.getDependencies('moduleB');
      
      expect(deps).toHaveLength(1);
      expect(deps[0].name).toBe('ModuleA');
    });

    it('should get dependents of a node', () => {
      const dependents = knowledgeGraph.getDependents('moduleA');
      
      expect(dependents).toHaveLength(1);
      expect(dependents[0].name).toBe('ModuleB');
    });
  });

  describe('calculateNodeImportance', () => {
    it('should calculate importance based on connections', () => {
      const hub: CodeNode = {
        id: 'hub',
        name: 'HubModule',
        type: 'module',
        filePath: '/test/hub.ts',
        startLine: 1,
        endLine: 10,
        language: 'typescript',
        content: 'export class Hub {}',
        relationships: []
      };

      knowledgeGraph.addNode(hub);

      // Add nodes that import the hub
      for (let i = 1; i <= 3; i++) {
        const node: CodeNode = {
          id: `node${i}`,
          name: `Module${i}`,
          type: 'module',
          filePath: `/test/module${i}.ts`,
          startLine: 1,
          endLine: 10,
          language: 'typescript',
          content: `import { Hub } from "./hub"`,
          relationships: []
        };

        knowledgeGraph.addNode(node);
        
        const rel: Relationship = {
          id: `rel${i}`,
          sourceId: `node${i}`,
          targetId: 'hub',
          type: 'imports'
        };

        knowledgeGraph.addRelationship(rel);
      }

      const importance = knowledgeGraph.calculateNodeImportance('hub');
      
      expect(importance).toBe(6); // 3 incoming * 2 + 0 outgoing
    });
  });

  describe('findGlobalCodeSmells', () => {
    it('should detect god classes', () => {
      const godClass: CodeNode = {
        id: 'godClass',
        name: 'GodClass',
        type: 'class',
        filePath: '/test/god.ts',
        startLine: 1,
        endLine: 500,
        language: 'typescript',
        content: 'class GodClass {}',
        relationships: []
      };

      knowledgeGraph.addNode(godClass);

      // Add many methods to the god class
      for (let i = 1; i <= 25; i++) {
        const method: CodeNode = {
          id: `method${i}`,
          name: `method${i}`,
          type: 'function',
          filePath: '/test/god.ts',
          startLine: i * 10,
          endLine: i * 10 + 5,
          language: 'typescript',
          content: `method${i}() {}`,
          relationships: []
        };

        knowledgeGraph.addNode(method);
        
        const rel: Relationship = {
          id: `rel${i}`,
          sourceId: 'godClass',
          targetId: `method${i}`,
          type: 'defines'
        };

        knowledgeGraph.addRelationship(rel);
      }

      const smells = knowledgeGraph.findGlobalCodeSmells();
      const godClassSmells = smells.get('godClass');
      
      expect(godClassSmells).toBeDefined();
      expect(godClassSmells![0].type).toBe('god-class');
      expect(godClassSmells![0].severity).toBe('high');
    });
  });

  describe('getAllNodes and getAllEdges', () => {
    it('should return all nodes', () => {
      const node1: CodeNode = {
        id: 'node1',
        name: 'Node1',
        type: 'class',
        filePath: '/test/file1.ts',
        startLine: 1,
        endLine: 10,
        language: 'typescript',
        content: 'class Node1 {}',
        relationships: []
      };

      const node2: CodeNode = {
        id: 'node2',
        name: 'Node2',
        type: 'class',
        filePath: '/test/file2.ts',
        startLine: 1,
        endLine: 10,
        language: 'typescript',
        content: 'class Node2 {}',
        relationships: []
      };

      knowledgeGraph.addNode(node1);
      knowledgeGraph.addNode(node2);

      const allNodes = knowledgeGraph.getAllNodes();
      
      expect(allNodes).toHaveLength(2);
      expect(allNodes.map(n => n.id)).toContain('node1');
      expect(allNodes.map(n => n.id)).toContain('node2');
    });

    it('should return all edges', () => {
      const node1: CodeNode = {
        id: 'node1',
        name: 'Node1',
        type: 'class',
        filePath: '/test/file1.ts',
        startLine: 1,
        endLine: 10,
        language: 'typescript',
        content: 'class Node1 {}',
        relationships: []
      };

      const node2: CodeNode = {
        id: 'node2',
        name: 'Node2',
        type: 'class',
        filePath: '/test/file2.ts',
        startLine: 1,
        endLine: 10,
        language: 'typescript',
        content: 'class Node2 {}',
        relationships: []
      };

      knowledgeGraph.addNode(node1);
      knowledgeGraph.addNode(node2);

      const rel: Relationship = {
        id: 'rel1',
        sourceId: 'node1',
        targetId: 'node2',
        type: 'imports'
      };

      knowledgeGraph.addRelationship(rel);

      const allEdges = knowledgeGraph.getAllEdges();
      
      expect(allEdges).toHaveLength(1);
      expect(allEdges[0].id).toBe('rel1');
    });
  });

  describe('clear', () => {
    it('should clear all nodes and edges', () => {
      const node: CodeNode = {
        id: 'node1',
        name: 'TestNode',
        type: 'class',
        filePath: '/test/file.ts',
        startLine: 1,
        endLine: 10,
        language: 'typescript',
        content: 'class TestNode {}',
        relationships: []
      };

      knowledgeGraph.addNode(node);
      
      knowledgeGraph.clear();
      const stats = knowledgeGraph.getStatistics();
      
      expect(stats.totalNodes).toBe(0);
      expect(stats.totalEdges).toBe(0);
      expect(stats.languages).toHaveLength(0);
    });
  });
});