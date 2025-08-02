import { Page } from 'playwright';
import { Logger } from '@earth-agents/core';

export interface WebsiteMetadata {
  name?: string;
  description?: string;
  designer?: string;
  awards?: string[];
  technologyStack?: string[];
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
  };
  twitter?: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
  };
  schema?: any;
}

export class MetadataCollector {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('MetadataCollector');
  }

  async collectWebsiteMetadata(url: string): Promise<WebsiteMetadata> {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      const metadata: WebsiteMetadata = {};

      // Basic metadata
      metadata.name = await this.extractTitle(page);
      metadata.description = await this.extractDescription(page);
      
      // Open Graph metadata
      metadata.openGraph = await this.extractOpenGraph(page);
      
      // Twitter Card metadata
      metadata.twitter = await this.extractTwitterCard(page);
      
      // Schema.org structured data
      metadata.schema = await this.extractSchema(page);
      
      // Technology stack detection
      metadata.technologyStack = await this.detectTechnologyStack(page);
      
      // Awards detection (from known award sites)
      metadata.awards = await this.detectAwards(url, page);
      
      // Designer/Agency detection
      metadata.designer = await this.detectDesigner(page);

      this.logger.info('Collected website metadata', { url, metadata });
      return metadata;
    } catch (error) {
      this.logger.error('Failed to collect metadata', { url, error });
      return {};
    } finally {
      await browser.close();
    }
  }

  private async extractTitle(page: Page): Promise<string | undefined> {
    return await page.evaluate(() => {
      return document.title || 
             document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
             document.querySelector('h1')?.textContent?.trim();
    });
  }

  private async extractDescription(page: Page): Promise<string | undefined> {
    return await page.evaluate(() => {
      return document.querySelector('meta[name="description"]')?.getAttribute('content') ||
             document.querySelector('meta[property="og:description"]')?.getAttribute('content');
    });
  }

  private async extractOpenGraph(page: Page): Promise<any> {
    return await page.evaluate(() => {
      const og: any = {};
      const metaTags = document.querySelectorAll('meta[property^="og:"]');
      
      metaTags.forEach(tag => {
        const property = tag.getAttribute('property')?.replace('og:', '');
        const content = tag.getAttribute('content');
        if (property && content) {
          og[property] = content;
        }
      });
      
      return og;
    });
  }

  private async extractTwitterCard(page: Page): Promise<any> {
    return await page.evaluate(() => {
      const twitter: any = {};
      const metaTags = document.querySelectorAll('meta[name^="twitter:"]');
      
      metaTags.forEach(tag => {
        const name = tag.getAttribute('name')?.replace('twitter:', '');
        const content = tag.getAttribute('content');
        if (name && content) {
          twitter[name] = content;
        }
      });
      
      return twitter;
    });
  }

  private async extractSchema(page: Page): Promise<any> {
    return await page.evaluate(() => {
      const schemas: any[] = [];
      const scriptTags = document.querySelectorAll('script[type="application/ld+json"]');
      
      scriptTags.forEach(script => {
        try {
          const data = JSON.parse(script.textContent || '{}');
          schemas.push(data);
        } catch (e) {
          // Invalid JSON
        }
      });
      
      return schemas;
    });
  }

  private async detectTechnologyStack(page: Page): Promise<string[]> {
    const technologies: string[] = [];

    // Check for common frameworks and libraries
    const detections = await page.evaluate(() => {
      const detected: string[] = [];
      
      // React
      if ((window as any).React || document.querySelector('[data-reactroot]')) {
        detected.push('React');
      }
      
      // Vue
      if ((window as any).Vue || document.querySelector('#app[data-v-]')) {
        detected.push('Vue.js');
      }
      
      // Angular
      if ((window as any).ng || document.querySelector('[ng-version]')) {
        detected.push('Angular');
      }
      
      // Next.js
      if (document.querySelector('#__next')) {
        detected.push('Next.js');
      }
      
      // Gatsby
      if (document.querySelector('#___gatsby')) {
        detected.push('Gatsby');
      }
      
      // WordPress
      if (document.querySelector('meta[name="generator"][content*="WordPress"]')) {
        detected.push('WordPress');
      }
      
      // Shopify
      if ((window as any).Shopify) {
        detected.push('Shopify');
      }
      
      // Check CSS frameworks
      const stylesheets = Array.from(document.styleSheets);
      const cssText = stylesheets.map(sheet => {
        try {
          return Array.from(sheet.cssRules || []).map(rule => rule.cssText).join(' ');
        } catch (e) {
          return '';
        }
      }).join(' ');
      
      if (cssText.includes('tailwind') || document.querySelector('[class*="tw-"]')) {
        detected.push('Tailwind CSS');
      }
      
      if (cssText.includes('bootstrap') || document.querySelector('[class*="col-md-"]')) {
        detected.push('Bootstrap');
      }
      
      return detected;
    });

    technologies.push(...detections);

    // Check response headers for server technology
    const response = await page.evaluate(() => fetch(window.location.href));
    if (response) {
      // Note: Some headers might not be accessible due to CORS
      technologies.push('JavaScript'); // Default for all modern sites
    }

    return [...new Set(technologies)]; // Remove duplicates
  }

  private async detectAwards(url: string, page: Page): Promise<string[]> {
    const awards: string[] = [];
    const domain = new URL(url).hostname;

    // Check for common award badges
    const awardIndicators = await page.evaluate(() => {
      const found: string[] = [];
      
      // Awwwards
      if (document.querySelector('a[href*="awwwards.com"]') || 
          document.querySelector('img[src*="awwwards"]')) {
        found.push('Awwwards');
      }
      
      // CSS Design Awards
      if (document.querySelector('a[href*="cssdesignawards.com"]') ||
          document.querySelector('img[src*="cssda"]')) {
        found.push('CSS Design Awards');
      }
      
      // FWA
      if (document.querySelector('a[href*="thefwa.com"]') ||
          document.querySelector('img[src*="fwa"]')) {
        found.push('FWA');
      }
      
      // Webby Awards
      if (document.querySelector('a[href*="webbyawards.com"]') ||
          document.querySelector('img[src*="webby"]')) {
        found.push('Webby Awards');
      }
      
      return found;
    });

    awards.push(...awardIndicators);

    // You could also check external APIs or databases for awards
    // For now, we'll just return what we found on the page

    return awards;
  }

  private async detectDesigner(page: Page): Promise<string | undefined> {
    // Look for designer/agency information
    const designer = await page.evaluate(() => {
      // Check meta tags
      const authorMeta = document.querySelector('meta[name="author"]')?.getAttribute('content');
      if (authorMeta) return authorMeta;
      
      // Check schema.org
      const schemas = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      for (const schema of schemas) {
        try {
          const data = JSON.parse(schema.textContent || '{}');
          if (data.author?.name) return data.author.name;
          if (data.creator?.name) return data.creator.name;
        } catch (e) {
          // Invalid JSON
        }
      }
      
      // Check footer for "Designed by" or "Created by"
      const footer = document.querySelector('footer');
      if (footer) {
        const text = footer.textContent || '';
        const designedByMatch = text.match(/(?:designed|created|built)\s+by\s+([^.]+)/i);
        if (designedByMatch) {
          return designedByMatch[1].trim();
        }
      }
      
      // Check humans.txt reference
      const humansTxt = document.querySelector('link[type="text/plain"][rel="author"]');
      if (humansTxt) {
        return 'See humans.txt';
      }
      
      return undefined;
    });

    return designer;
  }

  async collectComponentMetadata(page: Page, selector: string): Promise<any> {
    return await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return null;

      return {
        semanticRole: element.getAttribute('role'),
        ariaLabel: element.getAttribute('aria-label'),
        dataAttributes: Array.from(element.attributes)
          .filter(attr => attr.name.startsWith('data-'))
          .reduce((acc, attr) => ({ ...acc, [attr.name]: attr.value }), {}),
        microdata: {
          itemtype: element.getAttribute('itemtype'),
          itemprop: element.getAttribute('itemprop'),
          itemscope: element.hasAttribute('itemscope')
        }
      };
    }, selector);
  }
}