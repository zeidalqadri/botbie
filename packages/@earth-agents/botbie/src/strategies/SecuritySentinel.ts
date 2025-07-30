import { Strategy, StrategyResult, CodeNode, KnowledgeGraph } from '@earth-agents/core';
import { CodeIssue } from '../Botbie';
import { v4 as uuidv4 } from 'uuid';

export class SecuritySentinel implements Strategy {
  name = 'SecuritySentinel';
  description = 'Scans for security vulnerabilities and unsafe coding practices';

  private readonly sensitivePatterns = {
    hardcodedSecrets: [
      /api[_-]?key\s*[:=]\s*["'][\w\-]+["']/gi,
      /secret[_-]?key\s*[:=]\s*["'][\w\-]+["']/gi,
      /password\s*[:=]\s*["'][^"']+["']/gi,
      /token\s*[:=]\s*["'][\w\-]+["']/gi,
      /private[_-]?key\s*[:=]\s*["'][\w\-]+["']/gi,
      /aws[_-]?access[_-]?key[_-]?id\s*[:=]\s*["'][\w\-]+["']/gi,
      /aws[_-]?secret[_-]?access[_-]?key\s*[:=]\s*["'][\w\-]+["']/gi
    ],
    sqlInjection: [
      /query\s*\([^)]*\+[^)]*\)/gi,
      /execute\s*\([^)]*\$\{[^}]+\}[^)]*\)/gi,
      /raw\s*\([^)]*user[^)]*\)/gi,
      /where\s*\([^)]*\+[^)]*\)/gi
    ],
    xss: [
      /innerHTML\s*=\s*[^;]+user/gi,
      /document\.write\s*\([^)]*user/gi,
      /eval\s*\([^)]+\)/gi,
      /dangerouslySetInnerHTML/gi
    ],
    insecureRandom: [
      /Math\.random\s*\(\s*\)/g,
      /Date\.now\s*\(\s*\)/g
    ],
    insecureProtocol: [
      /http:\/\//gi,
      /ftp:\/\//gi
    ]
  };

  async execute(context: { graph: KnowledgeGraph; config?: any }): Promise<StrategyResult> {
    const findings: CodeIssue[] = [];

    try {
      const nodes = Array.from(context.graph['graph'].nodes.values()) as CodeNode[];

      for (const node of nodes) {
        // Check for hardcoded secrets
        const secretIssues = this.checkHardcodedSecrets(node);
        findings.push(...secretIssues);

        // Check for SQL injection vulnerabilities
        const sqlIssues = this.checkSQLInjection(node);
        findings.push(...sqlIssues);

        // Check for XSS vulnerabilities
        const xssIssues = this.checkXSS(node);
        findings.push(...xssIssues);

        // Check for insecure randomness
        const randomIssues = this.checkInsecureRandom(node);
        findings.push(...randomIssues);

        // Check for insecure protocols
        const protocolIssues = this.checkInsecureProtocols(node);
        findings.push(...protocolIssues);

        // Check authentication/authorization issues
        const authIssues = this.checkAuthIssues(node);
        findings.push(...authIssues);

        // Check for path traversal
        const pathIssues = this.checkPathTraversal(node);
        findings.push(...pathIssues);
      }

      // Check for missing security headers (in configuration files)
      const headerIssues = this.checkSecurityHeaders(context.graph);
      findings.push(...headerIssues);

      return {
        success: true,
        findings,
        suggestions: this.generateSecuritySuggestions(findings),
        confidence: 0.9
      };
    } catch (error) {
      return {
        success: false,
        findings: [],
        suggestions: [`Failed to analyze security: ${error}`],
        confidence: 0
      };
    }
  }

  canHandle(context: any): boolean {
    return context.graph && context.graph.getStatistics().totalNodes > 0;
  }

  private checkHardcodedSecrets(node: CodeNode): CodeIssue[] {
    const issues: CodeIssue[] = [];

    this.sensitivePatterns.hardcodedSecrets.forEach((pattern: RegExp) => {
      const matches = node.content.match(pattern);
      if (matches) {
        matches.forEach((match: string) => {
          // Skip if it's a placeholder or example
          if (match.includes('YOUR_') || match.includes('XXXX') || match.includes('example')) {
            return;
          }

          issues.push({
            id: uuidv4(),
            type: 'hardcoded-secret',
            severity: 'critical',
            file: node.filePath,
            line: this.findLineNumber(node, match),
            description: `Hardcoded secret detected: ${this.sanitizeSecret(match)}`,
            suggestion: 'Use environment variables or secure secret management systems',
            autoFixAvailable: true
          });
        });
      }
    });

    return issues;
  }

  private checkSQLInjection(node: CodeNode): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Skip if not in a file that likely handles database operations
    if (!this.isDataHandlingFile(node.filePath)) return issues;

    this.sensitivePatterns.sqlInjection.forEach((pattern: RegExp) => {
      const matches = node.content.match(pattern);
      if (matches) {
        matches.forEach((match: string) => {
          issues.push({
            id: uuidv4(),
            type: 'sql-injection',
            severity: 'critical',
            file: node.filePath,
            line: this.findLineNumber(node, match),
            description: 'Potential SQL injection vulnerability detected',
            suggestion: 'Use parameterized queries or prepared statements',
            autoFixAvailable: false
          });
        });
      }
    });

    // Check for string concatenation in SQL contexts
    const sqlContextPattern = /\b(query|execute|select|insert|update|delete|where)\s*\([^)]*\+[^)]*\)/gi;
    const contextMatches = node.content.match(sqlContextPattern);
    if (contextMatches) {
      contextMatches.forEach((match: string) => {
        issues.push({
          id: uuidv4(),
          type: 'sql-injection',
          severity: 'high',
          file: node.filePath,
          line: this.findLineNumber(node, match),
          description: 'String concatenation in SQL query',
          suggestion: 'Use parameterized queries instead of string concatenation'
        });
      });
    }

    return issues;
  }

  private checkXSS(node: CodeNode): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Skip if not in a frontend file
    if (!this.isFrontendFile(node.filePath)) return issues;

    this.sensitivePatterns.xss.forEach((pattern: RegExp) => {
      const matches = node.content.match(pattern);
      if (matches) {
        matches.forEach((match: string) => {
          issues.push({
            id: uuidv4(),
            type: 'xss-vulnerability',
            severity: 'high',
            file: node.filePath,
            line: this.findLineNumber(node, match),
            description: `Potential XSS vulnerability: ${match.substring(0, 50)}...`,
            suggestion: 'Sanitize user input and use safe DOM manipulation methods',
            autoFixAvailable: false
          });
        });
      }
    });

    // Check for unsafe React patterns
    if (node.filePath.includes('.tsx') || node.filePath.includes('.jsx')) {
      const dangerousPattern = /dangerouslySetInnerHTML\s*=\s*\{\s*\{[^}]+\}\s*\}/gi;
      const dangerousMatches = node.content.match(dangerousPattern);
      if (dangerousMatches) {
        dangerousMatches.forEach((match: string) => {
          issues.push({
            id: uuidv4(),
            type: 'react-xss',
            severity: 'medium',
            file: node.filePath,
            line: this.findLineNumber(node, match),
            description: 'Using dangerouslySetInnerHTML without sanitization',
            suggestion: 'Sanitize content with DOMPurify or similar before using dangerouslySetInnerHTML'
          });
        });
      }
    }

    return issues;
  }

  private checkInsecureRandom(node: CodeNode): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Check if this is a security-sensitive context
    const securityContext = /password|token|secret|key|salt|nonce|iv/i;
    if (!securityContext.test(node.content)) return issues;

    this.sensitivePatterns.insecureRandom.forEach((pattern: RegExp) => {
      const matches = node.content.match(pattern);
      if (matches) {
        matches.forEach((match: string) => {
          issues.push({
            id: uuidv4(),
            type: 'insecure-random',
            severity: 'high',
            file: node.filePath,
            line: this.findLineNumber(node, match),
            description: 'Using insecure random number generation for security-sensitive operations',
            suggestion: 'Use crypto.randomBytes() or similar cryptographically secure methods'
          });
        });
      }
    });

    return issues;
  }

  private checkInsecureProtocols(node: CodeNode): CodeIssue[] {
    const issues: CodeIssue[] = [];

    this.sensitivePatterns.insecureProtocol.forEach((pattern: RegExp) => {
      const matches = node.content.match(pattern);
      if (matches) {
        matches.forEach((match: string) => {
          // Skip localhost/development URLs
          if (match.includes('localhost') || match.includes('127.0.0.1')) return;

          issues.push({
            id: uuidv4(),
            type: 'insecure-protocol',
            severity: 'medium',
            file: node.filePath,
            line: this.findLineNumber(node, match),
            description: `Insecure protocol used: ${match}`,
            suggestion: 'Use HTTPS instead of HTTP for secure communication',
            autoFixAvailable: true
          });
        });
      }
    });

    return issues;
  }

  private checkAuthIssues(node: CodeNode): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Check for missing authentication
    const routePattern = /\.(get|post|put|delete|patch)\s*\([^)]+\)/gi;
    const routes = node.content.match(routePattern);
    
    if (routes) {
      routes.forEach((route: string) => {
        // Check if route has authentication middleware
        const hasAuth = /auth|authenticate|requireAuth|isAuthenticated|jwt|token/i.test(route);
        const isSensitive = /admin|user|profile|account|settings|delete|update/i.test(route);
        
        if (isSensitive && !hasAuth) {
          issues.push({
            id: uuidv4(),
            type: 'missing-auth',
            severity: 'high',
            file: node.filePath,
            line: this.findLineNumber(node, route),
            description: 'Potentially sensitive route without authentication',
            suggestion: 'Add authentication middleware to protect this route'
          });
        }
      });
    }

    // Check for weak password validation
    const passwordValidation = /password.*length.*[<>]\s*(\d+)/gi;
    const passwordChecks = node.content.match(passwordValidation);
    
    if (passwordChecks) {
      passwordChecks.forEach((check: string) => {
        const lengthMatch = check.match(/\d+/);
        if (lengthMatch && parseInt(lengthMatch[0]) < 8) {
          issues.push({
            id: uuidv4(),
            type: 'weak-password-policy',
            severity: 'medium',
            file: node.filePath,
            line: this.findLineNumber(node, check),
            description: 'Weak password policy detected',
            suggestion: 'Require passwords to be at least 8 characters with complexity requirements'
          });
        }
      });
    }

    return issues;
  }

  private checkPathTraversal(node: CodeNode): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Check for path traversal vulnerabilities
    const pathPatterns = [
      /path\.join\s*\([^)]*req\./gi,
      /readFile\s*\([^)]*req\./gi,
      /createReadStream\s*\([^)]*req\./gi,
      /\.\.\//g  // Direct path traversal attempts
    ];

    pathPatterns.forEach((pattern: RegExp) => {
      const matches = node.content.match(pattern);
      if (matches) {
        matches.forEach((match: string) => {
          // Check if there's validation
          const hasValidation = /normalize|resolve|sanitize|validate/i.test(
            node.content.substring(Math.max(0, node.content.indexOf(match) - 100), node.content.indexOf(match) + 100)
          );

          if (!hasValidation) {
            issues.push({
              id: uuidv4(),
              type: 'path-traversal',
              severity: 'high',
              file: node.filePath,
              line: this.findLineNumber(node, match),
              description: 'Potential path traversal vulnerability',
              suggestion: 'Validate and sanitize file paths, use path.resolve() and check against allowed directories'
            });
          }
        });
      }
    });

    return issues;
  }

  private checkSecurityHeaders(graph: KnowledgeGraph): CodeIssue[] {
    const issues: CodeIssue[] = [];
    
    // Look for configuration files
    const configFiles = (Array.from(graph['graph'].nodes.values()) as CodeNode[])
      .filter((node: CodeNode) => 
        node.filePath.includes('config') || 
        node.filePath.includes('server') ||
        node.filePath.includes('app.js') ||
        node.filePath.includes('app.ts')
      );

    const requiredHeaders = [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'X-XSS-Protection'
    ];

    configFiles.forEach((file: CodeNode) => {
      requiredHeaders.forEach((header: string) => {
        if (!file.content.includes(header)) {
          issues.push({
            id: uuidv4(),
            type: 'missing-security-header',
            severity: 'medium',
            file: file.filePath,
            description: `Missing security header: ${header}`,
            suggestion: `Add ${header} header to improve security`
          });
        }
      });
    });

    return issues;
  }

  private isDataHandlingFile(filePath: string): boolean {
    const dataPatterns = ['repository', 'dao', 'database', 'query', 'model', 'service'];
    return dataPatterns.some(pattern => filePath.toLowerCase().includes(pattern));
  }

  private isFrontendFile(filePath: string): boolean {
    const frontendExt = ['.jsx', '.tsx', '.vue', '.html', '.ejs', '.pug'];
    return frontendExt.some(ext => filePath.endsWith(ext));
  }

  private findLineNumber(node: CodeNode, match: string): number {
    const lines = node.content.substring(0, node.content.indexOf(match)).split('\n');
    return node.startLine + lines.length - 1;
  }

  private sanitizeSecret(secret: string): string {
    // Show only the type of secret, not the actual value
    const type = secret.split(/[:=]/)[0].trim();
    return `${type}=***`;
  }

  private generateSecuritySuggestions(issues: CodeIssue[]): string[] {
    const suggestions: string[] = [];

    if (issues.filter(i => i.type === 'hardcoded-secret').length > 0) {
      suggestions.push('Implement a secure secret management system (e.g., HashiCorp Vault, AWS Secrets Manager)');
    }

    if (issues.filter(i => i.type === 'sql-injection').length > 0) {
      suggestions.push('Use an ORM or query builder that supports parameterized queries');
    }

    if (issues.filter(i => i.type.includes('xss')).length > 0) {
      suggestions.push('Implement Content Security Policy (CSP) headers');
      suggestions.push('Use a templating engine that auto-escapes output');
    }

    if (issues.filter(i => i.type === 'missing-auth').length > 0) {
      suggestions.push('Implement a centralized authentication middleware');
    }

    if (issues.filter(i => i.severity === 'critical').length > 0) {
      suggestions.push('Consider running a security audit and penetration testing');
    }

    return suggestions;
  }
}