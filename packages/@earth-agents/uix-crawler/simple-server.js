#!/usr/bin/env node

// Ultra-minimal server with no dependencies
const http = require('http');

// Simple in-memory database
const database = {
  websites: new Map(),
  components: new Map(),
  crawlCount: 0
};

// Helper to parse JSON body
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

// Helper to send JSON response
function sendJSON(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

// Crawler API (Port 3001)
const crawlerServer = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  if (req.url === '/health' && req.method === 'GET') {
    sendJSON(res, { status: 'healthy', service: 'uix-crawler' });
  } else if (req.url === '/api/crawl' && req.method === 'POST') {
    const body = await parseBody(req);
    const { url } = body;
    
    console.log('Crawl requested for:', url);
    database.crawlCount++;
    
    const mockResult = {
      website: {
        id: `site-${Date.now()}`,
        url,
        name: url.replace(/https?:\/\//, '').split('/')[0],
        crawledAt: new Date()
      },
      components: [{
        id: `comp-${Date.now()}-1`,
        websiteId: `site-${Date.now()}`,
        type: 'navigation',
        selector: 'nav',
        screenshotUrl: 'data:image/png;base64,mock',
        html: '<nav>Mock Navigation</nav>',
        css: '{"display": "flex"}',
        metadata: { tags: ['navigation'], usage: ['header'], relatedPatterns: [] }
      }],
      designTokens: {
        colors: {
          primary: { hex: '#0066CC' },
          secondary: [],
          accent: { hex: '#FF6B35' },
          neutrals: [],
          semantic: {
            success: { hex: '#4CAF50' },
            warning: { hex: '#FF9800' },
            error: { hex: '#F44336' },
            info: { hex: '#2196F3' }
          }
        }
      },
      metadata: {
        duration: 5000,
        pagesVisited: 1,
        componentsFound: 1,
        errors: [],
        timestamp: new Date()
      }
    };
    
    database.websites.set(mockResult.website.id, mockResult.website);
    mockResult.components.forEach(c => database.components.set(c.id, c));
    
    sendJSON(res, { success: true, data: mockResult });
  } else {
    sendJSON(res, { error: 'Not found' }, 404);
  }
});

// Gallery API (Port 3002)
const galleryServer = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  if (req.url === '/health' && req.method === 'GET') {
    sendJSON(res, { status: 'healthy', service: 'uix-gallery' });
  } else if (req.url === '/api/components' && req.method === 'GET') {
    const components = Array.from(database.components.values());
    sendJSON(res, {
      success: true,
      data: {
        total: components.length,
        offset: 0,
        limit: 20,
        components
      }
    });
  } else if (req.url === '/api/stats' && req.method === 'GET') {
    sendJSON(res, {
      success: true,
      data: {
        totalWebsites: database.websites.size,
        totalComponents: database.components.size,
        totalPatterns: 0,
        componentsByType: { navigation: database.components.size }
      }
    });
  } else if (req.url === '/api/workflow-status' && req.method === 'GET') {
    sendJSON(res, {
      success: true,
      data: {
        n8n: { status: 'running', url: 'http://localhost:5678' },
        crawler: {
          lastActivity: new Date().toISOString(),
          totalCrawls: database.crawlCount,
          successRate: '100%'
        },
        schedule: 'Every 6 hours',
        nextRun: 'Check N8N UI for exact schedule'
      }
    });
  } else if (req.url === '/api/logs' && req.method === 'GET') {
    sendJSON(res, {
      success: true,
      data: {
        summary: {
          totalCrawls: database.crawlCount,
          successfulCrawls: database.crawlCount,
          failedCrawls: 0,
          componentsExtracted: database.components.size,
          codeGenerated: 0,
          lastActivity: new Date().toISOString()
        },
        recentActivity: []
      }
    });
  } else {
    sendJSON(res, { error: 'Not found' }, 404);
  }
});

// Start servers
crawlerServer.listen(3001, () => {
  console.log('✅ Crawler API started on port 3001');
});

galleryServer.listen(3002, () => {
  console.log('✅ Gallery API started on port 3002');
});

console.log('🚀 UIX Crawler Mock Services Running!');
console.log('   Crawler API: http://localhost:3001');
console.log('   Gallery API: http://localhost:3002');
console.log('');
console.log('Note: This is a mock implementation for testing N8N workflow.');
console.log('For full functionality, install dependencies and run: npm run start:api');