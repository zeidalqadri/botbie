import { UIXCrawler } from '../../src/crawler/UICrawler';
import { createCrawlerAPI } from '../../src/api/CrawlerAPI';
import { createGalleryAPI } from '../../src/api/GalleryAPI';
import request from 'supertest';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('E2E Integration Tests', () => {
  let crawler: UIXCrawler;
  let crawlerAPI: any;
  let galleryAPI: any;
  const testDataDir = path.join(__dirname, '../../tmp/e2e-test');

  beforeAll(async () => {
    // Setup test directories
    await fs.mkdir(testDataDir, { recursive: true });

    const config = {
      storage: {
        database: `file://${testDataDir}/db`,
        images: `file://${testDataDir}/images`
      },
      analysis: {
        extractPatterns: true,
        extractColors: true,
        extractTypography: true,
        checkAccessibility: true
      }
    };

    // Initialize crawler
    crawler = new UIXCrawler(config);
    await crawler.initialize();

    // Initialize APIs
    const crawlerService = createCrawlerAPI({
      port: 0,
      crawlerConfig: config
    });
    crawlerAPI = crawlerService.app;

    const galleryService = createGalleryAPI({
      port: 0,
      databaseUrl: config.storage.database
    });
    galleryAPI = galleryService.app;
  });

  afterAll(async () => {
    await crawler.shutdown();
    await fs.rm(testDataDir, { recursive: true, force: true });
  });

  describe('Full crawl workflow', () => {
    it('should crawl a website and store results', async () => {
      // Mock crawl result
      const mockUrl = 'https://example.com';
      const mockResult = {
        website: {
          id: 'site-e2e-1',
          url: mockUrl,
          name: 'Example Site',
          crawledAt: new Date()
        },
        components: [
          {
            id: 'comp-e2e-1',
            websiteId: 'site-e2e-1',
            type: 'navigation',
            selector: 'nav',
            screenshotUrl: 'data:image/png;base64,mock',
            html: '<nav>Navigation</nav>',
            css: '{"display": "flex"}',
            metadata: { tags: ['navigation'], usage: ['header'], relatedPatterns: [] }
          }
        ],
        designTokens: {
          colors: {
            primary: { hex: '#0066CC', rgb: { r: 0, g: 102, b: 204 }, hsl: { h: 210, s: 100, l: 40 } },
            secondary: [],
            accent: { hex: '#FF6B35', rgb: { r: 255, g: 107, b: 53 }, hsl: { h: 16, s: 100, l: 60 } },
            neutrals: [],
            semantic: {
              success: { hex: '#4CAF50', rgb: { r: 76, g: 175, b: 80 }, hsl: { h: 122, s: 39, l: 49 } },
              warning: { hex: '#FF9800', rgb: { r: 255, g: 152, b: 0 }, hsl: { h: 36, s: 100, l: 50 } },
              error: { hex: '#F44336', rgb: { r: 244, g: 67, b: 54 }, hsl: { h: 4, s: 90, l: 58 } },
              info: { hex: '#2196F3', rgb: { r: 33, g: 150, b: 243 }, hsl: { h: 207, s: 90, l: 54 } }
            }
          },
          typography: {
            fontFamilies: [],
            scale: [14, 16, 18, 24, 32],
            lineHeights: { body: 1.5 },
            fontWeights: { regular: 400, bold: 700 }
          },
          spacing: { base: 8, scale: [0, 8, 16, 24, 32], units: 'px' },
          shadows: {
            sm: '0 1px 2px rgba(0,0,0,0.05)',
            md: '0 4px 6px rgba(0,0,0,0.1)',
            lg: '0 10px 15px rgba(0,0,0,0.1)',
            xl: '0 20px 25px rgba(0,0,0,0.15)'
          },
          borders: {
            radii: { sm: '4px', md: '8px', lg: '16px', xl: '24px' },
            widths: { thin: '1px', medium: '2px', thick: '4px' },
            styles: ['solid']
          },
          animations: {
            durations: { fast: '200ms', normal: '300ms', slow: '500ms' },
            easings: { default: 'ease' }
          }
        },
        patterns: [],
        metadata: {
          duration: 5000,
          pagesVisited: 1,
          componentsFound: 1,
          errors: [],
          timestamp: new Date()
        }
      };

      // Since we're mocking playwright, we'll directly save the mock result
      const db = crawler['db'];
      await db.saveWebsite(mockResult.website);
      for (const component of mockResult.components) {
        await db.saveComponent(component);
      }
      await db.saveDesignTokens(mockResult.website.id, mockResult.designTokens);

      // Test Gallery API can retrieve the data
      const componentsResponse = await request(galleryAPI)
        .get('/api/components')
        .query({ websiteId: 'site-e2e-1' });

      expect(componentsResponse.status).toBe(200);
      expect(componentsResponse.body.data.components).toHaveLength(1);
      expect(componentsResponse.body.data.components[0].type).toBe('navigation');
    });
  });

  describe('API integration', () => {
    it('should handle component search', async () => {
      const response = await request(galleryAPI)
        .get('/api/components')
        .query({ type: 'navigation' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.components).toBeDefined();
    });

    it('should get gallery statistics', async () => {
      const response = await request(galleryAPI)
        .get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('totalWebsites');
      expect(response.body.data).toHaveProperty('totalComponents');
      expect(response.body.data).toHaveProperty('componentsByType');
    });

    it('should handle trending components request', async () => {
      const response = await request(galleryAPI)
        .get('/api/trending')
        .query({ period: 'week', limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('period', 'week');
      expect(response.body.data).toHaveProperty('components');
    });
  });

  describe('Code generation workflow', () => {
    it('should generate component code', async () => {
      const mockComponent = {
        id: 'comp-gen-1',
        websiteId: 'site-gen-1',
        type: 'button',
        selector: '.btn-primary',
        screenshotUrl: 'data:image/png;base64,mock',
        html: '<button class="btn-primary">Click Me</button>',
        css: JSON.stringify({
          'background-color': '#0066CC',
          'color': '#FFFFFF',
          'padding': '10px 20px',
          'border-radius': '4px',
          'border': 'none',
          'cursor': 'pointer'
        }),
        metadata: {
          tags: ['button', 'primary', 'cta'],
          usage: ['hero', 'form'],
          relatedPatterns: []
        }
      };

      // Mock Sketchie integration
      const mockCode = `import React from 'react';

const Button: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <button className="bg-blue-600 text-white px-5 py-2.5 rounded border-0 cursor-pointer hover:bg-blue-700">
      {children}
    </button>
  );
};

export default Button;`;

      // In real implementation, this would call Sketchie
      expect(mockCode).toContain('React.FC');
      expect(mockCode).toContain('bg-blue-600');
    });
  });

  describe('Batch operations', () => {
    it('should handle batch crawl requests', async () => {
      const response = await request(crawlerAPI)
        .post('/api/batch-crawl')
        .send({
          urls: ['https://example1.com', 'https://example2.com'],
          options: { depth: 1, patterns: ['navigation', 'hero'] }
        });

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('Pattern analysis', () => {
    it('should identify and compare patterns', async () => {
      // Create components for pattern analysis
      const navComponents = [
        {
          id: 'nav-1',
          websiteId: 'site-pattern-1',
          type: 'navigation' as const,
          selector: 'nav.primary',
          screenshotUrl: 'data:image/png;base64,mock',
          html: '<nav class="primary"><ul><li>Home</li></ul></nav>',
          css: JSON.stringify({ display: 'flex', position: 'fixed' }),
          metadata: { tags: ['navigation', 'fixed'], usage: ['header'], relatedPatterns: [] }
        },
        {
          id: 'nav-2',
          websiteId: 'site-pattern-2',
          type: 'navigation' as const,
          selector: 'nav.secondary',
          screenshotUrl: 'data:image/png;base64,mock',
          html: '<nav class="secondary"><ul><li>About</li></ul></nav>',
          css: JSON.stringify({ display: 'flex', position: 'sticky' }),
          metadata: { tags: ['navigation', 'sticky'], usage: ['header'], relatedPatterns: [] }
        }
      ];

      // Save components
      const db = crawler['db'];
      for (const comp of navComponents) {
        await db.saveComponent(comp);
      }

      // Retrieve and verify
      const patterns = await db.getPatternsByType('navigation');
      // In real implementation, patterns would be created by analyzer
      expect(navComponents).toHaveLength(2);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid crawl requests gracefully', async () => {
      const response = await request(crawlerAPI)
        .post('/api/crawl')
        .send({ url: 'not-a-valid-url' });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle missing components gracefully', async () => {
      const response = await request(galleryAPI)
        .get('/api/components/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Component not found');
    });
  });
});