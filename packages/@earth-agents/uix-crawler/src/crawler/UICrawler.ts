import { Logger } from '@earth-agents/core';
import { v4 as uuidv4 } from 'uuid';
import { ComponentExtractor } from './ComponentExtractor';
import { ScreenshotCapture } from './ScreenshotCapture';
import { MetadataCollector } from './MetadataCollector';
import { DesignPatternAnalyzer } from '../analyzers/DesignPatternAnalyzer';
import { ColorSchemeExtractor } from '../analyzers/ColorSchemeExtractor';
import { TypographyAnalyzer } from '../analyzers/TypographyAnalyzer';
import { LayoutAnalyzer } from '../analyzers/LayoutAnalyzer';
import { DatabaseManager } from '../storage/DatabaseManager';
import { ImageStorage } from '../storage/ImageStorage';
import {
  CrawlerConfig,
  CrawlOptions,
  CrawlResult,
  Website,
  UIComponent,
  CrawlMetadata,
  CrawlError
} from '../types';

export class UIXCrawler {
  private logger: Logger;
  private screenshotCapture: ScreenshotCapture;
  private componentExtractor: ComponentExtractor;
  private metadataCollector: MetadataCollector;
  private patternAnalyzer: DesignPatternAnalyzer;
  private colorExtractor: ColorSchemeExtractor;
  private typographyAnalyzer: TypographyAnalyzer;
  private layoutAnalyzer: LayoutAnalyzer;
  private db: DatabaseManager;
  private imageStorage: ImageStorage;

  constructor(private config: CrawlerConfig) {
    this.logger = new Logger('UIXCrawler');
    this.screenshotCapture = new ScreenshotCapture();
    this.componentExtractor = new ComponentExtractor();
    this.metadataCollector = new MetadataCollector();
    this.patternAnalyzer = new DesignPatternAnalyzer();
    this.colorExtractor = new ColorSchemeExtractor();
    this.typographyAnalyzer = new TypographyAnalyzer();
    this.layoutAnalyzer = new LayoutAnalyzer();
    this.db = new DatabaseManager(config.storage.database);
    this.imageStorage = new ImageStorage(config.storage.images);
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing UIX Crawler...');
    await this.db.connect();
    await this.imageStorage.initialize();
    await this.screenshotCapture.initialize();
    this.logger.info('UIX Crawler initialized successfully');
  }

  async crawlWebsite(url: string, options: CrawlOptions = {}): Promise<CrawlResult> {
    const startTime = Date.now();
    const errors: CrawlError[] = [];
    
    this.logger.info(`Starting crawl of ${url}`, { options });

    try {
      // Collect website metadata
      const website = await this.createWebsiteRecord(url);
      
      // Take screenshots at different viewports
      const screenshots = await this.captureScreenshots(url, options.viewports);
      
      // Extract UI components
      const components = await this.extractComponents(url, website.id, options);
      
      // Analyze design patterns
      const patterns = options.patterns 
        ? await this.analyzePatterns(components, options.patterns)
        : [];
      
      // Extract design tokens
      const designTokens = await this.extractDesignTokens(url, components);
      
      // Save to database
      await this.saveResults(website, components, patterns, designTokens);
      
      const metadata: CrawlMetadata = {
        duration: Date.now() - startTime,
        pagesVisited: 1, // Will be expanded for multi-page crawling
        componentsFound: components.length,
        errors,
        timestamp: new Date()
      };

      return {
        website,
        components,
        designTokens,
        patterns,
        metadata
      };
    } catch (error) {
      this.logger.error('Crawl failed', { url, error });
      throw error;
    } finally {
      await this.screenshotCapture.cleanup();
    }
  }

  async extractComponent(url: string, selector: string): Promise<UIComponent> {
    this.logger.info(`Extracting component ${selector} from ${url}`);
    
    const websiteId = uuidv4(); // In production, look up existing website
    const component = await this.componentExtractor.extractSingle(
      url,
      selector,
      websiteId
    );
    
    // Analyze the component
    if (this.config.analysis.extractColors) {
      component.designTokens = {
        ...component.designTokens,
        colors: await this.colorExtractor.extractFromComponent(component)
      };
    }
    
    if (this.config.analysis.checkAccessibility) {
      component.accessibilityScore = await this.checkAccessibility(component);
    }
    
    // Store the component
    await this.db.saveComponent(component);
    
    return component;
  }

