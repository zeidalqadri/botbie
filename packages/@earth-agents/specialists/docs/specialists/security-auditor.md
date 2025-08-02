# Security Auditor Specialist

The Security Auditor specialist provides comprehensive security analysis, vulnerability assessment, penetration testing guidance, and compliance validation for applications and infrastructure.

## 🛡️ Expertise Areas

### Core Focus Areas
- **Vulnerability Assessment** - OWASP Top 10, CWE analysis, security scanning
- **Penetration Testing** - Application security testing, infrastructure assessment
- **Code Security Review** - Static analysis, secure coding practices, security patterns
- **Compliance Auditing** - GDPR, PCI-DSS, HIPAA, SOC2, ISO 27001 compliance
- **Threat Modeling** - Risk assessment, attack surface analysis, threat identification
- **Security Architecture** - Defense-in-depth, zero-trust architecture, security controls

### Technical Approaches
- **Static Application Security Testing (SAST)** - Source code analysis, security rule enforcement
- **Dynamic Application Security Testing (DAST)** - Runtime vulnerability testing, black-box testing
- **Interactive Application Security Testing (IAST)** - Real-time security analysis during testing
- **Software Composition Analysis (SCA)** - Third-party dependency vulnerability scanning
- **Infrastructure Security** - Cloud security, container security, network security
- **Authentication & Authorization** - Identity management, access control, privilege escalation

### Deliverable Outputs
- **Security Assessment Reports** - Comprehensive vulnerability analysis and risk ratings
- **Penetration Test Reports** - Exploitation attempts, impact assessment, remediation steps
- **Compliance Reports** - Regulatory compliance status, gap analysis, improvement roadmap
- **Threat Models** - Attack vectors, risk matrices, mitigation strategies
- **Security Code Reviews** - Secure coding violations, fix recommendations, best practices
- **Security Architecture Reviews** - Design flaws, security controls evaluation, improvements

## 🔒 Usage Examples

### Comprehensive Security Audit

```typescript
import { getSpecialist, SpecialistAgentAdapter } from '@earth-agents/specialists';

const securityAuditor = getSpecialist('security-auditor');
const adapter = new SpecialistAgentAdapter(securityAuditor);
adapter.setTaskTool(taskTool);

// Comprehensive application security audit
const securityAudit = await adapter.invoke(
  'Perform comprehensive security audit of web application with OWASP Top 10 focus',
  {
    applicationType: 'web-application',
    framework: 'React + Node.js + Express',
    database: 'PostgreSQL',
    authentication: 'JWT with refresh tokens',
    deployment: 'AWS ECS with ALB',
    compliance: ['OWASP Top 10', 'CWE Top 25'],
    scope: [
      'authentication and session management',
      'input validation and sanitization',
      'SQL injection prevention',
      'XSS protection',
      'CSRF protection',
      'security headers',
      'dependency vulnerabilities',
      'infrastructure security'
    ],
    depth: 'comprehensive',
    includeRemediation: true
  }
);

console.log('Security Audit Results:', securityAudit.output);
```

### API Security Assessment

```typescript
// API-specific security analysis
const apiSecurity = await adapter.invoke(
  'Conduct security assessment of REST API with focus on authentication and authorization',
  {
    apiType: 'REST API',
    authentication: 'OAuth 2.0',
    authorization: 'RBAC',
    endpoints: [
      'POST /auth/login',
      'GET /users/{id}',
      'POST /users',
      'PUT /users/{id}',
      'DELETE /users/{id}',
      'GET /admin/reports'
    ],
    securityChecks: [
      'authentication bypass',
      'authorization flaws',
      'injection attacks',
      'rate limiting',
      'input validation',
      'error handling',
      'logging and monitoring'
    ],
    complianceStandards: ['OWASP API Security Top 10']
  }
);
```

### Infrastructure Security Review

