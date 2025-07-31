/**
 * Workflow Integration Example
 * 
 * This example shows how Sketchie integrates with other Earth Agents
 * in complex development workflows.
 */

import { createSketchie } from '@earth-agents/sketchie';
import { createBotbie } from '@earth-agents/botbie';
import { WorkflowOrchestrator } from '@earth-agents/cli';

async function integratedUIWorkflow() {
  console.log('🌍 Earth Agents Integrated UI Development Workflow\n');

  // Initialize agents
  const sketchie = createSketchie({
    framework: 'react',
    wcagLevel: 'AA'
  });
  
  const botbie = createBotbie({
    rules: ['react-hooks', 'typescript-strict']
  });

  const orchestrator = new WorkflowOrchestrator();

  await Promise.all([
    sketchie.initialize(),
    botbie.initialize()
  ]);

  // Define integrated workflow
  const uiDevelopmentWorkflow = {
    id: 'ui-development-workflow',
    name: 'Complete UI Development Pipeline',
    description: 'Design to production-ready code with quality checks',
    nodes: [
      {
        id: 'design-analysis',
        type: 'analysis',
        agent: 'sketchie',
        action: 'analyzeDesign',
        config: {
          extractTokens: true,
          detectPatterns: true
        }
      },
      {
        id: 'component-generation',
        type: 'action',
        agent: 'sketchie',
        action: 'generateComponent',
        dependsOn: ['design-analysis'],
        config: {
          typescript: true,
          testing: true
        }
      },
      {
        id: 'quality-check',
        type: 'parallel',
        dependsOn: ['component-generation'],
        tasks: [
          {
            agent: 'sketchie',
            action: 'checkAccessibility',
            config: { autoFix: true }
          },
          {
            agent: 'botbie',
            action: 'analyzeCode',
            config: { fix: true }
          }
        ]
      },
      {
        id: 'optimization',
        type: 'action',
        agent: 'sketchie',
        action: 'optimizePerformance',
        dependsOn: ['quality-check'],
        conditions: [
          {
            field: 'bundleSize',
            operator: '>',
            value: 50000
          }
        ]
      },
      {
        id: 'final-validation',
        type: 'merge',
        dependsOn: ['optimization'],
        action: 'validateComponent'
      }
    ]
  };

  // Execute workflow
  console.log('🔄 Executing integrated workflow...\n');

  // Step 1: Design Analysis
  console.log('📋 Step 1: Analyzing design requirements');
  
  const designInput = {
    type: 'description' as const,
    source: `
      Create a modern dashboard layout with:
      - Responsive sidebar navigation
      - Header with user profile and notifications
      - Main content area with data cards
      - Charts and analytics section
      - Dark mode support
    `
  };

  const designAnalysis = await sketchie.analyzeDesign(designInput);
  console.log(`✅ Identified ${designAnalysis.length} components to build\n`);

  // Step 2: Component Generation
  console.log('📋 Step 2: Generating components');
  
  const components = [];
  for (const component of designAnalysis) {
    const generated = await sketchie.generateComponent(
      { type: 'analysis', source: component },
      {
        framework: 'react',
        styling: 'styled-components',
        typescript: true,
        testing: true
      }
    );
    components.push(generated);
    console.log(`  ✅ Generated: ${component.name}`);
  }

  // Step 3: Parallel Quality Checks
  console.log('\n📋 Step 3: Running quality checks in parallel');
  
  const qualityResults = await Promise.all([
    // Sketchie accessibility check
    Promise.all(components.map(async (component) => {
      const a11y = await sketchie.checkAccessibility(component.typescript);
      return {
        component: component.name,
        accessibility: a11y
      };
    })),
    
    // Botbie code quality check
    Promise.all(components.map(async (component) => {
      const quality = await botbie.analyze({
        code: component.typescript,
        language: 'typescript'
      });
      return {
        component: component.name,
        codeQuality: quality
      };
    }))
  ]);

  console.log('  ✅ Accessibility checks complete');
  console.log('  ✅ Code quality analysis complete\n');

  // Step 4: Performance Optimization
  console.log('📋 Step 4: Optimizing performance');
  
  const optimizedComponents = [];
  for (const component of components) {
    const perf = await sketchie.analyzePerformance(component.typescript);
    
    if (perf.bundleSize > 50000) {
      console.log(`  ⚡ Optimizing ${component.name} (${perf.bundleSize} bytes)`);
      const optimized = await sketchie.optimizeComponent(component.typescript, {
        targetSize: 30000,
        techniques: ['tree-shaking', 'code-splitting']
      });
      optimizedComponents.push(optimized);
    } else {
      console.log(`  ✅ ${component.name} already optimal`);
      optimizedComponents.push(component);
    }
  }

  // Step 5: Cross-Agent Insights
  console.log('\n📋 Step 5: Generating cross-agent insights\n');

  const insights = {
    accessibility: qualityResults[0].map(r => ({
      component: r.component,
      score: r.accessibility.score,
      issues: r.accessibility.issues.length
    })),
    codeQuality: qualityResults[1].map(r => ({
      component: r.component,
      score: r.codeQuality.summary.qualityScore,
      issues: r.codeQuality.summary.totalIssues
    })),
    performance: await Promise.all(optimizedComponents.map(async (c) => {
      const perf = await sketchie.analyzePerformance(c.typescript || '');
      return {
        component: c.name,
        bundleSize: perf.bundleSize,
        renderTime: perf.renderTime
      };
    }))
  };

  console.log('🎯 Workflow Results Summary:');
  console.log('\n📊 Component Quality Metrics:');
  
  insights.accessibility.forEach((comp, idx) => {
    const codeQuality = insights.codeQuality[idx];
    const performance = insights.performance[idx];
    
    console.log(`\n  ${comp.component}:`);
    console.log(`    Accessibility: ${comp.score}/100 (${comp.issues} issues)`);
    console.log(`    Code Quality: ${codeQuality.score}/100 (${codeQuality.issues} issues)`);
    console.log(`    Bundle Size: ${Math.round(performance.bundleSize / 1024)}KB`);
    console.log(`    Render Time: ${performance.renderTime}ms`);
  });

  // Generate unified report
  const report = await orchestrator.generateReport({
    workflow: uiDevelopmentWorkflow,
    results: insights,
    recommendations: [
      'Consider implementing lazy loading for dashboard cards',
      'Add keyboard navigation to sidebar',
      'Implement virtual scrolling for large data sets',
      'Cache chart data to improve performance'
    ]
  });

  console.log('\n📄 Unified Workflow Report generated\n');

  return { components: optimizedComponents, insights, report };
}

