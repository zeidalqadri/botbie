# Specialist Integration API Reference

Comprehensive API documentation for the Earth Agents Specialist Integration System.

## 📚 Table of Contents

- [Core Classes](#core-classes)
- [Type Definitions](#type-definitions)
- [Registry Functions](#registry-functions)
- [Strategy Classes](#strategy-classes)
- [Utility Functions](#utility-functions)
- [Error Handling](#error-handling)
- [Examples](#examples)

## 🏗️ Core Classes

### SpecialistAgentAdapter

The main adapter class for invoking specialist agents through Claude Code.

```typescript
class SpecialistAgentAdapter {
  constructor(specialist: SpecialistDefinition);
  
  setTaskTool(taskTool: any): void;
  invoke(prompt: string, context?: any): Promise<SpecialistResult>;
  getSpecialistInfo(): SpecialistDefinition;
}
```

#### Constructor

```typescript
new SpecialistAgentAdapter(specialist: SpecialistDefinition)
```

**Parameters:**
- `specialist`: SpecialistDefinition - The specialist configuration

**Example:**
```typescript
import { getSpecialist, SpecialistAgentAdapter } from '@earth-agents/specialists';

const specialist = getSpecialist('backend-architect');
const adapter = new SpecialistAgentAdapter(specialist);
```

#### Methods

##### setTaskTool(taskTool)

Configures the Claude Code Task tool for specialist invocation.

**Parameters:**
- `taskTool`: any - The Task tool instance from Earth Agent context

**Example:**
```typescript
adapter.setTaskTool(taskTool);
```

##### invoke(prompt, context?)

Invokes the specialist with a prompt and optional context.

**Parameters:**
- `prompt`: string - The instruction/question for the specialist
- `context?`: any - Optional context object with additional information

**Returns:** `Promise<SpecialistResult>`

**Example:**
```typescript
const result = await adapter.invoke(
  'Design a REST API for user management',
  {
    framework: 'Express.js',
    database: 'PostgreSQL',
    authentication: 'JWT'
  }
);
```

##### getSpecialistInfo()

Returns the specialist definition and metadata.

**Returns:** `SpecialistDefinition`

**Example:**
```typescript
const info = adapter.getSpecialistInfo();
console.log(`Specialist: ${info.name} - ${info.description}`);
```

### BaseStrategy

Abstract base class for specialist integration strategies.

```typescript
abstract class BaseStrategy {
  protected specialists: Map<string, SpecialistAgentAdapter>;
  
  constructor();
  abstract analyze(context: CodeAnalysisContext): Promise<CodeAnalysisResult>;
  
  protected addSpecialist(name: string, adapter: SpecialistAgentAdapter): void;
  protected getSpecialist(name: string): SpecialistAgentAdapter | undefined;
  protected invokeSpecialist(name: string, prompt: string, context?: any): Promise<SpecialistResult>;
}
```

## 🏷️ Type Definitions

### SpecialistDefinition

```typescript
interface SpecialistDefinition {
  name: string;
  description: string;
  category: SpecialistCategory;
  focusAreas: string[];
  approaches: string[];
  outputs: string[];
  tools?: string[];
  subagentType: string;
}
```

### SpecialistCategory

```typescript
type SpecialistCategory = 
  | 'development'
  | 'debugging'
  | 'design'
  | 'data-science'
  | 'operations';
```

### SpecialistResult

```typescript
interface SpecialistResult {
  success: boolean;
  output: string;
  metadata?: {
    specialist: string;
    duration: number;
    tokensUsed?: number;
    confidence?: number;
  };
  error?: string;
}
```

### CodeAnalysisContext

```typescript
interface CodeAnalysisContext {
  filePath?: string;
  code?: string;
  language?: string;
  focusAreas?: string[];
  strictMode?: boolean;
  customRules?: Record<string, any>;
}
```

### CodeAnalysisResult

```typescript
interface CodeAnalysisResult {
  issues: CodeIssue[];
  suggestions: CodeSuggestion[];
  metrics: CodeMetrics;
  summary: string;
  confidence: number;
}
```

### CodeIssue

```typescript
interface CodeIssue {
  type: 'error' | 'warning' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  line?: number;
  column?: number;
  rule?: string;
  fixable?: boolean;
  suggestion?: string;
}
```

### CodeSuggestion

```typescript
interface CodeSuggestion {
  type: 'refactoring' | 'optimization' | 'best-practice' | 'enhancement';
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  example?: string;
  benefits: string[];
}
```

### CodeMetrics

```typescript
interface CodeMetrics {
  complexity: number;
  maintainabilityIndex: number;
  testCoverage?: number;
  performance?: number;
  security?: number;
  accessibility?: number;
}
```

## 📋 Registry Functions

### getSpecialist(name)

Retrieves a specialist by name from the global registry.

```typescript
function getSpecialist(name: string): SpecialistDefinition | null
```

**Parameters:**
- `name`: string - The specialist name (e.g., 'backend-architect')

**Returns:** `SpecialistDefinition | null`

**Example:**
```typescript
const specialist = getSpecialist('frontend-developer');
if (specialist) {
  console.log(`Found: ${specialist.description}`);
}
```

### getSpecialistsByCategory(category)

Retrieves all specialists in a specific category.

```typescript
function getSpecialistsByCategory(category: SpecialistCategory): SpecialistDefinition[]
```

**Parameters:**
- `category`: SpecialistCategory - The category to filter by

**Returns:** `SpecialistDefinition[]`

**Example:**
```typescript
const designSpecialists = getSpecialistsByCategory('design');
designSpecialists.forEach(s => console.log(s.name));
```

### listAllSpecialists()

Returns all registered specialists.

```typescript
function listAllSpecialists(): SpecialistDefinition[]
```

**Returns:** `SpecialistDefinition[]`

**Example:**
```typescript
const allSpecialists = listAllSpecialists();
console.log(`Total specialists: ${allSpecialists.length}`);
```

### registerSpecialist(specialist)

Registers a new specialist in the global registry.

```typescript
function registerSpecialist(specialist: SpecialistDefinition): void
```

**Parameters:**
- `specialist`: SpecialistDefinition - The specialist to register

**Example:**
```typescript
registerSpecialist({
  name: 'custom-specialist',
  description: 'Custom domain expert',
  category: 'development',
  focusAreas: ['custom-domain'],
  approaches: ['analysis', 'implementation'],
  outputs: ['code', 'documentation'],
  subagentType: 'general-purpose'
});
```

## 🎯 Strategy Classes

### CodeQualityStrategy

Strategy for code quality analysis using code review specialists.

```typescript
class CodeQualityStrategy extends BaseStrategy {
  constructor();
  
  async analyze(context: CodeAnalysisContext): Promise<CodeAnalysisResult>;
  
  private analyzeComplexity(code: string): Promise<ComplexityMetrics>;
  private findCodeSmells(code: string): Promise<CodeIssue[]>;
  private suggestRefactoring(code: string): Promise<CodeSuggestion[]>;
}
```

**Example:**
```typescript
const strategy = new CodeQualityStrategy();
const result = await strategy.analyze({
  filePath: './src/utils/helper.ts',
  focusAreas: ['complexity', 'maintainability'],
  strictMode: true
});
```

### SecurityAuditStrategy

Strategy for security analysis using security specialists.

```typescript
class SecurityAuditStrategy extends BaseStrategy {
  constructor();
  
  async analyze(context: CodeAnalysisContext): Promise<CodeAnalysisResult>;
  
  private scanVulnerabilities(code: string): Promise<SecurityIssue[]>;
  private checkOWASPCompliance(code: string): Promise<ComplianceResult>;
  private auditAuthPatterns(code: string): Promise<AuthAuditResult>;
}
```

**Example:**
```typescript
const strategy = new SecurityAuditStrategy();
const result = await strategy.analyze({
  filePath: './src/auth/middleware.ts',
  focusAreas: ['authentication', 'authorization', 'input-validation']
});
```

### PerformanceAnalysisStrategy

Strategy for performance analysis using performance specialists.

```typescript
class PerformanceAnalysisStrategy extends BaseStrategy {
  constructor();
  
  async analyze(context: CodeAnalysisContext): Promise<CodeAnalysisResult>;
  
  private profileMemoryUsage(code: string): Promise<MemoryProfile>;
  private analyzeBundleImpact(code: string): Promise<BundleAnalysis>;
  private identifyBottlenecks(code: string): Promise<PerformanceIssue[]>;
}
```

**Example:**
```typescript
const strategy = new PerformanceAnalysisStrategy();
const result = await strategy.analyze({
  filePath: './src/components/DataTable.tsx',
  focusAreas: ['render-performance', 'memory-usage']
});
```

### UIDesignStrategy

Strategy for UI design using design specialists.

```typescript
class UIDesignStrategy extends BaseStrategy {
  constructor();
  
  async design(context: UIDesignContext): Promise<UIDesignResult>;
  
  private generateComponents(requirements: string[]): Promise<ComponentCode>;
  private optimizeAccessibility(design: UIDesign): Promise<AccessibilityReport>;
  private createDesignTokens(theme: ThemeConfig): Promise<DesignTokens>;
}
```

**Example:**
```typescript
const strategy = new UIDesignStrategy();
const result = await strategy.design({
  component: 'user-profile-form',
  requirements: ['responsive', 'accessible', 'modern'],
  framework: 'react'
});
```

## 🛠️ Utility Functions

### createSpecialistAdapter(name)

Factory function to create a specialist adapter.

```typescript
function createSpecialistAdapter(name: string): SpecialistAgentAdapter | null
```

**Example:**
```typescript
const adapter = createSpecialistAdapter('database-architect');
```

### invokeSpecialistDirectly(name, prompt, context?)

Direct invocation of a specialist without creating an adapter.

```typescript
async function invokeSpecialistDirectly(
  name: string, 
  prompt: string, 
  context?: any
): Promise<SpecialistResult>
```

**Example:**
```typescript
const result = await invokeSpecialistDirectly(
  'api-developer',
  'Create OpenAPI spec for user service',
  { version: '3.0', includeExamples: true }
);
```

### validateSpecialistContext(context)

Validates specialist invocation context.

```typescript
function validateSpecialistContext(context: any): ValidationResult
```

**Example:**
```typescript
const validation = validateSpecialistContext({ filePath: './src/app.ts' });
if (!validation.valid) {
  console.error('Context validation failed:', validation.errors);
}
```

## ⚠️ Error Handling

### SpecialistError

Base error class for specialist-related errors.

```typescript
class SpecialistError extends Error {
  code: string;
  specialist?: string;
  context?: any;
  
  constructor(message: string, code: string, specialist?: string);
}
```

### Common Error Codes

```typescript
const ErrorCodes = {
  SPECIALIST_NOT_FOUND: 'SPECIALIST_NOT_FOUND',
  TASK_TOOL_NOT_SET: 'TASK_TOOL_NOT_SET',
  INVOCATION_FAILED: 'INVOCATION_FAILED',
  TIMEOUT: 'TIMEOUT',
  INVALID_CONTEXT: 'INVALID_CONTEXT',
  SPECIALIST_UNAVAILABLE: 'SPECIALIST_UNAVAILABLE'
} as const;
```

### Error Handling Example

```typescript
try {
  const result = await adapter.invoke('Analyze this code', { code: sourceCode });
  console.log(result.output);
} catch (error) {
  if (error instanceof SpecialistError) {
    switch (error.code) {
      case 'SPECIALIST_NOT_FOUND':
        console.error('Specialist not found:', error.specialist);
        break;
      case 'TASK_TOOL_NOT_SET':
        console.error('Task tool not configured');
        break;
      case 'TIMEOUT':
        console.error('Specialist invocation timed out');
        break;
      default:
        console.error('Specialist error:', error.message);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## 📝 Configuration Types

### SpecialistConfig

```typescript
interface SpecialistConfig {
  timeout?: number;
  maxRetries?: number;
  cacheEnabled?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  strategies?: Record<string, StrategyConfig>;
}
```

### StrategyConfig

```typescript
interface StrategyConfig {
  defaultSpecialists: string[];
  parallel?: boolean;
  priority?: 'high' | 'medium' | 'low';
  timeout?: number;
  retries?: number;
}
```

### WorkflowSpecialistConfig

```typescript
interface WorkflowSpecialistConfig {
  name: string;
  strategy?: string;
  context?: Record<string, any>;
  priority?: number;
  required?: boolean;
  timeout?: number;
}
```

## 🔧 Advanced Usage

### Custom Specialist Registration

```typescript
import { registerSpecialist, SpecialistDefinition } from '@earth-agents/specialists';

const customSpecialist: SpecialistDefinition = {
  name: 'blockchain-architect',
  description: 'Blockchain and DeFi architecture specialist',
  category: 'development',
  focusAreas: [
    'smart-contract-design',
    'defi-protocols',
    'consensus-mechanisms',
    'tokenomics'
  ],
  approaches: [
    'architecture-analysis',
    'security-review',
    'gas-optimization',
    'protocol-design'
  ],
  outputs: [
    'smart-contracts',
    'architecture-diagrams',
    'security-reports',
    'optimization-recommendations'
  ],
  subagentType: 'general-purpose'
};

registerSpecialist(customSpecialist);
```

### Parallel Specialist Invocation

```typescript
import { createSpecialistAdapter } from '@earth-agents/specialists';

async function parallelAnalysis(code: string) {
  const specialists = [
    'senior-code-reviewer',
    'security-auditor',
    'performance-engineer'
  ];
  
  const adapters = specialists
    .map(name => createSpecialistAdapter(name))
    .filter(adapter => adapter !== null);
  
  adapters.forEach(adapter => adapter.setTaskTool(taskTool));
  
  const results = await Promise.allSettled(
    adapters.map(adapter => 
      adapter.invoke('Analyze this code for issues', { code })
    )
  );
  
  return results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);
}
```

### Strategy Composition

```typescript
import { BaseStrategy, CodeAnalysisContext, CodeAnalysisResult } from '@earth-agents/specialists';

class ComprehensiveAnalysisStrategy extends BaseStrategy {
  constructor() {
    super();
    this.addSpecialist('code-reviewer', createSpecialistAdapter('senior-code-reviewer'));
    this.addSpecialist('security-auditor', createSpecialistAdapter('security-auditor'));
    this.addSpecialist('performance-engineer', createSpecialistAdapter('performance-engineer'));
  }
  
  async analyze(context: CodeAnalysisContext): Promise<CodeAnalysisResult> {
    const codeReview = await this.invokeSpecialist(
      'code-reviewer',
      'Review code quality and maintainability',
      context
    );
    
    const securityAudit = await this.invokeSpecialist(
      'security-auditor',
      'Perform security analysis',
      context
    );
    
    const performanceAnalysis = await this.invokeSpecialist(
      'performance-engineer',
      'Analyze performance characteristics',
      context
    );
    
    return this.aggregateResults([codeReview, securityAudit, performanceAnalysis]);
  }
  
  private aggregateResults(results: SpecialistResult[]): CodeAnalysisResult {
    // Combine and aggregate specialist results
    // Implementation details...
  }
}
```

---

*This API reference provides comprehensive documentation for integrating and using specialists within the Earth Agents ecosystem. For more examples and guides, see the [examples directory](../examples/) and [integration guides](./integration-guides.md).* 🚀