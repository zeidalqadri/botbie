import { DatabaseManager } from '../../src/storage/DatabaseManager';
import { Website, UIComponent, UIPattern, DesignTokens } from '../../src/types';

describe('DatabaseManager', () => {
  let db: DatabaseManager;

  beforeEach(async () => {
    db = new DatabaseManager('memory://test');
    await db.connect();
  });

  afterEach(async () => {
    await db.disconnect();
  });

  describe('connection', () => {
    it('should connect and disconnect successfully', async () => {
      const newDb = new DatabaseManager('memory://test2');
      await expect(newDb.connect()).resolves.not.toThrow();
      await expect(newDb.disconnect()).resolves.not.toThrow();
    });
  });

  describe('website operations', () => {
    it('should save and retrieve website', async () => {
      const website: Website = {
        id: 'site-123',
        url: 'https://example.com',
        name: 'Example Site',
        designer: 'Example Agency',
        awards: ['Awwwards'],
        technologyStack: ['React', 'Next.js'],
        crawledAt: new Date()
      };

      await db.saveWebsite(website);
      const retrieved = await db.getWebsite('site-123');
      
      expect(retrieved).toEqual(website);
    });

    it('should retrieve website by URL', async () => {
      const website: Website = {
        id: 'site-124',
        url: 'https://test.com',
        name: 'Test Site',
        crawledAt: new Date()
      };

      await db.saveWebsite(website);
      const retrieved = await db.getWebsiteByUrl('https://test.com');
      
      expect(retrieved).toEqual(website);
    });

    it('should return null for non-existent website', async () => {
      const retrieved = await db.getWebsite('non-existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('component operations', () => {
    const mockComponent: UIComponent = {
      id: 'comp-123',
      websiteId: 'site-123',
      type: 'button',
      selector: '.btn-primary',
      screenshotUrl: 'https://example.com/screenshot.png',
      html: '<button>Click me</button>',
      css: '{"background": "blue"}',
      metadata: {
        tags: ['primary', 'cta'],
        usage: ['hero', 'form'],
        relatedPatterns: ['button']
      }
    };

    it('should save and retrieve component', async () => {
      await db.saveComponent(mockComponent);
      const retrieved = await db.getComponent('comp-123');
      
      expect(retrieved).toEqual(mockComponent);
    });

    it('should get components by website', async () => {
      await db.saveComponent(mockComponent);
      await db.saveComponent({
        ...mockComponent,
        id: 'comp-124',
        websiteId: 'site-123'
      });
      await db.saveComponent({
        ...mockComponent,
        id: 'comp-125',
        websiteId: 'site-999'
      });

      const components = await db.getComponentsByWebsite('site-123');
      expect(components).toHaveLength(2);
      expect(components.map(c => c.id)).toContain('comp-123');
      expect(components.map(c => c.id)).toContain('comp-124');
    });

    it('should get components by type', async () => {
      await db.saveComponent(mockComponent);
      await db.saveComponent({
        ...mockComponent,
        id: 'comp-126',
        type: 'card'
      });

      const buttons = await db.getComponentsByType('button');
      expect(buttons).toHaveLength(1);
      expect(buttons[0].type).toBe('button');
    });

    it('should search components with filters', async () => {
      await db.saveComponent({
        ...mockComponent,
        accessibilityScore: 95
      });
      await db.saveComponent({
        ...mockComponent,
        id: 'comp-127',
        accessibilityScore: 75
      });

      const results = await db.searchComponents({
        type: 'button',
        minAccessibilityScore: 90
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('comp-123');
    });

    it('should search components by tags', async () => {
      await db.saveComponent(mockComponent);
      await db.saveComponent({
        ...mockComponent,
        id: 'comp-128',
        metadata: {
          tags: ['secondary'],
          usage: [],
          relatedPatterns: []
        }
      });

      const results = await db.searchComponents({
        tags: ['primary']
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('comp-123');
    });
  });

  describe('pattern operations', () => {
    const mockPattern: UIPattern = {
      id: 'pattern-123',
      name: 'Primary Button Pattern',
      type: 'button',
      description: 'A consistent button pattern',
      components: [],
      commonTraits: ['rounded corners', 'hover state'],
      bestPractices: ['Use semantic HTML', 'Include focus state']
    };

    it('should save and retrieve pattern', async () => {
      await db.savePattern(mockPattern);
      const retrieved = await db.getPattern('pattern-123');
      
      expect(retrieved).toEqual(mockPattern);
    });

    it('should get patterns by type', async () => {
      await db.savePattern(mockPattern);
      await db.savePattern({
        ...mockPattern,
        id: 'pattern-124',
        type: 'card'
      });

      const buttonPatterns = await db.getPatternsByType('button');
      expect(buttonPatterns).toHaveLength(1);
      expect(buttonPatterns[0].type).toBe('button');
    });
  });

  describe('design tokens operations', () => {
    const mockTokens: DesignTokens = {
      colors: {
        primary: {
          hex: '#0066CC',
          rgb: { r: 0, g: 102, b: 204 },
          hsl: { h: 210, s: 100, l: 40 }
        },
        secondary: [],
        accent: {
          hex: '#FF6B35',
          rgb: { r: 255, g: 107, b: 53 },
          hsl: { h: 16, s: 100, l: 60 }
        },
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
      spacing: {
        base: 8,
        scale: [0, 4, 8, 16, 24, 32, 48, 64],
        units: 'px'
      },
      shadows: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 6px rgba(0,0,0,0.1)',
        lg: '0 10px 15px rgba(0,0,0,0.1)',
        xl: '0 20px 25px rgba(0,0,0,0.15)'
      },
      borders: {
        radii: { sm: '4px', md: '8px', lg: '16px', xl: '24px' },
        widths: { thin: '1px', medium: '2px', thick: '4px' },
        styles: ['solid', 'dashed', 'dotted']
      },
      animations: {
        durations: { fast: '200ms', normal: '300ms', slow: '500ms' },
        easings: { default: 'ease', smooth: 'ease-in-out' }
      }
    };

    it('should save and retrieve design tokens', async () => {
      await db.saveDesignTokens('site-123', mockTokens);
      const retrieved = await db.getDesignTokens('site-123');
      
      expect(retrieved).toEqual(mockTokens);
    });
  });

  describe('transaction operations', () => {
    it('should execute transactions successfully', async () => {
      const website: Website = {
        id: 'site-tx-123',
        url: 'https://tx-test.com',
        name: 'Transaction Test',
        crawledAt: new Date()
      };

      const component: UIComponent = {
        id: 'comp-tx-123',
        websiteId: 'site-tx-123',
        type: 'card',
        selector: '.card',
        screenshotUrl: 'https://example.com/tx.png',
        html: '<div>Card</div>',
        css: '{}',
        metadata: { tags: [], usage: [], relatedPatterns: [] }
      };

      await db.transaction(async (tx) => {
        await tx.saveWebsite(website);
        await tx.saveComponent(component);
      });

      const retrievedWebsite = await db.getWebsite('site-tx-123');
      const retrievedComponent = await db.getComponent('comp-tx-123');

      expect(retrievedWebsite).toEqual(website);
      expect(retrievedComponent).toEqual(component);
    });
  });

  describe('statistics', () => {
    it('should return correct stats', async () => {
      // Add test data
      await db.saveWebsite({
        id: 'site-stats-1',
        url: 'https://stats1.com',
        name: 'Stats Site 1',
        crawledAt: new Date()
      });

      await db.saveComponent({
        id: 'comp-stats-1',
        websiteId: 'site-stats-1',
        type: 'button',
        selector: '.btn',
        screenshotUrl: 'https://example.com/stats1.png',
        html: '<button>Button</button>',
        css: '{}',
        metadata: { tags: [], usage: [], relatedPatterns: [] }
      });

      await db.saveComponent({
        id: 'comp-stats-2',
        websiteId: 'site-stats-1',
        type: 'card',
        selector: '.card',
        screenshotUrl: 'https://example.com/stats2.png',
        html: '<div>Card</div>',
        css: '{}',
        metadata: { tags: [], usage: [], relatedPatterns: [] }
      });

      const stats = await db.getStats();

      expect(stats.totalWebsites).toBe(1);
      expect(stats.totalComponents).toBe(2);
      expect(stats.componentsByType.button).toBe(1);
      expect(stats.componentsByType.card).toBe(1);
    });
  });
});