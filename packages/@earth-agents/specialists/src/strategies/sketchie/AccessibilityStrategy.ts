import { BaseStrategy } from '@earth-agents/sketchie';
import { SpecialistAgentAdapter } from '../../SpecialistAgentAdapter';
import { UIContext, UIResult } from '@earth-agents/types';

/**
 * Accessibility Strategy using Accessibility Specialist and Frontend Developer
 */
export class AccessibilityStrategy extends BaseStrategy {
  private accessibilitySpecialist: SpecialistAgentAdapter;
  private frontendDeveloper: SpecialistAgentAdapter;

  constructor() {
    super();
    this.accessibilitySpecialist = new SpecialistAgentAdapter('accessibility-specialist');
    this.frontendDeveloper = new SpecialistAgentAdapter('frontend-developer');
  }

  async analyze(context: UIContext): Promise<UIResult> {
    const { component, framework, requirements, existingCode } = context;

    // Analyze with accessibility specialist for WCAG compliance
    const a11yPrompt = `
Create comprehensive accessibility guidelines for a ${component} component.

Framework: ${framework || 'React'}
Requirements: ${requirements || 'Standard accessibility requirements'}

${existingCode ? `Existing Code to Review:
\`\`\`
${existingCode}
\`\`\`` : ''}

Focus on WCAG 2.1 AA compliance:
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation patterns
- Screen reader compatibility
- Color contrast requirements
- Focus management
- Alternative text for images
- Form accessibility
- Dynamic content announcements

Provide detailed accessibility specifications and testing checklist.
`;

    // Analyze with frontend developer for technical implementation
    const frontendPrompt = `
Implement accessibility features for a ${component} component using ${framework || 'React'}.

Requirements: ${requirements || 'Standard accessibility requirements'}

${existingCode ? `Existing Code:
\`\`\`
${existingCode}
\`\`\`` : ''}

Implement:
- Proper semantic HTML elements
- ARIA attributes and roles
- Keyboard event handlers
- Focus management hooks
- Screen reader announcements
- Skip links and landmarks
- High contrast mode support
- Reduced motion preferences

Provide complete accessible implementation.
`;

    try {
      const [a11yResult, frontendResult] = await Promise.all([
        this.accessibilitySpecialist.invoke(a11yPrompt, context),
        this.frontendDeveloper.invoke(frontendPrompt, context)
      ]);

      const accessibleImplementation = this.extractImplementation(frontendResult.output);
      const wcagGuidelines = this.extractWCAGGuidelines(a11yResult.output);
      const testingChecklist = this.extractTestingChecklist(a11yResult.output);
      const ariaAttributes = this.extractARIAAttributes(frontendResult.output);

      return {
        success: true,
        implementation: accessibleImplementation,
        wcagGuidelines,
        testingChecklist,
        ariaAttributes,
        suggestions: [
          ...a11yResult.suggestions || [],
          ...frontendResult.suggestions || []
        ],
        metadata: {
          framework: framework || 'React',
          componentType: component,
          wcagLevel: this.determineWCAGLevel(wcagGuidelines),
          accessibilityFeatures: this.identifyA11yFeatures(frontendResult.output)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Accessibility analysis failed: ${error.message}`,
        implementation: null,
        suggestions: []
      };
    }
  }

  private extractImplementation(output: string): string | null {
    const codeBlockPattern = /```(?:tsx?|jsx?|javascript|typescript)?\s*\n([\s\S]*?)\n```/i;
    const match = output.match(codeBlockPattern);
    return match ? match[1].trim() : null;
  }

  private extractWCAGGuidelines(output: string): any {
    const guidelines: any = {
      perceivable: [],
      operable: [],
      understandable: [],
      robust: []
    };

    const lines = output.split('\n');
    let currentPrinciple = null;

    for (const line of lines) {
      // Identify WCAG principles
      if (line.toLowerCase().includes('perceivable')) {
        currentPrinciple = 'perceivable';
      } else if (line.toLowerCase().includes('operable')) {
        currentPrinciple = 'operable';
      } else if (line.toLowerCase().includes('understandable')) {
        currentPrinciple = 'understandable';
      } else if (line.toLowerCase().includes('robust')) {
        currentPrinciple = 'robust';
      }

      // Extract specific guidelines
      if (currentPrinciple && (line.includes('-') || line.includes('•'))) {
        const guideline = line.replace(/^[\s\-•]+/, '').trim();
        if (guideline.length > 10) {
          guidelines[currentPrinciple].push(guideline);
        }
      }

      // Also look for common accessibility requirements
      const a11yPatterns = {
        perceivable: [
          /alt.*text/i, /color.*contrast/i, /text.*alternatives/i,
          /audio.*description/i, /captions/i
        ],
        operable: [
          /keyboard.*navigation/i, /focus.*management/i, /no.*seizures/i,
          /time.*limits/i, /skip.*links/i
        ],
        understandable: [
          /readable/i, /predictable/i, /input.*assistance/i,
          /error.*identification/i, /labels/i
        ],
        robust: [
          /compatible/i, /valid.*markup/i, /assistive.*technology/i,
          /aria/i, /semantic/i
        ]
      };

      for (const [principle, patterns] of Object.entries(a11yPatterns)) {
        for (const pattern of patterns) {
          if (pattern.test(line) && !guidelines[principle].some((g: string) => g.includes(line.trim()))) {
            guidelines[principle].push(line.trim());
            break;
          }
        }
      }
    }

    return guidelines;
  }

  private extractTestingChecklist(output: string): string[] {
    const checklist = [];
    const lines = output.split('\n');

    let inChecklist = false;
    for (const line of lines) {
      if (line.toLowerCase().includes('test') && 
          (line.toLowerCase().includes('checklist') || line.toLowerCase().includes('check'))) {
        inChecklist = true;
        continue;
      }

      if (inChecklist && (line.includes('□') || line.includes('☐') || line.includes('-') || line.includes('•'))) {
        const item = line.replace(/^[\s\-•□☐]+/, '').trim();
        if (item.length > 5) {
          checklist.push(item);
        }
      } else if (inChecklist && line.trim() === '') {
        break;
      }
    }

    // Add standard accessibility tests if none found
    if (checklist.length === 0) {
      checklist.push(
        'Test keyboard navigation (Tab, Enter, Escape)',
        'Verify screen reader compatibility',
        'Check color contrast ratios',
        'Test focus management',
        'Validate ARIA labels and roles',
        'Test with assistive technologies'
      );
    }

    return checklist;
  }

  private extractARIAAttributes(output: string): string[] {
    const ariaAttributes = [];
    const lines = output.split('\n');

    for (const line of lines) {
      // Find ARIA attributes in code
      const ariaMatches = line.match(/aria-[\w-]+/g);
      if (ariaMatches) {
        ariaMatches.forEach(attr => {
          if (!ariaAttributes.includes(attr)) {
            ariaAttributes.push(attr);
          }
        });
      }

      // Find role attributes
      const roleMatch = line.match(/role=["']([\w-]+)["']/);
      if (roleMatch && !ariaAttributes.includes(`role="${roleMatch[1]}"`)) {
        ariaAttributes.push(`role="${roleMatch[1]}"`);
      }
    }

    return ariaAttributes;
  }

  private determineWCAGLevel(guidelines: any): string {
    const totalGuidelines = Object.values(guidelines).reduce((sum: number, arr: any) => sum + arr.length, 0);
    
    if (totalGuidelines >= 15) return 'AAA';
    if (totalGuidelines >= 8) return 'AA';
    if (totalGuidelines >= 4) return 'A';
    return 'Basic';
  }

  private identifyA11yFeatures(output: string): string[] {
    const features = [];
    const lines = output.split('\n');

    const featurePatterns = {
      'Keyboard Navigation': /onKeyDown|onKeyUp|tabIndex|keyboard/i,
      'Screen Reader Support': /aria-|screen.*reader|sr-only/i,
      'Focus Management': /focus|blur|useRef.*focus/i,
      'Skip Links': /skip.*link|skip.*content/i,
      'High Contrast': /high.*contrast|prefers-contrast/i,
      'Reduced Motion': /prefers-reduced-motion|reduce.*motion/i,
      'Live Regions': /aria-live|role.*alert/i,
      'Form Labels': /htmlFor|aria-labelledby|aria-describedby/i
    };

    for (const line of lines) {
      for (const [feature, pattern] of Object.entries(featurePatterns)) {
        if (pattern.test(line) && !features.includes(feature)) {
          features.push(feature);
        }
      }
    }

    return features;
  }
}