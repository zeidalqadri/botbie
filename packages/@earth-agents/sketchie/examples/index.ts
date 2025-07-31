/**
 * Sketchie Examples
 * 
 * This file exports all example functions for easy access
 * and provides a CLI interface to run examples.
 */

export { generateButton } from './basic-button';
export { extractDesignSystem } from './design-system-extraction';
export { runAccessibilityAudit, fixSpecificIssues } from './accessibility-audit';
export { convertFigmaToCode, advancedFigmaFeatures } from './figma-to-code';
export { integratedUIWorkflow, designSystemWorkflow } from './workflow-integration';

// CLI interface for running examples
if (require.main === module) {
  const args = process.argv.slice(2);
  const exampleName = args[0];

  const examples: Record<string, () => Promise<any>> = {
    'button': async () => {
      const { generateButton } = await import('./basic-button');
      return generateButton();
    },
    'design-system': async () => {
      const { extractDesignSystem } = await import('./design-system-extraction');
      return extractDesignSystem();
    },
    'accessibility': async () => {
      const { runAccessibilityAudit } = await import('./accessibility-audit');
      return runAccessibilityAudit();
    },
    'figma': async () => {
      const { convertFigmaToCode } = await import('./figma-to-code');
      return convertFigmaToCode();
    },
    'workflow': async () => {
      const { integratedUIWorkflow } = await import('./workflow-integration');
      return integratedUIWorkflow();
    }
  };

  if (!exampleName || !examples[exampleName]) {
    console.log(`
🎨 Sketchie Examples

Usage: npx ts-node examples/index.ts [example-name]

Available examples:
  - button         : Generate a basic button component
  - design-system  : Extract design tokens from codebase
  - accessibility  : Run accessibility audit and fixes
  - figma         : Convert Figma designs to code
  - workflow      : Integrated Earth Agents workflow

Example: npx ts-node examples/index.ts button
    `);
    process.exit(0);
  }

  console.log(`\n🚀 Running "${exampleName}" example...\n`);
  
  examples[exampleName]()
    .then(() => {
      console.log('\n✅ Example completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Example failed:', error);
      process.exit(1);
    });
}