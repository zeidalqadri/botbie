# Earth Agents Premium Workflows

Premium workflow templates for the Earth Agents ecosystem, providing enterprise-grade development pipelines.

## 🌟 Overview

Earth Agents Workflows provides pre-built, customizable workflow templates that combine the power of Botbie, DebugEarth, and Sketchie agents to automate complex development tasks.

## 📦 Available Workflows

### Professional Tier

1. **Full-Stack Feature Development Pipeline**
   - Complete feature development from design to deployment
   - Integrated quality checks and performance optimization
   - 2-4 hours execution time

### Enterprise Tier

2. **Design System Creation & Maintenance**
   - Extract and maintain comprehensive design systems
   - Token management and theme generation
   - 4-8 hours execution time

3. **Accessibility Compliance Workflow**
   - WCAG compliance checking and automated fixes
   - Certification preparation and reporting
   - 3-6 hours execution time

## 🚀 Quick Start

### Installation

```bash
npm install @earth-agents/workflows
```

### Basic Usage

```typescript
import { executeWorkflow } from '@earth-agents/workflows';

// Execute a workflow
const result = await executeWorkflow('fullstack-feature-development', {
  designSource: './designs/new-feature.png',
  featureName: 'User Dashboard',
  targetFramework: 'react'
});
```

### Using the Catalog

```typescript
import { WorkflowCatalog } from '@earth-agents/workflows';

const catalog = new WorkflowCatalog();
await catalog.initialize();

// Get all workflows
const allWorkflows = catalog.getAllTemplates();

// Get workflows by category
const devWorkflows = catalog.getTemplatesByCategory('development');

// Get recommendations
const recommended = catalog.getRecommendedTemplates({
  framework: 'react',
  industry: 'finance',
  teamSize: 15
});
```

## 🎨 Workflow Customization

### Using Presets

```typescript
import { WorkflowCustomizer, executeWorkflow } from '@earth-agents/workflows';

// Use a preset
const quickValidation = WorkflowCustomizer.createPreset('quick-validation');

const result = await executeWorkflow(
  'accessibility-compliance',
  { targetPath: './src' },
  quickValidation
);
```

### Custom Configuration

```typescript
const customization = {
  templateId: 'design-system-creation',
  overrides: {
    config: {
      timeoutMinutes: 120,
      parallelExecution: true
    },
    nodes: [
      {
        id: 'generate-themes',
        inputs: {
          variations: ['light', 'dark', 'high-contrast', 'colorblind-safe']
        }
      }
    ]
  },
  variables: {
    packageName: '@mycompany/design-system',
    wcagLevel: 'AAA'
  }
};

const result = await executeWorkflow(
  'design-system-creation',
  { sourceType: 'existing-code', sourcePath: './src' },
  customization
);
```

## 📊 Workflow Execution

### With Event Monitoring

```typescript
import { WorkflowExecutor, loadWorkflowTemplate } from '@earth-agents/workflows';

const template = await loadWorkflowTemplate('fullstack-feature-development');
const executor = new WorkflowExecutor(template, {
  designSource: 'figma://...',
  featureName: 'Checkout Flow'
});

// Monitor events
executor.on('start', (execution) => {
  console.log('Workflow started:', execution.id);
});

executor.on('progress', (execution) => {
  console.log(`Progress: ${execution.progress}%`);
});

executor.on('log', (log) => {
  console.log(`[${log.level}] ${log.message}`);
});

executor.on('complete', (execution) => {
  console.log('Workflow completed!', execution.results);
});

executor.on('error', (error, execution) => {
  console.error('Workflow failed:', error);
});

// Execute
const result = await executor.execute();
```

### Cancelling Workflows

```typescript
// Start execution
const executionPromise = executor.execute();

// Cancel after 5 seconds
setTimeout(() => {
  executor.cancel();
}, 5000);

try {
  await executionPromise;
} catch (error) {
  if (error.message === 'Workflow cancelled') {
    console.log('Workflow was cancelled');
  }
}
```

## 🔧 Workflow Structure

### Template Format

Workflows are defined in YAML format:

```yaml
id: workflow-id
name: Workflow Name
category: development
tier: professional
nodes:
  - id: step-1
    name: First Step
    agent: sketchie
    action: analyzeDesign
    inputs:
      source: ${inputs.designSource}
outputs:
  - name: Component Library
    type: artifact
    format: zip
```

### Node Types

- **analysis** - Data analysis and extraction
- **action** - Perform specific actions
- **parallel** - Execute tasks in parallel
- **decision** - Conditional branching
- **merge** - Merge results from multiple nodes
- **loop** - Iterate over collections

## 📈 Metrics and Analytics

```typescript
const catalog = new WorkflowCatalog();
await catalog.initialize();

const stats = catalog.getStatistics();
console.log('Total workflows:', stats.total);
console.log('By category:', stats.byCategory);
console.log('Most popular:', stats.mostPopular);
```

## 🎯 Industry-Specific Use Cases

### E-Commerce
- Product catalog optimization
- Checkout flow enhancement
- Performance optimization

### Healthcare
- HIPAA-compliant UI development
- Accessibility-first patient portals
- Medical record viewers

### Financial Services
- Secure trading platforms
- Compliance-ready dashboards
- Real-time data visualizations

## 🔒 Security and Compliance

All workflows include:
- Security vulnerability scanning
- Compliance checking (WCAG, GDPR, HIPAA)
- Automated security fixes
- Audit trail generation

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../../CONTRIBUTING.md) for details.

## 📄 License

MIT © Earth Agents Team