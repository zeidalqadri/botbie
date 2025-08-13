import { BaseStrategy } from '@earth-agents/botbie';
import { SpecialistAgentAdapter } from '../../SpecialistAgentAdapter';
import { CodeAnalysisContext, CodeAnalysisResult } from '@earth-agents/types';

/**
 * Security Audit Strategy using Security Auditor specialist
 */
export class SecurityAuditStrategy extends BaseStrategy {
  private securityAuditor: SpecialistAgentAdapter;

  constructor() {
    super();
    this.securityAuditor = new SpecialistAgentAdapter('security-auditor');
  }

  async analyze(context: CodeAnalysisContext): Promise<CodeAnalysisResult> {
    const { code, filePath, language } = context;

    // Enhanced security audit prompt with Constitutional AI principles
    const prompt = `
You are a senior cybersecurity specialist conducting a comprehensive security audit. Your analysis should be helpful, harmless, and honest - providing accurate vulnerability assessments while avoiding any information that could be misused maliciously.

## SECURITY AUDIT REQUEST

**Target**: ${language} code from ${filePath}
**Objective**: Identify vulnerabilities and provide actionable remediation guidance

## ANALYSIS FRAMEWORK

Please analyze the code systematically using this chain-of-thought approach:

### Step 1: Initial Assessment
- Review the code structure and identify potential attack surfaces
- Consider the business context and data sensitivity
- Assess the overall security posture

### Step 2: OWASP Top 10 Analysis
Systematically check for each OWASP Top 10 vulnerability:
1. **A01: Broken Access Control** - Authorization bypasses, privilege escalation
2. **A02: Cryptographic Failures** - Weak encryption, exposed secrets, plain text data
3. **A03: Injection** - SQL, NoSQL, LDAP, OS command injection attacks
4. **A04: Insecure Design** - Design flaws, threat modeling gaps
5. **A05: Security Misconfiguration** - Default configs, unnecessary features
6. **A06: Vulnerable Components** - Outdated dependencies, known CVEs
7. **A07: Authentication Failures** - Weak auth, session management issues
8. **A08: Software Integrity Failures** - Unsigned code, insecure CI/CD
9. **A09: Logging/Monitoring Failures** - Insufficient logging, no alerting
10. **A10: Server-Side Request Forgery** - SSRF vulnerabilities

### Step 3: Additional Security Checks
- Input validation and sanitization effectiveness
- Error handling and information disclosure risks
- Security headers and browser protection mechanisms
- Rate limiting and DoS protection measures

### Step 4: Risk Assessment
For each finding, provide:
- **Severity**: Critical/High/Medium/Low with CVSS score
- **Impact**: Potential business and technical consequences
- **Exploitability**: How easily can this be exploited?
- **Compliance**: Relevant regulatory/standard violations

## CODE TO ANALYZE

\`\`\`${language}
${code}
\`\`\`

## REQUIRED OUTPUT FORMAT

Please structure your response as:

### 🚨 CRITICAL VULNERABILITIES (CVSS 9.0-10.0)
[List critical issues requiring immediate attention]

### ⚠️ HIGH PRIORITY VULNERABILITIES (CVSS 7.0-8.9)
[List high-severity issues to address within days]

### 📋 MEDIUM PRIORITY ISSUES (CVSS 4.0-6.9)
[List medium-severity issues for planned remediation]

### ℹ️ LOW PRIORITY / INFORMATIONAL (CVSS 0.1-3.9)
[List low-severity issues and best practice recommendations]

For each vulnerability, include:
- **Location**: Specific line numbers and code references
- **OWASP Category**: Which OWASP Top 10 category this falls under
- **Description**: Clear explanation of the vulnerability
- **Attack Vector**: How this could be exploited
- **Impact**: Potential consequences of successful exploitation
- **Remediation**: Specific, actionable fix with code examples
- **Prevention**: Best practices to prevent similar issues

## CONSTITUTIONAL AI PRINCIPLES

Please ensure your analysis:
- **Is Helpful**: Provides clear, actionable guidance for fixing vulnerabilities
- **Is Harmless**: Focuses on defensive security measures, not attack techniques
- **Is Honest**: Accurately assesses risk levels without false positives or fear-mongering
- **Promotes Security**: Encourages secure coding practices and security awareness

Focus on constructive remediation rather than exploitation techniques.
`;

    try {
      const result = await this.securityAuditor.invoke(prompt, {
        filePath,
        language,
        severity: 'high'
      });

      // Parse specialist results into Botbie format
      const issues = this.parseSecurityFindings(result.output);
      
      return {
        issues,
        metrics: {
          securityScore: result.metadata?.securityScore || 0,
          vulnerabilityCount: issues.length,
          criticalCount: issues.filter(i => i.severity === 'critical').length,
          highCount: issues.filter(i => i.severity === 'high').length
        },
        suggestions: result.suggestions || []
      };
    } catch (error) {
      return {
        issues: [],
        metrics: {},
        suggestions: [],
        error: `Security audit failed: ${error.message}`
      };
    }
  }

  private parseSecurityFindings(output: string): any[] {
    // Parse specialist output into structured issues
    const issues = [];
    const lines = output.split('\n');
    
    let currentIssue = null;
    for (const line of lines) {
      if (line.includes('VULNERABILITY:') || line.includes('SECURITY ISSUE:')) {
        if (currentIssue) issues.push(currentIssue);
        currentIssue = {
          type: 'security',
          severity: 'high',
          message: line.replace(/^.*?:\s*/, ''),
          line: 0,
          column: 0,
          rule: 'security-audit'
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