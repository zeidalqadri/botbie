# Sketchie API Reference

Complete API documentation for the Sketchie UI/UX agent.

## Table of Contents

- [Core API](#core-api)
- [Design Analysis](#design-analysis)
- [Component Generation](#component-generation)
- [Accessibility](#accessibility)
- [Performance](#performance)
- [Design Tokens](#design-tokens)
- [MCP Tools](#mcp-tools)
- [Types](#types)

## Core API

### `createSketchie(options?)`

Creates a new Sketchie instance.

```typescript
const sketchie = createSketchie({
  framework?: 'react' | 'vue' | 'angular' | 'webcomponents';
  wcagLevel?: 'A' | 'AA' | 'AAA';
  outputDir?: string;
  verbose?: boolean;
  performanceThresholds?: {
    bundleSize?: number;
    renderTime?: number;
  };
});
```

### `sketchie.initialize()`

Initializes the Sketchie agent and loads strategies.

```typescript
await sketchie.initialize();
```

## Design Analysis

### `sketchie.analyzeDesign(input)`

Analyzes a design input and extracts UI components.

```typescript
const components = await sketchie.analyzeDesign({
  type: 'description' | 'image' | 'figma' | 'sketch' | 'url',
  source: string,
  metadata?: {
    apiToken?: string;
    nodeIds?: string[];
    extractTokens?: boolean;
  }
});

// Returns: UIComponent[]
```

### `sketchie.analyzeComponents(path)`

Analyzes existing components in a directory.

```typescript
const analysis = await sketchie.analyzeComponents('./src/components');

// Returns: UIAnalysisResult
```

## Component Generation

### `sketchie.generateComponent(design, options)`

Generates a complete component from a design.

```typescript
const component = await sketchie.generateComponent(
  {
    type: 'description',
    source: 'A button component'
  },
  {
    framework: 'react',
    styling: 'styled-components',
    typescript: true,
    testing: true,
    storybook: true,
    accessibility: true,
    designSystem?: DesignSystem,
    enforceTokens?: boolean
  }
);

// Returns: GeneratedComponent
```

### `sketchie.saveComponent(component, path?)`

Saves a generated component to disk.

```typescript
await sketchie.saveComponent(component, './src/components/Button');
```

### `sketchie.modernizeComponent(path, options)`

Modernizes an existing component to current best practices.

```typescript
const modernized = await sketchie.modernizeComponent(
  './src/LegacyComponent.js',
  {
    targets: ['hooks', 'typescript', 'accessibility', 'performance'],
    preserveApi: true
  }
);
```

## Accessibility

### `sketchie.checkAccessibility(code)`

Checks a component for accessibility issues.

```typescript
const report = await sketchie.checkAccessibility(componentCode);

// Returns: AccessibilityReport
{
  score: number;
  wcagLevel: 'A' | 'AA' | 'AAA';
  issues: AccessibilityIssue[];
  passes: AccessibilityPass[];
  suggestions: string[];
}
```

### `sketchie.auditAccessibility(input, options?)`

Performs comprehensive accessibility audit.

```typescript
const audit = await sketchie.auditAccessibility(
  './src/components',
  {
    wcagLevel: 'AA',
    autoFix: true,
    generateReport: true
  }
);

// Returns: AccessibilityAudit
```

### `sketchie.fixAccessibilityIssues(code, issues)`

Automatically fixes accessibility issues.

```typescript
const fixed = await sketchie.fixAccessibilityIssues(
  componentCode,
  audit.issues
);
```

### `sketchie.fixColorContrast(bg, fg, options?)`

Fixes color contrast issues.

```typescript
const colors = await sketchie.fixColorContrast('#e0e0e0', '#666', {
  targetRatio: 4.5,
  preferDarker: true
});

// Returns: { background: string, foreground: string, ratio: number }
```

## Performance

### `sketchie.analyzePerformance(code)`

Analyzes component performance metrics.

```typescript
const perf = await sketchie.analyzePerformance(componentCode);

// Returns: PerformanceMetrics
{
  bundleSize: number;
  renderTime: number;
  reRenderTime: number;
  memoryUsage: number;
  suggestions: string[];
}
```

### `sketchie.optimizeComponent(code, options)`

Optimizes component for performance.

```typescript
const optimized = await sketchie.optimizeComponent(componentCode, {
  targetSize: 30000,
  techniques: ['tree-shaking', 'code-splitting', 'lazy-loading'],
  preserveFunctionality: true
});
```

### `sketchie.analyzeBundle(path)`

Analyzes bundle size and composition.

```typescript
const bundle = await sketchie.analyzeBundle('./dist/bundle.js');

// Returns: BundleAnalysis
```

## Design Tokens

### `sketchie.extractDesignTokens(path, options?)`

Extracts design tokens from codebase.

```typescript
const tokens = await sketchie.extractDesignTokens('./src', {
  categories: ['color', 'typography', 'spacing', 'shadow', 'radius'],
  format: 'js' | 'json' | 'css' | 'scss',
  deduplicate: true
});

// Returns: DesignSystem
```

### `sketchie.generateTheme(designSystem, options)`

Generates theme from design system.

```typescript
const theme = await sketchie.generateTheme(designSystem, {
  framework: 'styled-components' | 'emotion' | 'css-variables',
  darkMode: true,
  customizations?: {
    primaryColor?: string;
    fontFamily?: string;
  }
});
```

### `sketchie.convertTokensToTheme(tokens, options)`

Converts raw tokens to framework-specific theme.

```typescript
const theme = await sketchie.convertTokensToTheme(figmaTokens, {
  format: 'styled-components'
});
```

## MCP Tools

### Available Tools

1. **analyze-design** - Analyze design inputs
2. **generate-component** - Generate TypeScript components  
3. **audit-accessibility** - Check WCAG compliance
4. **optimize-bundle** - Optimize performance
5. **extract-tokens** - Extract design tokens
6. **generate-story** - Create Storybook stories
7. **analyze-ui-patterns** - Detect reusable patterns
8. **convert-to-typescript** - Convert JS to TS
9. **theme-generator** - Generate themes
10. **refactor-component** - Modernize components

### Tool Usage Example

```typescript
// Via MCP
const result = await mcpClient.callTool('sketchie_analyze-design', {
  designType: 'description',
  source: 'Create a card component',
  extractTokens: true
});
```

## Types

### Core Types

```typescript
interface DesignInput {
  type: 'image' | 'figma' | 'sketch' | 'url' | 'description';
  source: string;
  metadata?: Record<string, any>;
}

interface UIComponent {
  id: string;
  name: string;
  type: string;
  props: ComponentProp[];
  children?: UIComponent[];
  styles?: StyleDefinition;
  accessibility?: AccessibilityInfo;
  variants?: ComponentVariant[];
}

interface GeneratedComponent {
  name: string;
  typescript?: string;
  javascript?: string;
  jsx?: string;
  css?: string;
  tests?: string;
  stories?: string;
  types?: string;
  documentation?: string;
}

interface ComponentGenerationOptions {
  framework: 'react' | 'vue' | 'angular' | 'webcomponents';
  styling: 'styled-components' | 'emotion' | 'css' | 'scss' | 'tailwind';
  typescript: boolean;
  testing: boolean;
  storybook: boolean;
  accessibility: boolean;
  designSystem?: DesignSystem;
  enforceTokens?: boolean;
}
```

### Analysis Types

```typescript
interface UIAnalysisResult {
  components: UIComponent[];
  designTokens: DesignToken[];
  accessibility: AccessibilityInfo;
  performance: PerformanceMetrics;
  patterns: UIPattern[];
  suggestions: ComponentSuggestion[];
}

interface AccessibilityInfo {
  score: number;
  wcagLevel: 'A' | 'AA' | 'AAA';
  issues: AccessibilityIssue[];
  passes: AccessibilityPass[];
}

interface PerformanceMetrics {
  bundleSize: number;
  renderTime: number;
  reRenderTime: number;
  memoryUsage: number;
  suggestions: PerformanceSuggestion[];
}
```

### Design System Types

```typescript
interface DesignSystem {
  name: string;
  version: string;
  tokens: DesignToken[];
  components?: ComponentDefinition[];
  documentation?: string;
}

interface DesignToken {
  name: string;
  value: any;
  category: 'color' | 'typography' | 'spacing' | 'shadow' | 'radius' | 'animation';
  type: string;
  description?: string;
  metadata?: Record<string, any>;
  usageCount?: number;
}
```

## Error Handling

Sketchie uses typed errors for better error handling:

```typescript
try {
  await sketchie.generateComponent(design, options);
} catch (error) {
  if (error instanceof SketchieError) {
    console.error(`Sketchie Error: ${error.code} - ${error.message}`);
    
    switch (error.code) {
      case 'INVALID_DESIGN_INPUT':
        // Handle invalid input
        break;
      case 'FRAMEWORK_NOT_SUPPORTED':
        // Handle unsupported framework
        break;
      case 'ACCESSIBILITY_VIOLATION':
        // Handle accessibility issues
        break;
    }
  }
}
```

## Configuration

### Global Configuration

```typescript
Sketchie.configure({
  defaultFramework: 'react',
  defaultStyling: 'styled-components',
  aiProvider: 'openai',
  aiModel: 'gpt-4',
  cacheEnabled: true,
  telemetry: false
});
```

### Per-Instance Configuration

```typescript
const sketchie = createSketchie({
  // Instance-specific config
});

sketchie.updateConfig({
  wcagLevel: 'AAA',
  verbose: true
});
```