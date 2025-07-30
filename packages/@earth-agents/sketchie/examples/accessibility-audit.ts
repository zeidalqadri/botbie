/**
 * Accessibility Audit Example
 * 
 * This example shows how to audit components for WCAG compliance
 * and automatically fix common accessibility issues.
 */

import { createSketchie } from '@earth-agents/sketchie';
import * as fs from 'fs/promises';

async function runAccessibilityAudit() {
  const sketchie = createSketchie({
    wcagLevel: 'AA'
  });
  
  await sketchie.initialize();

  console.log('♿ Starting Accessibility Audit...\n');

  // Example 1: Audit a single component
  console.log('📋 Example 1: Auditing a form component\n');

  const formComponent = `
import React from 'react';
import styled from 'styled-components';

const Form = styled.form\`
  display: flex;
  flex-direction: column;
  gap: 16px;
\`;

const Input = styled.input\`
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
\`;

const Button = styled.button\`
  padding: 10px 20px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
\`;

export function LoginForm() {
  return (
    <Form>
      <Input type="email" placeholder="Email" />
      <Input type="password" placeholder="Password" />
      <Button>Login</Button>
    </Form>
  );
}
  `;

  // Audit the component
  const audit = await sketchie.auditAccessibility(formComponent, {
    autoFix: true
  });

  console.log('🔍 Accessibility Issues Found:');
  audit.issues.forEach((issue, index) => {
    console.log(`\n${index + 1}. ${issue.rule} (${issue.severity})`);
    console.log(`   Description: ${issue.description}`);
    console.log(`   Location: Line ${issue.line}`);
    console.log(`   Fix: ${issue.suggestedFix}`);
  });

  console.log(`\n✅ Auto-fixed ${audit.fixed.length} issues`);

  // Show the fixed component
  if (audit.fixedCode) {
    console.log('\n📝 Fixed Component:');
    console.log('```typescript');
    console.log(audit.fixedCode);
    console.log('```');
  }

  // Example 2: Batch audit multiple components
  console.log('\n\n📋 Example 2: Batch auditing components directory\n');

  const batchAudit = await sketchie.auditDirectory('./src/components', {
    wcagLevel: 'AA',
    includeReport: true,
    reportFormat: 'html'
  });

  console.log('📊 Batch Audit Summary:');
  console.log(`   Total files: ${batchAudit.totalFiles}`);
  console.log(`   Files with issues: ${batchAudit.filesWithIssues}`);
  console.log(`   Total issues: ${batchAudit.totalIssues}`);
  console.log(`   Critical issues: ${batchAudit.criticalIssues}`);
  console.log(`   Average score: ${batchAudit.averageScore}/100`);

  // Show top issues
  console.log('\n🔝 Top Accessibility Issues:');
  batchAudit.topIssues.slice(0, 5).forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.rule} (${issue.count} occurrences)`);
  });

  // Example 3: Component-specific checks
  console.log('\n\n📋 Example 3: Component-specific accessibility checks\n');

  // Check a modal component
  const modalChecks = await sketchie.checkComponentAccessibility({
    componentType: 'modal',
    code: `
      <Modal isOpen={true}>
        <h2>Delete Item</h2>
        <p>Are you sure you want to delete this item?</p>
        <button onClick={onConfirm}>Delete</button>
        <button onClick={onCancel}>Cancel</button>
      </Modal>
    `,
    checks: [
      'focus-trap',
      'escape-key',
      'aria-labels',
      'role-attributes',
      'keyboard-navigation'
    ]
  });

  console.log('🎯 Modal Accessibility Checks:');
  modalChecks.results.forEach(check => {
    const status = check.passed ? '✅' : '❌';
    console.log(`${status} ${check.name}: ${check.message}`);
  });

  // Generate accessibility report
  console.log('\n\n📄 Generating Accessibility Report...\n');

  const report = await sketchie.generateAccessibilityReport({
    format: 'markdown',
    includeFixExamples: true,
    includeBestPractices: true
  });

  await fs.writeFile('./accessibility-report.md', report);
  console.log('✅ Report saved to accessibility-report.md');

  // Show best practices
  console.log('\n💡 Accessibility Best Practices:');
  console.log('1. Always provide alternative text for images');
  console.log('2. Ensure sufficient color contrast (4.5:1 for normal text)');
  console.log('3. Make all interactive elements keyboard accessible');
  console.log('4. Use semantic HTML elements');
  console.log('5. Provide clear focus indicators');
  console.log('6. Include ARIA labels for screen readers');
  console.log('7. Test with actual assistive technologies');

  return audit;
}

// Helper function to demonstrate fixing specific issues
async function fixSpecificIssues() {
  const sketchie = createSketchie({ wcagLevel: 'AAA' });
  await sketchie.initialize();

  // Fix color contrast issues
  const lowContrastButton = {
    background: '#e0e0e0',
    color: '#666666'
  };

  const fixedColors = await sketchie.fixColorContrast(
    lowContrastButton.background,
    lowContrastButton.color,
    { targetRatio: 4.5 }
  );

  console.log('\n🎨 Fixed Color Contrast:');
  console.log(`Original: ${lowContrastButton.color} on ${lowContrastButton.background}`);
  console.log(`Fixed: ${fixedColors.foreground} on ${fixedColors.background}`);
  console.log(`Contrast ratio: ${fixedColors.ratio}:1`);

  // Add ARIA attributes
  const imageWithoutAlt = '<img src="logo.png">';
  const fixedImage = await sketchie.addAccessibilityAttributes(imageWithoutAlt, {
    elementType: 'image',
    context: 'Company logo in header'
  });

  console.log('\n🏷️  Fixed Image Accessibility:');
  console.log(`Original: ${imageWithoutAlt}`);
  console.log(`Fixed: ${fixedImage}`);
}

// Run the example
if (require.main === module) {
  runAccessibilityAudit()
    .then(() => fixSpecificIssues())
    .then(() => console.log('\n✅ Accessibility audit complete!'))
    .catch(console.error);
}

export { runAccessibilityAudit, fixSpecificIssues };