/**
 * Design System Extraction Example
 * 
 * This example demonstrates how to extract design tokens from
 * an existing codebase and create a cohesive design system.
 */

import { createSketchie } from '@earth-agents/sketchie';
import * as fs from 'fs/promises';
import * as path from 'path';

async function extractDesignSystem() {
  const sketchie = createSketchie();
  await sketchie.initialize();

  console.log('🎨 Extracting design tokens from codebase...\n');

  // Extract design tokens from existing components
  const designSystem = await sketchie.extractDesignTokens('./src', {
    categories: ['color', 'typography', 'spacing', 'shadow', 'radius'],
    format: 'js'
  });

  console.log(`📊 Extracted ${designSystem.tokens.length} design tokens\n`);

  // Display extracted tokens by category
  const tokensByCategory = designSystem.tokens.reduce((acc, token) => {
    if (!acc[token.category]) acc[token.category] = [];
    acc[token.category].push(token);
    return acc;
  }, {} as Record<string, typeof designSystem.tokens>);

  // Show color palette
  console.log('🎨 Color Palette:');
  tokensByCategory.color?.slice(0, 10).forEach(token => {
    console.log(`  ${token.name}: ${token.value} (used ${token.usageCount} times)`);
  });

  // Show typography
  console.log('\n📝 Typography:');
  tokensByCategory.typography?.slice(0, 5).forEach(token => {
    console.log(`  ${token.name}: ${JSON.stringify(token.value)}`);
  });

  // Show spacing
  console.log('\n📏 Spacing:');
  tokensByCategory.spacing?.slice(0, 8).forEach(token => {
    console.log(`  ${token.name}: ${token.value}`);
  });

  // Generate theme files
  console.log('\n🔧 Generating theme files...\n');

  // Generate styled-components theme
  const styledTheme = await sketchie.generateTheme(designSystem, {
    framework: 'styled-components',
    darkMode: true
  });

  // Generate CSS variables
  const cssVariables = await sketchie.generateTheme(designSystem, {
    framework: 'css-variables',
    darkMode: true
  });

  // Create theme directory
  const themeDir = './generated-theme';
  await fs.mkdir(themeDir, { recursive: true });

  // Save theme files
  await fs.writeFile(
    path.join(themeDir, 'theme.ts'),
    styledTheme.light
  );

  await fs.writeFile(
    path.join(themeDir, 'theme.dark.ts'),
    styledTheme.dark || ''
  );

  await fs.writeFile(
    path.join(themeDir, 'variables.css'),
    cssVariables.light
  );

  console.log('✅ Theme files generated successfully!');

  // Generate a component using the design system
  console.log('\n🏗️  Generating component with design system...\n');

  const card = await sketchie.generateComponent(
    {
      type: 'description',
      source: 'A card component with image, title, description, and action button'
    },
    {
      framework: 'react',
      styling: 'styled-components',
      designSystem: designSystem,
      enforceTokens: true
    }
  );

  console.log('Generated Card Component (using design tokens):');
  console.log(card.css?.slice(0, 500) + '...\n');

  // Analyze design system consistency
  const consistency = analyzeConsistency(designSystem);
  console.log('📊 Design System Consistency Report:');
  console.log(`  Color variations: ${consistency.colorVariations}`);
  console.log(`  Font families: ${consistency.fontFamilies}`);
  console.log(`  Spacing scale adherence: ${consistency.spacingConsistency}%`);

  return designSystem;
}

function analyzeConsistency(designSystem: any) {
  const colors = designSystem.tokens.filter((t: any) => t.category === 'color');
  const typography = designSystem.tokens.filter((t: any) => t.category === 'typography');
  const spacing = designSystem.tokens.filter((t: any) => t.category === 'spacing');

  // Analyze color variations
  const uniqueColors = new Set(colors.map((c: any) => c.value));
  
  // Analyze font families
  const fontFamilies = new Set(
    typography
      .map((t: any) => t.value.fontFamily)
      .filter(Boolean)
  );

  // Check if spacing follows a scale (4, 8, 12, 16, 24, 32, etc.)
  const spacingValues = spacing
    .map((s: any) => parseInt(s.value))
    .filter((v: number) => !isNaN(v));
  
  const followsScale = spacingValues.filter((v: number) => v % 4 === 0).length;
  const spacingConsistency = Math.round((followsScale / spacingValues.length) * 100);

  return {
    colorVariations: uniqueColors.size,
    fontFamilies: fontFamilies.size,
    spacingConsistency
  };
}

// Run the example
if (require.main === module) {
  extractDesignSystem()
    .then(() => console.log('\n✅ Design system extraction complete!'))
    .catch(console.error);
}

export { extractDesignSystem };