// Example: Custom workflow for design system creation
async function designSystemWorkflow() {
  console.log('\n\n🎨 Design System Creation Workflow\n');

  const sketchie = createSketchie();
  await sketchie.initialize();

  // Step 1: Extract tokens from existing codebase
  console.log('📋 Step 1: Extracting design tokens');
  const tokens = await sketchie.extractDesignTokens('./src');
  console.log(`  ✅ Extracted ${tokens.tokens.length} design tokens\n`);

  // Step 2: Generate base components
  console.log('📋 Step 2: Generating base components');
  
  const baseComponents = [
    'Button', 'Input', 'Card', 'Modal',
    'Dropdown', 'Table', 'Tabs', 'Alert'
  ];

  const generatedComponents = [];
  for (const componentName of baseComponents) {
    const component = await sketchie.generateComponent(
      {
        type: 'description',
        source: `${componentName} component following design system`
      },
      {
        framework: 'react',
        designSystem: tokens,
        enforceTokens: true
      }
    );
    generatedComponents.push(component);
    console.log(`  ✅ Generated: ${componentName}`);
  }

  // Step 3: Create component documentation
  console.log('\n📋 Step 3: Generating documentation');
  
  const docs = await sketchie.generateComponentDocs(generatedComponents, {
    format: 'storybook',
    includePlayground: true,
    includeAccessibility: true
  });

  console.log('  ✅ Generated Storybook documentation');
  console.log('  ✅ Added interactive playgrounds');
  console.log('  ✅ Included accessibility guidelines');

  // Step 4: Create theme variations
  console.log('\n📋 Step 4: Creating theme variations');
  
  const themes = await sketchie.generateThemeVariations(tokens, {
    variations: ['light', 'dark', 'high-contrast'],
    framework: 'css-variables'
  });

  console.log('  ✅ Generated light theme');
  console.log('  ✅ Generated dark theme');
  console.log('  ✅ Generated high-contrast theme');

  return {
    tokens,
    components: generatedComponents,
    documentation: docs,
    themes
  };
}

// Run the examples
if (require.main === module) {
  integratedUIWorkflow()
    .then(() => designSystemWorkflow())
    .then(() => console.log('\n✅ Workflow integration examples complete!'))
    .catch(console.error);
}

export { integratedUIWorkflow, designSystemWorkflow };