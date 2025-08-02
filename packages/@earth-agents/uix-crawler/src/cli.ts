#!/usr/bin/env node

import { Command } from 'commander';
import { UIXCrawler } from './crawler/UICrawler';
import { createCrawlerAPI } from './api/CrawlerAPI';
import { createGalleryAPI } from './api/GalleryAPI';
import { Logger } from '@earth-agents/core';
import * as fs from 'fs/promises';
import * as path from 'path';

const logger = new Logger('UIXCrawlerCLI');

const program = new Command();

program
  .name('uix-crawler')
  .description('UIX Crawler - Discover and catalog exceptional UI designs')
  .version('1.0.0');

// Crawl command
program
  .command('crawl <url>')
  .description('Crawl a website and extract UI components')
  .option('-d, --depth <number>', 'Crawl depth', '1')
  .option('-p, --patterns <types>', 'Component types to extract (comma-separated)', 'navigation,hero,card,form,button')
  .option('-i, --interactions', 'Capture interaction states', false)
  .option('-o, --output <path>', 'Output directory for results', './crawl-results')
  .option('--config <path>', 'Path to crawler config file')
  .action(async (url, options) => {
    try {
      logger.info('Starting crawl', { url, options });

      // Load config
      let config;
      if (options.config) {
        const configContent = await fs.readFile(options.config, 'utf-8');
        config = JSON.parse(configContent);
      } else {
        config = {
          storage: {
            database: 'file://./uix-database',
            images: 'file://./uix-images'
          },
          analysis: {
            extractPatterns: true,
            extractColors: true,
            extractTypography: true,
            checkAccessibility: true
          }
        };
      }

      const crawler = new UIXCrawler(config);
      await crawler.initialize();

      const result = await crawler.crawlWebsite(url, {
        depth: parseInt(options.depth),
        patterns: options.patterns.split(','),
        captureInteractions: options.interactions,
        extractTokens: true
      });

      // Save results
      const outputDir = options.output;
      await fs.mkdir(outputDir, { recursive: true });

      // Save website info
      await fs.writeFile(
        path.join(outputDir, 'website.json'),
        JSON.stringify(result.website, null, 2)
      );

      // Save components
      await fs.writeFile(
        path.join(outputDir, 'components.json'),
        JSON.stringify(result.components, null, 2)
      );

      // Save design tokens
      await fs.writeFile(
        path.join(outputDir, 'design-tokens.json'),
        JSON.stringify(result.designTokens, null, 2)
      );

      // Save patterns
      await fs.writeFile(
        path.join(outputDir, 'patterns.json'),
        JSON.stringify(result.patterns, null, 2)
      );

      // Save metadata
      await fs.writeFile(
        path.join(outputDir, 'metadata.json'),
        JSON.stringify(result.metadata, null, 2)
      );

      logger.info('Crawl completed successfully', {
        componentsFound: result.components.length,
        patternsIdentified: result.patterns.length,
        outputDir
      });

      await crawler.shutdown();
      process.exit(0);
    } catch (error) {
      logger.error('Crawl failed', { error });
      process.exit(1);
    }
  });

// Extract component command
program
  .command('extract <url> <selector>')
  .description('Extract a specific UI component from a webpage')
  .option('-o, --output <path>', 'Output file for component data', './component.json')
  .option('--code', 'Generate component code', false)
  .option('--framework <name>', 'Framework for code generation', 'react')
  .option('--styling <type>', 'Styling approach', 'tailwind')
  .action(async (url, selector, options) => {
    try {
      logger.info('Extracting component', { url, selector });

      const config = {
        storage: {
          database: 'file://./uix-database',
          images: 'file://./uix-images'
        },
        analysis: {
          extractPatterns: false,
          extractColors: true,
          extractTypography: true,
          checkAccessibility: true
        }
      };

      const crawler = new UIXCrawler(config);
      await crawler.initialize();

      const component = await crawler.extractComponent(url, selector);

      // Save component data
      await fs.writeFile(
        options.output,
        JSON.stringify(component, null, 2)
      );

      logger.info('Component extracted successfully', {
        id: component.id,
        type: component.type,
        output: options.output
      });

      // Generate code if requested
      if (options.code) {
        const code = await crawler.generateComponentCode(component, {
          framework: options.framework,
          typescript: true,
          styling: options.styling
        });

        const codePath = options.output.replace('.json', `.${options.framework}.tsx`);
        await fs.writeFile(codePath, code);
        
        logger.info('Component code generated', { path: codePath });
      }

      await crawler.shutdown();
      process.exit(0);
    } catch (error) {
      logger.error('Extraction failed', { error });
      process.exit(1);
    }
  });

