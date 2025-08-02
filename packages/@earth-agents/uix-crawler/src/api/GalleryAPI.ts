import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import { Logger } from '@earth-agents/core';
import { DatabaseManager } from '../storage/DatabaseManager';
import { UIComponent, ComponentType } from '../types';

export interface GalleryAPIConfig {
  port: number;
  corsOrigin?: string;
  databaseUrl: string;
}

export function createGalleryAPI(config: GalleryAPIConfig): {
  app: Application;
  start: () => Promise<void>;
  stop: () => Promise<void>;
} {
  const logger = new Logger('GalleryAPI');
  const app = express();
  const db = new DatabaseManager(config.databaseUrl);
  let server: any;

  // Middleware
  app.use(express.json());
  app.use(cors({
    origin: config.corsOrigin || '*',
    credentials: true
  }));

  // Health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'healthy', service: 'uix-gallery' });
  });

  // Browse components with filtering
  app.get('/api/components', async (req: Request, res: Response) => {
    try {
      const { 
        type, 
        style, 
        tags, 
        websiteId,
        minAccessibility,
        limit = 20,
        offset = 0
      } = req.query;

      logger.info('Browsing components', { type, style, tags });

      const components = await db.searchComponents({
        type: type as string,
        tags: tags ? (tags as string).split(',') : undefined,
        websiteId: websiteId as string,
        minAccessibilityScore: minAccessibility ? parseInt(minAccessibility as string) : undefined
      });

      // Apply style filter if provided
      let filtered = components;
      if (style) {
        filtered = components.filter(c => 
          c.metadata.tags.includes(style as string)
        );
      }

      // Pagination
      const paginated = filtered.slice(
        parseInt(offset as string),
        parseInt(offset as string) + parseInt(limit as string)
      );

      res.json({
        success: true,
        data: {
          total: filtered.length,
          offset: parseInt(offset as string),
          limit: parseInt(limit as string),
          components: paginated
        }
      });
    } catch (error: any) {
      logger.error('Failed to browse components', { error });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get component by ID
  app.get('/api/components/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const component = await db.getComponent(id);
      
      if (!component) {
        return res.status(404).json({
          success: false,
          error: 'Component not found'
        });
      }

      res.json({
        success: true,
        data: component
      });
    } catch (error: any) {
      logger.error('Failed to get component', { error });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get trending components
  app.get('/api/trending', async (req: Request, res: Response) => {
    try {
      const { period = 'week', limit = 10 } = req.query;
      
      logger.info('Getting trending components', { period, limit });

      const components = await db.getTrendingComponents(
        period as 'day' | 'week' | 'month',
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: {
          period,
          components
        }
      });
    } catch (error: any) {
      logger.error('Failed to get trending components', { error });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Search by color palette
  app.get('/api/search/palette', async (req: Request, res: Response) => {
    try {
      const { colors } = req.query;
      
      if (!colors) {
        return res.status(400).json({
          success: false,
          error: 'Colors parameter is required'
        });
      }

      const colorArray = (colors as string).split(',');
      logger.info('Searching by color palette', { colors: colorArray });

      // In a real implementation, this would search components by their color tokens
      const allComponents = await db.searchComponents({});
      
      // Filter components that have similar colors
      const matchingComponents = allComponents.filter(component => {
        if (!component.designTokens?.colors) return false;
        
        // Simple color matching logic
        // In production, this would use color distance algorithms
        return true; // Placeholder
      });

      res.json({
        success: true,
        data: {
          query: colorArray,
          components: matchingComponents
        }
      });
    } catch (error: any) {
      logger.error('Failed to search by palette', { error });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get websites
  app.get('/api/websites', async (req: Request, res: Response) => {
    try {
      const stats = await db.getStats();
      
      // In a real implementation, this would list all websites
      res.json({
        success: true,
        data: {
          total: stats.totalWebsites,
          websites: [] // Would fetch actual websites
        }
      });
    } catch (error: any) {
      logger.error('Failed to get websites', { error });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get design patterns
  app.get('/api/patterns', async (req: Request, res: Response) => {
    try {
      const { type } = req.query;
      
      logger.info('Getting design patterns', { type });

      let patterns;
      if (type) {
        patterns = await db.getPatternsByType(type as string);
      } else {
        // Get all patterns
        const types: ComponentType[] = [
          'navigation', 'hero', 'card', 'form', 'button',
          'modal', 'footer', 'sidebar', 'table', 'list'
        ];
        
        const allPatterns = await Promise.all(
          types.map(t => db.getPatternsByType(t))
        );
        
        patterns = allPatterns.flat();
      }

      res.json({
        success: true,
        data: patterns
      });
    } catch (error: any) {
      logger.error('Failed to get patterns', { error });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get component types
  app.get('/api/component-types', (req: Request, res: Response) => {
    const types: ComponentType[] = [
      'navigation', 'hero', 'card', 'form', 'button',
      'modal', 'footer', 'sidebar', 'table', 'list',
      'carousel', 'tabs', 'accordion', 'dropdown', 'custom'
    ];

    res.json({
      success: true,
      data: types
    });
  });

  // Get gallery statistics
  app.get('/api/stats', async (req: Request, res: Response) => {
    try {
      const stats = await db.getStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Failed to get stats', { error });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Search components by query
  app.get('/api/search', async (req: Request, res: Response) => {
    try {
      const { q, type, tags, limit = 20 } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          error: 'Query parameter is required'
        });
      }

      logger.info('Searching components', { query: q });

      // In a real implementation, this would use full-text search
      const allComponents = await db.searchComponents({
        type: type as string,
        tags: tags ? (tags as string).split(',') : undefined
      });

      // Simple text matching
      const query = (q as string).toLowerCase();
      const matching = allComponents.filter(component => 
        component.type.includes(query) ||
        component.metadata.tags.some(tag => tag.includes(query)) ||
        component.metadata.description?.toLowerCase().includes(query)
      );

      res.json({
        success: true,
        data: {
          query: q,
          total: matching.length,
          components: matching.slice(0, parseInt(limit as string))
        }
      });
    } catch (error: any) {
      logger.error('Failed to search', { error });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get similar components
  app.get('/api/components/:id/similar', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { limit = 5 } = req.query;
      
      const component = await db.getComponent(id);
      
      if (!component) {
        return res.status(404).json({
          success: false,
          error: 'Component not found'
        });
      }

      // Find similar components based on type and tags
      const similar = await db.searchComponents({
        type: component.type,
        tags: component.metadata.tags.slice(0, 3)
      });

      // Remove the original component and limit results
      const filtered = similar
        .filter(c => c.id !== id)
        .slice(0, parseInt(limit as string));

      res.json({
        success: true,
        data: filtered
      });
    } catch (error: any) {
      logger.error('Failed to get similar components', { error });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Error handling middleware
  app.use((err: any, req: Request, res: Response, next: any) => {
    logger.error('Unhandled error', { error: err });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  });

  const start = async () => {
    await db.connect();
    await db.createTables();
    
    return new Promise<void>((resolve) => {
      server = app.listen(config.port, () => {
        logger.info(`Gallery API started on port ${config.port}`);
        resolve();
      });
    });
  };

  const stop = async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => {
          logger.info('Gallery API stopped');
          resolve();
        });
      });
    }
    
    await db.disconnect();
  };

  return { app, start, stop };
}