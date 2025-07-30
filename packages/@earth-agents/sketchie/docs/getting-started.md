# Getting Started with Sketchie

This guide will help you get up and running with Sketchie, the UI/UX design agent that transforms designs into production-ready TypeScript components.

## Prerequisites

- Node.js 16+ 
- TypeScript 4.5+
- A package manager (npm, yarn, or pnpm)

## Installation

### As Part of Earth Agents CLI

```bash
npm install -g @earth-agents/cli
```

### As a Standalone Package

```bash
npm install @earth-agents/sketchie
```

## Basic Setup

### 1. Initialize Sketchie

```typescript
import { createSketchie } from '@earth-agents/sketchie';

const sketchie = createSketchie({
  framework: 'react',        // Your target framework
  wcagLevel: 'AA',          // Accessibility compliance level
  outputDir: './components'  // Where to save generated components
});

await sketchie.initialize();
```

### 2. Your First Component

Let's create a simple button component from a text description:

```typescript
// Analyze the design concept
const analysis = await sketchie.analyzeDesign({
  type: 'description',
  source: 'A primary button with rounded corners, blue background, white text, and hover state'
});

// Generate the component
const component = await sketchie.generateComponent(
  { type: 'description', source: 'Primary button' },
  {
    framework: 'react',
    styling: 'styled-components',
    typescript: true,
    testing: true,
    storybook: true
  }
);

// Save the component
await sketchie.saveComponent(component, './src/components/Button');
```

This generates:
- `Button.tsx` - The React component
- `Button.styles.ts` - Styled-components styles
- `Button.test.tsx` - Jest/React Testing Library tests
- `Button.stories.tsx` - Storybook stories

### 3. Working with Existing Designs

#### From Figma

```typescript
const figmaComponents = await sketchie.analyzeDesign({
  type: 'figma',
  source: 'https://www.figma.com/file/xxxxx/Design-System',
  metadata: {
    apiToken: process.env.FIGMA_TOKEN,
    nodeIds: ['1:2', '3:4'] // Optional: specific components
  }
});
```

#### From Images

```typescript
const imageComponents = await sketchie.analyzeDesign({
  type: 'image',
  source: './designs/dashboard-mockup.png'
});
```

### 4. Accessibility Checking

```typescript
// Check a single component
const accessibilityReport = await sketchie.checkAccessibility(
  './src/components/Button.tsx'
);

// Audit entire directory
const audit = await sketchie.auditAccessibility('./src/components', {
  wcagLevel: 'AA',
  autoFix: true
});

console.log(`Found ${audit.issues.length} accessibility issues`);
console.log(`Fixed ${audit.fixed.length} automatically`);
```

### 5. Performance Optimization

```typescript
// Analyze component performance
const perfAnalysis = await sketchie.analyzePerformance(
  './src/components/DataTable.tsx'
);

// Optimize if needed
if (perfAnalysis.bundleSize > 50000) { // 50KB
  const optimized = await sketchie.optimizeComponent(
    './src/components/DataTable.tsx',
    {
      targetSize: 30000,
      techniques: ['code-splitting', 'lazy-loading', 'memoization']
    }
  );
}
```

## Common Workflows

### Design System Extraction

Extract design tokens from an existing codebase:

```typescript
const designSystem = await sketchie.extractDesignTokens('./src', {
  categories: ['color', 'typography', 'spacing', 'shadow'],
  format: 'js'
});

// Save as theme
await sketchie.saveDesignSystem(designSystem, './src/theme');
```

### Batch Component Generation

Generate multiple components from a design system:

```typescript
const designs = [
  { type: 'description', source: 'Navigation bar with logo and menu' },
  { type: 'description', source: 'Card component with image, title, and description' },
  { type: 'description', source: 'Data table with sorting and pagination' }
];

for (const design of designs) {
  const component = await sketchie.generateComponent(design, {
    framework: 'react',
    designSystem: designSystem, // Use extracted tokens
    enforceTokens: true
  });
  
  await sketchie.saveComponent(component);
}
```

### Component Modernization

Update legacy components to modern patterns:

```typescript
const modernized = await sketchie.modernizeComponent(
  './src/components/LegacyForm.js',
  {
    targets: ['hooks', 'typescript', 'accessibility'],
    preserveApi: true
  }
);
```

## Configuration

### Sketchie Config File

Create a `.sketchierc.json` in your project root:

```json
{
  "framework": "react",
  "styling": "styled-components",
  "typescript": true,
  "outputDir": "./src/components",
  "accessibility": {
    "wcagLevel": "AA",
    "autoFix": true
  },
  "performance": {
    "bundleSizeLimit": 50000,
    "lazyLoad": true
  },
  "designSystem": {
    "tokensPath": "./src/theme/tokens.js",
    "enforceTokens": true
  }
}
```

### Environment Variables

```bash
# API Keys (optional)
FIGMA_TOKEN=your-figma-api-token
OPENAI_API_KEY=your-openai-key  # For advanced AI features

# Directories
SKETCHIE_OUTPUT_DIR=./src/components
SKETCHIE_ASSETS_DIR=./public/assets

# Feature flags
SKETCHIE_AUTO_OPTIMIZE=true
SKETCHIE_GENERATE_TESTS=true
```

## Next Steps

- Explore [Advanced Features](./advanced-features.md)
- Learn about [Design Token Management](./design-tokens.md)
- See [Framework-Specific Guides](./frameworks/)
- Check out [Example Projects](../examples/)

## Troubleshooting

### Common Issues

1. **Component generation fails**
   - Check your design input format
   - Ensure framework dependencies are installed
   - Verify API keys for external services

2. **Accessibility warnings persist**
   - Some issues require manual intervention
   - Check the generated `accessibility-report.html`
   - Use `wcagLevel: 'AAA'` for stricter compliance

3. **Large bundle sizes**
   - Enable performance optimization
   - Use code splitting for complex components
   - Consider lazy loading for heavy dependencies

### Getting Help

- Join our [Discord](https://discord.gg/earth-agents)
- Check [GitHub Issues](https://github.com/earth-agents/sketchie/issues)
- Read the [FAQ](./faq.md)