// Start API server command
program
  .command('serve')
  .description('Start the UIX Crawler API server')
  .option('-p, --port <number>', 'API port', '3000')
  .option('--crawler-port <number>', 'Crawler API port', '3001')
  .option('--gallery-port <number>', 'Gallery API port', '3002')
  .option('--cors <origin>', 'CORS origin', '*')
  .option('--db <url>', 'Database URL', 'file://./uix-database')
  .option('--images <path>', 'Image storage path', 'file://./uix-images')
  .action(async (options) => {
    try {
      logger.info('Starting UIX Crawler services...');

      // Start Crawler API
      const crawlerAPI = createCrawlerAPI({
        port: parseInt(options.crawlerPort),
        corsOrigin: options.cors,
        crawlerConfig: {
          storage: {
            database: options.db,
            images: options.images
          },
          analysis: {
            extractPatterns: true,
            extractColors: true,
            extractTypography: true,
            checkAccessibility: true
          }
        }
      });

      // Start Gallery API
      const galleryAPI = createGalleryAPI({
        port: parseInt(options.galleryPort),
        corsOrigin: options.cors,
        databaseUrl: options.db
      });

      await crawlerAPI.start();
      await galleryAPI.start();

      logger.info('Services started', {
        crawlerAPI: `http://localhost:${options.crawlerPort}`,
        galleryAPI: `http://localhost:${options.galleryPort}`
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        logger.info('Shutting down services...');
        await crawlerAPI.stop();
        await galleryAPI.stop();
        process.exit(0);
      });
    } catch (error) {
      logger.error('Failed to start services', { error });
      process.exit(1);
    }
  });

// Analyze command
program
  .command('analyze <url>')
  .description('Analyze a website\'s design system')
  .option('-o, --output <path>', 'Output file for analysis', './analysis.json')
  .action(async (url, options) => {
    try {
      logger.info('Analyzing website', { url });

      const config = {
        storage: {
          database: 'file://./uix-database',
          images: 'file://./uix-images'
        },
        analysis: {
          extractPatterns: true,
          extractColors: true,
          extractTypography: true,
          checkAccessibility: false
        }
      };

      const crawler = new UIXCrawler(config);
      await crawler.initialize();

      const result = await crawler.crawlWebsite(url, {
        depth: 1,
        patterns: ['navigation', 'hero', 'button', 'card'],
        captureInteractions: false,
        extractTokens: true
      });

      const analysis = {
        url,
        timestamp: new Date(),
        designTokens: result.designTokens,
        patterns: result.patterns.map(p => ({
          name: p.name,
          type: p.type,
          commonTraits: p.commonTraits,
          componentsCount: p.components.length
        })),
        summary: {
          totalComponents: result.components.length,
          componentTypes: result.components.reduce((acc, c) => {
            acc[c.type] = (acc[c.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          primaryColors: result.designTokens.colors.primary,
          fontFamilies: result.designTokens.typography.fontFamilies.map(f => f.family),
          spacingBase: result.designTokens.spacing.base
        }
      };

      await fs.writeFile(
        options.output,
        JSON.stringify(analysis, null, 2)
      );

      logger.info('Analysis completed', {
        output: options.output,
        componentsFound: result.components.length
      });

      await crawler.shutdown();
      process.exit(0);
    } catch (error) {
      logger.error('Analysis failed', { error });
      process.exit(1);
    }
  });

// Parse and execute
program.parse(process.argv);