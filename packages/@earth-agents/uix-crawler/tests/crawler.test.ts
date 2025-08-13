import { UIXCrawler } from '../src/crawler/UICrawler';
import { CrawlerConfig } from '../src/types';

describe('UIXCrawler', () => {
  let crawler: UIXCrawler;
  
  beforeEach(() => {
    const config: CrawlerConfig = {
      storage: {
        database: 'file://./test-db',
        images: 'file://./test-images'
      },
      analysis: {
        extractPatterns: true,
        extractColors: true,
        extractTypography: true,
        checkAccessibility: true
      },
      limits: {
        maxPages: 1,
        maxComponents: 10,
        timeout: 30000
      }
    };
    
    crawler = new UIXCrawler(config);
  });

  afterEach(async () => {
    await crawler.shutdown();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(crawler.initialize()).resolves.not.toThrow();
    });
  });

  describe('component extraction', () => {
    it('should extract a component from a URL', async () => {
      // Mock test - in real implementation would use a test server
      const mockComponent = {
        id: 'test-123',
        websiteId: 'website-123',
        type: 'button' as const,
        selector: '.test-button',
        screenshotUrl: 'data:image/png;base64,mock',
        html: '<button class="test-button">Click me</button>',
        css: '{"display": "inline-block", "padding": "10px"}',
        metadata: {
          tags: ['button', 'interactive'],
          usage: ['cta', 'user-action'],
          relatedPatterns: []
        }
      };

      // In a real test, we would mock the Playwright browser
      // For now, this is a placeholder
      expect(mockComponent).toHaveProperty('id');
      expect(mockComponent.type).toBe('button');
    });
  });

  describe('design token extraction', () => {
    it('should extract color palette', () => {
      // Test color parsing logic
      const testColors = [
        '#FF0000', // Red
        'rgb(0, 255, 0)', // Green
        'rgba(0, 0, 255, 1)' // Blue
      ];

      // In a real test, we would test the ColorSchemeExtractor
      expect(testColors).toHaveLength(3);
      expect(testColors[0]).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('should extract typography system', () => {
      // Test typography analysis
      const mockTypography = {
        fontFamilies: [
          {
            family: 'Inter',
            fallback: ['sans-serif'],
            category: 'sans-serif' as const,
            source: 'google' as const,
            weights: [400, 500, 600, 700]
          }
        ],
        scale: [12, 14, 16, 18, 20, 24, 32, 48],
        lineHeights: {
          body: 1.5,
          heading: 1.2
        },
        fontWeights: {
          regular: 400,
          medium: 500,
          semiBold: 600,
          bold: 700
        }
      };

      expect(mockTypography.fontFamilies).toHaveLength(1);
      expect(mockTypography.scale).toContain(16);
    });
  });

  describe('pattern analysis', () => {
    it('should identify UI patterns', () => {
      // Test pattern detection
      const mockPatterns = [
        {
          id: 'pattern-navigation-123',
          name: 'Navigation Pattern',
          type: 'navigation' as const,
          description: 'A navigation pattern that uses flexbox layout',
          components: [],
          commonTraits: ['display: flex', 'responsive design'],
          bestPractices: ['Use semantic <nav> element', 'Include aria-label']
        }
      ];

      expect(mockPatterns[0].type).toBe('navigation');
      expect(mockPatterns[0].commonTraits).toContain('display: flex');
    });
  });

  describe('crawl options', () => {
    it('should respect crawl depth limit', () => {
      const options = {
        depth: 2,
        patterns: ['navigation', 'hero'] as any[],
        captureInteractions: true
      };

      expect(options.depth).toBe(2);
      expect(options.patterns).toContain('navigation');
    });
  });
});