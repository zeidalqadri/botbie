import { Page } from 'playwright';
import { Logger } from '@earth-agents/core';
import { Color, ColorPalette, UIComponent } from '../types';

export class ColorSchemeExtractor {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ColorSchemeExtractor');
  }

  async extractFromPage(url: string): Promise<ColorPalette> {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Extract all colors from computed styles
      const colors = await page.evaluate(() => {
        const colorSet = new Set<string>();
        const elements = document.querySelectorAll('*');
        
        elements.forEach(element => {
          const styles = window.getComputedStyle(element);
          
          // Extract color properties
          const colorProps = [
            'color',
            'background-color',
            'border-color',
            'border-top-color',
            'border-right-color',
            'border-bottom-color',
            'border-left-color',
            'outline-color',
            'text-decoration-color',
            'text-shadow',
            'box-shadow'
          ];
          
          colorProps.forEach(prop => {
            const value = styles.getPropertyValue(prop);
            if (value && value !== 'transparent' && value !== 'none') {
              // Extract colors from complex values like shadows
              const rgbMatches = value.matchAll(/rgba?\([^)]+\)/g);
              for (const match of rgbMatches) {
                colorSet.add(match[0]);
              }
              
              // Also check for hex colors
              const hexMatches = value.matchAll(/#[0-9a-fA-F]{3,8}/g);
              for (const match of hexMatches) {
                colorSet.add(match[0]);
              }
              
              // Add the raw value if it's a simple color
              if (value.startsWith('rgb') || value.startsWith('#')) {
                colorSet.add(value);
              }
            }
          });
        });
        
        return Array.from(colorSet);
      });

      // Convert colors to our Color format
      const processedColors = colors.map(color => this.parseColor(color)).filter(Boolean) as Color[];
      
      // Analyze and categorize colors
      const palette = await this.categorizeColors(processedColors);
      
      this.logger.info(`Extracted ${processedColors.length} colors from ${url}`);
      return palette;
    } catch (error) {
      this.logger.error('Failed to extract colors', { url, error });
      throw error;
    } finally {
      await browser.close();
    }
  }

  async extractFromComponent(component: UIComponent): Promise<Partial<ColorPalette>> {
    const colors: Color[] = [];
    
    // Parse CSS for colors
    try {
      const css = JSON.parse(component.css);
      
      for (const [property, value] of Object.entries(css)) {
        if (typeof value === 'string' && this.isColorProperty(property)) {
          const color = this.parseColor(value);
          if (color) {
            colors.push(color);
          }
        }
      }
    } catch (error) {
      this.logger.warn('Failed to parse component CSS', { componentId: component.id });
    }

    // Extract colors from HTML (inline styles)
    const inlineColors = this.extractInlineColors(component.html);
    colors.push(...inlineColors);

    // Categorize component colors
    const palette = await this.categorizeColors(colors);
    
    return palette;
  }

  private parseColor(colorString: string): Color | null {
    try {
      let hex = '';
      let rgb = { r: 0, g: 0, b: 0 };
      let hsl = { h: 0, s: 0, l: 0 };

      // Parse hex colors
      if (colorString.startsWith('#')) {
        hex = colorString;
        rgb = this.hexToRgb(hex);
        hsl = this.rgbToHsl(rgb);
      }
      // Parse rgb/rgba colors
      else if (colorString.startsWith('rgb')) {
        const matches = colorString.match(/\d+/g);
        if (matches && matches.length >= 3) {
          rgb = {
            r: parseInt(matches[0]),
            g: parseInt(matches[1]),
            b: parseInt(matches[2])
          };
          hex = this.rgbToHex(rgb);
          hsl = this.rgbToHsl(rgb);
        }
      }
      // Parse named colors
      else if (this.isNamedColor(colorString)) {
        // Convert named color to hex using a temporary element
        hex = this.namedColorToHex(colorString);
        rgb = this.hexToRgb(hex);
        hsl = this.rgbToHsl(rgb);
      } else {
        return null;
      }

      // Calculate WCAG contrast ratios
      const wcagContrast = {
        white: this.calculateContrast(rgb, { r: 255, g: 255, b: 255 }),
        black: this.calculateContrast(rgb, { r: 0, g: 0, b: 0 })
      };

      return {
        hex,
        rgb,
        hsl,
        name: this.getColorName(hex),
        wcagContrast
      };
    } catch (error) {
      this.logger.debug('Failed to parse color', { colorString });
      return null;
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  private rgbToHex(rgb: { r: number; g: number; b: number }): string {
    return '#' + [rgb.r, rgb.g, rgb.b]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
  }

  private rgbToHsl(rgb: { r: number; g: number; b: number }): { h: number; s: number; l: number } {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  private calculateContrast(
    rgb1: { r: number; g: number; b: number },
    rgb2: { r: number; g: number; b: number }
  ): number {
    const luminance = (rgb: { r: number; g: number; b: number }) => {
      const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
        val = val / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const l1 = luminance(rgb1);
    const l2 = luminance(rgb2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  private async categorizeColors(colors: Color[]): Promise<ColorPalette> {
    // Remove duplicates
    const uniqueColors = this.deduplicateColors(colors);
    
    // Find primary color (most frequently used)
    const primary = this.findPrimaryColor(uniqueColors);
    
    // Find accent color (most vibrant, different from primary)
    const accent = this.findAccentColor(uniqueColors, primary);
    
    // Categorize remaining colors
    const neutrals = this.findNeutralColors(uniqueColors);
    const secondary = this.findSecondaryColors(uniqueColors, primary, accent, neutrals);
    
    // Find semantic colors
    const semantic = this.findSemanticColors(uniqueColors);

    return {
      primary,
      secondary,
      accent,
      neutrals,
      semantic
    };
  }

  private deduplicateColors(colors: Color[]): Color[] {
    const seen = new Set<string>();
    return colors.filter(color => {
      const key = color.hex;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private findPrimaryColor(colors: Color[]): Color {
    // For now, return the most saturated non-neutral color
    const nonNeutrals = colors.filter(c => c.hsl.s > 20);
    
    if (nonNeutrals.length === 0) {
      return colors[0] || this.createDefaultColor();
    }
    
    // Sort by saturation and pick the most vibrant
    return nonNeutrals.sort((a, b) => b.hsl.s - a.hsl.s)[0];
  }

  private findAccentColor(colors: Color[], primary: Color): Color {
    // Find a color that contrasts with primary
    const candidates = colors.filter(c => 
      c.hex !== primary.hex && 
      c.hsl.s > 30 && 
      Math.abs(c.hsl.h - primary.hsl.h) > 30
    );
    
    if (candidates.length === 0) {
      return primary;
    }
    
    return candidates[0];
  }

  private findNeutralColors(colors: Color[]): Color[] {
    return colors.filter(c => c.hsl.s < 20)
      .sort((a, b) => a.hsl.l - b.hsl.l)
      .slice(0, 5);
  }

  private findSecondaryColors(
    colors: Color[],
    primary: Color,
    accent: Color,
    neutrals: Color[]
  ): Color[] {
    const neutralHexes = new Set(neutrals.map(n => n.hex));
    
    return colors.filter(c => 
      c.hex !== primary.hex && 
      c.hex !== accent.hex && 
      !neutralHexes.has(c.hex) &&
      c.hsl.s > 20
    ).slice(0, 3);
  }

  private findSemanticColors(colors: Color[]): ColorPalette['semantic'] {
    // Look for common semantic color patterns
    const success = colors.find(c => 
      c.hsl.h >= 90 && c.hsl.h <= 150 && c.hsl.s > 30
    ) || this.createDefaultColor('#4CAF50');
    
    const error = colors.find(c => 
      (c.hsl.h >= 0 && c.hsl.h <= 20) || (c.hsl.h >= 340 && c.hsl.h <= 360) && c.hsl.s > 30
    ) || this.createDefaultColor('#F44336');
    
    const warning = colors.find(c => 
      c.hsl.h >= 30 && c.hsl.h <= 60 && c.hsl.s > 30
    ) || this.createDefaultColor('#FF9800');
    
    const info = colors.find(c => 
      c.hsl.h >= 180 && c.hsl.h <= 240 && c.hsl.s > 30
    ) || this.createDefaultColor('#2196F3');

    return { success, error, warning, info };
  }

  private createDefaultColor(hex: string = '#000000'): Color {
    const rgb = this.hexToRgb(hex);
    const hsl = this.rgbToHsl(rgb);
    
    return {
      hex,
      rgb,
      hsl,
      wcagContrast: {
        white: this.calculateContrast(rgb, { r: 255, g: 255, b: 255 }),
        black: this.calculateContrast(rgb, { r: 0, g: 0, b: 0 })
      }
    };
  }

  private isColorProperty(property: string): boolean {
    return property.includes('color') || 
           property.includes('background') ||
           property.includes('border') ||
           property.includes('shadow');
  }

  private extractInlineColors(html: string): Color[] {
    const colors: Color[] = [];
    const styleRegex = /style="([^"]*)"/g;
    let match;
    
    while ((match = styleRegex.exec(html)) !== null) {
      const style = match[1];
      
      // Extract hex colors
      const hexRegex = /#[0-9a-fA-F]{3,8}/g;
      let hexMatch;
      while ((hexMatch = hexRegex.exec(style)) !== null) {
        const color = this.parseColor(hexMatch[0]);
        if (color) colors.push(color);
      }
      
      // Extract rgb colors
      const rgbRegex = /rgba?\([^)]+\)/g;
      let rgbMatch;
      while ((rgbMatch = rgbRegex.exec(style)) !== null) {
        const color = this.parseColor(rgbMatch[0]);
        if (color) colors.push(color);
      }
    }
    
    return colors;
  }

  private isNamedColor(color: string): boolean {
    const namedColors = [
      'black', 'white', 'red', 'green', 'blue', 'yellow', 'cyan', 'magenta',
      'gray', 'grey', 'orange', 'purple', 'brown', 'pink', 'lime', 'olive',
      'navy', 'teal', 'silver', 'gold'
    ];
    return namedColors.includes(color.toLowerCase());
  }

  private namedColorToHex(colorName: string): string {
    const colorMap: Record<string, string> = {
      'black': '#000000',
      'white': '#FFFFFF',
      'red': '#FF0000',
      'green': '#008000',
      'blue': '#0000FF',
      'yellow': '#FFFF00',
      'cyan': '#00FFFF',
      'magenta': '#FF00FF',
      'gray': '#808080',
      'grey': '#808080',
      'orange': '#FFA500',
      'purple': '#800080',
      'brown': '#A52A2A',
      'pink': '#FFC0CB',
      'lime': '#00FF00',
      'olive': '#808000',
      'navy': '#000080',
      'teal': '#008080',
      'silver': '#C0C0C0',
      'gold': '#FFD700'
    };
    
    return colorMap[colorName.toLowerCase()] || '#000000';
  }

  private getColorName(hex: string): string | undefined {
    // Simple color naming based on hue
    const rgb = this.hexToRgb(hex);
    const hsl = this.rgbToHsl(rgb);
    
    if (hsl.s < 10) {
      if (hsl.l < 20) return 'black';
      if (hsl.l > 80) return 'white';
      return 'gray';
    }
    
    const hue = hsl.h;
    if (hue < 15 || hue >= 345) return 'red';
    if (hue < 45) return 'orange';
    if (hue < 65) return 'yellow';
    if (hue < 150) return 'green';
    if (hue < 200) return 'cyan';
    if (hue < 260) return 'blue';
    if (hue < 290) return 'purple';
    return 'magenta';
  }
}