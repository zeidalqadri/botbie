import { DesignPatternAnalyzer } from '../../src/analyzers/DesignPatternAnalyzer';
import { UIComponent, UIPattern, ComponentType } from '../../src/types';

describe('DesignPatternAnalyzer', () => {
  let analyzer: DesignPatternAnalyzer;

  beforeEach(() => {
    analyzer = new DesignPatternAnalyzer();
  });

  const createMockComponent = (type: ComponentType, css: any = {}): UIComponent => ({
    id: `test-${Date.now()}`,
    websiteId: 'site-123',
    type,
    selector: `.${type}`,
    screenshotUrl: 'data:image/png;base64,mock',
    html: `<div class="${type}">Content</div>`,
    css: JSON.stringify(css),
    metadata: { tags: [type], usage: [], relatedPatterns: [] }
  });

  describe('pattern analysis', () => {
    it('should analyze navigation patterns', async () => {
      const components: UIComponent[] = [
        createMockComponent('navigation', { display: 'flex', position: 'fixed' }),
        createMockComponent('navigation', { display: 'flex', position: 'sticky' }),
        createMockComponent('navigation', { display: 'block', position: 'relative' })
      ];

      const pattern = await analyzer.analyzePattern('navigation', components);
      
      expect(pattern.type).toBe('navigation');
      expect(pattern.components).toHaveLength(3);
      expect(pattern.commonTraits).toContain('display: flex');
      expect(pattern.bestPractices).toContain('Use semantic <nav> element');
    });

    it('should identify flexbox usage', async () => {
      const components: UIComponent[] = [
        createMockComponent('card', { display: 'flex' }),
        createMockComponent('card', { display: 'flex' }),
        createMockComponent('card', { display: 'block' })
      ];

      const pattern = await analyzer.analyzePattern('card', components);
      expect(pattern.commonTraits).toContain('uses flexbox layout');
    });

    it('should identify grid usage', async () => {
      const components: UIComponent[] = [
        createMockComponent('list', { display: 'grid' }),
        createMockComponent('list', { display: 'grid' }),
        createMockComponent('list', { display: 'inline-grid' })
      ];

      const pattern = await analyzer.analyzePattern('list', components);
      expect(pattern.commonTraits).toContain('uses CSS grid layout');
    });

    it('should detect accessibility features', async () => {
      const components: UIComponent[] = [
        {
          ...createMockComponent('button'),
          html: '<button aria-label="Submit" role="button">Submit</button>'
        },
        {
          ...createMockComponent('button'),
          html: '<button aria-label="Cancel">Cancel</button>'
        }
      ];

      const pattern = await analyzer.analyzePattern('button', components);
      expect(pattern.commonTraits).toContain('accessibility-focused');
    });
  });

  describe('best practices identification', () => {
    it('should provide form-specific best practices', async () => {
      const components = [createMockComponent('form')];
      const pattern = await analyzer.analyzePattern('form', components);
      
      expect(pattern.bestPractices).toContain('Label all form inputs clearly');
      expect(pattern.bestPractices).toContain('Provide helpful error messages');
      expect(pattern.bestPractices).toContain('Include proper validation');
    });

    it('should provide modal-specific best practices', async () => {
      const components = [createMockComponent('modal')];
      const pattern = await analyzer.analyzePattern('modal', components);
      
      expect(pattern.bestPractices).toContain('Trap focus within modal');
      expect(pattern.bestPractices).toContain('Provide clear close button');
      expect(pattern.bestPractices).toContain('Ensure ESC key closes modal');
    });

    it('should add animation best practices when animations detected', async () => {
      const components = [
        createMockComponent('card', { 
          transition: 'all 0.3s ease',
          animation: 'fadeIn 0.5s'
        })
      ];
      
      const pattern = await analyzer.analyzePattern('card', components);
      expect(pattern.bestPractices).toContain('Use CSS animations for smooth transitions');
      expect(pattern.bestPractices).toContain('Respect prefers-reduced-motion preference');
    });
  });

  describe('pattern comparison', () => {
    it('should calculate similarity between patterns', async () => {
      const pattern1: UIPattern = {
        id: 'pattern-1',
        name: 'Navigation Pattern',
        type: 'navigation',
        description: 'A navigation pattern',
        components: [],
        commonTraits: ['display: flex', 'position: fixed', 'responsive design'],
        bestPractices: []
      };

      const pattern2: UIPattern = {
        id: 'pattern-2',
        name: 'Navigation Pattern',
        type: 'navigation',
        description: 'Another navigation pattern',
        components: [],
        commonTraits: ['display: flex', 'position: sticky', 'responsive design'],
        bestPractices: []
      };

      const comparison = await analyzer.comparePatterns(pattern1, pattern2);
      
      expect(comparison.similarity).toBeGreaterThan(0);
      expect(comparison.similarity).toBeLessThan(1);
      expect(comparison.differences).toContain('Pattern 1 has "position: fixed" but Pattern 2 doesn\'t');
    });

    it('should return 0 similarity for different pattern types', async () => {
      const pattern1: UIPattern = {
        id: 'pattern-1',
        name: 'Navigation Pattern',
        type: 'navigation',
        description: 'A navigation pattern',
        components: [],
        commonTraits: ['display: flex'],
        bestPractices: []
      };

      const pattern2: UIPattern = {
        id: 'pattern-2',
        name: 'Card Pattern',
        type: 'card',
        description: 'A card pattern',
        components: [],
        commonTraits: ['display: flex'],
        bestPractices: []
      };

      const comparison = await analyzer.comparePatterns(pattern1, pattern2);
      expect(comparison.similarity).toBe(0);
    });

    it('should provide recommendations based on differences', async () => {
      const pattern1: UIPattern = {
        id: 'pattern-1',
        name: 'Card Pattern',
        type: 'card',
        description: 'A card pattern',
        components: [],
        commonTraits: ['display: block'],
        bestPractices: []
      };

      const pattern2: UIPattern = {
        id: 'pattern-2',
        name: 'Card Pattern',
        type: 'card',
        description: 'A modern card pattern',
        components: [],
        commonTraits: ['display: flex', 'responsive design'],
        bestPractices: []
      };

      const comparison = await analyzer.comparePatterns(pattern1, pattern2);
      expect(comparison.recommendations).toContain('Use modern CSS layout techniques for better flexibility');
    });
  });

  describe('HTML structure analysis', () => {
    it('should extract semantic elements', async () => {
      const components: UIComponent[] = [
        {
          ...createMockComponent('navigation'),
          html: '<nav><ul><li>Home</li><li>About</li></ul></nav>'
        },
        {
          ...createMockComponent('navigation'),
          html: '<header><nav>Menu</nav></header>'
        }
      ];

      const pattern = await analyzer.analyzePattern('navigation', components);
      expect(pattern.commonTraits).toContain('contains <nav> element');
    });
  });
});