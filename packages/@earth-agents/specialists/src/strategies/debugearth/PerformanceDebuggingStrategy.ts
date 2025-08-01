import { BaseStrategy } from '@earth-agents/debugearth';
import { SpecialistAgentAdapter } from '../../SpecialistAgentAdapter';
import { DebugContext, DebugResult } from '@earth-agents/types';

/**
 * Performance Debugging Strategy using Performance Engineer specialist
 */
export class PerformanceDebuggingStrategy extends BaseStrategy {
  private performanceEngineer: SpecialistAgentAdapter;
  private dataEngineer: SpecialistAgentAdapter;

  constructor() {
    super();
    this.performanceEngineer = new SpecialistAgentAdapter('performance-engineer');
    this.dataEngineer = new SpecialistAgentAdapter('data-engineer');
  }

  async analyze(context: DebugContext): Promise<DebugResult> {
    const { code, metrics, errorMessage, stackTrace } = context;

    // Check if this is a performance-related issue
    if (!this.isPerformanceIssue(errorMessage, metrics)) {
      return {
        success: true,
        findings: [],
        suggestions: []
      };
    }

    // Analyze performance with performance engineer
    const perfPrompt = `
Debug this performance issue:

Error: ${errorMessage}

${code ? `Code:
\`\`\`
${code}
\`\`\`` : ''}

${stackTrace ? `Stack Trace:
\`\`\`
${stackTrace}
\`\`\`` : ''}

${metrics ? `Performance Metrics:
${JSON.stringify(metrics, null, 2)}` : ''}

Analyze:
- Performance bottlenecks
- Memory usage patterns
- CPU consumption
- I/O operations
- Algorithm complexity
- Caching opportunities
- Database query performance

Provide specific optimization recommendations.
`;

    // If database-related, also analyze with data engineer
    let dataResult = null;
    if (this.isDatabaseRelated(errorMessage, code)) {
      const dataPrompt = `
Analyze database performance in this issue:

Error: ${errorMessage}
Code: ${code?.slice(0, 2000) || 'N/A'}

Focus on:
- Query optimization
- Index usage
- Connection pooling
- Transaction efficiency
- Data access patterns
`;

      dataResult = await this.dataEngineer.invoke(dataPrompt, context);
    }

    try {
      const perfResult = await this.performanceEngineer.invoke(perfPrompt, context);

      const bottlenecks = this.extractBottlenecks(perfResult.output);
      const optimizations = this.extractOptimizations(perfResult.output);

      const findings = [
        {
          type: 'performance-issue',
          severity: this.calculateSeverity(metrics),
          description: `Performance bottleneck detected: ${bottlenecks[0] || errorMessage}`,
          evidence: stackTrace || code?.slice(0, 500)
        },
        ...bottlenecks.slice(1).map(bottleneck => ({
          type: 'performance-bottleneck',
          severity: 'medium' as const,
          description: bottleneck,
          evidence: ''
        }))
      ];

      const allSuggestions = [
        ...optimizations,
        ...perfResult.suggestions || []
      ];

      if (dataResult) {
        allSuggestions.push(...dataResult.suggestions || []);
        findings.push({
          type: 'database-performance',
          severity: 'medium' as const,
          description: 'Database optimization opportunities identified',
          evidence: dataResult.output.slice(0, 200)
        });
      }

      return {
        success: true,
        findings,
        suggestions: allSuggestions,
        metadata: {
          performanceImpact: this.assessPerformanceImpact(metrics),
          optimizationPriority: this.calculateOptimizationPriority(bottlenecks),
          databaseOptimizations: dataResult?.suggestions
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Performance debugging failed: ${error.message}`,
        findings: [],
        suggestions: []
      };
    }
  }

  private isPerformanceIssue(errorMessage?: string, metrics?: any): boolean {
    const performanceKeywords = [
      'timeout', 'slow', 'performance', 'memory', 'cpu',
      'latency', 'response time', 'optimization', 'bottleneck',
      'heap', 'gc', 'garbage collection', 'leak'
    ];

    if (errorMessage) {
      const hasKeyword = performanceKeywords.some(keyword =>
        errorMessage.toLowerCase().includes(keyword)
      );
      if (hasKeyword) return true;
    }

    if (metrics) {
      // Check for performance-related metrics
      if (metrics.responseTime > 5000) return true;
      if (metrics.memoryUsage > 0.8) return true;
      if (metrics.cpuUsage > 0.9) return true;
    }

    return false;
  }

  private isDatabaseRelated(errorMessage?: string, code?: string): boolean {
    const dbKeywords = [
      'query', 'database', 'sql', 'connection', 'transaction',
      'index', 'join', 'select', 'insert', 'update'
    ];

    const text = `${errorMessage || ''} ${code || ''}`.toLowerCase();
    return dbKeywords.some(keyword => text.includes(keyword));
  }

  private extractBottlenecks(output: string): string[] {
    const bottlenecks = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.includes('Bottleneck:') || line.includes('BOTTLENECK:')) {
        bottlenecks.push(line.replace(/^.*?:\s*/, '').trim());
      } else if (line.includes('Performance issue:')) {
        bottlenecks.push(line.replace(/^.*?:\s*/, '').trim());
      }
    }

    return bottlenecks;
  }

  private extractOptimizations(output: string): string[] {
    const optimizations = [];
    const lines = output.split('\n');

    let inOptimizations = false;
    for (const line of lines) {
      if (line.includes('Optimization') || line.includes('Recommendation:')) {
        inOptimizations = true;
        if (line.includes(':')) {
          optimizations.push(line.replace(/^.*?:\s*/, '').trim());
        }
        continue;
      }
      if (inOptimizations && line.trim().match(/^\d+\.|^-|^\*/)) {
        optimizations.push(line.trim().replace(/^[\d+\.\-\*]\s*/, ''));
      } else if (inOptimizations && line.trim() === '') {
        break;
      }
    }

    return optimizations;
  }

  private calculateSeverity(metrics?: any): 'low' | 'medium' | 'high' | 'critical' {
    if (!metrics) return 'medium';

    if (metrics.responseTime > 10000 || metrics.memoryUsage > 0.95) {
      return 'critical';
    }
    if (metrics.responseTime > 5000 || metrics.memoryUsage > 0.8) {
      return 'high';
    }
    if (metrics.responseTime > 2000 || metrics.memoryUsage > 0.6) {
      return 'medium';
    }
    return 'low';
  }

  private assessPerformanceImpact(metrics?: any): string {
    if (!metrics) return 'unknown';

    const impacts = [];
    if (metrics.responseTime > 5000) impacts.push('high response time');
    if (metrics.memoryUsage > 0.8) impacts.push('high memory usage');
    if (metrics.cpuUsage > 0.9) impacts.push('high CPU usage');
    if (metrics.errorRate > 0.01) impacts.push('elevated error rate');

    return impacts.length > 0 ? impacts.join(', ') : 'minimal impact';
  }

  private calculateOptimizationPriority(bottlenecks: string[]): string {
    if (bottlenecks.length === 0) return 'low';
    if (bottlenecks.length >= 3) return 'high';
    if (bottlenecks.some(b => b.includes('critical') || b.includes('severe'))) {
      return 'critical';
    }
    return 'medium';
  }
}