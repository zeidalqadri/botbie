import { TypographyAnalyzer } from '../../src/analyzers/TypographyAnalyzer';
import { TypographySystem, Font } from '../../src/types';

describe('TypographyAnalyzer', () => {
  let analyzer: TypographyAnalyzer;

  beforeEach(() => {
    analyzer = new TypographyAnalyzer();
  });

  describe('font family processing', () => {
    it('should parse font stacks correctly', () => {
      const fonts = [
        { family: '"Inter", -apple-system, sans-serif', weights: [400, 600] },
        { family: '"Playfair Display", Georgia, serif', weights: [400, 700] }
      ];

      const processed = analyzer['processFontFamilies'](fonts);
      
      expect(processed[0].family).toBe('Inter');
      expect(processed[0].fallback).toContain('-apple-system');
      expect(processed[0].fallback).toContain('sans-serif');
      expect(processed[0].category).toBe('sans-serif');
    });

    it('should categorize fonts correctly', () => {
      const testCases = [
        { font: 'Arial', expected: 'sans-serif' },
        { font: 'Times New Roman', expected: 'serif' },
        { font: 'Courier New', expected: 'monospace' },
        { font: 'Display Bold', expected: 'display' }
      ];

      testCases.forEach(({ font, expected }) => {
        const category = analyzer['categorizeFont'](font);
        expect(category).toBe(expected);
      });
    });

    it('should detect font sources', () => {
      const testCases = [
        { font: 'Roboto', expected: 'google' },
        { font: 'Arial', expected: 'system' },
        { font: 'CustomBrandFont', expected: 'custom' }
      ];

      testCases.forEach(({ font, expected }) => {
        const source = analyzer['detectFontSource'](font);
        expect(source).toBe(expected);
      });
    });
  });

  describe('type scale calculation', () => {
    it('should calculate modular type scale', () => {
      const sizes = [14, 16, 18, 20, 24, 32, 48];
      const scale = analyzer['calculateTypeScale'](sizes);
      
      expect(scale).toContain(16); // Base size
      expect(scale).toContain(20); // 16 * 1.25
      expect(scale).toContain(32); // Larger size
    });

    it('should find correct base font size', () => {
      const sizes = [12, 14, 16, 16, 16, 18, 24, 32];
      const baseSize = analyzer['findBaseFontSize'](sizes);
      
      expect(baseSize).toBe(16); // Most common body size
    });

    it('should handle empty size array', () => {
      const sizes: number[] = [];
      const baseSize = analyzer['findBaseFontSize'](sizes);
      
      expect(baseSize).toBe(16); // Default
    });
  });

  describe('line height processing', () => {
    it('should process line heights with defaults', () => {
      const lineHeights = {
        'h1': 1.2,
        'p': 1.6,
        'custom': 2.5
      };

      const processed = analyzer['processLineHeights'](lineHeights);
      
      expect(processed.h1).toBe(1.2);
      expect(processed.p).toBe(1.6);
      expect(processed.body).toBe(1.5); // Default
      expect(processed.button).toBe(1.2); // Default
    });

    it('should filter out invalid line heights', () => {
      const lineHeights = {
        'p': 1.5,
        'invalid': 0.5, // Too small
        'huge': 3.0 // Too large
      };

      const processed = analyzer['processLineHeights'](lineHeights);
      
      expect(processed.p).toBe(1.5);
      expect(processed.invalid).toBeUndefined();
      expect(processed.huge).toBeUndefined();
    });
  });

  describe('font weight naming', () => {
    it('should convert numeric weights to names', () => {
      const testCases = [
        { weight: 100, expected: 'thin' },
        { weight: 400, expected: 'regular' },
        { weight: 700, expected: 'bold' },
        { weight: 900, expected: 'black' },
        { weight: 550, expected: 'weight550' }
      ];

      testCases.forEach(({ weight, expected }) => {
        const name = analyzer['getFontWeightName'](weight);
        expect(name).toBe(expected);
      });
    });
  });

  describe('typography comparison', () => {
    it('should compare typography systems', async () => {
      const system1: TypographySystem = {
        fontFamilies: [
          {
            family: 'Inter',
            fallback: ['sans-serif'],
            category: 'sans-serif',
            source: 'google',
            weights: [400, 600]
          }
        ],
        scale: [14, 16, 18, 24, 32],
        lineHeights: { body: 1.5, heading: 1.2 },
        fontWeights: { regular: 400, bold: 700 }
      };

      const system2: TypographySystem = {
        fontFamilies: [
          {
            family: 'Roboto',
            fallback: ['sans-serif'],
            category: 'sans-serif',
            source: 'google',
            weights: [400, 700]
          }
        ],
        scale: [14, 16, 20, 28, 40],
        lineHeights: { body: 1.6, heading: 1.3 },
        fontWeights: { regular: 400, bold: 700 }
      };

      const comparison = await analyzer.compareTypography(system1, system2);
      
      expect(comparison.similarity).toBeLessThan(1);
      expect(comparison.differences).toContain('Different font families used');
      expect(comparison.recommendations).toContain('Consider using consistent font families across designs');
    });

    it('should detect line height differences', async () => {
      const system1: TypographySystem = {
        fontFamilies: [],
        scale: [16],
        lineHeights: { body: 1.4, heading: 1.1 },
        fontWeights: { regular: 400 }
      };

      const system2: TypographySystem = {
        fontFamilies: [],
        scale: [16],
        lineHeights: { body: 1.8, heading: 1.4 },
        fontWeights: { regular: 400 }
      };

      const comparison = await analyzer.compareTypography(system1, system2);
      
      expect(comparison.differences).toContain('Different line height approaches');
      expect(comparison.recommendations).toContain('Maintain consistent line height ratios for better readability');
    });
  });
});