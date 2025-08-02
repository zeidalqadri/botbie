import express, { Request, Response, Application } from 'express';
import cors from 'cors';
import { Logger } from '@earth-agents/core';
import { UIXCrawler } from '../crawler/UICrawler';
import { CrawlerConfig, CrawlOptions } from '../types';

export interface CrawlerAPIConfig {
  port: number;
  corsOrigin?: string;
  crawlerConfig: CrawlerConfig;
}

export function createCrawlerAPI(config: CrawlerAPIConfig): {
  app: Application;
  start: () => Promise<void>;
  stop: () => Promise<void>;
} {
  const logger = new Logger('CrawlerAPI');
  const app = express();
  const crawler = new UIXCrawler(config.crawlerConfig);
  let server: any;

  // Middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(cors({
    origin: config.corsOrigin || '*',
    credentials: true
  }));

  // Health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'healthy', service: 'uix-crawler' });
  });

  // Crawl a website
  app.post('/api/crawl', async (req: Request, res: Response) => {
    try {
      const { url, options } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      logger.info('Starting crawl', { url, options });
      
      const result = await crawler.crawlWebsite(url, options as CrawlOptions);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Crawl failed', { error });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Extract a specific component
  app.post('/api/extract-component', async (req: Request, res: Response) => {
    try {
      const { url, selector } = req.body;
      
      if (!url || !selector) {
        return res.status(400).json({ error: 'URL and selector are required' });
      }

      logger.info('Extracting component', { url, selector });
      
      const component = await crawler.extractComponent(url, selector);
      
      res.json({
        success: true,
        data: component
      });
    } catch (error: any) {
      logger.error('Component extraction failed', { error });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Generate code for a component
  app.post('/api/components/:id/code', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { framework, typescript, styling } = req.body;
      
      // In a real implementation, fetch component from database
      // For now, we'll need the component data in the request
      const { component } = req.body;
      
      if (!component) {
        return res.status(400).json({ error: 'Component data is required' });
      }

      logger.info('Generating code', { componentId: id, framework, typescript, styling });
      
      const code = await crawler.generateComponentCode(component, {
        framework: framework || 'react',
        typescript: typescript !== false,
        styling: styling || 'tailwind'
      });
      
      res.json({
        success: true,
        data: {
          code,
          framework,
          typescript,
          styling
        }
      });
    } catch (error: any) {
      logger.error('Code generation failed', { error });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Analyze a website's design patterns
  app.post('/api/analyze', async (req: Request, res: Response) => {
    try {
      const { url, patterns } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      logger.info('Analyzing website', { url, patterns });
      
      const result = await crawler.crawlWebsite(url, {
        patterns,
        captureInteractions: false,
        extractTokens: true
      });
      
      res.json({
        success: true,
        data: {
          url,
          patterns: result.patterns,
          designTokens: result.designTokens,
          componentsFound: result.metadata.componentsFound
        }
      });
    } catch (error: any) {
      logger.error('Analysis failed', { error });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Batch crawl multiple websites
  app.post('/api/batch-crawl', async (req: Request, res: Response) => {
    try {
      const { urls, options } = req.body;
      
      if (!urls || !Array.isArray(urls)) {
        return res.status(400).json({ error: 'URLs array is required' });
      }

      logger.info('Starting batch crawl', { count: urls.length });
      
      const results = await Promise.allSettled(
        urls.map(url => crawler.crawlWebsite(url, options))
      );
      
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');
      
      res.json({
        success: true,
        data: {
          total: urls.length,
          successful: successful.length,
          failed: failed.length,
          results: results.map((result, index) => ({
            url: urls[index],
            status: result.status,
            data: result.status === 'fulfilled' ? result.value : null,
            error: result.status === 'rejected' ? result.reason.message : null
          }))
        }
      });
    } catch (error: any) {
      logger.error('Batch crawl failed', { error });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get crawler status
  app.get('/api/status', async (req: Request, res: Response) => {
    try {
      // In a real implementation, this would check active crawls, queue status, etc.
      res.json({
        success: true,
        data: {
          status: 'ready',
          activeCrawls: 0,
          queuedCrawls: 0,
          completedToday: 0
        }
      });
    } catch (error: any) {
      logger.error('Status check failed', { error });
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
    await crawler.initialize();
    
    return new Promise<void>((resolve) => {
      server = app.listen(config.port, () => {
        logger.info(`Crawler API started on port ${config.port}`);
        resolve();
      });
    });
  };

  const stop = async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => {
          logger.info('Crawler API stopped');
          resolve();
        });
      });
    }
    
    await crawler.shutdown();
  };

  return { app, start, stop };
}