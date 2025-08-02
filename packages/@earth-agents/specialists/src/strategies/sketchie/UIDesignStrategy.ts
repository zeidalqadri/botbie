import { BaseStrategy } from '@earth-agents/sketchie';
import { SpecialistAgentAdapter } from '../../SpecialistAgentAdapter';
import { UIContext, UIResult } from '@earth-agents/types';

/**
 * UI Design Strategy using Frontend Developer and UI/UX Designer specialists
 */
export class UIDesignStrategy extends BaseStrategy {
  private frontendDeveloper: SpecialistAgentAdapter;
  private uiuxDesigner: SpecialistAgentAdapter;

  constructor() {
    super();
    this.frontendDeveloper = new SpecialistAgentAdapter('frontend-developer');
    this.uiuxDesigner = new SpecialistAgentAdapter('ui-ux-designer');
  }

  async analyze(context: UIContext): Promise<UIResult> {
    const { component, framework, requirements, designSpecs } = context;

    // Analyze with frontend developer for technical implementation
    const frontendPrompt = `
Design and implement a ${component} component using ${framework || 'React'}.

Requirements:
${requirements || 'Standard component requirements'}

${designSpecs ? `Design Specifications:
${designSpecs}` : ''}

Focus on:
- Component structure and props
- State management approach
- Event handling
- Performance optimization
- Accessibility compliance
- Responsive design patterns
- Modern CSS/styling approaches

Provide complete implementation with best practices.
`;

    // Analyze with UI/UX designer for design aspects
    const designPrompt = `
Create a comprehensive UI/UX design for a ${component} component.

Requirements: ${requirements || 'Standard component requirements'}

Focus on:
- User experience patterns
- Visual hierarchy
- Color and typography
- Spacing and layout
- Interactive states
- Accessibility considerations
- Mobile responsiveness
- Design system consistency

Provide design specifications and rationale.
`;

    try {
      const [frontendResult, designResult] = await Promise.all([
        this.frontendDeveloper.invoke(frontendPrompt, context),
        this.uiuxDesigner.invoke(designPrompt, context)
      ]);

      const implementation = this.extractImplementation(frontendResult.output);
      const designSpecs = this.extractDesignSpecs(designResult.output);
      const accessibility = this.extractAccessibilityFeatures(frontendResult.output);

      return {
        success: true,
        implementation,
        designSpecs,
        accessibility,
        suggestions: [
          ...frontendResult.suggestions || [],
          ...designResult.suggestions || []
        ],
        metadata: {
          framework: framework || 'React',
          componentType: component,
          designPrinciples: this.extractDesignPrinciples(designResult.output),
          technicalRecommendations: frontendResult.metadata?.recommendations
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `UI design analysis failed: ${error.message}`,
        implementation: null,
        designSpecs: null,
        suggestions: []
      };
    }
  }

  private extractImplementation(output: string): string | null {
    // Look for code blocks in the output
    const codeBlockPattern = /```(?:tsx?|jsx?|javascript|typescript)?\s*\n([\s\S]*?)\n```/i;
    const match = output.match(codeBlockPattern);
    
    if (match) {
      return match[1].trim();
    }

    // Fallback: look for any code-like content
    const lines = output.split('\n');
    let inCode = false;
    let code = '';
    
    for (const line of lines) {
      if (line.includes('function') || line.includes('const') || line.includes('export')) {
        inCode = true;
      }
      if (inCode) {
        code += line + '\n';
        if (line.includes('}') && code.length > 100) {
          break;
        }
      }
    }
    
    return code.length > 50 ? code.trim() : null;
  }

  private extractDesignSpecs(output: string): any {
    const specs: any = {};
    const lines = output.split('\n');
    
    let currentSection = null;
    
    for (const line of lines) {
      // Extract color specifications
      if (line.includes('Color') || line.includes('color')) {
        const colorMatch = line.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgb\([^)]+\)/);
        if (colorMatch && !specs.colors) {
          specs.colors = [colorMatch[0]];
        } else if (colorMatch && specs.colors) {
          specs.colors.push(colorMatch[0]);
        }
      }
      
      // Extract spacing specifications
      if (line.includes('padding') || line.includes('margin') || line.includes('spacing')) {
        const spacingMatch = line.match(/(\d+)px|(\d+)rem|(\d+)em/);
        if (spacingMatch && !specs.spacing) {
          specs.spacing = spacingMatch[0];
        }
      }
      
      // Extract typography
      if (line.includes('font') || line.includes('Font')) {
        if (!specs.typography) specs.typography = {};
        const fontSizeMatch = line.match(/(\d+)px|(\d+)rem/);
        const fontFamilyMatch = line.match(/(Arial|Helvetica|Times|Georgia|Verdana|[A-Z][a-z]+)/);
        
        if (fontSizeMatch) specs.typography.fontSize = fontSizeMatch[0];
        if (fontFamilyMatch) specs.typography.fontFamily = fontFamilyMatch[0];
      }
    }
    
    return Object.keys(specs).length > 0 ? specs : null;
  }

  private extractAccessibilityFeatures(output: string): string[] {
    const features = [];
    const lines = output.split('\n');
    
    const a11yPatterns = {
      'aria-label': /aria-label/i,
      'role': /role=/i,
      'tabIndex': /tabindex/i,
      'alt text': /alt=/i,
      'keyboard navigation': /keyboard|onkeydown|onkeyup/i,
      'focus management': /focus|blur/i,
      'screen reader': /screen reader|aria-/i
    };
    
    for (const line of lines) {
      for (const [feature, pattern] of Object.entries(a11yPatterns)) {
        if (pattern.test(line) && !features.includes(feature)) {
          features.push(feature);
        }
      }
    }
    
    return features;
  }

  private extractDesignPrinciples(output: string): string[] {
    const principles = [];
    const lines = output.split('\n');
    
    const principleKeywords = [
      'consistency', 'hierarchy', 'contrast', 'whitespace',
      'usability', 'accessibility', 'responsive', 'progressive',
      'minimalism', 'clarity', 'feedback', 'affordance'
    ];
    
    for (const line of lines) {
      for (const principle of principleKeywords) {
        if (line.toLowerCase().includes(principle) && !principles.includes(principle)) {
          principles.push(principle);
        }
      }
    }
    
    return principles;
  }
}