```typescript
// Cloud infrastructure security assessment
const infraSecurity = await adapter.invoke(
  'Review cloud infrastructure security configuration and identify vulnerabilities',
  {
    cloudProvider: 'AWS',
    architecture: 'microservices',
    services: [
      'EC2 instances',
      'RDS databases',
      'S3 buckets',
      'Lambda functions',
      'API Gateway',
      'CloudFront',
      'VPC and subnets',
      'Security groups',
      'IAM roles and policies'
    ],
    securityAreas: [
      'network security',
      'access control',
      'data encryption',
      'monitoring and logging',
      'backup and recovery',
      'incident response'
    ],
    complianceRequirements: ['SOC2 Type II', 'PCI-DSS Level 1']
  }
);
```

### Dependency Security Scan

```typescript
// Third-party dependency vulnerability assessment
const dependencyScan = await adapter.invoke(
  'Analyze third-party dependencies for known vulnerabilities and security risks',
  {
    projectType: 'Node.js application',
    packageManager: 'npm',
    packageFiles: ['package.json', 'package-lock.json'],
    scope: [
      'known vulnerabilities (CVE database)',
      'license compliance',
      'malicious packages',
      'outdated dependencies',
      'dependency confusion risks',
      'supply chain security'
    ],
    riskTolerance: 'low',
    includeDevDependencies: true,
    generateSBOM: true // Software Bill of Materials
  }
);
```

## 🔧 Integration with Earth Agents

### Botbie Integration

The Security Auditor specialist integrates with Botbie through the **Security Audit Strategy**:

```typescript
// Security Audit Strategy usage
import { SecurityAuditStrategy } from '@earth-agents/specialists';

const strategy = new SecurityAuditStrategy();
const result = await strategy.analyze({
  projectPath: './web-application',
  focusAreas: ['owasp-top-10', 'authentication', 'data-protection'],
  complianceStandards: ['PCI-DSS', 'GDPR'],
  depth: 'comprehensive',
  includeInfrastructure: true
});

console.log('Security Issues:', result.issues);
console.log('Compliance Status:', result.compliance);
console.log('Remediation Plan:', result.remediationPlan);
```

### Workflow Integration

```yaml
# In workflow YAML - Enterprise Security Pipeline
- id: security-assessment
  name: Comprehensive Security Assessment
  type: specialist
  specialists:
    - name: security-auditor
      strategy: security-audit
      priority: 1
      required: true
      context:
        focus: comprehensive-audit
        standards:
          - OWASP-Top-10
          - CWE-Top-25
          - PCI-DSS
        checks:
          - authentication-security
          - authorization-security
          - input-validation
          - crypto-practices
    - name: network-architect
      strategy: network-security
      priority: 2
      required: false
      context:
        focus: infrastructure-security
        checks:
          - firewall-rules
          - network-segmentation
          - ssl-tls-config
  tasks:
    - agent: botbie
      action: performSecurityAudit
      inputs:
        specialists: ${node.specialists}
        projectPath: ${inputs.projectPath}
```

## 🎯 Common Use Cases

### 1. OWASP Top 10 Compliance Audit

**Scenario**: Ensure web application complies with OWASP Top 10 security risks.

**Context**:
```typescript
{
  auditType: 'OWASP Top 10 2021',
  application: 'e-commerce platform',
  technology: ['React', 'Node.js', 'PostgreSQL'],
  deploymentTarget: 'production',
  userBase: '100,000+ users',
  sensitiveData: 'payment information, personal data'
}
```

**Expected Output**:
- A01: Broken Access Control assessment
- A02: Cryptographic Failures analysis
- A03: Injection vulnerability testing
- A04: Insecure Design evaluation
- A05: Security Misconfiguration review
- A06: Vulnerable Components identification
- A07: Authentication Failures analysis
- A08: Software Integrity Failures check
- A09: Logging/Monitoring gaps assessment
- A10: Server-Side Request Forgery (SSRF) testing

### 2. PCI-DSS Compliance Assessment

**Scenario**: Validate payment processing system for PCI-DSS compliance.

