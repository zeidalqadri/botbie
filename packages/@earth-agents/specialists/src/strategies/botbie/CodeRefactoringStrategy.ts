import { BaseStrategy } from '@earth-agents/botbie';
import { SpecialistAgentAdapter } from '../../SpecialistAgentAdapter';
import { CodeAnalysisContext, CodeAnalysisResult } from '@earth-agents/types';

/**
 * Code Refactoring Strategy using Refactoring Expert and Code Reviewer specialists
 */
export class CodeRefactoringStrategy extends BaseStrategy {
  private refactoringExpert: SpecialistAgentAdapter;
  private codeReviewer: SpecialistAgentAdapter;

  constructor() {
    super();
    this.refactoringExpert = new SpecialistAgentAdapter('refactoring-expert');
    this.codeReviewer = new SpecialistAgentAdapter('code-reviewer');
  }

  async analyze(context: CodeAnalysisContext): Promise<CodeAnalysisResult> {
    const { code, filePath, language } = context;

    // First, get code review to identify areas needing refactoring
    const reviewPrompt = `
Review this ${language} code for refactoring opportunities.

Focus on:
- Code smells and anti-patterns
- Duplicate code detection
- Complex methods that need simplification
- Poor naming conventions
- Violation of SOLID principles
- Tight coupling issues
- Missing abstractions

Code:
\`\`\`${language}
${code}
\`\`\`

Identify specific areas that would benefit from refactoring.
`;

    // Then get specific refactoring recommendations
    const refactorPrompt = `
Provide detailed refactoring recommendations for this ${language} code.

Focus on:
- Extract method/class opportunities
- Design pattern applications
- Dependency injection improvements
- Interface extraction
- Code consolidation
- Naming improvements
- Complexity reduction

Code:
\`\`\`${language}
${code}
\`\`\`

Provide before/after examples for major refactoring suggestions.
`;

    try {
      const [reviewResult, refactorResult] = await Promise.all([
        this.codeReviewer.invoke(reviewPrompt, { filePath, language }),
        this.refactoringExpert.invoke(refactorPrompt, { filePath, language })
      ]);

      const issues = [
        ...this.parseCodeSmells(reviewResult.output),
        ...this.parseRefactoringOpportunities(refactorResult.output)
      ];

      const complexity = this.calculateComplexity(code);

      return {
        issues,
        metrics: {
          cyclomaticComplexity: complexity.cyclomatic,
          cognitiveComplexity: complexity.cognitive,
          maintainabilityIndex: this.calculateMaintainabilityIndex(code),
          technicalDebt: refactorResult.metadata?.technicalDebt || 'medium'
        },
        suggestions: [
          ...this.extractRefactoringSuggestions(refactorResult.output),
          ...reviewResult.suggestions || []
        ],
        metadata: {
          codeSmells: this.categorizeCodeSmells(issues),
          refactoringPriority: this.calculateRefactoringPriority(issues, complexity)
        }
      };
    } catch (error) {
      return {
        issues: [],
        metrics: {},
        suggestions: [],
        error: `Refactoring analysis failed: ${error.message}`
      };
    }
  }

  private calculateComplexity(code: string): { cyclomatic: number, cognitive: number } {
    // Simplified complexity calculation
    const lines = code.split('\n');
    let cyclomatic = 1;
    let cognitive = 0;
    let depth = 0;

    const complexityPatterns = {
      conditional: /\b(if|else if|case|catch)\b/,
      loop: /\b(for|while|do)\b/,
      logical: /(\|\||&&)/,
      ternary: /\?.*:/
    };

    lines.forEach(line => {
      // Track nesting depth
      if (line.includes('{')) depth++;
      if (line.includes('}')) depth = Math.max(0, depth - 1);

      // Cyclomatic complexity
      if (complexityPatterns.conditional.test(line)) cyclomatic++;
      if (complexityPatterns.loop.test(line)) cyclomatic++;
      if (complexityPatterns.logical.test(line)) {
        cyclomatic += (line.match(/(\|\||&&)/g) || []).length;
      }

      // Cognitive complexity (includes nesting)
      if (complexityPatterns.conditional.test(line)) cognitive += 1 + depth;
      if (complexityPatterns.loop.test(line)) cognitive += 1 + depth;
      if (complexityPatterns.ternary.test(line)) cognitive += 1;
    });

    return { cyclomatic, cognitive };
  }

