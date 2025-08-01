import { BaseStrategy } from '@earth-agents/sketchie';
import { SpecialistAgentAdapter } from '../../SpecialistAgentAdapter';
import { UIContext, UIResult } from '@earth-agents/types';

/**
 * Responsive Design Strategy using Mobile Developer and Frontend Developer specialists
 */
export class ResponsiveDesignStrategy extends BaseStrategy {
  private mobileDeveloper: SpecialistAgentAdapter;
  private frontendDeveloper: SpecialistAgentAdapter;

  constructor() {
    super();
    this.mobileDeveloper = new SpecialistAgentAdapter('mobile-developer');
    this.frontendDeveloper = new SpecialistAgentAdapter('frontend-developer');
  }

  async analyze(context: UIContext): Promise<UIResult> {
    const { component, framework, requirements, screenSizes } = context;

    // Analyze with mobile developer for mobile-first approach
    const mobilePrompt = `
Design a mobile-first responsive ${component} component.

Framework: ${framework || 'React'}
Requirements: ${requirements || 'Responsive component requirements'}
Target Screen Sizes: ${screenSizes?.join(', ') || 'mobile, tablet, desktop'}

Focus on:
- Mobile-first design principles
- Touch-friendly interactions
- Performance on mobile devices
- Progressive enhancement
- Offline considerations
- Battery and data efficiency
- Native app patterns

Provide implementation with mobile optimization.
`;

    // Analyze with frontend developer for cross-device compatibility
    const frontendPrompt = `
Create responsive breakpoints and layouts for a ${component} component.

Framework: ${framework || 'React'}
Requirements: ${requirements || 'Responsive component requirements'}

Focus on:
- CSS Grid and Flexbox layouts
- Media query strategies
- Fluid typography and spacing
- Image optimization and responsive images
- Cross-browser compatibility
- Performance optimization
- CSS-in-JS vs CSS modules

Provide complete responsive implementation.
`;

    try {
      const [mobileResult, frontendResult] = await Promise.all([
        this.mobileDeveloper.invoke(mobilePrompt, context),
        this.frontendDeveloper.invoke(frontendPrompt, context)
      ]);

      const responsiveImplementation = this.combineImplementations(
        frontendResult.output,
        mobileResult.output
      );
      
      const breakpoints = this.extractBreakpoints(frontendResult.output);
      const mobileOptimizations = this.extractMobileOptimizations(mobileResult.output);

      return {
        success: true,
        implementation: responsiveImplementation,
        breakpoints,
        mobileOptimizations,
        suggestions: [
          ...frontendResult.suggestions || [],
          ...mobileResult.suggestions || []
        ],
        metadata: {
          framework: framework || 'React',
          componentType: component,
          supportedDevices: this.identifySuportedDevices(screenSizes),
          performanceOptimizations: this.extractPerformanceOptimizations(mobileResult.output)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Responsive design analysis failed: ${error.message}`,
        implementation: null,
        suggestions: []
      };
    }
  }

  private combineImplementations(frontendOutput: string, mobileOutput: string): string | null {
    // Extract the main implementation from frontend
    const frontendCode = this.extractCodeBlock(frontendOutput);
    const mobileOptimizations = this.extractMobileFeatures(mobileOutput);
    
    if (!frontendCode) return null;
    
    // Combine with mobile optimizations
    let combined = frontendCode;
    
    // Add mobile-specific features if not present
    if (!combined.includes('useEffect') && mobileOptimizations.includes('viewport detection')) {
      combined = combined.replace(
        /import React/,
        "import React, { useEffect, useState }"
      );
    }
    
    return combined;
  }

  private extractCodeBlock(output: string): string | null {
    const codeBlockPattern = /```(?:tsx?|jsx?|javascript|typescript)?\s*\n([\s\S]*?)\n```/i;
    const match = output.match(codeBlockPattern);
    return match ? match[1].trim() : null;
  }

  private extractBreakpoints(output: string): any {
    const breakpoints: any = {};
    const lines = output.split('\n');
    
    for (const line of lines) {
      // Look for common breakpoint patterns
      const breakpointPattern = /@media\s*\([^)]*(?:min-width|max-width)[^)]*(\d+)px\)/i;
      const match = line.match(breakpointPattern);
      
      if (match) {
        const width = parseInt(match[1]);
        if (width <= 480) breakpoints.mobile = `${width}px`;
        else if (width <= 768) breakpoints.tablet = `${width}px`;
        else if (width <= 1024) breakpoints.desktop = `${width}px`;
        else breakpoints.large = `${width}px`;
      }
      
      // Look for named breakpoints
      if (line.includes('mobile') && line.includes('px')) {
        const pxMatch = line.match(/(\d+)px/);
        if (pxMatch) breakpoints.mobile = pxMatch[0];
      }
      if (line.includes('tablet') && line.includes('px')) {
        const pxMatch = line.match(/(\d+)px/);
        if (pxMatch) breakpoints.tablet = pxMatch[0];
      }
    }
    
    return Object.keys(breakpoints).length > 0 ? breakpoints : {
      mobile: '480px',
      tablet: '768px',
      desktop: '1024px'
    };
  }

  private extractMobileOptimizations(output: string): string[] {
    const optimizations = [];
    const lines = output.split('\n');
    
    const optimizationPatterns = {
      'Touch targets': /touch|tap|44px|48px/i,
      'Lazy loading': /lazy|intersection observer/i,
      'Image optimization': /srcset|picture|webp/i,
      'Viewport optimization': /viewport|meta.*viewport/i,
      'Offline support': /offline|service worker|cache/i,
      'Performance monitoring': /performance|web vitals/i,
      'Battery optimization': /battery|power/i,
      'Gesture support': /gesture|swipe|pinch/i
    };
    
    for (const line of lines) {
      for (const [optimization, pattern] of Object.entries(optimizationPatterns)) {
        if (pattern.test(line) && !optimizations.includes(optimization)) {
          optimizations.push(optimization);
        }
      }
    }
    
    return optimizations;
  }

  private extractMobileFeatures(output: string): string[] {
    const features = [];
    const lines = output.split('\n');
    
    const featurePatterns = [
      'viewport detection',
      'touch events',
      'orientation change',
      'device pixel ratio',
      'native scroll',
      'pull to refresh'
    ];
    
    for (const line of lines) {
      for (const feature of featurePatterns) {
        if (line.toLowerCase().includes(feature.toLowerCase()) && !features.includes(feature)) {
          features.push(feature);
        }
      }
    }
    
    return features;
  }

  private identifySuportedDevices(screenSizes?: string[]): string[] {
    if (!screenSizes) return ['mobile', 'tablet', 'desktop'];
    
    const devices = [];
    screenSizes.forEach(size => {
      if (size.includes('mobile') || size.includes('phone')) devices.push('mobile');
      if (size.includes('tablet') || size.includes('ipad')) devices.push('tablet');
      if (size.includes('desktop') || size.includes('laptop')) devices.push('desktop');
    });
    
    return devices.length > 0 ? devices : ['mobile', 'tablet', 'desktop'];
  }

  private extractPerformanceOptimizations(output: string): string[] {
    const optimizations = [];
    const lines = output.split('\n');
    
    const perfPatterns = {
      'Code splitting': /code split|lazy load|dynamic import/i,
      'Bundle optimization': /bundle|chunk|tree shaking/i,
      'Image optimization': /image|webp|avif|srcset/i,
      'Caching': /cache|etag|service worker/i,
      'Minification': /minify|compress|gzip/i,
      'CDN usage': /cdn|edge/i
    };
    
    for (const line of lines) {
      for (const [optimization, pattern] of Object.entries(perfPatterns)) {
        if (pattern.test(line) && !optimizations.includes(optimization)) {
          optimizations.push(optimization);
        }
      }
    }
    
    return optimizations;
  }
}