# 🎨 Sketchie - UI/UX Design Agent

Sketchie is an AI-powered UI/UX agent that transforms design concepts into production-ready TypeScript components. Part of the Earth Agents ecosystem, Sketchie makes "designing and sketching and typescripting a breeze."

## 🌟 Features

- **Design-to-Code Transformation**: Convert Figma designs, images, or text descriptions into TypeScript components
- **Accessibility-First**: Built-in WCAG compliance checking and automatic fixes
- **Performance Optimization**: Analyze and optimize component bundle sizes and render times
- **Design Token Extraction**: Automatically extract colors, typography, spacing from existing codebases
- **Framework Support**: Generate components for React, Vue, Angular, or Web Components
- **TypeScript Native**: Full TypeScript support with proper type inference
- **Storybook Integration**: Automatic story generation for component documentation

## 🚀 Quick Start

### Installation

```bash
npm install @earth-agents/sketchie
# or
yarn add @earth-agents/sketchie
# or
pnpm add @earth-agents/sketchie
```

### Basic Usage

```typescript
import { createSketchie } from '@earth-agents/sketchie';

// Initialize Sketchie
const sketchie = createSketchie({
  framework: 'react',
  wcagLevel: 'AA'
});

await sketchie.initialize();

// Analyze a design
const components = await sketchie.analyzeDesign({
  type: 'description',
  source: 'A modern dashboard with sidebar navigation and data cards'
});

// Generate component code
const component = await sketchie.generateComponent(
  { type: 'description', source: 'A responsive navigation bar' },
  {
    framework: 'react',
    styling: 'styled-components',
    typescript: true,
    testing: true
  }
);
```

## 📚 Core Concepts

### Design Input Types

Sketchie accepts various design inputs:

```typescript
type DesignInput = {
  type: 'image' | 'figma' | 'sketch' | 'url' | 'description';
  source: string; // Path, URL, or text description
  metadata?: Record<string, any>;
};
```

### Component Generation Options

```typescript
interface ComponentGenerationOptions {
  framework: 'react' | 'vue' | 'angular' | 'webcomponents';
  styling: 'styled-components' | 'emotion' | 'css' | 'scss' | 'tailwind';
  typescript: boolean;
  testing: boolean;
  storybook: boolean;
  accessibility: boolean;
}
```

### UI Analysis Result

```typescript
interface UIAnalysisResult {
  components: UIComponent[];
  designTokens: DesignToken[];
  accessibility: AccessibilityInfo;
  performance: PerformanceMetrics;
  patterns: UIPattern[];
  suggestions: ComponentSuggestion[];
}
```

## 🛠️ Strategies

Sketchie uses four specialized strategies:

### 1. Design Analyzer
Analyzes design inputs and extracts UI components, patterns, and tokens.

```typescript
const analyzer = new DesignAnalyzer();
const analysis = await analyzer.analyze(designInput);
```

### 2. Component Generator
Transforms analyzed designs into production-ready code.

```typescript
const generator = new ComponentGenerator();
const code = await generator.generate(uiComponent, options);
```

### 3. Accessibility Checker
Ensures WCAG compliance and provides fixes.

```typescript
const checker = new AccessibilityChecker({ wcagLevel: 'AA' });
const report = await checker.check(componentCode);
```

### 4. Performance Optimizer
Optimizes components for bundle size and render performance.

```typescript
const optimizer = new PerformanceOptimizer();
const optimized = await optimizer.optimize(component);
```

## 🎯 Claude Code Integration

Sketchie integrates seamlessly with Claude Code through slash commands:

### Available Commands

- `/earth sketch` - Transform designs to TypeScript components
- `/earth sketch-a11y` - Accessibility audit and fixes
- `/earth sketch-perf` - Performance optimization
- `/earth sketch-tokens` - Extract design tokens

### Example Usage

```bash
# Transform a design description to React component
/earth sketch "Create a modern login form with email and password fields"

# Audit accessibility
/earth sketch-a11y ./src/components

# Extract design tokens
/earth sketch-tokens ./src/styles
```

## 📋 MCP Tools

Sketchie provides 10 MCP tools for programmatic access:

1. **analyze-design** - Analyze design inputs
2. **generate-component** - Generate TypeScript components
3. **audit-accessibility** - Check WCAG compliance
4. **optimize-bundle** - Optimize performance
5. **extract-tokens** - Extract design tokens
6. **generate-story** - Create Storybook stories
7. **analyze-ui-patterns** - Detect reusable patterns
8. **convert-to-typescript** - Convert JS to TS
9. **theme-generator** - Generate themes from tokens
10. **refactor-component** - Modernize components

## 🔄 Workflow Integration

Sketchie integrates with the Earth Agents workflow orchestrator:

```typescript
const workflow = {
  id: 'ui-development',
  name: 'UI Development Workflow',
  nodes: [
    {
      id: 'analyze',
      type: 'analysis',
      agent: 'sketchie',
      action: 'analyzeDesign'
    },
    {
      id: 'generate',
      type: 'action',
      agent: 'sketchie',
      action: 'generateComponent'
    },
    {
      id: 'quality-check',
      type: 'parallel',
      agents: ['sketchie', 'botbie'],
      actions: ['checkAccessibility', 'analyzeCode']
    }
  ]
};
```

## 🎨 Design System Support

Sketchie can extract and maintain design systems:

```typescript
// Extract design system from existing codebase
const designSystem = await sketchie.extractDesignTokens('./src');

// Generate theme
const theme = await sketchie.generateTheme(designSystem, {
  darkMode: true,
  framework: 'styled-components'
});

// Apply design system to new components
const component = await sketchie.generateComponent(design, {
  designSystem: designSystem,
  enforceTokens: true
});
```

## 📊 Performance Metrics

Sketchie tracks and optimizes key metrics:

- **Bundle Size**: Component JavaScript size
- **Render Time**: Initial and re-render performance
- **Accessibility Score**: WCAG compliance percentage
- **Code Quality**: TypeScript coverage and best practices

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../../CONTRIBUTING.md) for details.

## 📄 License

MIT © Earth Agents Team