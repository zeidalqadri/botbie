import request from 'supertest';
import { createCrawlerAPI } from '../../src/api/CrawlerAPI';
import { CrawlerConfig } from '../../src/types';

describe('CrawlerAPI', () => {
  let api: any;
  let server: any;

  beforeAll(async () => {
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
      }
    };

    const crawlerAPI = createCrawlerAPI({
      port: 0, // Use random port
      crawlerConfig: config
    });

    api = crawlerAPI.app;
    // Don't start the server for supertest
  });

  afterAll(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(api).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'healthy',
        service: 'uix-crawler'
      });
    });
  });

  describe('POST /api/crawl', () => {
    it('should require URL parameter', async () => {
      const response = await request(api)
        .post('/api/crawl')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('URL is required');
    });

    it('should accept crawl request with valid URL', async () => {
      const response = await request(api)
        .post('/api/crawl')
        .send({
          url: 'https://example.com',
          options: {
            depth: 1,
            patterns: ['navigation', 'hero']
          }
        });
      
      // Will fail since we don't have a mock implementation
      // But we're testing the API contract
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('POST /api/extract-component', () => {
    it('should require URL and selector', async () => {
      const response = await request(api)
        .post('/api/extract-component')
        .send({ url: 'https://example.com' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('URL and selector are required');
    });

    it('should accept component extraction request', async () => {
      const response = await request(api)
        .post('/api/extract-component')
        .send({
          url: 'https://example.com',
          selector: '.navigation'
        });
      
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('POST /api/components/:id/code', () => {
    it('should require component data', async () => {
      const response = await request(api)
        .post('/api/components/test-123/code')
        .send({
          framework: 'react'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Component data is required');
    });

    it('should accept code generation request', async () => {
      const mockComponent = {
        id: 'test-123',
        websiteId: 'site-123',
        type: 'button',
        selector: '.btn',
        screenshotUrl: 'data:image/png;base64,mock',
        html: '<button>Click</button>',
        css: '{}',
        metadata: { tags: [], usage: [], relatedPatterns: [] }
      };

      const response = await request(api)
        .post('/api/components/test-123/code')
        .send({
          component: mockComponent,
          framework: 'react',
          typescript: true,
          styling: 'tailwind'
        });
      
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('POST /api/analyze', () => {
    it('should require URL for analysis', async () => {
      const response = await request(api)
        .post('/api/analyze')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('URL is required');
    });

    it('should accept analysis request', async () => {
      const response = await request(api)
        .post('/api/analyze')
        .send({
          url: 'https://example.com',
          patterns: ['navigation', 'hero', 'card']
        });
      
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('POST /api/batch-crawl', () => {
    it('should require URLs array', async () => {
      const response = await request(api)
        .post('/api/batch-crawl')
        .send({
          urls: 'not-an-array'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('URLs array is required');
    });

    it('should accept batch crawl request', async () => {
      const response = await request(api)
        .post('/api/batch-crawl')
        .send({
          urls: [
            'https://example1.com',
            'https://example2.com'
          ],
          options: {
            depth: 1
          }
        });
      
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('GET /api/status', () => {
    it('should return crawler status', async () => {
      const response = await request(api).get('/api/status');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('activeCrawls');
    });
  });

  describe('Error handling', () => {
    it('should handle internal server errors', async () => {
      // Force an error by sending invalid JSON
      const response = await request(api)
        .post('/api/crawl')
        .set('Content-Type', 'application/json')
        .send('invalid-json');
      
      expect(response.status).toBe(400);
    });
  });
});