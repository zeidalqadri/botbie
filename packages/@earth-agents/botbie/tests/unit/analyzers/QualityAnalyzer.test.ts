import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { QualityAnalyzer } from '../../../src/analyzers/QualityAnalyzer';
import { KnowledgeGraph, CodeNode } from '@earth-agents/core';

describe('QualityAnalyzer', () => {
  let qualityAnalyzer: QualityAnalyzer;
  let knowledgeGraph: KnowledgeGraph;

  beforeEach(() => {
    knowledgeGraph = new KnowledgeGraph();
    qualityAnalyzer = new QualityAnalyzer(knowledgeGraph);
  });

  describe('analyzeNode', () => {
    it('should detect high complexity functions', async () => {
      const complexFunction: CodeNode = {
        id: 'complex1',
        name: 'complexFunction',
        type: 'function',
        filePath: '/test/complex.ts',
        startLine: 1,
        endLine: 50,
        language: 'typescript',
        content: `
          function complexFunction(data) {
            if (data.a) {
              if (data.b) {
                for (let i = 0; i < data.items.length; i++) {
                  if (data.items[i].type === 'special') {
                    switch (data.items[i].value) {
                      case 1:
                        return 'one';
                      case 2:
                        return 'two';
                      case 3:
                        return 'three';
                      default:
                        return 'unknown';
                    }
                  } else if (data.items[i].type === 'normal') {
                    while (data.items[i].count > 0) {
                      data.items[i].count--;
                    }
                  }
                }
              } else {
                return data.c ? 'c' : 'd';
              }
            }
            return null;
          }
        `,
        relationships: []
      };

      const issues = await qualityAnalyzer.analyzeNode(complexFunction);
      
      const complexityIssue = issues.find(i => i.type === 'high-complexity');
      expect(complexityIssue).toBeDefined();
      expect(complexityIssue?.severity).toBe('high');
      expect(complexityIssue?.description).toContain('high cyclomatic complexity');
    });

    it('should detect long functions', async () => {
      const longFunction: CodeNode = {
        id: 'long1',
        name: 'longFunction',
        type: 'function',
        filePath: '/test/long.ts',
        startLine: 1,
        endLine: 200,
        language: 'typescript',
        content: Array(200).fill('  // some code').join('\n'),
        relationships: []
      };

      const issues = await qualityAnalyzer.analyzeNode(longFunction);
      
      const lengthIssue = issues.find(i => i.type === 'long-function');
      expect(lengthIssue).toBeDefined();
      expect(lengthIssue?.severity).toBe('high');
      expect(lengthIssue?.description).toContain('too long');
    });

    it('should detect missing documentation', async () => {
      const undocumentedFunction: CodeNode = {
        id: 'undoc1',
        name: 'publicFunction',
        type: 'function',
        filePath: '/test/undoc.ts',
        startLine: 1,
        endLine: 10,
        language: 'typescript',
        content: `
          export function publicFunction(param1: string, param2: number) {
            return param1 + param2;
          }
        `,
        relationships: []
      };

      const issues = await qualityAnalyzer.analyzeNode(undocumentedFunction);
      
      const docIssue = issues.find(i => i.type === 'missing-documentation');
      expect(docIssue).toBeDefined();
      expect(docIssue?.severity).toBe('low');
      expect(docIssue?.autoFixAvailable).toBe(true);
    });
  });

  describe('calculateQualityMetrics', () => {
    it('should calculate correct cyclomatic complexity', async () => {
      const node: CodeNode = {
        id: 'test1',
        name: 'testFunction',
        type: 'function',
        filePath: '/test/metrics.ts',
        startLine: 1,
        endLine: 20,
        language: 'typescript',
        content: `
          function testFunction(x) {
            if (x > 0) {
              if (x > 10) {
                return 'big';
              } else {
                return 'small';
              }
            } else if (x < 0) {
              return 'negative';
            } else {
              return 'zero';
            }
          }
        `,
        relationships: []
      };

      const issues = await qualityAnalyzer.analyzeNode(node);
      
      expect(node.quality).toBeDefined();
      expect(node.quality!.complexity).toBeGreaterThan(1);
    });

    it('should calculate documentation score correctly', async () => {
      const wellDocumented: CodeNode = {
        id: 'doc1',
        name: 'wellDocumented',
        type: 'function',
        filePath: '/test/documented.ts',
        startLine: 1,
        endLine: 15,
        language: 'typescript',
        content: `
          /**
           * This function does something important
           * @param x - The input value
           * @returns The processed result
           */
          function wellDocumented(x: number): string {
            // Process the input
            return x.toString();
          }
        `,
        relationships: []
      };

      await qualityAnalyzer.analyzeNode(wellDocumented);
      
      expect(wellDocumented.quality?.documentationScore).toBe(1);
    });

    it('should detect maintainability issues', async () => {
      const poorlyMaintainable: CodeNode = {
        id: 'poor1',
        name: 'x',
        type: 'function',
        filePath: '/test/poor.ts',
        startLine: 1,
        endLine: 30,
        language: 'typescript',
        content: `
          function x(a, b, c, d, e, f) {
            var result = a + b * c / d - e + f;
            if (result > 100) { return 'a'; }
            else if (result > 50) { return 'b'; }
            else if (result > 25) { return 'c'; }
            else if (result > 10) { return 'd'; }
            else if (result > 5) { return 'e'; }
            else if (result > 1) { return 'f'; }
            else if (result > 0) { return 'g'; }
            else { return 'h'; }
          }
        `,
        relationships: []
      };

      await qualityAnalyzer.analyzeNode(poorlyMaintainable);
      
      expect(poorlyMaintainable.quality?.maintainability).toBeLessThan(70);
    });
  });

  describe('findGlobalIssues', () => {
    beforeEach(() => {
      // Add some interconnected nodes
      const module1: CodeNode = {
        id: 'mod1',
        name: 'Module1',
        type: 'module',
        filePath: '/test/mod1.ts',
        startLine: 1,
        endLine: 100,
        language: 'typescript',
        content: 'export class Module1 {}',
        relationships: []
      };

      const module2: CodeNode = {
        id: 'mod2',
        name: 'Module2',
        type: 'module',
        filePath: '/test/mod2.ts',
        startLine: 1,
        endLine: 100,
        language: 'typescript',
        content: 'import { Module1 } from "./mod1"',
        relationships: []
      };

      knowledgeGraph.addNode(module1);
      knowledgeGraph.addNode(module2);

      // Add duplicate code
      const dupFunction1: CodeNode = {
        id: 'dup1',
        name: 'calculateTotal',
        type: 'function',
        filePath: '/test/dup1.ts',
        startLine: 1,
        endLine: 20,
        language: 'typescript',
        content: `
          function calculateTotal(items) {
            let total = 0;
            for (const item of items) {
              total += item.price * item.quantity;
            }
            return total;
          }
        `,
        relationships: []
      };

      const dupFunction2: CodeNode = {
        id: 'dup2',
        name: 'computeSum',
        type: 'function',
        filePath: '/test/dup2.ts',
        startLine: 1,
        endLine: 20,
        language: 'typescript',
        content: `
          function computeSum(products) {
            let total = 0;
            for (const item of products) {
              total += item.price * item.quantity;
            }
            return total;
          }
        `,
        relationships: []
      };

      knowledgeGraph.addNode(dupFunction1);
      knowledgeGraph.addNode(dupFunction2);
    });

    it('should detect duplicate code patterns', async () => {
      const issues = await qualityAnalyzer.findGlobalIssues();
      
      const duplicateIssue = issues.find(i => i.type === 'code-duplication');
      expect(duplicateIssue).toBeDefined();
      expect(duplicateIssue?.description).toContain('similar to');
    });

    it('should detect unused code', async () => {
      const unusedFunction: CodeNode = {
        id: 'unused1',
        name: 'unusedHelper',
        type: 'function',
        filePath: '/test/unused.ts',
        startLine: 1,
        endLine: 10,
        language: 'typescript',
        content: `
          function unusedHelper() {
            return 'never called';
          }
        `,
        relationships: []
      };

      knowledgeGraph.addNode(unusedFunction);

      const issues = await qualityAnalyzer.findGlobalIssues();
      
      const unusedIssue = issues.find(i => 
        i.type === 'unused-code' && i.description.includes('unusedHelper')
      );
      expect(unusedIssue).toBeDefined();
      expect(unusedIssue?.autoFixAvailable).toBe(true);
    });
  });

  describe('canAutoFix', () => {
    it('should identify auto-fixable issues', () => {
      const analyzer = new QualityAnalyzer(knowledgeGraph);
      
      expect(analyzer['canAutoFix']('missing-documentation')).toBe(true);
      expect(analyzer['canAutoFix']('unused-code')).toBe(true);
      expect(analyzer['canAutoFix']('high-complexity')).toBe(false);
      expect(analyzer['canAutoFix']('code-duplication')).toBe(false);
    });
  });

  describe('detectCodeSmells', () => {
    it('should detect long parameter lists', async () => {
      const tooManyParams: CodeNode = {
        id: 'params1',
        name: 'tooManyParams',
        type: 'function',
        filePath: '/test/params.ts',
        startLine: 1,
        endLine: 10,
        language: 'typescript',
        content: `
          function tooManyParams(a, b, c, d, e, f, g, h) {
            return a + b + c + d + e + f + g + h;
          }
        `,
        relationships: []
      };

      await qualityAnalyzer.analyzeNode(tooManyParams);
      
      const smell = tooManyParams.quality?.codeSmells.find(
        s => s.type === 'long-parameter-list'
      );
      expect(smell).toBeDefined();
      expect(smell?.severity).toBe('medium');
    });

    it('should detect magic numbers', async () => {
      const magicNumbers: CodeNode = {
        id: 'magic1',
        name: 'calculateDiscount',
        type: 'function',
        filePath: '/test/magic.ts',
        startLine: 1,
        endLine: 10,
        language: 'typescript',
        content: `
          function calculateDiscount(price) {
            if (price > 100) {
              return price * 0.85;
            } else if (price > 50) {
              return price * 0.9;
            }
            return price;
          }
        `,
        relationships: []
      };

      await qualityAnalyzer.analyzeNode(magicNumbers);
      
      const smell = magicNumbers.quality?.codeSmells.find(
        s => s.type === 'magic-numbers'
      );
      expect(smell).toBeDefined();
      expect(smell?.description).toContain('magic numbers');
    });
  });
});