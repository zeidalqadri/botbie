import { MCPPrompt } from '@earth-agents/core';

export const sketchiePrompts: MCPPrompt[] = [
  {
    name: 'design-to-code',
    description: 'Convert a design into production-ready TypeScript components',
    arguments: [
      {
        name: 'design_description',
        description: 'Description of the design or UI element',
        required: true
      },
      {
        name: 'framework',
        description: 'Target framework (react, vue, angular)',
        required: false
      },
      {
        name: 'include_tests',
        description: 'Whether to generate tests',
        required: false
      }
    ]
  },
  {
    name: 'component-refactor',
    description: 'Refactor an existing component to modern best practices',
    arguments: [
      {
        name: 'component_code',
        description: 'The component code to refactor',
        required: true
      },
      {
        name: 'targets',
        description: 'What to focus on (performance, accessibility, typescript)',
        required: false
      }
    ]
  },
  {
    name: 'accessibility-fix',
    description: 'Fix accessibility issues in UI components',
    arguments: [
      {
        name: 'component_code',
        description: 'Component with accessibility issues',
        required: true
      },
      {
        name: 'wcag_level',
        description: 'Target WCAG level (A, AA, AAA)',
        required: false
      }
    ]
  },
  {
    name: 'design-system-setup',
    description: 'Set up a complete design system from scratch',
    arguments: [
      {
        name: 'project_type',
        description: 'Type of project (webapp, mobile, desktop)',
        required: true
      },
      {
        name: 'brand_colors',
        description: 'Primary brand colors',
        required: false
      },
      {
        name: 'typography_preferences',
        description: 'Font family preferences',
        required: false
      }
    ]
  },
  {
    name: 'ui-pattern-analysis',
    description: 'Analyze UI code for patterns and improvement opportunities',
    arguments: [
      {
        name: 'codebase_description',
        description: 'Description of the codebase structure',
        required: true
      },
      {
        name: 'focus_areas',
        description: 'Specific areas to analyze',
        required: false
      }
    ]
  },
  {
    name: 'responsive-design',
    description: 'Make components responsive across devices',
    arguments: [
      {
        name: 'component_code',
        description: 'Component to make responsive',
        required: true
      },
      {
        name: 'breakpoints',
        description: 'Target breakpoints (mobile, tablet, desktop)',
        required: false
      }
    ]
  },
  {
    name: 'performance-optimization',
    description: 'Optimize UI components for better performance',
    arguments: [
      {
        name: 'component_code',
        description: 'Component to optimize',
        required: true
      },
      {
        name: 'metrics',
        description: 'Target metrics (bundle size, render time)',
        required: false
      }
    ]
  },
  {
    name: 'storybook-generation',
    description: 'Generate comprehensive Storybook stories for components',
    arguments: [
      {
        name: 'component_code',
        description: 'Component to create stories for',
        required: true
      },
      {
        name: 'include_playground',
        description: 'Include interactive playground',
        required: false
      }
    ]
  }
];