  async generateComponentCode(
    component: UIComponent,
    options: { framework: string; typescript: boolean; styling: string }
  ): Promise<string> {
    // Integration with Sketchie
    const { createSketchie } = await import('@earth-agents/sketchie');
    const sketchie = createSketchie({ framework: options.framework as any });
    
    await sketchie.initialize();
    
    const code = await sketchie.generateComponent(
      {
        type: 'html',
        source: component.html,
        metadata: {
          css: component.css,
          designTokens: component.designTokens
        }
      },
      {
        framework: options.framework as any,
        styling: options.styling as any,
        typescript: options.typescript,
        testing: false,
        storybook: false,
        accessibility: true
      }
    );
    
    return code.code;
  }

  private async createWebsiteRecord(url: string): Promise<Website> {
    const metadata = await this.metadataCollector.collectWebsiteMetadata(url);
    
    const website: Website = {
      id: uuidv4(),
      url,
      name: metadata.name || new URL(url).hostname,
      designer: metadata.designer,
      awards: metadata.awards,
      technologyStack: metadata.technologyStack,
      crawledAt: new Date()
    };
    
    return website;
  }

  private async captureScreenshots(url: string, viewports?: string[]) {
    const viewportList = viewports || ['desktop', 'tablet', 'mobile'];
    const screenshots = [];
    
    for (const viewport of viewportList) {
      const screenshot = await this.screenshotCapture.capture(url, viewport as any);
      const uploadedUrl = await this.imageStorage.upload(screenshot, `${viewport}-full`);
      screenshots.push({ viewport, url: uploadedUrl });
    }
    
    return screenshots;
  }

  private async extractComponents(
    url: string,
    websiteId: string,
    options: CrawlOptions
  ): Promise<UIComponent[]> {
    const components = await this.componentExtractor.extractAll(url, websiteId, {
      patterns: options.patterns,
      captureInteractions: options.captureInteractions
    });
    
    // Upload component screenshots
    for (const component of components) {
      if (component.screenshotUrl.startsWith('data:')) {
        const uploadedUrl = await this.imageStorage.upload(
          component.screenshotUrl,
          `component-${component.id}`
        );
        component.screenshotUrl = uploadedUrl;
      }
      
      // Upload interaction screenshots
      if (component.interactions) {
        for (const interaction of component.interactions) {
          if (interaction.screenshotUrl.startsWith('data:')) {
            const uploadedUrl = await this.imageStorage.upload(
              interaction.screenshotUrl,
              `interaction-${component.id}-${interaction.type}`
            );
            interaction.screenshotUrl = uploadedUrl;
          }
        }
      }
    }
    
    return components;
  }

  private async analyzePatterns(components: UIComponent[], targetPatterns: string[]) {
    const patterns = [];
    
    for (const patternType of targetPatterns) {
      const matchingComponents = components.filter(c => c.type === patternType);
      if (matchingComponents.length > 0) {
        const pattern = await this.patternAnalyzer.analyzePattern(
          patternType as any,
          matchingComponents
        );
        patterns.push(pattern);
      }
    }
    
    return patterns;
  }

  private async extractDesignTokens(url: string, components: UIComponent[]) {
    const [colors, typography, layout] = await Promise.all([
      this.config.analysis.extractColors 
        ? this.colorExtractor.extractFromPage(url)
        : null,
      this.config.analysis.extractTypography
        ? this.typographyAnalyzer.analyzePage(url)
        : null,
      this.layoutAnalyzer.analyzePage(url)
    ]);
    
    return {
      colors: colors || {} as any,
      typography: typography || {} as any,
      spacing: layout?.spacing || {} as any,
      shadows: layout?.shadows || {} as any,
      borders: layout?.borders || {} as any,
      animations: {} as any // TODO: Implement animation extraction
    };
  }

  private async checkAccessibility(component: UIComponent): Promise<number> {
    // TODO: Implement actual accessibility checking
    // For now, return a mock score
    return Math.random() * 100;
  }

  private async saveResults(
    website: Website,
    components: UIComponent[],
    patterns: any[],
    designTokens: any
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.saveWebsite(website);
      
      for (const component of components) {
        await tx.saveComponent(component);
      }
      
      for (const pattern of patterns) {
        await tx.savePattern(pattern);
      }
      
      await tx.saveDesignTokens(website.id, designTokens);
    });
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down UIX Crawler...');
    await this.screenshotCapture.shutdown();
    await this.db.disconnect();
    this.logger.info('UIX Crawler shut down successfully');
  }
}