import { Page, Browser, BrowserContext } from 'playwright';
import { Logger } from '@earth-agents/core';
import { Viewport, ViewportConfig } from '../types';

export class ScreenshotCapture {
  private logger: Logger;
  private browser: Browser | null = null;
  private contexts: Map<string, BrowserContext> = new Map();

  constructor() {
    this.logger = new Logger('ScreenshotCapture');
  }

  async initialize(): Promise<void> {
    const { chromium } = await import('playwright');
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.logger.info('Screenshot capture initialized');
  }

  async capture(url: string, viewport: Viewport = 'desktop'): Promise<string> {
    if (!this.browser) {
      throw new Error('ScreenshotCapture not initialized. Call initialize() first.');
    }

    const viewportConfig = this.getViewportConfig(viewport);
    const context = await this.getContext(viewport, viewportConfig);
    const page = await context.newPage();

    try {
      this.logger.info(`Capturing screenshot for ${url} at ${viewport} viewport`);
      
      // Navigate to page
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Wait for animations to complete
      await page.waitForTimeout(1000);

      // Remove cookie banners and popups if present
      await this.removeCookieBanners(page);

      // Capture full page screenshot
      const screenshot = await page.screenshot({
        fullPage: true,
        type: 'png',
        animations: 'disabled'
      });

      // Convert to base64
      return `data:image/png;base64,${screenshot.toString('base64')}`;
    } catch (error) {
      this.logger.error('Screenshot capture failed', { url, viewport, error });
      throw error;
    } finally {
      await page.close();
    }
  }

  async captureElement(
    url: string,
    selector: string,
    viewport: Viewport = 'desktop'
  ): Promise<string> {
    if (!this.browser) {
      throw new Error('ScreenshotCapture not initialized. Call initialize() first.');
    }

    const viewportConfig = this.getViewportConfig(viewport);
    const context = await this.getContext(viewport, viewportConfig);
    const page = await context.newPage();

    try {
      this.logger.info(`Capturing element ${selector} from ${url}`);
      
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Wait for element
      const element = await page.waitForSelector(selector, { timeout: 10000 });
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }

      // Scroll element into view
      await element.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Capture element screenshot
      const screenshot = await element.screenshot({
        type: 'png',
        animations: 'disabled'
      });

      return `data:image/png;base64,${screenshot.toString('base64')}`;
    } catch (error) {
      this.logger.error('Element screenshot capture failed', { url, selector, error });
      throw error;
    } finally {
      await page.close();
    }
  }

  async captureInteractions(
    url: string,
    selector: string,
    viewport: Viewport = 'desktop'
  ): Promise<Record<string, string>> {
    if (!this.browser) {
      throw new Error('ScreenshotCapture not initialized. Call initialize() first.');
    }

    const viewportConfig = this.getViewportConfig(viewport);
    const context = await this.getContext(viewport, viewportConfig);
    const page = await context.newPage();
    const screenshots: Record<string, string> = {};

    try {
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      const element = await page.waitForSelector(selector, { timeout: 10000 });
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }

      // Default state
      await element.scrollIntoViewIfNeeded();
      const defaultScreenshot = await element.screenshot({ type: 'png' });
      screenshots.default = `data:image/png;base64,${defaultScreenshot.toString('base64')}`;

      // Hover state
      try {
        await element.hover();
        await page.waitForTimeout(300);
        const hoverScreenshot = await element.screenshot({ type: 'png' });
        screenshots.hover = `data:image/png;base64,${hoverScreenshot.toString('base64')}`;
      } catch (e) {
        this.logger.debug('Could not capture hover state', { selector });
      }

      // Focus state (for focusable elements)
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      if (['button', 'input', 'select', 'textarea', 'a'].includes(tagName)) {
        try {
          await element.focus();
          await page.waitForTimeout(300);
          const focusScreenshot = await element.screenshot({ type: 'png' });
          screenshots.focus = `data:image/png;base64,${focusScreenshot.toString('base64')}`;
        } catch (e) {
          this.logger.debug('Could not capture focus state', { selector });
        }
      }

      // Active/clicked state
      if (['button', 'a'].includes(tagName)) {
        try {
          await page.evaluate(el => {
            el.classList.add('active');
            el.setAttribute('aria-pressed', 'true');
          }, element);
          await page.waitForTimeout(300);
          const activeScreenshot = await element.screenshot({ type: 'png' });
          screenshots.active = `data:image/png;base64,${activeScreenshot.toString('base64')}`;
        } catch (e) {
          this.logger.debug('Could not capture active state', { selector });
        }
      }

      return screenshots;
    } catch (error) {
      this.logger.error('Interaction screenshots capture failed', { url, selector, error });
      throw error;
    } finally {
      await page.close();
    }
  }

  private getViewportConfig(viewport: Viewport): ViewportConfig {
    const configs: Record<Viewport, ViewportConfig> = {
      mobile: {
        width: 375,
        height: 812,
        deviceScaleFactor: 3,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      },
      tablet: {
        width: 768,
        height: 1024,
        deviceScaleFactor: 2,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      },
      desktop: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      wide: {
        width: 2560,
        height: 1440,
        deviceScaleFactor: 1,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    };

    return configs[viewport];
  }

  private async getContext(viewport: string, config: ViewportConfig): Promise<BrowserContext> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    if (this.contexts.has(viewport)) {
      return this.contexts.get(viewport)!;
    }

    const context = await this.browser.newContext({
      viewport: {
        width: config.width,
        height: config.height
      },
      deviceScaleFactor: config.deviceScaleFactor,
      userAgent: config.userAgent
    });

    this.contexts.set(viewport, context);
    return context;
  }

  private async removeCookieBanners(page: Page): Promise<void> {
    // Common cookie banner selectors
    const cookieSelectors = [
      '[id*="cookie"]',
      '[class*="cookie"]',
      '[id*="consent"]',
      '[class*="consent"]',
      '[id*="gdpr"]',
      '[class*="gdpr"]',
      '[id*="privacy"]',
      '[class*="privacy-banner"]',
      'button:has-text("Accept")',
      'button:has-text("Accept all")',
      'button:has-text("I agree")'
    ];

    for (const selector of cookieSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const isVisible = await element.isVisible();
          if (isVisible) {
            // Try to find and click accept button
            const acceptButton = await page.$(`${selector} button:has-text("Accept")`);
            if (acceptButton) {
              await acceptButton.click();
            } else {
              // Hide the banner
              await page.evaluate(el => {
                el.style.display = 'none';
              }, element);
            }
            this.logger.debug('Removed cookie banner');
            break;
          }
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }
  }

  async cleanup(): Promise<void> {
    for (const context of this.contexts.values()) {
      await context.close();
    }
    this.contexts.clear();
  }

  async shutdown(): Promise<void> {
    await this.cleanup();
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.logger.info('Screenshot capture shut down');
  }
}