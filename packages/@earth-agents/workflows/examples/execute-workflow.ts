/**
 * Example: Executing Premium Workflows
 * 
 * This example demonstrates how to execute premium workflows
 * with customization and event monitoring.
 */

import { 
  WorkflowCatalog,
  WorkflowCustomizer,
  WorkflowExecutor,
  executeWorkflow,
  loadWorkflowTemplate
} from '@earth-agents/workflows';

async function basicWorkflowExecution() {
  console.log('=== Basic Workflow Execution ===\n');
  
  // Simple execution with minimal configuration
  try {
    const result = await executeWorkflow('fullstack-feature-development', {
      designSource: 'Create a modern login form with email, password, and social login options',
      featureName: 'AuthenticationForm',
      targetFramework: 'react',
      stylingLibrary: 'styled-components'
    });
    
    console.log('✅ Workflow completed successfully!');
    console.log('Generated components:', Object.keys(result).length);
  } catch (error) {
    console.error('❌ Workflow failed:', error);
  }
}

async function customizedWorkflowExecution() {
  console.log('\n=== Customized Workflow Execution ===\n');
  
  // Load and customize a workflow
  const catalog = new WorkflowCatalog();
  await catalog.initialize();
  
  const template = catalog.getTemplate('design-system-creation');
  if (!template) {
    console.error('Template not found');
    return;
  }
  
  // Create customization
  const customization = {
    templateId: 'design-system-creation',
    overrides: {
      config: {
        parallelExecution: true,
        timeoutMinutes: 120
      },
      nodes: [
        {
          id: 'generate-themes',
          inputs: {
            variations: [
              { name: 'light', base: 'default' },
              { name: 'dark', base: 'default', transforms: ['invert-colors'] },
              { name: 'high-contrast', base: 'default', transforms: ['maximize-contrast'] },
              { name: 'colorblind-safe', base: 'default', transforms: ['deuteranopia-safe'] }
            ]
          }
        }
      ]
    },
    variables: {
      packageName: '@mycompany/design-system',
      version: '1.0.0',
      wcagLevel: 'AA',
      outputPath: './dist/design-system'
    }
  };
  
  // Validate customization
  const validation = WorkflowCustomizer.validate(template, customization);
  if (!validation.valid) {
    console.error('Invalid customization:', validation.errors);
    return;
  }
  
  // Apply customization
  const customizedTemplate = WorkflowCustomizer.customize(template, customization);
  
  // Execute
  const executor = new WorkflowExecutor(customizedTemplate, {
    sourceType: 'existing-code',
    sourcePath: './src',
    targetFramework: 'react'
  });
  
  const result = await executor.execute();
  console.log('✅ Customized workflow completed!');
}

async function monitoredWorkflowExecution() {
  console.log('\n=== Monitored Workflow Execution ===\n');
  
  const template = await loadWorkflowTemplate('accessibility-compliance');
  const executor = new WorkflowExecutor(template, {
    targetPath: './src/components',
    wcagLevel: 'AA',
    reportFormat: 'html'
  });
  
  // Set up monitoring
  const startTime = Date.now();
  let lastProgress = 0;
  
  executor.on('start', (execution) => {
    console.log(`🚀 Workflow started: ${execution.id}`);
    console.log(`Template: ${execution.templateId}`);
  });
  
  executor.on('progress', (execution) => {
    if (execution.progress - lastProgress >= 10) {
      console.log(`📊 Progress: ${execution.progress}%`);
      lastProgress = execution.progress;
    }
  });
  
  executor.on('log', (log) => {
    const icon = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    }[log.level];
    
    console.log(`${icon} [${log.level.toUpperCase()}] ${log.message}`);
  });
  
  executor.on('complete', (execution) => {
    const duration = Date.now() - startTime;
    console.log(`\n✅ Workflow completed in ${Math.round(duration / 1000)}s`);
    console.log('Results:', JSON.stringify(execution.results, null, 2));
  });
  
  executor.on('error', (error, execution) => {
    console.error(`\n❌ Workflow failed: ${error.message}`);
    if (execution.errors) {
      console.error('Errors:', execution.errors);
    }
  });
  
  // Execute
  try {
    await executor.execute();
  } catch (error) {
    console.error('Execution error:', error);
  }
}

async function workflowWithPresets() {
  console.log('\n=== Workflow with Presets ===\n');
  
  // Use different presets for different scenarios
  const scenarios = [
    { name: 'Quick Validation', preset: 'quick-validation' },
    { name: 'Strict Compliance', preset: 'strict-compliance' },
    { name: 'Performance Focused', preset: 'performance-focused' },
    { name: 'Minimal Output', preset: 'minimal' }
  ];
  
  for (const scenario of scenarios) {
    console.log(`\n--- ${scenario.name} ---`);
    
    const preset = WorkflowCustomizer.createPreset(scenario.preset as any);
    
    try {
      const result = await executeWorkflow(
        'fullstack-feature-development',
        {
          designSource: 'Simple button component',
          featureName: 'Button',
          targetFramework: 'react'
        },
        preset
      );
      
      console.log(`✅ ${scenario.name} completed`);
    } catch (error) {
      console.error(`❌ ${scenario.name} failed:`, error);
    }
  }
}

async function catalogExploration() {
  console.log('\n=== Workflow Catalog Exploration ===\n');
  
  const catalog = new WorkflowCatalog();
  await catalog.initialize();
  
  // Get statistics
  const stats = catalog.getStatistics();
  console.log('📊 Catalog Statistics:');
  console.log(`  Total workflows: ${stats.total}`);
  console.log(`  Categories: ${Object.keys(stats.byCategory).join(', ')}`);
  console.log(`  Average execution time: ${stats.averageExecutionTime} minutes`);
  
  // Get recommendations
  console.log('\n🎯 Recommended Workflows for React/Finance:');
  const recommendations = catalog.getRecommendedTemplates({
    framework: 'react',
    industry: 'finance',
    teamSize: 15
  });
  
  recommendations.forEach(workflow => {
    console.log(`  - ${workflow.name} (${workflow.tier})`);
    console.log(`    ${workflow.description}`);
  });
  
  // Search by tags
  console.log('\n🔍 Workflows tagged with "accessibility":');
  const accessibilityWorkflows = catalog.searchByTags(['accessibility']);
  accessibilityWorkflows.forEach(workflow => {
    console.log(`  - ${workflow.name}`);
  });
  
  // Export catalog
  await catalog.exportCatalog('./workflow-catalog.json');
  console.log('\n📁 Catalog exported to workflow-catalog.json');
  
  // Generate documentation
  await catalog.generateDocumentation('./workflow-docs.md');
  console.log('📚 Documentation generated at workflow-docs.md');
}

// Run all examples
async function runAllExamples() {
  console.log('🌍 Earth Agents Workflow Examples\n');
  
  await basicWorkflowExecution();
  await customizedWorkflowExecution();
  await monitoredWorkflowExecution();
  await workflowWithPresets();
  await catalogExploration();
  
  console.log('\n✨ All examples completed!');
}

// Run if called directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export {
  basicWorkflowExecution,
  customizedWorkflowExecution,
  monitoredWorkflowExecution,
  workflowWithPresets,
  catalogExploration
};