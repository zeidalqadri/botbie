import { Page } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import { UIComponent, ComponentType, InteractionState, ComponentMetadata } from '../types';
import { Logger } from '@earth-agents/core';

export class ComponentExtractor {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ComponentExtractor');
  }

  async extractAll(
    url: string,
    websiteId: string,
    options: {
      patterns?: ComponentType[];
      captureInteractions?: boolean;
    }
  ): Promise<UIComponent[]> {
    const { page } = await this.createPage(url);
    const components: UIComponent[] = [];

    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Component selectors map
      const componentSelectors: Record<ComponentType, string[]> = {
        navigation: ['nav', 'header nav', '[role="navigation"]', '.navigation', '.navbar'],
        hero: ['section.hero', '.hero-section', 'header.hero', '[class*="hero"]', 'section:first-of-type'],
        card: ['.card', '[class*="card"]', 'article.card', '.product-card', '.content-card'],
        form: ['form', '.form-container', '[class*="form"]'],
        button: ['button', 'a.button', '.btn', '[role="button"]'],
        modal: ['.modal', '[role="dialog"]', '.dialog', '[class*="modal"]'],
        footer: ['footer', '.footer', '[role="contentinfo"]'],
        sidebar: ['aside', '.sidebar', '[role="complementary"]', '[class*="sidebar"]'],
        table: ['table', '.data-table', '[role="table"]'],
        list: ['ul.list', 'ol.list', '.list-container', '[role="list"]'],
        carousel: ['.carousel', '.slider', '[class*="carousel"]', '[class*="slider"]'],
        tabs: ['.tabs', '[role="tablist"]', '[class*="tabs"]'],
        accordion: ['.accordion', '[class*="accordion"]', '.collapse'],
        dropdown: ['select', '.dropdown', '[class*="dropdown"]', '.select'],
        custom: [] // Will be handled separately
      };

      const targetPatterns = options.patterns || Object.keys(componentSelectors) as ComponentType[];

      for (const type of targetPatterns) {
        if (type === 'custom') continue;
        
        const selectors = componentSelectors[type];
        for (const selector of selectors) {
          try {
            const elements = await page.$$(selector);
            
            for (const element of elements.slice(0, 3)) { // Limit per selector
              const component = await this.extractComponent(
                page,
                element,
                type,
                websiteId,
                options.captureInteractions
              );
              
              if (component) {
                components.push(component);
              }
            }
          } catch (error) {
            this.logger.warn(`Failed to extract ${type} with selector ${selector}`, { error });
          }
        }
      }

      this.logger.info(`Extracted ${components.length} components from ${url}`);
      return components;
    } finally {
      await page.close();
    }
  }

  async extractSingle(
    url: string,
    selector: string,
    websiteId: string
  ): Promise<UIComponent> {
    const { page } = await this.createPage(url);

    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      
      const element = await page.$(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }

      const component = await this.extractComponent(
        page,
        element,
        'custom',
        websiteId,
        true
      );

      if (!component) {
        throw new Error(`Failed to extract component: ${selector}`);
      }

      return component;
    } finally {
      await page.close();
    }
  }

  private async extractComponent(
    page: Page,
    element: any,
    type: ComponentType,
    websiteId: string,
    captureInteractions: boolean = false
  ): Promise<UIComponent | null> {
    try {
      const boundingBox = await element.boundingBox();
      if (!boundingBox || boundingBox.width < 50 || boundingBox.height < 20) {
        return null; // Skip tiny elements
      }

      // Generate unique selector
      const selector = await page.evaluate((el) => {
        const getSelector = (element: Element): string => {
          if (element.id) return `#${element.id}`;
          if (element.className && typeof element.className === 'string') {
            const classes = element.className.split(' ').filter(c => c);
            if (classes.length) return `.${classes.join('.')}`;
          }
          const parent = element.parentElement;
          if (!parent) return element.tagName.toLowerCase();
          const siblings = Array.from(parent.children);
          const index = siblings.indexOf(element) + 1;
          return `${getSelector(parent)} > ${element.tagName.toLowerCase()}:nth-child(${index})`;
        };
        return getSelector(el);
      }, element);

      // Extract HTML
      const html = await page.evaluate(el => el.outerHTML, element);

      // Extract computed styles
      const css = await page.evaluate(el => {
        const styles = window.getComputedStyle(el);
        const important = [
          'display', 'position', 'width', 'height', 'padding', 'margin',
          'background', 'border', 'color', 'font', 'text', 'flex', 'grid'
        ];
        
        const extracted: Record<string, string> = {};
        for (const prop of important) {
          const keys = Array.from(styles).filter(k => k.startsWith(prop));
          keys.forEach(key => {
            const value = styles.getPropertyValue(key);
            if (value && value !== 'none' && value !== 'auto') {
              extracted[key] = value;
            }
          });
        }
        return extracted;
      }, element);

      // Capture screenshot
      const screenshotBuffer = await element.screenshot();
      const screenshotUrl = `data:image/png;base64,${screenshotBuffer.toString('base64')}`;

      // Capture interaction states
      const interactions: InteractionState[] = [{
        type: 'default',
        screenshotUrl,
        css: JSON.stringify(css)
      }];

      if (captureInteractions) {
        // Hover state
        try {
          await element.hover();
          await page.waitForTimeout(100);
          const hoverScreenshot = await element.screenshot();
          const hoverCss = await page.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return Object.fromEntries(
              Array.from(styles).map(key => [key, styles.getPropertyValue(key)])
            );
          }, element);
          
          interactions.push({
            type: 'hover',
            screenshotUrl: `data:image/png;base64,${hoverScreenshot.toString('base64')}`,
            css: JSON.stringify(hoverCss)
          });
        } catch (e) {
          // Some elements can't be hovered
        }

        // Focus state (for focusable elements)
        if (['button', 'input', 'select', 'textarea', 'a'].includes(await element.evaluate(el => el.tagName.toLowerCase()))) {
          try {
            await element.focus();
            await page.waitForTimeout(100);
            const focusScreenshot = await element.screenshot();
            const focusCss = await page.evaluate(el => {
              const styles = window.getComputedStyle(el);
              return Object.fromEntries(
                Array.from(styles).map(key => [key, styles.getPropertyValue(key)])
              );
            }, element);
            
            interactions.push({
              type: 'focus',
              screenshotUrl: `data:image/png;base64,${focusScreenshot.toString('base64')}`,
              css: JSON.stringify(focusCss)
            });
          } catch (e) {
            // Some elements can't be focused
          }
        }
      }

      // Extract metadata
      const metadata: ComponentMetadata = {
        tags: await this.extractTags(element, type),
        usage: await this.extractUsage(element, type),
        relatedPatterns: await this.extractRelatedPatterns(html, type)
      };

      return {
        id: uuidv4(),
        websiteId,
        type,
        selector,
        screenshotUrl,
        html,
        css: JSON.stringify(css),
        interactions,
        metadata
      };
    } catch (error) {
      this.logger.error('Failed to extract component', { error, type });
      return null;
    }
  }

  private async createPage(url: string) {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });
    const page = await context.newPage();
    
    return { browser, page };
  }

  private async extractTags(element: any, type: ComponentType): Promise<string[]> {
    const tags = [type];
    
    // Add semantic tags based on element attributes
    const attributes = await element.evaluate((el: Element) => ({
      role: el.getAttribute('role'),
      ariaLabel: el.getAttribute('aria-label'),
      dataTestId: el.getAttribute('data-testid'),
      className: el.className
    }));

    if (attributes.role) tags.push(`role:${attributes.role}`);
    if (attributes.ariaLabel) tags.push('accessible');
    if (attributes.className && attributes.className.includes('dark')) tags.push('dark-mode');
    
    return tags;
  }

  private async extractUsage(element: any, type: ComponentType): Promise<string[]> {
    const usage: string[] = [];
    
    // Component-specific usage patterns
    switch (type) {
      case 'navigation':
        usage.push('site-navigation', 'header-menu', 'main-menu');
        break;
      case 'card':
        usage.push('content-display', 'product-showcase', 'feature-highlight');
        break;
      case 'form':
        usage.push('user-input', 'data-collection', 'contact-form');
        break;
      case 'button':
        usage.push('user-action', 'cta', 'form-submit');
        break;
      case 'modal':
        usage.push('overlay', 'dialog', 'popup');
        break;
      default:
        usage.push('general-ui');
    }
    
    return usage;
  }

  private async extractRelatedPatterns(html: string, type: ComponentType): Promise<string[]> {
    const patterns: string[] = [];
    
    // Analyze HTML structure to find related patterns
    if (html.includes('button') && type !== 'button') patterns.push('button');
    if (html.includes('form') && type !== 'form') patterns.push('form');
    if (html.includes('input')) patterns.push('form-input');
    if (html.includes('img') || html.includes('picture')) patterns.push('image');
    if (html.includes('svg')) patterns.push('icon');
    
    return patterns.filter(p => p !== type);
  }
}