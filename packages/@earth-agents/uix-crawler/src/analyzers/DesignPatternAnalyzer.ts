import { Logger } from '@earth-agents/core';
import { UIComponent, UIPattern, ComponentType } from '../types';

export class DesignPatternAnalyzer {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('DesignPatternAnalyzer');
  }

  async analyzePattern(
    type: ComponentType,
    components: UIComponent[]
  ): Promise<UIPattern> {
    this.logger.info(`Analyzing ${type} pattern from ${components.length} components`);

    const commonTraits = await this.extractCommonTraits(components);
    const bestPractices = await this.identifyBestPractices(type, components);
    const description = this.generatePatternDescription(type, commonTraits);

    const pattern: UIPattern = {
      id: `pattern-${type}-${Date.now()}`,
      name: this.getPatternName(type),
      type,
      description,
      components,
      commonTraits,
      bestPractices
    };

    return pattern;
  }

  private async extractCommonTraits(components: UIComponent[]): Promise<string[]> {
    const traits: string[] = [];
    
    // Analyze CSS properties
    const cssProperties = components.map(c => {
      try {
        return JSON.parse(c.css);
      } catch {
        return {};
      }
    });

    // Find common display properties
    const displays = cssProperties.map(css => css.display).filter(Boolean);
    const mostCommonDisplay = this.getMostFrequent(displays);
    if (mostCommonDisplay) {
      traits.push(`display: ${mostCommonDisplay}`);
    }

    // Find common positioning
    const positions = cssProperties.map(css => css.position).filter(Boolean);
    const mostCommonPosition = this.getMostFrequent(positions);
    if (mostCommonPosition && mostCommonPosition !== 'static') {
      traits.push(`position: ${mostCommonPosition}`);
    }

    // Check for flexbox usage
    const flexCount = cssProperties.filter(css => 
      css.display === 'flex' || css.display === 'inline-flex'
    ).length;
    if (flexCount > components.length / 2) {
      traits.push('uses flexbox layout');
    }

    // Check for grid usage
    const gridCount = cssProperties.filter(css => 
      css.display === 'grid' || css.display === 'inline-grid'
    ).length;
    if (gridCount > components.length / 2) {
      traits.push('uses CSS grid layout');
    }

    // Analyze HTML structure
    const structures = components.map(c => this.analyzeHTMLStructure(c.html));
    
    // Common semantic elements
    const semanticElements = ['nav', 'header', 'main', 'section', 'article', 'aside', 'footer'];
    for (const element of semanticElements) {
      const count = structures.filter(s => s.includes(element)).length;
      if (count > components.length / 2) {
        traits.push(`contains <${element}> element`);
      }
    }

    // Responsive design indicators
    const hasMediaQueries = cssProperties.some(css => 
      Object.keys(css).some(key => key.includes('@media'))
    );
    if (hasMediaQueries) {
      traits.push('responsive design');
    }

    // Accessibility features
    const hasAriaLabels = components.filter(c => 
      c.html.includes('aria-label') || c.html.includes('role=')
    ).length;
    if (hasAriaLabels > components.length / 2) {
      traits.push('accessibility-focused');
    }

    return traits;
  }

  private analyzeHTMLStructure(html: string): string[] {
    const elements: string[] = [];
    const tagRegex = /<(\w+)[\s>]/g;
    let match;
    
    while ((match = tagRegex.exec(html)) !== null) {
      elements.push(match[1].toLowerCase());
    }
    
    return [...new Set(elements)];
  }

  private getMostFrequent<T>(arr: T[]): T | null {
    if (arr.length === 0) return null;
    
    const frequency = new Map<T, number>();
    for (const item of arr) {
      frequency.set(item, (frequency.get(item) || 0) + 1);
    }
    
    let maxCount = 0;
    let mostFrequent: T | null = null;
    
    for (const [item, count] of frequency.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = item;
      }
    }
    
    return mostFrequent;
  }

  private async identifyBestPractices(
    type: ComponentType,
    components: UIComponent[]
  ): Promise<string[]> {
    const practices: string[] = [];

    switch (type) {
      case 'navigation':
        practices.push(
          'Use semantic <nav> element',
          'Include aria-label for screen readers',
          'Ensure keyboard navigation support',
          'Implement responsive mobile menu',
          'Highlight current page/section',
          'Keep navigation consistent across pages'
        );
        break;

      case 'hero':
        practices.push(
          'Use high-quality, optimized images',
          'Include clear call-to-action',
          'Ensure text contrast meets WCAG standards',
          'Implement responsive typography',
          'Consider video background performance',
          'Add loading states for media'
        );
        break;

      case 'card':
        practices.push(
          'Maintain consistent spacing',
          'Use semantic HTML structure',
          'Ensure interactive elements are accessible',
          'Implement hover states for desktop',
          'Consider touch targets for mobile',
          'Use lazy loading for images'
        );
        break;

      case 'form':
        practices.push(
          'Label all form inputs clearly',
          'Provide helpful error messages',
          'Include proper validation',
          'Ensure keyboard navigation',
          'Use appropriate input types',
          'Implement progress indicators for multi-step forms'
        );
        break;

      case 'button':
        practices.push(
          'Use semantic <button> element',
          'Provide clear hover and focus states',
          'Ensure sufficient color contrast',
          'Include disabled states',
          'Make touch targets at least 44x44px',
          'Use consistent styling across the site'
        );
        break;

      case 'modal':
        practices.push(
          'Trap focus within modal',
          'Provide clear close button',
          'Include backdrop click to close',
          'Ensure ESC key closes modal',
          'Prevent body scroll when open',
          'Announce modal to screen readers'
        );
        break;

      case 'footer':
        practices.push(
          'Use semantic <footer> element',
          'Organize content in logical sections',
          'Include essential links',
          'Ensure readability with proper contrast',
          'Make links keyboard accessible',
          'Consider sticky footer for short pages'
        );
        break;

      default:
        practices.push(
          'Follow semantic HTML practices',
          'Ensure accessibility compliance',
          'Implement responsive design',
          'Optimize for performance',
          'Maintain visual consistency'
        );
    }

    // Add specific practices based on component analysis
    const hasAnimations = components.some(c => 
      c.css.includes('transition') || c.css.includes('animation')
    );
    if (hasAnimations) {
      practices.push('Use CSS animations for smooth transitions');
      practices.push('Respect prefers-reduced-motion preference');
    }

    const hasInteractions = components.some(c => 
      c.interactions && c.interactions.length > 1
    );
    if (hasInteractions) {
      practices.push('Provide clear interaction feedback');
      practices.push('Ensure all states are accessible');
    }

    return practices;
  }

  private getPatternName(type: ComponentType): string {
    const names: Record<ComponentType, string> = {
      navigation: 'Navigation Pattern',
      hero: 'Hero Section Pattern',
      card: 'Card Component Pattern',
      form: 'Form Design Pattern',
      button: 'Button Pattern',
      modal: 'Modal Dialog Pattern',
      footer: 'Footer Pattern',
      sidebar: 'Sidebar Pattern',
      table: 'Data Table Pattern',
      list: 'List Pattern',
      carousel: 'Carousel Pattern',
      tabs: 'Tabs Pattern',
      accordion: 'Accordion Pattern',
      dropdown: 'Dropdown Pattern',
      custom: 'Custom Pattern'
    };

    return names[type] || 'Unknown Pattern';
  }

  private generatePatternDescription(
    type: ComponentType,
    traits: string[]
  ): string {
    const baseDescriptions: Record<ComponentType, string> = {
      navigation: 'A navigation pattern for site-wide menu systems',
      hero: 'A hero section pattern for prominent page introductions',
      card: 'A card component pattern for content presentation',
      form: 'A form pattern for user input collection',
      button: 'A button pattern for user actions',
      modal: 'A modal dialog pattern for overlaid content',
      footer: 'A footer pattern for site-wide information',
      sidebar: 'A sidebar pattern for secondary navigation or content',
      table: 'A data table pattern for structured information display',
      list: 'A list pattern for ordered or unordered content',
      carousel: 'A carousel pattern for sliding content presentation',
      tabs: 'A tabs pattern for content organization',
      accordion: 'An accordion pattern for collapsible content sections',
      dropdown: 'A dropdown pattern for selectable options',
      custom: 'A custom UI pattern'
    };

    let description = baseDescriptions[type] || 'A UI pattern';
    
    if (traits.length > 0) {
      description += ` that ${traits.slice(0, 3).join(', ')}`;
    }

    return description;
  }

  async comparePatterns(pattern1: UIPattern, pattern2: UIPattern): Promise<{
    similarity: number;
    differences: string[];
    recommendations: string[];
  }> {
    const similarity = this.calculateSimilarity(pattern1, pattern2);
    const differences = this.identifyDifferences(pattern1, pattern2);
    const recommendations = this.generateRecommendations(pattern1, pattern2, differences);

    return {
      similarity,
      differences,
      recommendations
    };
  }

  private calculateSimilarity(pattern1: UIPattern, pattern2: UIPattern): number {
    if (pattern1.type !== pattern2.type) return 0;

    const traits1 = new Set(pattern1.commonTraits);
    const traits2 = new Set(pattern2.commonTraits);
    
    const intersection = new Set([...traits1].filter(x => traits2.has(x)));
    const union = new Set([...traits1, ...traits2]);
    
    return intersection.size / union.size;
  }

  private identifyDifferences(pattern1: UIPattern, pattern2: UIPattern): string[] {
    const differences: string[] = [];
    
    const traits1 = new Set(pattern1.commonTraits);
    const traits2 = new Set(pattern2.commonTraits);
    
    // Traits in pattern1 but not pattern2
    for (const trait of traits1) {
      if (!traits2.has(trait)) {
        differences.push(`Pattern 1 has "${trait}" but Pattern 2 doesn't`);
      }
    }
    
    // Traits in pattern2 but not pattern1
    for (const trait of traits2) {
      if (!traits1.has(trait)) {
        differences.push(`Pattern 2 has "${trait}" but Pattern 1 doesn't`);
      }
    }
    
    return differences;
  }

  private generateRecommendations(
    pattern1: UIPattern,
    pattern2: UIPattern,
    differences: string[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (differences.some(d => d.includes('accessibility'))) {
      recommendations.push('Consider adding accessibility features to improve usability');
    }
    
    if (differences.some(d => d.includes('responsive'))) {
      recommendations.push('Implement responsive design for better mobile experience');
    }
    
    if (differences.some(d => d.includes('flexbox') || d.includes('grid'))) {
      recommendations.push('Use modern CSS layout techniques for better flexibility');
    }
    
    return recommendations;
  }
}