**Context**:
```typescript
{
  complianceLevel: 'PCI-DSS Level 1',
  paymentProcessor: 'Stripe integration',
  cardDataHandling: 'tokenization',
  environment: 'cloud-hosted (AWS)',
  annualTransactions: '> 6 million',
  assessmentType: 'self-assessment'
}
```

**Expected Output**:
- Network security controls validation
- Cardholder data protection measures
- Access control implementation review
- Regular security testing procedures
- Information security policy compliance
- Vulnerability management program assessment

### 3. API Security Testing

**Scenario**: Security assessment of RESTful API before production deployment.

**Context**:
```typescript
{
  apiFramework: 'Express.js',
  authentication: 'JWT + OAuth2',
  authorization: 'role-based access control',
  dataTypes: 'user profiles, financial data',
  integrationsThirdParty: ['payment gateway', 'email service'],
  expectedLoad: '10,000 requests/minute'
}
```

**Expected Output**:
- Authentication mechanism security review
- Authorization bypass testing
- Input validation and injection testing
- Rate limiting and DDoS protection
- API versioning security implications
- Error handling and information disclosure

### 4. Container Security Assessment

**Scenario**: Security review of containerized application deployment.

**Context**:
```typescript
{
  containerPlatform: 'Docker + Kubernetes',
  baseImages: 'Alpine Linux, Node.js official',
  orchestration: 'AWS EKS',
  secrets: 'Kubernetes secrets + AWS Secrets Manager',
  networking: 'service mesh with Istio',
  monitoring: 'Prometheus + Grafana'
}
```

**Expected Output**:
- Container image vulnerability scanning
- Kubernetes security configuration review
- Network policy and segmentation analysis
- Secrets management security assessment
- Runtime security monitoring evaluation
- Supply chain security validation

## 📊 Security Metrics and Reporting

### Risk Assessment Matrix

```typescript
interface SecurityRisk {
  id: string;
  title: string;
  description: string;
  category: 'critical' | 'high' | 'medium' | 'low';
  cvssScore: number;
  impact: 'high' | 'medium' | 'low';
  likelihood: 'high' | 'medium' | 'low';
  riskRating: number;
  remediation: {
    effort: 'high' | 'medium' | 'low';
    timeline: string;
    priority: number;
    steps: string[];
  };
  compliance: {
    standard: string;
    requirement: string;
    status: 'compliant' | 'non-compliant' | 'partial';
  }[];
}
```

### Compliance Dashboard

```typescript
interface ComplianceStatus {
  standard: string;
  overallScore: number;
  requirements: {
    id: string;
    description: string;
    status: 'pass' | 'fail' | 'partial' | 'not-applicable';
    evidence: string[];
    gaps: string[];
    remediation: string[];
  }[];
  lastAssessment: Date;
  nextAssessment: Date;
  certificationStatus: 'certified' | 'in-progress' | 'expired' | 'not-certified';
}
```

## 🎯 Best Practices

### Context Preparation

1. **Provide Comprehensive Application Details**
   ```typescript
   const context = {
     applicationArchitecture: {
       frontend: 'React SPA',
       backend: 'Node.js REST API',
       database: 'PostgreSQL with Redis cache',
       authentication: 'JWT with refresh tokens',
       deployment: 'AWS ECS with Application Load Balancer'
     },
     dataClassification: [
       'PII (personally identifiable information)',
       'payment card data',
       'healthcare records',
       'financial transactions'
     ],
     regulatoryRequirements: ['GDPR', 'PCI-DSS', 'HIPAA'],
     threatModel: 'previous penetration test results available'
   };
   ```

2. **Include Infrastructure Context**
   ```typescript
   const context = {
     cloudProvider: 'AWS',
     networkArchitecture: 'VPC with public/private subnets',
     securityGroups: 'restrictive inbound/outbound rules',
     encryption: 'TLS 1.3 in transit, AES-256 at rest',
     monitoring: 'CloudTrail, GuardDuty, Security Hub',
     backupStrategy: 'automated daily backups with encryption'
   };
   ```

