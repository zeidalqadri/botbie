import { BaseStrategy } from '@earth-agents/botbie';
import { SpecialistAgentAdapter } from '../../SpecialistAgentAdapter';
import { CodeAnalysisContext, CodeAnalysisResult } from '@earth-agents/types';

/**
 * Database Optimization Strategy using Data Engineer specialist
 */
export class DatabaseOptimizationStrategy extends BaseStrategy {
  private dataEngineer: SpecialistAgentAdapter;
  private performanceEngineer: SpecialistAgentAdapter;

  constructor() {
    super();
    this.dataEngineer = new SpecialistAgentAdapter('data-engineer');
    this.performanceEngineer = new SpecialistAgentAdapter('performance-engineer');
  }

  async analyze(context: CodeAnalysisContext): Promise<CodeAnalysisResult> {
    const { code, filePath, language } = context;

    // Check if code contains database operations
    if (!this.containsDatabaseOperations(code)) {
      return {
        issues: [],
        metrics: {},
        suggestions: []
      };
    }

    // Analyze with data engineer for schema and query optimization
    const dataPrompt = `
Analyze the following ${language} code for database optimization opportunities.

Focus on:
- Query performance and efficiency
- Index usage and optimization
- Schema design improvements
- N+1 query problems
- Connection pooling
- Transaction management
- Data access patterns

Code:
\`\`\`${language}
${code}
\`\`\`

Provide specific optimization recommendations with examples.
`;

    // Analyze with performance engineer for runtime optimization
    const perfPrompt = `
Analyze database performance aspects in this ${language} code:

Focus on:
- Query execution time optimization
- Caching strategies
- Batch processing opportunities
- Async/await patterns
- Connection management
- Memory usage

Code:
\`\`\`${language}
${code}
\`\`\`
`;

    try {
      const [dataResult, perfResult] = await Promise.all([
        this.dataEngineer.invoke(dataPrompt, { filePath, language }),
        this.performanceEngineer.invoke(perfPrompt, { filePath, language })
      ]);

      const issues = [
        ...this.parseOptimizationFindings(dataResult.output, 'schema'),
        ...this.parseOptimizationFindings(perfResult.output, 'performance')
      ];

      return {
        issues,
        metrics: {
          queryCount: this.countQueries(code),
          optimizationScore: dataResult.metadata?.score || 0,
          performanceImpact: perfResult.metadata?.impact || 'medium'
        },
        suggestions: [
          ...dataResult.suggestions || [],
          ...perfResult.suggestions || []
        ]
      };
    } catch (error) {
      return {
        issues: [],
        metrics: {},
        suggestions: [],
        error: `Database optimization analysis failed: ${error.message}`
      };
    }
  }

  private containsDatabaseOperations(code: string): boolean {
    const dbPatterns = [
      /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN)\b/i,
      /\.(find|findOne|create|update|delete|save|query)\(/,
      /\b(mongoose|sequelize|typeorm|prisma|knex)\b/i,
      /\b(db|database|sql|query|collection)\b/i
    ];
    
    return dbPatterns.some(pattern => pattern.test(code));
  }

  private countQueries(code: string): number {
    const queryPatterns = [
      /\b(SELECT|INSERT|UPDATE|DELETE)\b/gi,
      /\.(find|findOne|create|update|delete|save|query)\(/g
    ];
    
    let count = 0;
    queryPatterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) count += matches.length;
    });
    
    return count;
  }

  private parseOptimizationFindings(output: string, type: string): any[] {
    const issues = [];
    const lines = output.split('\n');
    
    let currentIssue = null;
    for (const line of lines) {
      if (line.includes('OPTIMIZATION:') || line.includes('ISSUE:')) {
        if (currentIssue) issues.push(currentIssue);
        currentIssue = {
          type: 'optimization',
          severity: 'warning',
          message: line.replace(/^.*?:\s*/, ''),
          line: 0,
          column: 0,
          rule: `db-${type}`
        };
      } else if (currentIssue && line.includes('Line')) {
        const match = line.match(/Line\s+(\d+)/);
        if (match) currentIssue.line = parseInt(match[1]);
      } else if (currentIssue && line.includes('Impact:')) {
        const impactMatch = line.match(/Impact:\s*(\w+)/i);
        if (impactMatch && impactMatch[1].toLowerCase() === 'high') {
          currentIssue.severity = 'error';
        }
      }
    }
    
    if (currentIssue) issues.push(currentIssue);
    return issues;
  }
}