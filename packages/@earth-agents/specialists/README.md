# Earth Agents Specialist Integration System

The Specialist Integration System enables Earth Agents to leverage 44 specialized Claude Code agents for enhanced capabilities across development, debugging, design, data science, and operations domains.

## 🌟 Overview

This package provides a unified interface for invoking Claude Code specialist agents through Earth Agents workflows. Each specialist brings deep expertise in specific domains, allowing Earth Agents to deliver more sophisticated and specialized solutions.

## 🏗️ Architecture

### Core Components

- **SpecialistAgentAdapter**: Core adapter class for invoking specialists
- **SpecialistRegistry**: Global registry for all available specialists
- **Strategy Patterns**: Integration strategies for each Earth Agent
- **Type Definitions**: Comprehensive TypeScript interfaces

### Integration Flow

```
Earth Agent → Strategy → SpecialistAgentAdapter → Claude Code Task Tool → Specialist Agent
```

## 🤖 Available Specialists (44 Total)

### Development Specialists (15)
- **Backend Architect** - Server-side architecture and API design
- **Frontend Developer** - Modern UI/UX development and frameworks
- **Fullstack Engineer** - End-to-end application development
- **Mobile Developer** - iOS, Android, and cross-platform apps
- **DevOps Engineer** - CI/CD, infrastructure, and deployment
- **Database Architect** - Database design and optimization
- **API Developer** - REST, GraphQL, and API integration
- **Security Auditor** - Security analysis and vulnerability assessment
- **Performance Engineer** - Application optimization and profiling
- **Test Engineer** - Testing strategies and automation
- **Code Reviewer** - Code quality and best practices
- **Technical Writer** - Documentation and technical communication
- **Product Manager** - Feature planning and requirements
- **System Administrator** - Infrastructure and system management
- **Network Architect** - Network design and security

### Debugging & Analysis Specialists (8)
- **Debug Specialist** - Complex debugging and troubleshooting
- **Performance Debugger** - Performance bottleneck identification
- **Memory Profiler** - Memory leak detection and optimization
- **Network Debugger** - Network issue diagnosis
- **Database Debugger** - Query optimization and database issues
- **Security Analyst** - Security vulnerability analysis
- **Log Analyzer** - Log analysis and monitoring
- **Error Tracker** - Error pattern analysis and resolution

### Design & UI Specialists (9)
- **UI/UX Designer** - User interface and experience design
- **Visual Designer** - Graphics, branding, and visual elements
- **Interaction Designer** - User interaction and animation
- **Accessibility Specialist** - WCAG compliance and inclusive design
- **Design System Architect** - Design system creation and maintenance
- **Prototyping Specialist** - Rapid prototyping and wireframing
- **Brand Designer** - Brand identity and marketing materials
- **Information Architect** - Content structure and organization
- **User Researcher** - User behavior analysis and testing

### Data Science Specialists (7)
- **Data Scientist** - Statistical analysis and machine learning
- **Data Engineer** - Data pipeline and infrastructure
- **ML Engineer** - Machine learning model deployment
- **Data Analyst** - Business intelligence and reporting
- **AI Researcher** - Advanced AI and research methodologies
- **Business Analyst** - Business process and requirement analysis
- **Statistician** - Statistical modeling and analysis

### Operations Specialists (5)
- **Cloud Architect** - Cloud infrastructure and services
- **Site Reliability Engineer** - System reliability and monitoring
- **Automation Engineer** - Process automation and scripting
- **Compliance Officer** - Regulatory compliance and auditing
- **Project Manager** - Project planning and execution

## 🚀 Quick Start

### Basic Usage

```typescript
import { SpecialistAgentAdapter, getSpecialist } from '@earth-agents/specialists';

// Get a specialist
const backendArchitect = getSpecialist('backend-architect');

// Create adapter
const adapter = new SpecialistAgentAdapter(backendArchitect);

// Set task tool (from Earth Agent context)
adapter.setTaskTool(taskTool);

// Invoke specialist
const result = await adapter.invoke(
  'Design a REST API for user management system',
  { 
    framework: 'Express.js',
    database: 'PostgreSQL',
    authentication: 'JWT'
  }
);

console.log(result.output);
```

### Workflow Integration

```yaml
# In workflow YAML
- id: architecture-review
  name: Architecture Review with Specialists
  type: specialist
  specialists:
    - name: backend-architect
      strategy: api-design
      priority: 1
      required: true
      context:
        framework: express
        database: postgresql
    - name: security-auditor
      strategy: security-review
      priority: 2
      required: false
      context:
        focus: authentication
```

## 🎯 Earth Agent Integration

### Botbie Integration
Botbie uses 5 specialist strategies:

1. **Code Quality Strategy** (code-reviewer, refactoring-expert)
2. **Security Audit Strategy** (security-auditor, network-architect)
3. **Performance Analysis Strategy** (performance-engineer, database-architect)
4. **Architecture Review Strategy** (backend-architect, system-administrator)
5. **Testing Strategy** (test-engineer, debug-specialist)

### DebugEarth Integration
DebugEarth uses 3 specialist strategies:

1. **Deep Debug Strategy** (debug-specialist, performance-debugger)
2. **System Analysis Strategy** (system-administrator, network-debugger)
3. **Performance Investigation Strategy** (memory-profiler, database-debugger)

### Sketchie Integration
Sketchie uses 3 specialist strategies:

1. **UI Design Strategy** (ui-ux-designer, accessibility-specialist)
2. **Component Development Strategy** (frontend-developer, design-system-architect)
3. **User Experience Strategy** (interaction-designer, user-researcher)

## 📚 Specialist Categories

### Development Focus
Specialists focused on building and architecting software solutions.