3. **Specify Compliance and Risk Requirements**
   ```typescript
   const context = {
     complianceFrameworks: [
       {
         name: 'PCI-DSS',
         level: 'Level 1',
         lastAssessment: '2023-01-15',
         nextAssessment: '2024-01-15'
       },
       {
         name: 'SOC2 Type II',
         focus: 'security and availability',
         auditor: 'Big Four accounting firm'
       }
     ],
     riskAppetite: 'low',
     businessCriticality: 'high',
     reputationalImpact: 'severe'
   };
   ```

### Prompt Guidelines

1. **Security Assessment Prompts**
   - Specify the type of assessment (vulnerability scan, penetration test, code review)
   - Include scope boundaries and any areas to exclude
   - Mention time constraints and resource limitations

2. **Compliance Audit Prompts**
   - Clearly state the compliance framework and version
   - Include current compliance status if known
   - Specify the target compliance level or certification

3. **Threat Modeling Prompts**
   - Describe the business context and valuable assets
   - Include known threats or previous incidents
   - Specify the threat modeling methodology preference (STRIDE, PASTA, etc.)

### Result Interpretation

1. **Vulnerability Prioritization**
   - Focus on critical and high-severity vulnerabilities first
   - Consider business context and asset value
   - Evaluate exploit likelihood and potential impact

2. **Compliance Gap Analysis**
   - Map findings to specific compliance requirements
   - Prioritize gaps that affect certification or audit outcomes
   - Plan remediation timeline based on compliance deadlines

3. **Security Architecture Recommendations**
   - Evaluate recommendations against current architecture
   - Consider implementation cost and complexity
   - Plan phased security improvements

## 🚨 Emergency Response

### Critical Security Issues

When the Security Auditor identifies critical security vulnerabilities:

1. **Immediate Actions**
   - Isolate affected systems if actively exploitable
   - Implement temporary mitigations
   - Document the vulnerability and impact

2. **Communication Protocol**
   - Notify security team and management immediately
   - Prepare stakeholder communication plan
   - Coordinate with legal and compliance teams if needed

3. **Remediation Planning**
   - Develop hotfix for critical vulnerabilities
   - Plan comprehensive security improvements
   - Schedule post-incident security review

### Incident Response Integration

```typescript
// Example: Automated security incident creation
const criticalFindings = securityAudit.issues.filter(
  issue => issue.severity === 'critical'
);

if (criticalFindings.length > 0) {
  await createSecurityIncident({
    title: `Critical Security Vulnerabilities Detected`,
    description: `Security audit identified ${criticalFindings.length} critical issues`,
    severity: 'critical',
    findings: criticalFindings,
    recommendedActions: securityAudit.recommendations,
    assignedTo: 'security-team',
    escalationRequired: true
  });
}
```

## 📚 Related Resources

### Documentation
- [API Reference](../api-reference.md)
- [Integration Guides](../integration-guides.md)
- [Network Architect Specialist](./network-architect.md)
- [Backend Architect Specialist](./backend-architect.md)

### Security Tools and Frameworks
- **SAST Tools**: SonarQube, Checkmarx, Veracode, Semgrep
- **DAST Tools**: OWASP ZAP, Burp Suite, Nessus, Rapid7
- **SCA Tools**: Snyk, WhiteSource, Black Duck, Sonatype
- **Cloud Security**: AWS Security Hub, Azure Security Center, GCP Security Command Center

### Compliance Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PCI-DSS Requirements](https://www.pcisecuritystandards.org/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [ISO 27001 Standard](https://www.iso.org/isoiec-27001-information-security.html)

### Training and Certifications
- **CISSP** - Certified Information Systems Security Professional
- **CISM** - Certified Information Security Manager
- **CEH** - Certified Ethical Hacker
- **OSCP** - Offensive Security Certified Professional

---

*The Security Auditor specialist provides enterprise-grade security expertise to identify vulnerabilities, ensure compliance, and strengthen your application's security posture. Use this specialist for comprehensive security assessments and regulatory compliance validation.* 🛡️🔒