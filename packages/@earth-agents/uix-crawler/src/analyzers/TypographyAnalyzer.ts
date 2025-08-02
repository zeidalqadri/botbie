import { Page } from 'playwright';
import { Logger } from '@earth-agents/core';
import { TypographySystem, Font } from '../types';

export class TypographyAnalyzer {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('TypographyAnalyzer');
  }

  async analyzePage(url: string): Promise<TypographySystem> {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Extract typography data
      const typographyData = await page.evaluate(() => {
        const fonts = new Map<string, Set<number>>();
        const sizes = new Set<number>();
        const lineHeights = new Map<string, number>();
        const fontWeights = new Map<string, number>();
        const letterSpacings = new Map<string, number>();
        
        // Get all text elements
        const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button, li, td, th, label, div');
        
        textElements.forEach(element => {
          const styles = window.getComputedStyle(element);
          
          // Font family
          const fontFamily = styles.fontFamily;
          const fontSize = parseFloat(styles.fontSize);
          const fontWeight = parseInt(styles.fontWeight) || 400;
          
          if (fontFamily && fontSize) {
            if (!fonts.has(fontFamily)) {
              fonts.set(fontFamily, new Set());
            }
            fonts.get(fontFamily)!.add(fontWeight);
            sizes.add(fontSize);
            
            // Track line heights by element type
            const tagName = element.tagName.toLowerCase();
            const lineHeight = styles.lineHeight;
            if (lineHeight && lineHeight !== 'normal') {
              const lineHeightValue = parseFloat(lineHeight) / fontSize;
              lineHeights.set(tagName, lineHeightValue);
            }
            
            // Track font weights
            fontWeights.set(`${tagName}-${fontWeight}`, fontWeight);
            
            // Track letter spacing
            const letterSpacing = styles.letterSpacing;
            if (letterSpacing && letterSpacing !== 'normal') {
              letterSpacings.set(tagName, parseFloat(letterSpacing));
            }
          }
        });
        
        // Convert to serializable format
        return {
          fonts: Array.from(fonts.entries()).map(([family, weights]) => ({
            family,
            weights: Array.from(weights).sort((a, b) => a - b)
          })),
          sizes: Array.from(sizes).sort((a, b) => a - b),
          lineHeights: Object.fromEntries(lineHeights),
          fontWeights: Object.fromEntries(
            Array.from(new Set(fontWeights.values()))
              .sort((a, b) => a - b)
              .map(weight => [this.getFontWeightName(weight), weight])
          ),
          letterSpacings: Object.fromEntries(letterSpacings)
        };
      });

      // Process and categorize fonts
      const fontFamilies = await this.processFontFamilies(typographyData.fonts);
      
      // Calculate type scale
      const scale = this.calculateTypeScale(typographyData.sizes);
      
      // Process line heights
      const processedLineHeights = this.processLineHeights(typographyData.lineHeights);
      
      const typography: TypographySystem = {
        fontFamilies,
        scale,
        lineHeights: processedLineHeights,
        fontWeights: typographyData.fontWeights,
        letterSpacing: typographyData.letterSpacings
      };

      this.logger.info(`Analyzed typography for ${url}`, { 
        fontsCount: fontFamilies.length,
        scaleSteps: scale.length 
      });
      
      return typography;
    } catch (error) {
      this.logger.error('Failed to analyze typography', { url, error });
      throw error;
    } finally {
      await browser.close();
    }
  }

  private async processFontFamilies(
    fonts: Array<{ family: string; weights: number[] }>
  ): Promise<Font[]> {
    return fonts.map(({ family, weights }) => {
      const cleanedFamily = this.cleanFontFamily(family);
      const { primary, fallback } = this.parseFontStack(cleanedFamily);
      
      return {
        family: primary,
        fallback,
        category: this.categorizeFont(primary),
        source: this.detectFontSource(primary),
        weights
      };
    }).filter((font, index, self) => 
      // Remove duplicates
      index === self.findIndex(f => f.family === font.family)
    );
  }

  private cleanFontFamily(fontFamily: string): string {
    // Remove quotes and extra spaces
    return fontFamily
      .replace(/["']/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private parseFontStack(fontFamily: string): { primary: string; fallback: string[] } {
    const fonts = fontFamily.split(',').map(f => f.trim());
    return {
      primary: fonts[0],
      fallback: fonts.slice(1)
    };
  }

  private categorizeFont(fontName: string): Font['category'] {
    const lowerName = fontName.toLowerCase();
    
    // Serif fonts
    if (lowerName.includes('serif') && !lowerName.includes('sans')) {
      return 'serif';
    }
    
    // Monospace fonts
    if (lowerName.includes('mono') || lowerName.includes('code') || 
        lowerName.includes('courier') || lowerName.includes('consolas')) {
      return 'monospace';
    }
    
    // Display fonts
    if (lowerName.includes('display') || lowerName.includes('heading') ||
        lowerName.includes('title')) {
      return 'display';
    }
    
    // Default to sans-serif
    return 'sans-serif';
  }

  private detectFontSource(fontName: string): Font['source'] {
    const systemFonts = [
      'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 
      'Verdana', 'Tahoma', 'Trebuchet MS', 'Impact',
      'Comic Sans MS', 'Courier New', 'Lucida Console',
      '-apple-system', 'BlinkMacSystemFont', 'Segoe UI',
      'system-ui', 'sans-serif', 'serif', 'monospace'
    ];
    
    const googleFonts = [
      'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Raleway',
      'Poppins', 'Source Sans Pro', 'Oswald', 'Playfair Display',
      'Merriweather', 'Nunito', 'Ubuntu', 'Quicksand', 'Inter',
      'Work Sans', 'Barlow', 'Oxygen', 'Josefin Sans'
    ];
    
    if (systemFonts.some(font => fontName.includes(font))) {
      return 'system';
    }
    
    if (googleFonts.some(font => fontName.includes(font))) {
      return 'google';
    }
    
    return 'custom';
  }

  private calculateTypeScale(sizes: number[]): number[] {
    // Remove duplicates and sort
    const uniqueSizes = [...new Set(sizes)].sort((a, b) => a - b);
    
    // If we have a good distribution, use it
    if (uniqueSizes.length >= 6 && uniqueSizes.length <= 10) {
      return uniqueSizes;
    }
    
    // Otherwise, create a modular scale
    const baseFontSize = this.findBaseFontSize(uniqueSizes);
    const ratio = 1.25; // Major third scale
    const scale: number[] = [];
    
    // Generate scale steps
    for (let i = -2; i <= 4; i++) {
      scale.push(Math.round(baseFontSize * Math.pow(ratio, i)));
    }
    
    return scale;
  }

  private findBaseFontSize(sizes: number[]): number {
    // Look for common body text sizes (14-18px)
    const bodySizes = sizes.filter(size => size >= 14 && size <= 18);
    
    if (bodySizes.length > 0) {
      // Return the most common body size
      const frequency = new Map<number, number>();
      bodySizes.forEach(size => {
        frequency.set(size, (frequency.get(size) || 0) + 1);
      });
      
      let maxCount = 0;
      let baseSize = 16;
      
      frequency.forEach((count, size) => {
        if (count > maxCount) {
          maxCount = count;
          baseSize = size;
        }
      });
      
      return baseSize;
    }
    
    // Default to 16px
    return 16;
  }

  private processLineHeights(lineHeights: Record<string, number>): Record<string, number> {
    const processed: Record<string, number> = {};
    
    // Standard line height recommendations
    const defaults: Record<string, number> = {
      'h1': 1.2,
      'h2': 1.25,
      'h3': 1.3,
      'h4': 1.35,
      'h5': 1.4,
      'h6': 1.4,
      'p': 1.5,
      'body': 1.5,
      'small': 1.4,
      'button': 1.2,
      'label': 1.3
    };
    
    // Use observed values or defaults
    Object.keys(defaults).forEach(key => {
      processed[key] = lineHeights[key] || defaults[key];
    });
    
    // Add any additional observed line heights
    Object.entries(lineHeights).forEach(([key, value]) => {
      if (!processed[key] && value > 1 && value < 2) {
        processed[key] = Math.round(value * 100) / 100;
      }
    });
    
    return processed;
  }

  private getFontWeightName(weight: number): string {
    const weightNames: Record<number, string> = {
      100: 'thin',
      200: 'extraLight',
      300: 'light',
      400: 'regular',
      500: 'medium',
      600: 'semiBold',
      700: 'bold',
      800: 'extraBold',
      900: 'black'
    };
    
    return weightNames[weight] || `weight${weight}`;
  }

  async compareTypography(
    system1: TypographySystem,
    system2: TypographySystem
  ): Promise<{
    similarity: number;
    differences: string[];
    recommendations: string[];
  }> {
    const differences: string[] = [];
    const recommendations: string[] = [];
    
    // Compare font families
    const fonts1 = new Set(system1.fontFamilies.map(f => f.family));
    const fonts2 = new Set(system2.fontFamilies.map(f => f.family));
    
    const commonFonts = new Set([...fonts1].filter(x => fonts2.has(x)));
    const fontSimilarity = commonFonts.size / Math.max(fonts1.size, fonts2.size);
    
    if (fontSimilarity < 0.5) {
      differences.push('Different font families used');
      recommendations.push('Consider using consistent font families across designs');
    }
    
    // Compare type scales
    const scale1 = new Set(system1.scale);
    const scale2 = new Set(system2.scale);
    const commonSizes = new Set([...scale1].filter(x => scale2.has(x)));
    const scaleSimilarity = commonSizes.size / Math.max(scale1.size, scale2.size);
    
    if (scaleSimilarity < 0.5) {
      differences.push('Different type scales');
      recommendations.push('Establish a consistent modular type scale');
    }
    
    // Compare line heights
    const avgLineHeight1 = this.averageLineHeight(system1.lineHeights);
    const avgLineHeight2 = this.averageLineHeight(system2.lineHeights);
    
    if (Math.abs(avgLineHeight1 - avgLineHeight2) > 0.2) {
      differences.push('Different line height approaches');
      recommendations.push('Maintain consistent line height ratios for better readability');
    }
    
    // Calculate overall similarity
    const similarity = (fontSimilarity + scaleSimilarity) / 2;
    
    return {
      similarity,
      differences,
      recommendations
    };
  }

  private averageLineHeight(lineHeights: Record<string, number>): number {
    const values = Object.values(lineHeights);
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
}