**Key Specialists:**
- Backend Architect: Server architecture and API design
- Frontend Developer: Modern web development
- DevOps Engineer: Infrastructure and deployment

### Quality Assurance Focus
Specialists focused on code quality, testing, and debugging.

**Key Specialists:**
- Senior Code Reviewer: Comprehensive code analysis
- Test Engineer: Testing strategy and automation
- Debug Specialist: Complex issue resolution

### Design Focus
Specialists focused on user experience and visual design.

**Key Specialists:**
- UI/UX Designer: User interface design
- Accessibility Specialist: Inclusive design
- Design System Architect: Scalable design systems

### Data Focus
Specialists focused on data analysis and machine learning.

**Key Specialists:**
- Data Scientist: Statistical analysis and ML
- Data Engineer: Data pipeline architecture
- Business Analyst: Business intelligence

### Operations Focus
Specialists focused on infrastructure and operations.

**Key Specialists:**
- Cloud Architect: Cloud infrastructure design
- Site Reliability Engineer: System reliability
- DevOps Engineer: CI/CD and automation

## 🔧 Configuration

### Environment Variables

```env
# Specialist configuration
SPECIALIST_TIMEOUT=30000
SPECIALIST_MAX_RETRIES=3
SPECIALIST_CACHE_ENABLED=true
SPECIALIST_LOG_LEVEL=info
```

### Advanced Configuration

```typescript
import { SpecialistConfig } from '@earth-agents/specialists';

const config: SpecialistConfig = {
  timeout: 30000,
  maxRetries: 3,
  cacheEnabled: true,
  strategies: {
    'code-review': {
      defaultSpecialists: ['senior-code-reviewer', 'refactoring-expert'],
      parallel: true,
      priority: 'high'
    }
  }
};
```

## 📖 API Reference

### SpecialistAgentAdapter

```typescript
class SpecialistAgentAdapter {
  constructor(specialist: SpecialistDefinition)
  setTaskTool(taskTool: any): void
  invoke(prompt: string, context?: any): Promise<SpecialistResult>
  getSpecialistInfo(): SpecialistDefinition
}
```

### Registry Functions

```typescript
// Get specialist by name
function getSpecialist(name: string): SpecialistDefinition

// Get specialists by category
function getSpecialistsByCategory(category: SpecialistCategory): SpecialistDefinition[]

// List all specialists
function listAllSpecialists(): SpecialistDefinition[]

// Register custom specialist
function registerSpecialist(specialist: SpecialistDefinition): void
```

### Strategy Functions

```typescript
// Get strategy by name
function getStrategy(name: string): BaseStrategy

// Register custom strategy
function registerStrategy(name: string, strategy: BaseStrategy): void
```

## 🎯 Best Practices

### 1. Specialist Selection
- Choose specialists based on specific expertise needed
- Use required=true for critical specialists
- Set appropriate priorities for execution order

### 2. Context Provision
- Provide rich context for better specialist output
- Include relevant technical constraints
- Specify desired output format

### 3. Error Handling
- Always handle specialist invocation errors
- Implement fallback strategies for non-required specialists
- Use timeout values appropriate for task complexity

### 4. Performance Optimization
- Use parallel execution when possible
- Cache specialist results when appropriate
- Set reasonable timeout values

## 🔍 Examples

### Code Review Example

```typescript
import { CodeQualityStrategy } from '@earth-agents/specialists';

const strategy = new CodeQualityStrategy();
const result = await strategy.analyze({
  filePath: './src/api/users.ts',
  focusAreas: ['security', 'performance', 'maintainability'],
  strictMode: true
});

console.log('Issues found:', result.issues.length);
console.log('Suggestions:', result.suggestions);
```

### UI Design Example

```typescript
import { UIDesignStrategy } from '@earth-agents/specialists';

const strategy = new UIDesignStrategy();
const result = await strategy.design({
  component: 'user-profile-form',
  requirements: [
    'responsive design',
    'accessibility compliant',
    'modern styling'
  ],
  framework: 'react',
  designSystem: 'material-ui'
});

console.log('Component code:', result.code);
console.log('Design tokens:', result.tokens);
```

## 🚀 Slash Commands

Each Earth Agent provides natural language slash commands for specialist access:

### Botbie Commands
- `/security-audit` - Comprehensive security analysis
- `/code-review` - Expert code review
- `/performance-analysis` - Performance optimization
- `/architecture-review` - System architecture evaluation
- `/testing-strategy` - Testing approach design

### DebugEarth Commands
- `/deep-debug` - Complex issue investigation
- `/system-analysis` - System-wide problem analysis
- `/performance-investigation` - Performance issue diagnosis

### Sketchie Commands
- `/ui-design` - User interface design
- `/accessibility-audit` - Accessibility compliance check
- `/responsive-design` - Multi-device design optimization

## 🤝 Contributing

### Adding New Specialists

1. Define the specialist in appropriate category file
2. Add specialist to registry
3. Create integration strategies as needed
4. Update documentation
5. Add tests

### Creating Custom Strategies

```typescript
import { BaseStrategy, CodeAnalysisContext, CodeAnalysisResult } from '@earth-agents/specialists';

export class CustomStrategy extends BaseStrategy {
  async analyze(context: CodeAnalysisContext): Promise<CodeAnalysisResult> {
    // Implementation
  }
}
```

## 📝 License

This package is part of the Earth Agents ecosystem and follows the same licensing terms.

## 🆘 Support

For support and questions:
- Check the [documentation](./docs/)
- Review [examples](./examples/)
- Open an issue in the repository
- Contact the Earth Agents team

---

*Transform your Earth Agents with the power of specialized expertise! 🌍🤖*