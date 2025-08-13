# Earth Agents Specialist Integration Guides

Step-by-step guides for integrating specialists into Earth Agents workflows and applications.

## 📚 Table of Contents

- [Workflow Integration](#workflow-integration)
- [Earth Agent Integration](#earth-agent-integration)
- [Custom Strategy Development](#custom-strategy-development)
- [Slash Command Integration](#slash-command-integration)
- [Advanced Patterns](#advanced-patterns)
- [Troubleshooting](#troubleshooting)

## 🔄 Workflow Integration

### Basic Workflow Specialist Node

Add specialist nodes to your YAML workflows for enhanced capabilities.

#### Single Specialist Integration

```yaml
nodes:
  - id: code-review
    name: Code Review with Expert Analysis
    type: specialist
    specialists:
      - name: senior-code-reviewer
        strategy: comprehensive-review
        priority: 1
        required: true
        context:
          focus: security-and-performance
          language: typescript
          framework: react
    tasks:
      - agent: botbie
        action: analyzeCode
        inputs:
          specialists: ${node.specialists}
          filePath: ${inputs.filePath}
```

#### Multiple Specialists Integration

```yaml
nodes:
  - id: security-audit
    name: Multi-Specialist Security Audit
    type: specialist
    specialists:
      - name: security-auditor
        strategy: security-audit
        priority: 1
        required: true
        context:
          focus: owasp-compliance
          depth: comprehensive
      - name: network-architect
        strategy: network-security
        priority: 2
        required: false
        context:
          focus: infrastructure-security
      - name: database-architect
        strategy: data-security
        priority: 3
        required: false
        context:
          focus: sql-injection-prevention
    tasks:
      - agent: botbie
        action: performSecurityAudit
        inputs:
          specialists: ${node.specialists}
          targetPath: ${inputs.projectPath}
```

#### Conditional Specialist Execution

```yaml
nodes:
  - id: performance-optimization
    name: Performance Optimization
    type: specialist
    conditions:
      - field: inputs.performanceIssues
        operator: equals
        value: true
        action: continue
    specialists:
      - name: performance-engineer
        strategy: performance-debugging
        priority: 1
        required: true
        context:
          focus: bottleneck-identification
          target: web-application
      - name: database-architect
        strategy: query-optimization
        priority: 2
        required: false
        context:
          focus: database-performance
          database: ${inputs.databaseType}
```

### Workflow Configuration Options

#### Specialist Context Configuration

```yaml
specialists:
  - name: frontend-developer
    strategy: component-development
    priority: 1
    required: true
    context:
      framework: ${inputs.framework || 'react'}
      styling: ${inputs.styling || 'tailwind'}
      testing: ${inputs.includeTests || true}
      accessibility: ${inputs.a11yCompliance || 'wcag-aa'}
      performance: ${inputs.optimizeForPerformance || true}
```

#### Timeout and Retry Configuration

```yaml
specialists:
  - name: ai-researcher
    strategy: research-analysis
    priority: 1
    required: true
    timeout: 60000  # 1 minute
    retries: 2
    context:
      research_depth: comprehensive
      include_citations: true
```

#### Parallel vs Sequential Execution

```yaml
# Parallel execution (default for multiple specialists)
specialists:
  - name: ui-ux-designer
    strategy: design-review
    priority: 1
    required: true
  - name: accessibility-specialist
    strategy: a11y-audit
    priority: 1  # Same priority = parallel
    required: true

# Sequential execution
specialists:
  - name: backend-architect
    strategy: api-design
    priority: 1
    required: true
  - name: security-auditor
    strategy: security-review
    priority: 2  # Higher priority = runs after
    required: true
```

## 🤖 Earth Agent Integration

### Botbie Integration Example

```typescript
import { SpecialistAgentAdapter, getSpecialist } from '@earth-agents/specialists';

export class BobbieAgent {
  private specialists: Map<string, SpecialistAgentAdapter> = new Map();
  
  constructor(private taskTool: any) {
    this.initializeSpecialists();
  }
  
  private initializeSpecialists() {
    const specialistNames = [
      'senior-code-reviewer',
      'security-auditor',
      'performance-engineer',
      'backend-architect',
      'test-engineer'
    ];
    
    specialistNames.forEach(name => {
      const specialist = getSpecialist(name);
      if (specialist) {
        const adapter = new SpecialistAgentAdapter(specialist);
        adapter.setTaskTool(this.taskTool);
        this.specialists.set(name, adapter);
      }
    });
  }
  
  async performCodeReview(filePath: string, options: CodeReviewOptions) {
    const codeReviewer = this.specialists.get('senior-code-reviewer');
    if (!codeReviewer) {
      throw new Error('Code reviewer specialist not available');
    }
    
    const context = {
      filePath,
      language: this.detectLanguage(filePath),
      focusAreas: options.focusAreas || ['quality', 'security', 'performance'],
      strictMode: options.strictMode || false
    };
    
    const result = await codeReviewer.invoke(
      'Perform comprehensive code review with actionable feedback',
      context
    );
    
    return this.processReviewResult(result);
  }
  
  async performSecurityAudit(projectPath: string) {
    const securityAuditor = this.specialists.get('security-auditor');
    if (!securityAuditor) {
      throw new Error('Security auditor specialist not available');
    }
    
    return await securityAuditor.invoke(
      'Conduct comprehensive security audit with OWASP compliance check',
      {
        projectPath,
        standards: ['owasp-top-10', 'cwe-top-25'],
        includeInfrastructure: true,
        generateReport: true
      }
    );
  }
}
```

### DebugEarth Integration Example

```typescript
import { DeepDebugStrategy, SystemAnalysisStrategy } from '@earth-agents/specialists';

export class DebugEarthAgent {
  private strategies: Map<string, any> = new Map();
  
  constructor(private taskTool: any) {
    this.initializeStrategies();
  }
  
  private initializeStrategies() {
    this.strategies.set('deep-debug', new DeepDebugStrategy());
    this.strategies.set('system-analysis', new SystemAnalysisStrategy());
    this.strategies.set('performance-investigation', new PerformanceInvestigationStrategy());
    
    // Configure task tool for all strategies
    this.strategies.forEach(strategy => {
      if (strategy.setTaskTool) {
        strategy.setTaskTool(this.taskTool);
      }
    });
  }
  
  async investigateIssue(issueDescription: string, context: any) {
    const strategy = this.strategies.get('deep-debug');
    
    const analysisContext = {
      issue: issueDescription,
      stackTrace: context.stackTrace,
      environment: context.environment,
      reproducibleSteps: context.steps,
      previousAttempts: context.previousFixes
    };
    
    return await strategy.analyze(analysisContext);
  }
  
  async analyzeSystemPerformance(metrics: PerformanceMetrics) {
    const strategy = this.strategies.get('performance-investigation');
    
    return await strategy.analyze({
      metrics,
      environment: 'production',
      focusAreas: ['memory-usage', 'cpu-utilization', 'network-latency'],
      timeWindow: '24h'
    });
  }
}
```

### Sketchie Integration Example

```typescript
import { UIDesignStrategy, ComponentDevelopmentStrategy } from '@earth-agents/specialists';

export class SketchieAgent {
  private uiDesignStrategy: UIDesignStrategy;
  private componentStrategy: ComponentDevelopmentStrategy;
  
  constructor(private taskTool: any) {
    this.uiDesignStrategy = new UIDesignStrategy();
    this.componentStrategy = new ComponentDevelopmentStrategy();
    
    // Configure strategies
    this.uiDesignStrategy.setTaskTool(taskTool);
    this.componentStrategy.setTaskTool(taskTool);
  }
  
  async designComponent(requirements: ComponentRequirements) {
    const designResult = await this.uiDesignStrategy.design({
      component: requirements.name,
      requirements: requirements.features,
      framework: requirements.framework || 'react',
      designSystem: requirements.designSystem,
      accessibility: requirements.accessibility || 'wcag-aa'
    });
    
    const implementationResult = await this.componentStrategy.develop({
      design: designResult,
      testing: requirements.includeTests,
      documentation: requirements.includeStorybook
    });
    
    return {
      design: designResult,
      implementation: implementationResult,
      metadata: {
        framework: requirements.framework,
        accessibility: designResult.accessibilityScore,
        performance: implementationResult.performanceScore
      }
    };
  }
  
  async auditAccessibility(componentPath: string) {
    const accessibilitySpecialist = this.getSpecialist('accessibility-specialist');
    
    return await accessibilitySpecialist.invoke(
      'Perform comprehensive accessibility audit with WCAG 2.1 compliance',
      {
        filePath: componentPath,
        standards: ['wcag-2.1-aa', 'section-508'],
        includeScreenReader: true,
        includeMobile: true
      }
    );
  }
}
```

## 🏗️ Custom Strategy Development

### Creating a Custom Strategy Class

```typescript
import { BaseStrategy, CodeAnalysisContext, CodeAnalysisResult } from '@earth-agents/specialists';

export class APISecurityStrategy extends BaseStrategy {
  constructor() {
    super();
    
    // Initialize required specialists
    this.addSpecialist('security-auditor', this.createAdapter('security-auditor'));
    this.addSpecialist('api-developer', this.createAdapter('api-developer'));
    this.addSpecialist('network-architect', this.createAdapter('network-architect'));
  }
  
  async analyze(context: CodeAnalysisContext): Promise<CodeAnalysisResult> {
    const results = await Promise.allSettled([
      this.analyzeEndpoints(context),
      this.auditAuthentication(context),
      this.checkRateLimiting(context),
      this.validateInputSanitization(context)
    ]);
    
    return this.aggregateResults(results);
  }
  
  private async analyzeEndpoints(context: CodeAnalysisContext) {
    const apiDeveloper = this.getSpecialist('api-developer');
    return await apiDeveloper?.invoke(
      'Analyze API endpoints for security vulnerabilities and best practices',
      {
        ...context,
        focus: 'endpoint-security',
        checks: ['sql-injection', 'xss', 'authorization', 'input-validation']
      }
    );
  }
  
  private async auditAuthentication(context: CodeAnalysisContext) {
    const securityAuditor = this.getSpecialist('security-auditor');
    return await securityAuditor?.invoke(
      'Audit authentication and authorization mechanisms',
      {
        ...context,
        focus: 'auth-security',
        standards: ['oauth2', 'jwt', 'session-management']
      }
    );
  }
  
  private async checkRateLimiting(context: CodeAnalysisContext) {
    const networkArchitect = this.getSpecialist('network-architect');
    return await networkArchitect?.invoke(
      'Evaluate rate limiting and DDoS protection mechanisms',
      {
        ...context,
        focus: 'rate-limiting',
        checks: ['request-throttling', 'ip-blocking', 'adaptive-limits']
      }
    );
  }
  
  private async validateInputSanitization(context: CodeAnalysisContext) {
    const securityAuditor = this.getSpecialist('security-auditor');
    return await securityAuditor?.invoke(
      'Validate input sanitization and output encoding',
      {
        ...context,
        focus: 'input-validation',
        checks: ['sanitization', 'encoding', 'parameter-pollution']
      }
    );
  }
  
  private aggregateResults(results: PromiseSettledResult<any>[]): CodeAnalysisResult {
    const successfulResults = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
    
    const issues: CodeIssue[] = [];
    const suggestions: CodeSuggestion[] = [];
    let totalConfidence = 0;
    
    successfulResults.forEach(result => {
      if (result?.issues) issues.push(...result.issues);
      if (result?.suggestions) suggestions.push(...result.suggestions);
      if (result?.confidence) totalConfidence += result.confidence;
    });
    
    return {
      issues: this.deduplicateIssues(issues),
      suggestions: this.prioritizeSuggestions(suggestions),
      metrics: this.calculateMetrics(successfulResults),
      summary: this.generateSummary(issues, suggestions),
      confidence: totalConfidence / successfulResults.length
    };
  }
}
```

### Registering Custom Strategies

```typescript
import { registerStrategy } from '@earth-agents/specialists';
import { APISecurityStrategy } from './APISecurityStrategy';

// Register the strategy
registerStrategy('api-security', new APISecurityStrategy());

// Use in workflows
const strategy = getStrategy('api-security');
const result = await strategy.analyze({
  filePath: './src/api/routes.ts',
  focusAreas: ['security', 'authentication', 'rate-limiting']
});
```

## 💬 Slash Command Integration

### Creating Specialist-Powered Slash Commands

```typescript
// Example: Botbie security audit slash command
export class SecurityAuditCommand {
  constructor(private bobbieAgent: BobbieAgent) {}
  
  async execute(args: string[]): Promise<string> {
    const projectPath = args[0] || './';
    const auditType = args[1] || 'comprehensive';
    
    try {
      const result = await this.bobbieAgent.performSecurityAudit(projectPath);
      
      return this.formatAuditResult(result, auditType);
    } catch (error) {
      return `❌ Security audit failed: ${error.message}`;
    }
  }
  
  private formatAuditResult(result: any, auditType: string): string {
    const { issues, suggestions, metrics } = result;
    
    let output = `🔒 **Security Audit Results** (${auditType})\n\n`;
    
    // Critical issues
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      output += `🚨 **Critical Issues (${criticalIssues.length})**:\n`;
      criticalIssues.forEach(issue => {
        output += `  • ${issue.message} (${issue.rule})\n`;
      });
      output += '\n';
    }
    
    // Security score
    output += `📊 **Security Score**: ${metrics.security}/100\n`;
    output += `🎯 **OWASP Compliance**: ${metrics.owaspCompliance}%\n\n`;
    
    // Top suggestions
    const topSuggestions = suggestions.slice(0, 3);
    if (topSuggestions.length > 0) {
      output += `💡 **Top Recommendations**:\n`;
      topSuggestions.forEach(suggestion => {
        output += `  • ${suggestion.description}\n`;
      });
    }
    
    return output;
  }
}
```

### Markdown-Based Slash Command Documentation

```markdown
# Security Audit with OWASP Compliance

I'm Botbie with comprehensive security expertise! 🔒🤖

I'll audit your code using my **Security Auditor** and **Network Architect** specialists, who are experts in OWASP guidelines, penetration testing, and security best practices.

## Usage

**Comprehensive Security Audit:**
"Audit this codebase for security vulnerabilities"

**Specific Security Areas:**
- "Check for SQL injection vulnerabilities"
- "Audit authentication mechanisms"
- "Review API security"
- "Validate input sanitization"

**With Compliance Standards:**
"Perform OWASP Top 10 compliance audit on this web application"

## Example Output

```
🔒 SECURITY AUDIT RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 SECURITY SCORE: 87/100
Target: 95+ (Production Ready)

🚨 CRITICAL ISSUES (2 found):
├─ SQL Injection vulnerability in user login (line 45)
└─ Hardcoded API key in configuration (line 12)

⚠️  HIGH PRIORITY (4 found):
├─ Missing input validation on contact form
├─ Weak password policy implementation
├─ Missing CSRF protection on state-changing requests
└─ Insufficient error handling exposing system info

💡 SECURITY RECOMMENDATIONS:
├─ Implement parameterized queries for database operations
├─ Move secrets to environment variables or vault
├─ Add comprehensive input validation middleware
└─ Implement proper error handling with sanitized messages
```
```

## 🔧 Advanced Patterns

### Specialist Chaining

```typescript
class ChainedAnalysisStrategy extends BaseStrategy {
  async analyze(context: CodeAnalysisContext): Promise<CodeAnalysisResult> {
    // Step 1: Code quality analysis
    const qualityResult = await this.invokeSpecialist(
      'senior-code-reviewer',
      'Analyze code quality and identify improvement areas',
      context
    );
    
    // Step 2: Use quality results to inform security audit
    const securityContext = {
      ...context,
      qualityIssues: qualityResult.issues,
      focusAreas: this.deriveSecurityFocus(qualityResult)
    };
    
    const securityResult = await this.invokeSpecialist(
      'security-auditor',
      'Perform targeted security audit based on code quality findings',
      securityContext
    );
    
    // Step 3: Performance analysis considering previous findings
    const performanceContext = {
      ...context,
      knownIssues: [...qualityResult.issues, ...securityResult.issues],
      optimizationTargets: this.derivePerformanceTargets(qualityResult, securityResult)
    };
    
    const performanceResult = await this.invokeSpecialist(
      'performance-engineer',
      'Analyze performance with awareness of quality and security constraints',
      performanceContext
    );
    
    return this.synthesizeResults([qualityResult, securityResult, performanceResult]);
  }
  
  private deriveSecurityFocus(qualityResult: any): string[] {
    const focus = ['general-security'];
    
    if (qualityResult.issues.some(i => i.rule?.includes('input'))) {
      focus.push('input-validation', 'injection-attacks');
    }
    
    if (qualityResult.issues.some(i => i.rule?.includes('auth'))) {
      focus.push('authentication', 'authorization');
    }
    
    return focus;
  }
}
```

### Dynamic Specialist Selection

```typescript
class AdaptiveAnalysisStrategy extends BaseStrategy {
  async analyze(context: CodeAnalysisContext): Promise<CodeAnalysisResult> {
    const codeType = this.analyzeCodeType(context);
    const specialists = this.selectSpecialists(codeType);
    
    const results = await Promise.allSettled(
      specialists.map(name => this.invokeSpecialist(name, this.craftPrompt(name, codeType), context))
    );
    
    return this.aggregateResults(results);
  }
  
  private analyzeCodeType(context: CodeAnalysisContext): CodeType {
    // Analyze code to determine type and characteristics
    const indicators = {
      hasDatabase: /\b(SELECT|INSERT|UPDATE|DELETE|query|db\.)\b/i.test(context.code || ''),
      hasAPI: /\b(router|app\.(get|post|put|delete)|fetch|axios)\b/i.test(context.code || ''),
      hasAuth: /\b(auth|login|password|token|jwt)\b/i.test(context.code || ''),
      hasUI: /\b(component|render|jsx|tsx|css|styled)\b/i.test(context.code || ''),
      hasTests: /\b(test|describe|it|expect|mock)\b/i.test(context.code || '')
    };
    
    return {
      category: this.determineCategory(indicators),
      complexity: this.calculateComplexity(context.code || ''),
      indicators
    };
  }
  
  private selectSpecialists(codeType: CodeType): string[] {
    const specialists = ['senior-code-reviewer']; // Always include
    
    if (codeType.indicators.hasDatabase) {
      specialists.push('database-architect');
    }
    
    if (codeType.indicators.hasAPI) {
      specialists.push('api-developer', 'security-auditor');
    }
    
    if (codeType.indicators.hasAuth) {
      specialists.push('security-auditor');
    }
    
    if (codeType.indicators.hasUI) {
      specialists.push('frontend-developer', 'accessibility-specialist');
    }
    
    if (codeType.complexity > 10) {
      specialists.push('refactoring-expert');
    }
    
    return [...new Set(specialists)]; // Remove duplicates
  }
}
```

### Specialist Result Caching

```typescript
class CachedSpecialistStrategy extends BaseStrategy {
  private cache = new Map<string, { result: any, timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  
  protected async invokeSpecialist(
    name: string, 
    prompt: string, 
    context?: any
  ): Promise<SpecialistResult> {
    const cacheKey = this.generateCacheKey(name, prompt, context);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }
    
    const result = await super.invokeSpecialist(name, prompt, context);
    
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
    
    return result;
  }
  
  private generateCacheKey(name: string, prompt: string, context?: any): string {
    const contextHash = context ? JSON.stringify(context) : '';
    return `${name}:${this.hashString(prompt + contextHash)}`;
  }
  
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
}
```

## 🔍 Troubleshooting

### Common Issues and Solutions

#### Issue: Specialist Not Found

```typescript
// Problem: getSpecialist returns null
const specialist = getSpecialist('non-existent-specialist');
// specialist is null

// Solution: Check specialist name and registration
import { listAllSpecialists } from '@earth-agents/specialists';

const available = listAllSpecialists();
console.log('Available specialists:', available.map(s => s.name));

// Or use error handling
const specialist = getSpecialist('backend-architect');
if (!specialist) {
  throw new Error('Backend architect specialist not found');
}
```

#### Issue: Task Tool Not Set

```typescript
// Problem: SpecialistError with TASK_TOOL_NOT_SET
const adapter = new SpecialistAgentAdapter(specialist);
await adapter.invoke('prompt'); // Throws error

// Solution: Always set task tool before invoking
adapter.setTaskTool(taskTool);
await adapter.invoke('prompt'); // Works
```

#### Issue: Specialist Timeout

```typescript
// Problem: Long-running specialist operations timing out
const result = await adapter.invoke('complex analysis task'); // Times out

// Solution: Increase timeout for complex tasks
const context = {
  timeout: 60000, // 1 minute
  complexity: 'high'
};
const result = await adapter.invoke('complex analysis task', context);
```

#### Issue: Context Validation Errors

```typescript
// Problem: Invalid context causing errors
const result = await adapter.invoke('analyze', { invalidField: true });

// Solution: Use proper context structure
const context = {
  filePath: './src/app.ts',
  language: 'typescript',
  focusAreas: ['security', 'performance'],
  strictMode: false
};
const result = await adapter.invoke('analyze code', context);
```

### Debugging Specialist Invocations

```typescript
class DebuggingSpecialistAdapter extends SpecialistAgentAdapter {
  async invoke(prompt: string, context?: any): Promise<SpecialistResult> {
    const startTime = Date.now();
    
    console.log(`🔍 Invoking specialist: ${this.getSpecialistInfo().name}`);
    console.log(`📝 Prompt: ${prompt}`);
    console.log(`⚙️ Context:`, context);
    
    try {
      const result = await super.invoke(prompt, context);
      const duration = Date.now() - startTime;
      
      console.log(`✅ Success in ${duration}ms`);
      console.log(`📊 Output length: ${result.output?.length || 0} chars`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error(`❌ Failed after ${duration}ms:`, error);
      throw error;
    }
  }
}
```

### Performance Monitoring

```typescript
class MonitoredSpecialistStrategy extends BaseStrategy {
  private metrics = {
    invocations: 0,
    totalTime: 0,
    errors: 0,
    successes: 0
  };
  
  protected async invokeSpecialist(
    name: string, 
    prompt: string, 
    context?: any
  ): Promise<SpecialistResult> {
    this.metrics.invocations++;
    const startTime = Date.now();
    
    try {
      const result = await super.invokeSpecialist(name, prompt, context);
      const duration = Date.now() - startTime;
      
      this.metrics.totalTime += duration;
      this.metrics.successes++;
      
      // Log slow operations
      if (duration > 30000) {
        console.warn(`⚠️ Slow specialist operation: ${name} took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      this.metrics.errors++;
      console.error(`❌ Specialist error: ${name}`, error);
      throw error;
    }
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      averageTime: this.metrics.totalTime / this.metrics.invocations,
      successRate: this.metrics.successes / this.metrics.invocations
    };
  }
}
```

---

*These integration guides provide comprehensive patterns for incorporating specialists into your Earth Agents workflows and applications. For more specific examples, see the [examples directory](../examples/) and [API reference](./api-reference.md).* 🚀