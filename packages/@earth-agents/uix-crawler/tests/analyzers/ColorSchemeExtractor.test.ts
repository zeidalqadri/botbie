import { ColorSchemeExtractor } from '../../src/analyzers/ColorSchemeExtractor';
import { UIComponent, Color } from '../../src/types';

describe('ColorSchemeExtractor', () => {
  let extractor: ColorSchemeExtractor;

  beforeEach(() => {
    extractor = new ColorSchemeExtractor();
  });

  describe('color parsing', () => {
    it('should parse hex colors correctly', () => {
      const color = extractor['parseColor']('#FF5733');
      expect(color).toMatchObject({
        hex: '#FF5733',
        rgb: { r: 255, g: 87, b: 51 },
        hsl: expect.objectContaining({ h: expect.any(Number) })
      });
    });

    it('should parse rgb colors correctly', () => {
      const color = extractor['parseColor']('rgb(100, 150, 200)');
      expect(color).toMatchObject({
        hex: '#6496c8',
        rgb: { r: 100, g: 150, b: 200 }
      });
    });

    it('should parse rgba colors correctly', () => {
      const color = extractor['parseColor']('rgba(100, 150, 200, 0.5)');
      expect(color).toMatchObject({
        rgb: { r: 100, g: 150, b: 200 }
      });
    });

    it('should handle invalid color strings', () => {
      const color = extractor['parseColor']('not-a-color');
      expect(color).toBeNull();
    });
  });

  describe('color categorization', () => {
    it('should identify primary and accent colors', async () => {
      const colors: Color[] = [
        {
          hex: '#0066CC',
          rgb: { r: 0, g: 102, b: 204 },
          hsl: { h: 210, s: 100, l: 40 },
          wcagContrast: { white: 5.5, black: 3.8 }
        },
        {
          hex: '#FF6B35',
          rgb: { r: 255, g: 107, b: 53 },
          hsl: { h: 16, s: 100, l: 60 },
          wcagContrast: { white: 2.9, black: 7.2 }
        }
      ];

      const palette = await extractor['categorizeColors'](colors);
      expect(palette.primary).toBeDefined();
      expect(palette.accent).toBeDefined();
      expect(palette.primary.hex).not.toBe(palette.accent.hex);
    });

    it('should identify neutral colors', async () => {
      const colors: Color[] = [
        {
          hex: '#333333',
          rgb: { r: 51, g: 51, b: 51 },
          hsl: { h: 0, s: 0, l: 20 },
          wcagContrast: { white: 12.6, black: 1.7 }
        },
        {
          hex: '#666666',
          rgb: { r: 102, g: 102, b: 102 },
          hsl: { h: 0, s: 0, l: 40 },
          wcagContrast: { white: 5.7, black: 3.7 }
        }
      ];

      const palette = await extractor['categorizeColors'](colors);
      expect(palette.neutrals.length).toBeGreaterThan(0);
      expect(palette.neutrals[0].hsl.s).toBeLessThan(20);
    });

    it('should identify semantic colors', async () => {
      const colors: Color[] = [
        {
          hex: '#4CAF50', // Green for success
          rgb: { r: 76, g: 175, b: 80 },
          hsl: { h: 122, s: 39, l: 49 },
          wcagContrast: { white: 2.5, black: 8.4 }
        },
        {
          hex: '#F44336', // Red for error
          rgb: { r: 244, g: 67, b: 54 },
          hsl: { h: 4, s: 90, l: 58 },
          wcagContrast: { white: 3.1, black: 6.7 }
        }
      ];

      const palette = await extractor['categorizeColors'](colors);
      expect(palette.semantic.success).toBeDefined();
      expect(palette.semantic.error).toBeDefined();
    });
  });

  describe('component color extraction', () => {
    it('should extract colors from component CSS', async () => {
      const component: UIComponent = {
        id: 'test-123',
        websiteId: 'site-123',
        type: 'button',
        selector: '.btn',
        screenshotUrl: 'data:image/png;base64,mock',
        html: '<button>Click</button>',
        css: JSON.stringify({
          'background-color': '#0066CC',
          'color': '#FFFFFF',
          'border-color': '#004499'
        }),
        metadata: { tags: [], usage: [], relatedPatterns: [] }
      };

      const palette = await extractor.extractFromComponent(component);
      expect(palette.primary).toBeDefined();
      expect(palette.primary?.hex).toBe('#0066CC');
    });

    it('should extract colors from inline styles', async () => {
      const component: UIComponent = {
        id: 'test-124',
        websiteId: 'site-123',
        type: 'card',
        selector: '.card',
        screenshotUrl: 'data:image/png;base64,mock',
        html: '<div style="background-color: #FF5733; color: rgb(255, 255, 255);">Card</div>',
        css: '{}',
        metadata: { tags: [], usage: [], relatedPatterns: [] }
      };

      const palette = await extractor.extractFromComponent(component);
      const colors = [palette.primary, ...(palette.secondary || [])];
      const hexColors = colors.filter(c => c).map(c => c!.hex);
      
      expect(hexColors).toContain('#FF5733');
    });
  });

  describe('WCAG contrast calculation', () => {
    it('should calculate correct contrast ratios', () => {
      const white = { r: 255, g: 255, b: 255 };
      const black = { r: 0, g: 0, b: 0 };
      const gray = { r: 128, g: 128, b: 128 };

      const contrastWhiteBlack = extractor['calculateContrast'](white, black);
      expect(contrastWhiteBlack).toBeCloseTo(21, 0);

      const contrastWhiteGray = extractor['calculateContrast'](white, gray);
      expect(contrastWhiteGray).toBeGreaterThan(3);
    });
  });

  describe('color deduplication', () => {
    it('should remove duplicate colors', () => {
      const colors: Color[] = [
        {
          hex: '#FF0000',
          rgb: { r: 255, g: 0, b: 0 },
          hsl: { h: 0, s: 100, l: 50 },
          wcagContrast: { white: 4, black: 5.25 }
        },
        {
          hex: '#FF0000', // Duplicate
          rgb: { r: 255, g: 0, b: 0 },
          hsl: { h: 0, s: 100, l: 50 },
          wcagContrast: { white: 4, black: 5.25 }
        }
      ];

      const deduplicated = extractor['deduplicateColors'](colors);
      expect(deduplicated.length).toBe(1);
    });
  });
});