  private calculateMaintainabilityIndex(code: string): number {
    // Simplified maintainability index calculation
    const lines = code.split('\n').filter(l => l.trim().length > 0);
    const complexity = this.calculateComplexity(code);
    
    // Basic formula: 171 - 5.2 * ln(V) - 0.23 * CC - 16.2 * ln(LOC)
    const loc = lines.length;
    const cc = complexity.cyclomatic;
    const volume = loc * Math.log2(50); // Simplified Halstead volume
    
    const mi = Math.max(0, Math.min(100,
      171 - 5.2 * Math.log(volume) - 0.23 * cc - 16.2 * Math.log(loc)
    ));
    
    return Math.round(mi);
  }

  private parseCodeSmells(output: string): any[] {
    const issues = [];
    const lines = output.split('\n');
    
    const smellPatterns = {
      'Long Method': /long method|too many lines|method too long/i,
      'Large Class': /large class|too many responsibilities|god class/i,
      'Duplicate Code': /duplicate|repeated code|copy.paste/i,
      'Long Parameter List': /too many parameters|parameter list/i,
      'Feature Envy': /feature envy|accessing other class/i,
      'Data Clumps': /data clump|grouped data/i
    };
    
    lines.forEach((line, index) => {
      for (const [smell, pattern] of Object.entries(smellPatterns)) {
        if (pattern.test(line)) {
          issues.push({
            type: 'code-smell',
            severity: 'warning',
            message: `${smell}: ${line.trim()}`,
            line: index + 1,
            column: 0,
            rule: `smell-${smell.toLowerCase().replace(/\s+/g, '-')}`
          });
        }
      }
    });
    
    return issues;
  }

  private parseRefactoringOpportunities(output: string): any[] {
    const issues = [];
    const lines = output.split('\n');
    
    let currentOpportunity = null;
    for (const line of lines) {
      if (line.includes('REFACTOR:') || line.includes('OPPORTUNITY:')) {
        if (currentOpportunity) issues.push(currentOpportunity);
        currentOpportunity = {
          type: 'refactoring',
          severity: 'info',
          message: line.replace(/^.*?:\s*/, ''),
          line: 0,
          column: 0,
          rule: 'refactoring-opportunity'
        };
      } else if (currentOpportunity && line.includes('Line')) {
        const match = line.match(/Line\s+(\d+)/);
        if (match) currentOpportunity.line = parseInt(match[1]);
      } else if (currentOpportunity && line.includes('Priority:')) {
        const priorityMatch = line.match(/Priority:\s*(\w+)/i);
        if (priorityMatch && priorityMatch[1].toLowerCase() === 'high') {
          currentOpportunity.severity = 'warning';
        }
      }
    }
    
    if (currentOpportunity) issues.push(currentOpportunity);
    return issues;
  }

  private extractRefactoringSuggestions(output: string): string[] {
    const suggestions = [];
    const lines = output.split('\n');
    
    let inSuggestion = false;
    let currentSuggestion = '';
    
    lines.forEach(line => {
      if (line.includes('Suggestion:') || line.includes('Recommendation:')) {
        if (currentSuggestion) suggestions.push(currentSuggestion.trim());
        inSuggestion = true;
        currentSuggestion = line.replace(/^.*?:\s*/, '');
      } else if (inSuggestion && line.trim() === '') {
        suggestions.push(currentSuggestion.trim());
        inSuggestion = false;
        currentSuggestion = '';
      } else if (inSuggestion) {
        currentSuggestion += ' ' + line.trim();
      }
    });
    
    if (currentSuggestion) suggestions.push(currentSuggestion.trim());
    
    return suggestions;
  }

  private categorizeCodeSmells(issues: any[]): Record<string, number> {
    const categories = {};
    
    issues
      .filter(issue => issue.type === 'code-smell')
      .forEach(issue => {
        const category = issue.rule.replace('smell-', '');
        categories[category] = (categories[category] || 0) + 1;
      });
    
    return categories;
  }

  private calculateRefactoringPriority(issues: any[], complexity: any): string {
    const smellCount = issues.filter(i => i.type === 'code-smell').length;
    const refactorCount = issues.filter(i => i.type === 'refactoring').length;
    
    if (complexity.cyclomatic > 20 || complexity.cognitive > 30) return 'critical';
    if (smellCount > 5 || refactorCount > 10) return 'high';
    if (smellCount > 2 || refactorCount > 5) return 'medium';
    return 'low';
  }
}