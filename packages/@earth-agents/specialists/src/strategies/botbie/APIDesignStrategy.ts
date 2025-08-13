import { BaseStrategy } from '@earth-agents/botbie';
import { SpecialistAgentAdapter } from '../../SpecialistAgentAdapter';
import { CodeAnalysisContext, CodeAnalysisResult } from '@earth-agents/types';

/**
 * API Design Strategy using Backend Architect and API Designer specialists
 */
export class APIDesignStrategy extends BaseStrategy {
  private backendArchitect: SpecialistAgentAdapter;
  private apiDesigner: SpecialistAgentAdapter;

  constructor() {
    super();
    this.backendArchitect = new SpecialistAgentAdapter('backend-architect');
    this.apiDesigner = new SpecialistAgentAdapter('api-designer');
  }

  async analyze(context: CodeAnalysisContext): Promise<CodeAnalysisResult> {
    const { code, filePath, language } = context;

    // Check if code contains API definitions
    if (!this.containsAPIDefinitions(code)) {
      return {
        issues: [],
        metrics: {},
        suggestions: []
      };
    }

    // Analyze API design with backend architect
    const architectPrompt = `
Review the API design in this ${language} code for architectural best practices.

Focus on:
- RESTful design principles
- API versioning strategy
- Error handling patterns
- Authentication/authorization
- Rate limiting considerations
- Response consistency
- API documentation

Code:
\`\`\`${language}
${code}
\`\`\`

Provide specific recommendations for improving the API design.
`;

    // Analyze with API designer for usability
    const designerPrompt = `
Evaluate the API design for developer experience and usability.

Focus on:
- Endpoint naming conventions
- HTTP method usage
- Status code appropriateness
- Request/response schemas
- Pagination patterns
- Filtering and sorting
- API discoverability

Code:
\`\`\`${language}
${code}
\`\`\`
`;

    try {
      const [architectResult, designerResult] = await Promise.all([
        this.backendArchitect.invoke(architectPrompt, { filePath, language }),
        this.apiDesigner.invoke(designerPrompt, { filePath, language })
      ]);

      const issues = [
        ...this.parseAPIFindings(architectResult.output, 'architecture'),
        ...this.parseAPIFindings(designerResult.output, 'design')
      ];

      const endpoints = this.extractEndpoints(code);

      return {
        issues,
        metrics: {
          endpointCount: endpoints.length,
          restfulScore: this.calculateRESTfulScore(endpoints),
          consistencyScore: designerResult.metadata?.consistencyScore || 0
        },
        suggestions: [
          ...architectResult.suggestions || [],
          ...designerResult.suggestions || []
        ],
        metadata: {
          endpoints,
          apiVersion: this.detectAPIVersion(code)
        }
      };
    } catch (error) {
      return {
        issues: [],
        metrics: {},
        suggestions: [],
        error: `API design analysis failed: ${error.message}`
      };
    }
  }

  private containsAPIDefinitions(code: string): boolean {
    const apiPatterns = [
      /\b(app|router)\.(get|post|put|patch|delete|use)\(/i,
      /@(Get|Post|Put|Patch|Delete|RequestMapping)/i,
      /\b(endpoint|route|api|rest)\b/i,
      /\bResponse\b.*\bstatus\b/i
    ];
    
    return apiPatterns.some(pattern => pattern.test(code));
  }

  private extractEndpoints(code: string): any[] {
    const endpoints = [];
    const routePattern = /(?:app|router)\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
    const decoratorPattern = /@(Get|Post|Put|Patch|Delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
    
    let match;
    while ((match = routePattern.exec(code)) !== null) {
      endpoints.push({
        method: match[1].toUpperCase(),
        path: match[2],
        line: code.substring(0, match.index).split('\n').length
      });
    }
    
    while ((match = decoratorPattern.exec(code)) !== null) {
      endpoints.push({
        method: match[1].toUpperCase(),
        path: match[2],
        line: code.substring(0, match.index).split('\n').length
      });
    }
    
    return endpoints;
  }

  private calculateRESTfulScore(endpoints: any[]): number {
    if (endpoints.length === 0) return 0;
    
    let score = 100;
    const deductions = {
      nonRestfulVerb: 10,
      inconsistentNaming: 5,
      missingVersion: 15,
      poorResourceNaming: 10
    };
    
    endpoints.forEach(endpoint => {
      // Check for non-RESTful verbs in path
      if (/\/(get|create|update|delete|fetch)/i.test(endpoint.path)) {
        score -= deductions.nonRestfulVerb;
      }
      
      // Check for consistent naming
      if (endpoint.path.includes('_') && endpoint.path.includes('-')) {
        score -= deductions.inconsistentNaming;
      }
      
      // Check for poor resource naming
      if (!/^\/[a-z]+/.test(endpoint.path)) {
        score -= deductions.poorResourceNaming;
      }
    });
    
    return Math.max(0, score);
  }

  private detectAPIVersion(code: string): string | null {
    const versionPatterns = [
      /\/v(\d+)\//,
      /version\s*[:=]\s*['"`](\d+\.\d+)/i,
      /@Version\s*\(\s*['"`](\d+)/i
    ];
    
    for (const pattern of versionPatterns) {
      const match = code.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }

  private parseAPIFindings(output: string, type: string): any[] {
    const issues = [];
    const lines = output.split('\n');
    
    let currentIssue = null;
    for (const line of lines) {
      if (line.includes('ISSUE:') || line.includes('PROBLEM:') || line.includes('VIOLATION:')) {
        if (currentIssue) issues.push(currentIssue);
        currentIssue = {
          type: 'api-design',
          severity: 'warning',
          message: line.replace(/^.*?:\s*/, ''),
          line: 0,
          column: 0,
          rule: `api-${type}`
        };
      } else if (currentIssue && line.includes('Line')) {
        const match = line.match(/Line\s+(\d+)/);
        if (match) currentIssue.line = parseInt(match[1]);
      } else if (currentIssue && line.includes('Severity:')) {
        const severityMatch = line.match(/Severity:\s*(\w+)/i);
        if (severityMatch) {
          currentIssue.severity = severityMatch[1].toLowerCase();
        }
      }
    }
    
    if (currentIssue) issues.push(currentIssue);
    return issues;
  }
}