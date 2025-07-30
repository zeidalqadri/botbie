/**
 * Basic Button Generation Example
 * 
 * This example shows how to generate a simple button component
 * from a text description using Sketchie.
 */

import { createSketchie } from '@earth-agents/sketchie';

async function generateButton() {
  // Initialize Sketchie
  const sketchie = createSketchie({
    framework: 'react',
    wcagLevel: 'AA'
  });

  await sketchie.initialize();

  // Define the button design
  const buttonDesign = {
    type: 'description' as const,
    source: `
      Create a modern button component with the following specifications:
      - Primary variant: Blue background (#007AFF), white text
      - Secondary variant: White background, blue text and border
      - Disabled state: Gray background, reduced opacity
      - Hover state: Slightly darker background
      - Focus state: Blue outline for accessibility
      - Padding: 12px horizontal, 8px vertical
      - Border radius: 6px
      - Font weight: 600
      - Transition: all 200ms ease
    `
  };

  // Generate the component
  const button = await sketchie.generateComponent(buttonDesign, {
    framework: 'react',
    styling: 'styled-components',
    typescript: true,
    testing: true,
    storybook: true,
    accessibility: true
  });

  // Display generated code
  console.log('=== Generated Button Component ===');
  console.log('\n--- TypeScript Component ---');
  console.log(button.typescript);
  
  console.log('\n--- Styled Components ---');
  console.log(button.css);
  
  console.log('\n--- Test File ---');
  console.log(button.tests);
  
  console.log('\n--- Storybook Stories ---');
  console.log(button.stories);

  // Check accessibility
  const a11yReport = await sketchie.checkAccessibility(button.typescript);
  console.log('\n--- Accessibility Report ---');
  console.log(`Score: ${a11yReport.score}/100`);
  console.log(`WCAG Level: ${a11yReport.wcagLevel}`);
  console.log(`Issues: ${a11yReport.issues.length}`);

  // Analyze performance
  const perfReport = await sketchie.analyzePerformance(button.typescript);
  console.log('\n--- Performance Report ---');
  console.log(`Bundle Size: ${perfReport.bundleSize} bytes`);
  console.log(`Render Time: ${perfReport.renderTime}ms`);

  return button;
}

// Run the example
if (require.main === module) {
  generateButton()
    .then(() => console.log('\n✅ Button generated successfully!'))
    .catch(console.error);
}

export { generateButton };