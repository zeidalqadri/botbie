#!/usr/bin/env node

// Minimal service runner that works without full npm install
const express = require('express');
const cors = require('cors');

// Mock Logger if @earth-agents/core is not available
class Logger {
  constructor(name) {
    this.name = name;
  }
  info(msg, data) { console.log(`[${this.name}] INFO:`, msg, data || ''); }
  error(msg, data) { console.error(`[${this.name}] ERROR:`, msg, data || ''); }
  warn(msg, data) { console.warn(`[${this.name}] WARN:`, msg, data || ''); }
  debug(msg, data) { console.log(`[${this.name}] DEBUG:`, msg, data || ''); }
}

// Simple in-memory database
const database = {
  websites: new Map(),
  components: new Map(),
  patterns: new Map(),
  designTokens: new Map()
};

// Crawler API (Port 3001)
const crawlerApp = express();
crawlerApp.use(express.json({ limit: '50mb' }));
crawlerApp.use(cors({ origin: '*' }));

crawlerApp.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'uix-crawler' });
});

crawlerApp.post('/api/crawl', async (req, res) => {
  const { url, options } = req.body;
  console.log('Crawl requested for:', url, options);
  
  // Mock crawl result
  const mockResult = {
    website: {
      id: `site-${Date.now()}`,
      url,
      name: new URL(url).hostname,
      crawledAt: new Date()
    },
    components: [
      {
        id: `comp-${Date.now()}-1`,
        websiteId: `site-${Date.now()}`,
        type: 'navigation',
        selector: 'nav',
        screenshotUrl: 'data:image/png;base64,mock',
        html: '<nav>Mock Navigation</nav>',
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
      typography: { fontFamilies: [], scale: [14, 16, 18, 24, 32], lineHeights: { body: 1.5 }, fontWeights: { regular: 400, bold: 700 } },
      spacing: { base: 8, scale: [0, 8, 16, 24, 32], units: 'px' },
      shadows: { sm: '0 1px 2px rgba(0,0,0,0.05)', md: '0 4px 6px rgba(0,0,0,0.1)', lg: '0 10px 15px rgba(0,0,0,0.1)', xl: '0 20px 25px rgba(0,0,0,0.15)' },
      borders: { radii: { sm: '4px', md: '8px', lg: '16px', xl: '24px' }, widths: { thin: '1px', medium: '2px', thick: '4px' }, styles: ['solid'] },
      animations: { durations: { fast: '200ms', normal: '300ms', slow: '500ms' }, easings: { default: 'ease' } }
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
  
  // Store in database
  database.websites.set(mockResult.website.id, mockResult.website);
  mockResult.components.forEach(c => database.components.set(c.id, c));
  
  res.json({ success: true, data: mockResult });
});

// Gallery API (Port 3002)
const galleryApp = express();
galleryApp.use(express.json());
galleryApp.use(cors({ origin: '*' }));

galleryApp.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'uix-gallery' });
});

galleryApp.get('/api/components', (req, res) => {
  const components = Array.from(database.components.values());
  res.json({
    success: true,
    data: {
      total: components.length,
      offset: 0,
      limit: 20,
      components
    }
  });
});

galleryApp.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalWebsites: database.websites.size,
      totalComponents: database.components.size,
      totalPatterns: database.patterns.size,
      componentsByType: {}
    }
  });
});

galleryApp.get('/api/workflow-status', (req, res) => {
  res.json({
    success: true,
    data: {
      n8n: { status: 'running', url: 'http://localhost:5678' },
      crawler: {
        lastActivity: new Date().toISOString(),
        totalCrawls: database.websites.size,
        successRate: '100%'
      },
      schedule: 'Every 6 hours',
      nextRun: 'Check N8N UI for exact schedule'
    }
  });
});

galleryApp.get('/api/logs', (req, res) => {
  res.json({
    success: true,
    data: {
      summary: {
        totalCrawls: database.websites.size,
        successfulCrawls: database.websites.size,
        failedCrawls: 0,
        componentsExtracted: database.components.size,
        codeGenerated: 0,
        lastActivity: new Date().toISOString()
      },
      recentActivity: []
    }
  });
});

// Start servers
const crawlerPort = process.env.CRAWLER_PORT || 3001;
const galleryPort = process.env.GALLERY_PORT || 3002;

crawlerApp.listen(crawlerPort, () => {
  console.log(`✅ Crawler API started on port ${crawlerPort}`);
});

galleryApp.listen(galleryPort, () => {
  console.log(`✅ Gallery API started on port ${galleryPort}`);
});

console.log('🚀 UIX Crawler Services Running!');
console.log(`   Crawler API: http://localhost:${crawlerPort}`);
console.log(`   Gallery API: http://localhost:${galleryPort}`);