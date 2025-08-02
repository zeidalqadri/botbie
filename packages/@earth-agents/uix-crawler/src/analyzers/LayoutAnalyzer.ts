import { Page } from 'playwright';
import { Logger } from '@earth-agents/core';
import { SpacingScale, ShadowScale, BorderTokens } from '../types';

export class LayoutAnalyzer {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('LayoutAnalyzer');
  }

  async analyzePage(url: string): Promise<{
    spacing: SpacingScale;
    shadows: ShadowScale;
    borders: BorderTokens;
  }> {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      
      const layoutData = await page.evaluate(() => {
        const spacings = new Set<number>();
        const shadows = new Set<string>();
        const borderRadii = new Set<string>();
        const borderWidths = new Set<string>();
        const borderStyles = new Set<string>();
        
        const elements = document.querySelectorAll('*');
        
        elements.forEach(element => {
          const styles = window.getComputedStyle(element);
          
          // Extract spacing values
          ['margin', 'padding'].forEach(prop => {
            ['top', 'right', 'bottom', 'left'].forEach(side => {
              const value = styles.getPropertyValue(`${prop}-${side}`);
              if (value && value !== '0px' && value !== 'auto') {
                const parsed = parseFloat(value);
                if (!isNaN(parsed) && parsed > 0) {
                  spacings.add(parsed);
                }
              }
            });
          });
          
          // Extract gap values (for flexbox/grid)
          ['gap', 'row-gap', 'column-gap'].forEach(prop => {
            const value = styles.getPropertyValue(prop);
            if (value && value !== 'normal' && value !== '0px') {
              const parsed = parseFloat(value);
              if (!isNaN(parsed) && parsed > 0) {
                spacings.add(parsed);
              }
            }
          });
          
          // Extract shadows
          const boxShadow = styles.boxShadow;
          if (boxShadow && boxShadow !== 'none') {
            shadows.add(boxShadow);
          }
          
          // Extract border radii
          ['border-radius', 'border-top-left-radius', 'border-top-right-radius',
           'border-bottom-left-radius', 'border-bottom-right-radius'].forEach(prop => {
            const value = styles.getPropertyValue(prop);
            if (value && value !== '0px') {
              borderRadii.add(value);
            }
          });
          
          // Extract border widths
          ['border-width', 'border-top-width', 'border-right-width',
           'border-bottom-width', 'border-left-width'].forEach(prop => {
            const value = styles.getPropertyValue(prop);
            if (value && value !== '0px' && value !== 'medium') {
              borderWidths.add(value);
            }
          });
          
          // Extract border styles
          const borderStyle = styles.borderStyle;
          if (borderStyle && borderStyle !== 'none') {
            borderStyles.add(borderStyle);
          }
        });
        
        return {
          spacings: Array.from(spacings).sort((a, b) => a - b),
          shadows: Array.from(shadows),
          borderRadii: Array.from(borderRadii),
          borderWidths: Array.from(borderWidths),
          borderStyles: Array.from(borderStyles)
        };
      });

      // Process the extracted data
      const spacing = this.processSpacing(layoutData.spacings);
      const shadows = this.processShadows(layoutData.shadows);
      const borders = this.processBorders({
        radii: layoutData.borderRadii,
        widths: layoutData.borderWidths,
        styles: layoutData.borderStyles
      });

      this.logger.info(`Analyzed layout for ${url}`, {
        spacingSteps: spacing.scale.length,
        shadowVariants: Object.keys(shadows).length,
        borderRadiiCount: Object.keys(borders.radii).length
      });

      return { spacing, shadows, borders };
    } catch (error) {
      this.logger.error('Failed to analyze layout', { url, error });
      throw error;
    } finally {
      await browser.close();
    }
  }

  private processSpacing(spacings: number[]): SpacingScale {
    // Find the base unit (likely 4, 8, or 16)
    const base = this.findBaseUnit(spacings);
    
    // Create a scale based on the base unit
    const scale = this.createSpacingScale(base, spacings);
    
    return {
      base,
      scale,
      units: 'px' // Could be enhanced to detect rem/em usage
    };
  }

  private findBaseUnit(spacings: number[]): number {
    // Common base units in design systems
    const commonBases = [4, 8, 16];
    
    // Find which base unit best explains the spacings
    let bestBase = 8;
    let bestScore = 0;
    
    for (const base of commonBases) {
      let score = 0;
      for (const spacing of spacings) {
        if (spacing % base === 0) {
          score++;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestBase = base;
      }
    }
    
    return bestBase;
  }

  private createSpacingScale(base: number, observedSpacings: number[]): number[] {
    const scale: number[] = [];
    const maxMultiplier = Math.max(...observedSpacings) / base;
    
    // Create scale from 0 to max observed
    for (let i = 0; i <= Math.ceil(maxMultiplier); i++) {
      const value = base * i;
      // Only include if it was actually observed or is a key value
      if (observedSpacings.includes(value) || i <= 8) {
        scale.push(value);
      }
    }
    
    // Ensure we have key values
    const keyMultipliers = [0, 0.5, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32];
    for (const multiplier of keyMultipliers) {
      const value = base * multiplier;
      if (!scale.includes(value) && value <= Math.max(...observedSpacings)) {
        scale.push(value);
      }
    }
    
    return scale.sort((a, b) => a - b);
  }

  private processShadows(shadows: string[]): ShadowScale {
    // Categorize shadows by their characteristics
    const categorized = shadows.map(shadow => ({
      shadow,
      metrics: this.analyzeShadow(shadow)
    }));
    
    // Sort by blur radius (shadow size)
    categorized.sort((a, b) => a.metrics.blur - b.metrics.blur);
    
    // Pick representative shadows for each size
    const scale: ShadowScale = {
      sm: '',
      md: '',
      lg: '',
      xl: '',
      custom: {}
    };
    
    if (categorized.length > 0) {
      const quartile = Math.floor(categorized.length / 4);
      
      scale.sm = categorized[0]?.shadow || this.createDefaultShadow('sm');
      scale.md = categorized[quartile]?.shadow || this.createDefaultShadow('md');
      scale.lg = categorized[quartile * 2]?.shadow || this.createDefaultShadow('lg');
      scale.xl = categorized[quartile * 3]?.shadow || this.createDefaultShadow('xl');
      
      // Store unique custom shadows
      categorized.forEach((item, index) => {
        if (!Object.values(scale).includes(item.shadow)) {
          scale.custom![`shadow-${index}`] = item.shadow;
        }
      });
    } else {
      // Use defaults if no shadows found
      scale.sm = this.createDefaultShadow('sm');
      scale.md = this.createDefaultShadow('md');
      scale.lg = this.createDefaultShadow('lg');
      scale.xl = this.createDefaultShadow('xl');
    }
    
    return scale;
  }

  private analyzeShadow(shadow: string): { blur: number; spread: number; y: number } {
    // Parse shadow string to extract values
    // Format: [inset] <x> <y> <blur> [spread] <color>
    const parts = shadow.split(/\s+/).filter(p => p && !p.includes('rgb') && !p.includes('#'));
    
    let x = 0, y = 0, blur = 0, spread = 0;
    let index = 0;
    
    // Skip 'inset' if present
    if (parts[index] === 'inset') {
      index++;
    }
    
    // Parse numeric values
    if (parts[index]) x = parseFloat(parts[index++]) || 0;
    if (parts[index]) y = parseFloat(parts[index++]) || 0;
    if (parts[index]) blur = parseFloat(parts[index++]) || 0;
    if (parts[index] && !isNaN(parseFloat(parts[index]))) {
      spread = parseFloat(parts[index]) || 0;
    }
    
    return { blur, spread, y };
  }

  private createDefaultShadow(size: 'sm' | 'md' | 'lg' | 'xl'): string {
    const shadows = {
      sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px rgba(0, 0, 0, 0.15)'
    };
    
    return shadows[size];
  }

  private processBorders(data: {
    radii: string[];
    widths: string[];
    styles: string[];
  }): BorderTokens {
    // Process border radii
    const radii: Record<string, string> = {};
    const uniqueRadii = [...new Set(data.radii)].sort((a, b) => {
      const aVal = parseFloat(a) || 0;
      const bVal = parseFloat(b) || 0;
      return aVal - bVal;
    });
    
    // Create named radii
    if (uniqueRadii.length > 0) {
      radii.none = '0';
      radii.sm = uniqueRadii[0] || '2px';
      radii.md = uniqueRadii[Math.floor(uniqueRadii.length / 3)] || '4px';
      radii.lg = uniqueRadii[Math.floor(uniqueRadii.length * 2 / 3)] || '8px';
      radii.xl = uniqueRadii[uniqueRadii.length - 1] || '16px';
      
      // Check for full radius (pills/circles)
      if (uniqueRadii.some(r => r.includes('50%') || parseFloat(r) > 100)) {
        radii.full = '9999px';
      }
    } else {
      // Defaults
      radii.none = '0';
      radii.sm = '2px';
      radii.md = '4px';
      radii.lg = '8px';
      radii.xl = '16px';
    }
    
    // Process border widths
    const widths: Record<string, string> = {};
    const uniqueWidths = [...new Set(data.widths)];
    
    widths.none = '0';
    widths.thin = uniqueWidths.find(w => parseFloat(w) === 1) || '1px';
    widths.medium = uniqueWidths.find(w => parseFloat(w) === 2) || '2px';
    widths.thick = uniqueWidths.find(w => parseFloat(w) >= 3) || '4px';
    
    // Process border styles
    const styles = [...new Set(data.styles)].filter(s => s !== 'none');
    
    return {
      radii,
      widths,
      styles: styles.length > 0 ? styles : ['solid', 'dashed', 'dotted']
    };
  }

  async compareLayouts(
    layout1: any,
    layout2: any
  ): Promise<{
    similarity: number;
    differences: string[];
    recommendations: string[];
  }> {
    const differences: string[] = [];
    const recommendations: string[] = [];
    
    // Compare spacing scales
    const scale1 = new Set(layout1.spacing.scale);
    const scale2 = new Set(layout2.spacing.scale);
    const commonSpacings = new Set([...scale1].filter(x => scale2.has(x)));
    const spacingSimilarity = commonSpacings.size / Math.max(scale1.size, scale2.size);
    
    if (spacingSimilarity < 0.6) {
      differences.push('Different spacing scales used');
      recommendations.push('Establish a consistent spacing system based on a base unit');
    }
    
    // Compare base units
    if (layout1.spacing.base !== layout2.spacing.base) {
      differences.push(`Different base units: ${layout1.spacing.base}px vs ${layout2.spacing.base}px`);
      recommendations.push('Use a consistent base unit (8px or 4px recommended) across designs');
    }
    
    // Compare shadow usage
    const shadows1Count = Object.keys(layout1.shadows).length;
    const shadows2Count = Object.keys(layout2.shadows).length;
    
    if (Math.abs(shadows1Count - shadows2Count) > 2) {
      differences.push('Inconsistent shadow usage');
      recommendations.push('Define a standard shadow scale (sm, md, lg, xl) for consistency');
    }
    
    // Compare border radius usage
    const radii1 = Object.values(layout1.borders.radii);
    const radii2 = Object.values(layout2.borders.radii);
    
    if (radii1.length !== radii2.length) {
      differences.push('Different border radius scales');
      recommendations.push('Standardize border radius values across components');
    }
    
    // Calculate overall similarity
    const similarity = spacingSimilarity;
    
    return {
      similarity,
      differences,
      recommendations
    };
  }
}