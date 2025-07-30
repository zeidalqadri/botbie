/**
 * Figma to Code Example
 * 
 * This example demonstrates how to convert Figma designs
 * directly into production-ready TypeScript components.
 */

import { createSketchie } from '@earth-agents/sketchie';
import * as fs from 'fs/promises';
import * as path from 'path';

async function convertFigmaToCode() {
  // Initialize Sketchie with Figma integration
  const sketchie = createSketchie({
    framework: 'react',
    styling: 'styled-components',
    typescript: true
  });

  await sketchie.initialize();

  console.log('🎨 Converting Figma Design to Code...\n');

  // Example 1: Convert a specific Figma component
  console.log('📋 Example 1: Converting a single Figma component\n');

  try {
    const cardComponent = await sketchie.analyzeDesign({
      type: 'figma',
      source: 'https://www.figma.com/file/ABC123/Design-System?node-id=123:456',
      metadata: {
        apiToken: process.env.FIGMA_TOKEN || 'your-figma-token',
        componentName: 'ProductCard'
      }
    });

    console.log(`✅ Analyzed ${cardComponent.length} components from Figma`);
    
    // Generate code for the first component
    if (cardComponent.length > 0) {
      const generated = await sketchie.generateComponent(
        { type: 'figma', source: cardComponent[0].id },
        {
          framework: 'react',
          styling: 'styled-components',
          typescript: true,
          testing: true,
          storybook: true
        }
      );

      console.log('\n📝 Generated Component Structure:');
      console.log('- Component: ProductCard.tsx');
      console.log('- Styles: ProductCard.styles.ts');
      console.log('- Tests: ProductCard.test.tsx');
      console.log('- Stories: ProductCard.stories.tsx');
      console.log('- Types: ProductCard.types.ts');
    }
  } catch (error) {
    console.log('ℹ️  Figma API token not configured. Using mock data for demo.\n');
  }

  // Example 2: Batch convert multiple Figma frames
  console.log('\n📋 Example 2: Batch converting Figma frames\n');

  const mockFigmaFrames = [
    { id: '1:1', name: 'Hero Section', type: 'FRAME' },
    { id: '2:1', name: 'Navigation Bar', type: 'COMPONENT' },
    { id: '3:1', name: 'Feature Card', type: 'COMPONENT' },
    { id: '4:1', name: 'Footer', type: 'FRAME' }
  ];

  console.log('🔄 Processing Figma frames:');
  
  for (const frame of mockFigmaFrames) {
    console.log(`\n  Converting: ${frame.name} (${frame.type})`);
    
    // Simulate component generation from Figma frame
    const componentDesign = {
      type: 'description' as const,
      source: `Generate a ${frame.name} component based on modern design patterns`,
      metadata: { figmaId: frame.id, figmaType: frame.type }
    };

    const component = await sketchie.generateComponent(componentDesign, {
      framework: 'react',
      styling: 'styled-components',
      typescript: true
    });

    // Save to organized directory structure
    const componentDir = `./generated/figma-components/${frame.name.replace(/\s+/g, '-')}`;
    await fs.mkdir(componentDir, { recursive: true });
    
    if (component.typescript) {
      await fs.writeFile(
        path.join(componentDir, 'index.tsx'),
        component.typescript
      );
    }
    
    console.log(`    ✅ Saved to ${componentDir}`);
  }

  // Example 3: Extract and apply Figma design tokens
  console.log('\n\n📋 Example 3: Extracting Figma design tokens\n');

  const figmaTokens = {
    colors: {
      primary: '#5B21B6',
      secondary: '#10B981',
      neutral: {
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827'
      }
    },
    typography: {
      fontFamily: {
        sans: 'Inter, system-ui, sans-serif',
        mono: 'JetBrains Mono, monospace'
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '30px',
        '4xl': '36px'
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700'
      }
    },
    spacing: {
      0: '0px',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '20px',
      6: '24px',
      8: '32px',
      10: '40px',
      12: '48px',
      16: '64px'
    },
    borderRadius: {
      none: '0px',
      sm: '2px',
      base: '4px',
      md: '6px',
      lg: '8px',
      xl: '12px',
      full: '9999px'
    }
  };

  // Convert Figma tokens to theme
  const theme = await sketchie.convertTokensToTheme(figmaTokens, {
    format: 'styled-components'
  });

  console.log('🎨 Generated Theme from Figma Tokens:');
  console.log(theme.slice(0, 500) + '...\n');

  // Example 4: Smart component mapping
  console.log('📋 Example 4: Smart Figma to React mapping\n');

  const figmaComponentMap = {
    'Button / Primary': {
      reactName: 'PrimaryButton',
      props: ['size', 'disabled', 'loading', 'icon'],
      variants: ['small', 'medium', 'large']
    },
    'Input / Text': {
      reactName: 'TextInput',
      props: ['placeholder', 'value', 'onChange', 'error', 'helperText'],
      validation: true
    },
    'Card / Product': {
      reactName: 'ProductCard',
      props: ['image', 'title', 'price', 'description', 'onAddToCart'],
      responsive: true
    }
  };

  console.log('🔄 Component Mapping:');
  Object.entries(figmaComponentMap).forEach(([figmaName, config]) => {
    console.log(`\n  Figma: "${figmaName}"`);
    console.log(`  React: <${config.reactName} />`);
    console.log(`  Props: ${config.props.join(', ')}`);
  });

  // Generate TypeScript interfaces from Figma component structure
  const interfaces = generateInterfacesFromFigma(figmaComponentMap);
  console.log('\n\n📝 Generated TypeScript Interfaces:');
  console.log(interfaces);

  return { theme, components: figmaComponentMap };
}

