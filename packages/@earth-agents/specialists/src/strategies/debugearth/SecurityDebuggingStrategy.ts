import { BaseStrategy } from '@earth-agents/debugearth';
import { SpecialistAgentAdapter } from '../../SpecialistAgentAdapter';
import { DebugContext, DebugResult } from '@earth-agents/types';

/**
 * Security Debugging Strategy using Security Auditor specialist
 */
export class SecurityDebuggingStrategy extends BaseStrategy {
  private securityAuditor: SpecialistAgentAdapter;
  private networkArchitect: SpecialistAgentAdapter;

  constructor() {
    super();
    this.securityAuditor = new SpecialistAgentAdapter('security-auditor');
    this.networkArchitect = new SpecialistAgentAdapter('network-architect');
  }

  async analyze(context: DebugContext): Promise<DebugResult> {
    const { errorMessage, logs, code, environment } = context;

    // Check if this is a security-related issue
    if (!this.isSecurityIssue(errorMessage, logs)) {
      return {
        success: true,
        findings: [],
        suggestions: []
      };
    }

    // Analyze security with security auditor
    const securityPrompt = `
Investigate this security-related issue:

Error: ${errorMessage}
Environment: ${environment || 'production'}

${logs ? `Logs:
\`\`\`
${logs.slice(0, 3000)}
\`\`\`` : ''}

${code ? `Related Code:
\`\`\`
${code.slice(0, 2000)}
\`\`\`` : ''}

Analyze for:
- Authentication/authorization failures
- Input validation vulnerabilities
- Injection attacks (SQL, XSS, etc.)
- CSRF attacks
- Security misconfigurations
- Sensitive data exposure
- Cryptographic failures

Provide immediate containment steps and remediation actions.
`;

    // If network-related, also analyze with network architect
    let networkResult = null;
    if (this.isNetworkSecurityIssue(errorMessage, logs)) {
      const networkPrompt = `
Analyze network security aspects of this issue:

Error: ${errorMessage}
Logs: ${logs?.slice(0, 1500) || 'N/A'}

Focus on:
- Network intrusion attempts
- DDoS patterns
- Firewall rule violations
- VPN security issues
- Load balancer security
- CDN security configurations
`;

      networkResult = await this.networkArchitect.invoke(networkPrompt, context);
    }

    try {
      const securityResult = await this.securityAuditor.invoke(securityPrompt, context);

      const threats = this.extractSecurityThreats(securityResult.output);
      const containmentSteps = this.extractContainmentSteps(securityResult.output);
      const remediationActions = this.extractRemediationActions(securityResult.output);

      const findings = [
        {
          type: 'security-incident',
          severity: this.calculateSecuritySeverity(threats),
          description: `Security issue detected: ${threats[0] || errorMessage}`,
          evidence: logs?.slice(0, 500) || code?.slice(0, 500)
        },
        ...threats.slice(1).map(threat => ({
          type: 'security-threat',
          severity: 'high' as const,
          description: threat,
          evidence: ''
        }))
      ];

      const allSuggestions = [
        ...containmentSteps.map(step => `URGENT: ${step}`),
        ...remediationActions,
        ...securityResult.suggestions || []
      ];

      if (networkResult) {
        allSuggestions.push(...networkResult.suggestions || []);
        findings.push({
          type: 'network-security',
          severity: 'high' as const,
          description: 'Network security vulnerabilities identified',
          evidence: networkResult.output.slice(0, 200)
        });
      }

      return {
        success: true,
        findings,
        suggestions: allSuggestions,
        metadata: {
          securityLevel: this.assessSecurityLevel(threats),
          requiresImmediateAction: containmentSteps.length > 0,
          affectedSystems: this.identifyAffectedSystems(logs),
          networkSecurityIssues: networkResult?.suggestions
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Security debugging failed: ${error.message}`,
        findings: [],
        suggestions: []
      };
    }
  }

  private isSecurityIssue(errorMessage?: string, logs?: string): boolean {
    const securityKeywords = [
      'unauthorized', 'forbidden', 'authentication', 'authorization',
      'security', 'vulnerability', 'attack', 'breach', 'intrusion',
      'injection', 'xss', 'csrf', 'malicious', 'suspicious',
      'blocked', 'denied', 'threat', 'exploit'
    ];

    const text = `${errorMessage || ''} ${logs || ''}`.toLowerCase();
    return securityKeywords.some(keyword => text.includes(keyword));
  }

  private isNetworkSecurityIssue(errorMessage?: string, logs?: string): boolean {
    const networkKeywords = [
      'ddos', 'firewall', 'intrusion', 'scan', 'probe',
      'blocked ip', 'rate limit', 'traffic', 'connection refused',
      'network', 'port', 'protocol'
    ];

    const text = `${errorMessage || ''} ${logs || ''}`.toLowerCase();
    return networkKeywords.some(keyword => text.includes(keyword));
  }

  private extractSecurityThreats(output: string): string[] {
    const threats = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.includes('Threat:') || line.includes('THREAT:')) {
        threats.push(line.replace(/^.*?:\s*/, '').trim());
      } else if (line.includes('Vulnerability:') || line.includes('Attack:')) {
        threats.push(line.replace(/^.*?:\s*/, '').trim());
      }
    }

    return threats;
  }

  private extractContainmentSteps(output: string): string[] {
    const steps = [];
    const lines = output.split('\n');

    let inContainment = false;
    for (const line of lines) {
      if (line.includes('Containment') || line.includes('Immediate') || line.includes('URGENT')) {
        inContainment = true;
        if (line.includes(':')) {
          steps.push(line.replace(/^.*?:\s*/, '').trim());
        }
        continue;
      }
      if (inContainment && line.trim().match(/^\d+\.|^-|^\*/)) {
        steps.push(line.trim().replace(/^[\d+\.\-\*]\s*/, ''));
      } else if (inContainment && line.trim() === '') {
        break;
      }
    }

    return steps;
  }

  private extractRemediationActions(output: string): string[] {
    const actions = [];
    const lines = output.split('\n');

    let inRemediation = false;
    for (const line of lines) {
      if (line.includes('Remediation') || line.includes('Fix:') || line.includes('Resolution:')) {
        inRemediation = true;
        if (line.includes(':')) {
          actions.push(line.replace(/^.*?:\s*/, '').trim());
        }
        continue;
      }
      if (inRemediation && line.trim().match(/^\d+\.|^-|^\*/)) {
        actions.push(line.trim().replace(/^[\d+\.\-\*]\s*/, ''));
      } else if (inRemediation && line.trim() === '') {
        break;
      }
    }

    return actions;
  }

  private calculateSecuritySeverity(threats: string[]): 'low' | 'medium' | 'high' | 'critical' {
    if (threats.length === 0) return 'medium';

    const criticalKeywords = ['breach', 'injection', 'rce', 'privilege escalation'];
    const highKeywords = ['xss', 'csrf', 'unauthorized access', 'data exposure'];

    const threatText = threats.join(' ').toLowerCase();

    if (criticalKeywords.some(keyword => threatText.includes(keyword))) {
      return 'critical';
    }
    if (highKeywords.some(keyword => threatText.includes(keyword))) {
      return 'high';
    }
    if (threats.length >= 2) {
      return 'high';
    }
    return 'medium';
  }

  private assessSecurityLevel(threats: string[]): string {
    if (threats.length === 0) return 'low-risk';
    if (threats.length >= 3) return 'high-risk';
    
    const riskIndicators = threats.join(' ').toLowerCase();
    if (riskIndicators.includes('critical') || riskIndicators.includes('severe')) {
      return 'critical-risk';
    }
    
    return 'medium-risk';
  }

  private identifyAffectedSystems(logs?: string): string[] {
    if (!logs) return [];

    const systems = [];
    const systemPatterns = [
      /database/i,
      /api/i,
      /authentication/i,
      /payment/i,
      /user/i,
      /admin/i
    ];

    systemPatterns.forEach(pattern => {
      if (pattern.test(logs)) {
        const match = pattern.source.toLowerCase().replace(/[^a-z]/g, '');
        if (!systems.includes(match)) {
          systems.push(match);
        }
      }
    });

    return systems;
  }
}