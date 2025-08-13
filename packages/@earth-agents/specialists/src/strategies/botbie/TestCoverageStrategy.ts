import { BaseStrategy } from '@earth-agents/botbie';
import { SpecialistAgentAdapter } from '../../SpecialistAgentAdapter';
import { CodeAnalysisContext, CodeAnalysisResult } from '@earth-agents/types';

/**
 * Test Coverage Strategy using Test Engineer specialist
 */
export class TestCoverageStrategy extends BaseStrategy {
  private testEngineer: SpecialistAgentAdapter;

  constructor() {
    super();
    this.testEngineer = new SpecialistAgentAdapter('test-engineer');
  }

  async analyze(context: CodeAnalysisContext): Promise<CodeAnalysisResult> {
    const { code, filePath, language, testCode } = context;

    const prompt = `
Analyze test coverage and testing quality for this ${language} code.

Production Code:
\`\`\`${language}
${code}
\`\`\`

${testCode ? `Test Code:
\`\`\`${language}
${testCode}
\`\`\`` : 'No test code provided.'}

Analyze:
1. Test coverage gaps
2. Missing test scenarios
3. Test quality and assertions
4. Edge cases not covered
5. Test maintainability
6. Mocking and isolation issues

Provide specific recommendations for improving test coverage and quality.
`;

    try {
      const result = await this.testEngineer.invoke(prompt, {
        filePath,
        language,
        hasTests: !!testCode
      });

      const issues = this.parseTestIssues(result.output);
      const coverage = this.estimateCoverage(code, testCode);

      return {
        issues,
        metrics: {
          estimatedCoverage: coverage.percentage,
          missingTests: coverage.missingTests,
          testQualityScore: result.metadata?.qualityScore || 0,
          assertionDensity: this.calculateAssertionDensity(testCode)
        },
        suggestions: [
          ...this.generateTestSuggestions(result.output),
          ...result.suggestions || []
        ],
        metadata: {
          uncoveredFunctions: coverage.uncoveredFunctions,
          testTypes: this.identifyTestTypes(testCode)
        }
      };
    } catch (error) {
      return {
        issues: [],
        metrics: {},
        suggestions: [],
        error: `Test coverage analysis failed: ${error.message}`
      };
    }
  }

  private parseTestIssues(output: string): any[] {
    const issues = [];
    const lines = output.split('\n');
    
    const issuePatterns = {
      'missing-test': /missing test|not tested|no test/i,
      'weak-assertion': /weak assertion|no assertion|assert missing/i,
      'no-edge-cases': /edge case|boundary|error handling/i,
      'poor-isolation': /not isolated|dependency|mock missing/i
    };
    
    lines.forEach((line, index) => {
      for (const [type, pattern] of Object.entries(issuePatterns)) {
        if (pattern.test(line)) {
          issues.push({
            type: 'test-coverage',
            severity: type === 'missing-test' ? 'error' : 'warning',
            message: line.trim(),
            line: index + 1,
            column: 0,
            rule: type
          });
        }
      }
    });
    
    return issues;
  }

  private estimateCoverage(code: string, testCode?: string): any {
    if (!testCode) {
      return {
        percentage: 0,
        missingTests: 'all',
        uncoveredFunctions: this.extractFunctions(code)
      };
    }

    const functions = this.extractFunctions(code);
    const testedFunctions = this.extractTestedFunctions(testCode);
    
    const uncoveredFunctions = functions.filter(
      fn => !testedFunctions.some(tested => 
        tested.toLowerCase().includes(fn.toLowerCase()) ||
        fn.toLowerCase().includes(tested.toLowerCase())
      )
    );

    const coverage = functions.length > 0
      ? Math.round(((functions.length - uncoveredFunctions.length) / functions.length) * 100)
      : 0;

    return {
      percentage: coverage,
      missingTests: uncoveredFunctions.length,
      uncoveredFunctions
    };
  }

  private extractFunctions(code: string): string[] {
    const functions = [];
    
    // JavaScript/TypeScript function patterns
    const patterns = [
      /function\s+(\w+)/g,
      /(\w+)\s*:\s*function/g,
      /(\w+)\s*=\s*function/g,
      /(\w+)\s*=\s*\([^)]*\)\s*=>/g,
      /async\s+(\w+)\s*\(/g,
      /(\w+)\s*\([^)]*\)\s*{/g,
      /class\s+(\w+)/g,
      /(\w+)\s*:\s*async\s*\(/g
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        if (match[1] && !functions.includes(match[1])) {
          functions.push(match[1]);
        }
      }
    });
    
    return functions;
  }

  private extractTestedFunctions(testCode: string): string[] {
    const tested = [];
    
    // Common test patterns
    const patterns = [
      /(?:it|test|describe)\s*\(['"`].*?(\w+).*?['"`]/g,
      /expect\s*\(\s*(\w+)/g,
      /(\w+)\.toBe/g,
      /assert.*?\(\s*(\w+)/g
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(testCode)) !== null) {
        if (match[1] && !tested.includes(match[1])) {
          tested.push(match[1]);
        }
      }
    });
    
    return tested;
  }

  private calculateAssertionDensity(testCode?: string): number {
    if (!testCode) return 0;
    
    const assertions = (testCode.match(/expect|assert|should/gi) || []).length;
    const tests = (testCode.match(/it\s*\(|test\s*\(/gi) || []).length;
    
    return tests > 0 ? Math.round((assertions / tests) * 10) / 10 : 0;
  }

  private identifyTestTypes(testCode?: string): string[] {
    if (!testCode) return [];
    
    const types = [];
    const typePatterns = {
      unit: /unit|isolated|mock/i,
      integration: /integration|api|endpoint/i,
      e2e: /e2e|end.to.end|selenium|cypress/i,
      performance: /performance|load|stress/i,
      security: /security|vulnerability|penetration/i
    };
    
    for (const [type, pattern] of Object.entries(typePatterns)) {
      if (pattern.test(testCode)) {
        types.push(type);
      }
    }
    
    return types.length > 0 ? types : ['unit']; // Default to unit if unclear
  }

  private generateTestSuggestions(output: string): string[] {
    const suggestions = [];
    const lines = output.split('\n');
    
    let collectingSuggestions = false;
    let currentSuggestion = '';
    
    lines.forEach(line => {
      if (line.includes('Test:') || line.includes('Add test:')) {
        if (currentSuggestion) suggestions.push(currentSuggestion.trim());
        collectingSuggestions = true;
        currentSuggestion = line;
      } else if (collectingSuggestions && line.trim() === '') {
        suggestions.push(currentSuggestion.trim());
        collectingSuggestions = false;
        currentSuggestion = '';
      } else if (collectingSuggestions) {
        currentSuggestion += ' ' + line.trim();
      }
    });
    
    if (currentSuggestion) suggestions.push(currentSuggestion.trim());
    
    return suggestions;
  }
}