import { MCPResource } from '@earth-agents/core';

export const sketchieResources: MCPResource[] = [
  {
    name: 'component-library',
    uri: 'sketchie://components',
    description: 'Access to generated component library',
    mimeType: 'application/json'
  },
  {
    name: 'design-tokens',
    uri: 'sketchie://tokens',
    description: 'Extracted design tokens and theme values',
    mimeType: 'application/json'
  },
  {
    name: 'ui-patterns',
    uri: 'sketchie://patterns',
    description: 'Detected UI patterns and recommendations',
    mimeType: 'application/json'
  },
  {
    name: 'accessibility-report',
    uri: 'sketchie://accessibility',
    description: 'Latest accessibility audit results',
    mimeType: 'application/json'
  },
  {
    name: 'performance-metrics',
    uri: 'sketchie://performance',
    description: 'Component performance metrics and optimization suggestions',
    mimeType: 'application/json'
  },
  {
    name: 'design-system',
    uri: 'sketchie://design-system',
    description: 'Complete design system documentation',
    mimeType: 'application/json'
  },
  {
    name: 'component-analytics',
    uri: 'sketchie://analytics',
    description: 'Usage analytics and component effectiveness metrics',
    mimeType: 'application/json'
  },
  {
    name: 'style-guide',
    uri: 'sketchie://style-guide',
    description: 'Generated style guide with live examples',
    mimeType: 'text/html'
  }
];