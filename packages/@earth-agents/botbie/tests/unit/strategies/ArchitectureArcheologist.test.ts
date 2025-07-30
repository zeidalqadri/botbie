import { describe, it, expect, beforeEach } from '@jest/globals';
import { ArchitectureArcheologist } from '../../../src/strategies/ArchitectureArcheologist';
import { KnowledgeGraph, CodeNode, Relationship } from '@earth-agents/core';

describe('ArchitectureArcheologist', () => {
  let strategy: ArchitectureArcheologist;
  let knowledgeGraph: KnowledgeGraph;

  beforeEach(() => {
    strategy = new ArchitectureArcheologist();
    knowledgeGraph = new KnowledgeGraph();
  });

  describe('canHandle', () => {
    it('should handle contexts with knowledge graph', () => {
      const context = { graph: knowledgeGraph };
      expect(strategy.canHandle(context)).toBe(true);
    });

    it('should not handle contexts without knowledge graph', () => {
      const context = { someOtherProp: 'value' };
      expect(strategy.canHandle(context)).toBe(false);
    });
  });

  describe('execute', () => {
    it('should detect circular dependencies', async () => {
      // Create circular dependency: A -> B -> C -> A
      const moduleA: CodeNode = {
        id: 'modA',
        name: 'ModuleA',
        type: 'module',
        filePath: '/test/a.ts',
        startLine: 1,
        endLine: 10,
        language: 'typescript',
        content: 'import { ModuleB } from "./b"',
        relationships: []
      };

      const moduleB: CodeNode = {
        id: 'modB',
        name: 'ModuleB',
        type: 'module',
        filePath: '/test/b.ts',
        startLine: 1,
        endLine: 10,
        language: 'typescript',
        content: 'import { ModuleC } from "./c"',
        relationships: []
      };

      const moduleC: CodeNode = {
        id: 'modC',
        name: 'ModuleC',
        type: 'module',
        filePath: '/test/c.ts',
        startLine: 1,
        endLine: 10,
        language: 'typescript',
        content: 'import { ModuleA } from "./a"',
        relationships: []
      };

      knowledgeGraph.addNode(moduleA);
      knowledgeGraph.addNode(moduleB);
      knowledgeGraph.addNode(moduleC);

      const relAB: Relationship = {
        id: 'relAB',
        sourceId: 'modA',
        targetId: 'modB',
        type: 'imports'
      };

      const relBC: Relationship = {
        id: 'relBC',
        sourceId: 'modB',
        targetId: 'modC',
        type: 'imports'
      };

      const relCA: Relationship = {
        id: 'relCA',
        sourceId: 'modC',
        targetId: 'modA',
        type: 'imports'
      };

      knowledgeGraph.addRelationship(relAB);
      knowledgeGraph.addRelationship(relBC);
      knowledgeGraph.addRelationship(relCA);

      const result = await strategy.execute({ graph: knowledgeGraph });
      
      expect(result.success).toBe(true);
      expect(result.findings).toBeDefined();
      
      const circularDepIssue = result.findings!.find(
        f => f.type === 'circular-dependency'
      );
      expect(circularDepIssue).toBeDefined();
      expect(circularDepIssue?.severity).toBe('critical');
    });

    it('should analyze module coupling', async () => {
      // Create highly coupled module
      const coreModule: CodeNode = {
        id: 'core',
        name: 'CoreModule',
        type: 'module',
        filePath: '/test/core.ts',
        startLine: 1,
        endLine: 100,
        language: 'typescript',
        content: 'export class CoreModule {}',
        relationships: []
      };

      knowledgeGraph.addNode(coreModule);

      // Add many modules that depend on core
      for (let i = 1; i <= 15; i++) {
        const dependentModule: CodeNode = {
          id: `mod${i}`,
          name: `Module${i}`,
          type: 'module',
          filePath: `/test/mod${i}.ts`,
          startLine: 1,
          endLine: 50,
          language: 'typescript',
          content: `import { CoreModule } from "./core"`,
          relationships: []
        };

        knowledgeGraph.addNode(dependentModule);

        const rel: Relationship = {
          id: `rel${i}`,
          sourceId: `mod${i}`,
          targetId: 'core',
          type: 'imports'
        };

        knowledgeGraph.addRelationship(rel);
      }

      const result = await strategy.execute({ graph: knowledgeGraph });
      
      expect(result.success).toBe(true);
      expect(result.findings).toBeDefined();
      
      const couplingIssue = result.findings!.find(
        f => f.type === 'high-coupling' && f.description.includes('CoreModule')
      );
      expect(couplingIssue).toBeDefined();
      expect(couplingIssue?.severity).toBe('high');
    });

    it('should check SOLID principles - Single Responsibility', async () => {
      // Create a class that violates SRP
      const godClass: CodeNode = {
        id: 'godClass',
        name: 'UserManager',
        type: 'class',
        filePath: '/test/god.ts',
        startLine: 1,
        endLine: 500,
        language: 'typescript',
        content: `
          class UserManager {
            // Authentication methods
            login() {}
            logout() {}
            verifyPassword() {}
            
            // Database methods
            saveUser() {}
            deleteUser() {}
            findUser() {}
            
            // Email methods
            sendWelcomeEmail() {}
            sendPasswordReset() {}
            
            // Reporting methods
            generateUserReport() {}
            exportToExcel() {}
            
            // Payment methods
            processPayment() {}
            refundPayment() {}
          }
        `,
        relationships: []
      };

      knowledgeGraph.addNode(godClass);

      // Add many methods as separate nodes
      const methodNames = [
        'login', 'logout', 'verifyPassword',
        'saveUser', 'deleteUser', 'findUser',
        'sendWelcomeEmail', 'sendPasswordReset',
        'generateUserReport', 'exportToExcel',
        'processPayment', 'refundPayment'
      ];

      methodNames.forEach((name, i) => {
        const method: CodeNode = {
          id: `method${i}`,
          name,
          type: 'function',
          filePath: '/test/god.ts',
          startLine: 10 + i * 10,
          endLine: 15 + i * 10,
          language: 'typescript',
          content: `${name}() {}`,
          relationships: []
        };

        knowledgeGraph.addNode(method);

        const rel: Relationship = {
          id: `methodRel${i}`,
          sourceId: 'godClass',
          targetId: `method${i}`,
          type: 'defines'
        };

        knowledgeGraph.addRelationship(rel);
      });

      const result = await strategy.execute({ graph: knowledgeGraph });
      
      const srpViolation = result.findings!.find(
        f => f.type === 'srp-violation'
      );
      expect(srpViolation).toBeDefined();
      expect(srpViolation?.description).toContain('too many responsibilities');
    });

    it('should detect layer violations', async () => {
      // Create nodes representing different layers
      const controller: CodeNode = {
        id: 'controller',
        name: 'UserController',
        type: 'class',
        filePath: '/src/controllers/UserController.ts',
        startLine: 1,
        endLine: 50,
        language: 'typescript',
        content: 'import { Database } from "../database/Database"',
        relationships: []
      };

      const database: CodeNode = {
        id: 'database',
        name: 'Database',
        type: 'class',
        filePath: '/src/database/Database.ts',
        startLine: 1,
        endLine: 100,
        language: 'typescript',
        content: 'export class Database {}',
        relationships: []
      };

      knowledgeGraph.addNode(controller);
      knowledgeGraph.addNode(database);

      // Controller directly importing database (layer violation)
      const violation: Relationship = {
        id: 'violation',
        sourceId: 'controller',
        targetId: 'database',
        type: 'imports'
      };

      knowledgeGraph.addRelationship(violation);

      const result = await strategy.execute({ graph: knowledgeGraph });
      
      const layerViolation = result.findings!.find(
        f => f.type === 'layer-violation'
      );
      expect(layerViolation).toBeDefined();
      expect(layerViolation?.description).toContain('Controller importing from Database layer');
    });

    it('should provide architecture suggestions', async () => {
      // Add some nodes to analyze
      const nodes = [
        {
          id: 'service1',
          name: 'UserService',
          type: 'class' as const,
          filePath: '/test/services/user.ts',
          content: 'export class UserService {}'
        },
        {
          id: 'service2',
          name: 'OrderService',
          type: 'class' as const,
          filePath: '/test/services/order.ts',
          content: 'export class OrderService {}'
        },
        {
          id: 'util1',
          name: 'StringUtils',
          type: 'class' as const,
          filePath: '/test/utils/string.ts',
          content: 'export class StringUtils {}'
        }
      ];

      nodes.forEach(n => {
        const node: CodeNode = {
          ...n,
          startLine: 1,
          endLine: 20,
          language: 'typescript',
          relationships: []
        };
        knowledgeGraph.addNode(node);
      });

      const result = await strategy.execute({ graph: knowledgeGraph });
      
      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions!.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeModuleDependencies', () => {
    it('should calculate correct module metrics', async () => {
      // Create a simple module structure
      const moduleA: CodeNode = {
        id: 'modA',
        name: 'ModuleA',
        type: 'module',
        filePath: '/test/a.ts',
        startLine: 1,
        endLine: 50,
        language: 'typescript',
        content: 'export class ModuleA {}',
        relationships: []
      };

      const moduleB: CodeNode = {
        id: 'modB',
        name: 'ModuleB',
        type: 'module',
        filePath: '/test/b.ts',
        startLine: 1,
        endLine: 50,
        language: 'typescript',
        content: 'import { ModuleA } from "./a"',
        relationships: []
      };

      knowledgeGraph.addNode(moduleA);
      knowledgeGraph.addNode(moduleB);

      const rel: Relationship = {
        id: 'rel1',
        sourceId: 'modB',
        targetId: 'modA',
        type: 'imports'
      };

      knowledgeGraph.addRelationship(rel);

      const result = await strategy.execute({ graph: knowledgeGraph });
      
      expect(result.metrics).toBeDefined();
      expect(result.metrics!['module-dependencies']).toBeDefined();
      expect(result.metrics!['module-dependencies'].totalModules).toBe(2);
      expect(result.metrics!['module-dependencies'].averageDependencies).toBe(0.5);
    });
  });
});