function generateInterfacesFromFigma(componentMap: any): string {
  let interfaces = '// Generated TypeScript interfaces from Figma components\n\n';

  Object.entries(componentMap).forEach(([figmaName, config]: [string, any]) => {
    interfaces += `export interface ${config.reactName}Props {\n`;
    
    config.props.forEach((prop: string) => {
      let type = 'string';
      if (prop === 'disabled' || prop === 'loading') type = 'boolean';
      if (prop === 'onChange') type = '(value: string) => void';
      if (prop === 'onAddToCart') type = '() => void';
      
      interfaces += `  ${prop}?: ${type};\n`;
    });
    
    if (config.variants) {
      interfaces += `  variant?: ${config.variants.map((v: string) => `'${v}'`).join(' | ')};\n`;
    }
    
    interfaces += '}\n\n';
  });

  return interfaces;
}

// Advanced Figma features
async function advancedFigmaFeatures() {
  const sketchie = createSketchie();
  await sketchie.initialize();

  console.log('\n\n🚀 Advanced Figma Features\n');

  // Auto-detect and convert component variants
  console.log('📋 Auto-detecting component variants:');
  
  const variantComponent = await sketchie.detectComponentVariants({
    figmaNodeId: '123:456',
    generatePropTypes: true
  });

  console.log(`Found ${variantComponent.variants.length} variants`);
  console.log('Generated prop types:', variantComponent.propTypes);

  // Generate responsive components from Figma auto-layout
  console.log('\n📱 Generating responsive components:');
  
  const responsiveComponent = await sketchie.generateResponsiveComponent({
    figmaNodeId: '789:012',
    breakpoints: {
      mobile: 375,
      tablet: 768,
      desktop: 1024
    }
  });

  console.log('Generated responsive styles for:', Object.keys(responsiveComponent.styles));

  // Create component documentation from Figma
  const docs = await sketchie.generateDocsFromFigma({
    figmaFileId: 'ABC123',
    format: 'markdown',
    includeProps: true,
    includeExamples: true
  });

  console.log('\n📚 Generated documentation preview:');
  console.log(docs.slice(0, 300) + '...');
}

// Run the example
if (require.main === module) {
  convertFigmaToCode()
    .then(() => advancedFigmaFeatures())
    .then(() => console.log('\n✅ Figma to code conversion complete!'))
    .catch(console.error);
}

export { convertFigmaToCode, advancedFigmaFeatures };