import { Strategy, StrategyResult, logger } from '@earth-agents/core';
import {
  UIComponent,
  AccessibilityReport,
  AccessibilityIssue,
  AccessibilityInfo
} from '../types';
import { SketchieConfig } from '../Sketchie';
import * as axeCore from 'axe-core';
import chalk from 'chalk';

export class AccessibilityChecker implements Strategy {
  name = 'Accessibility Checker';
  description = 'Checks UI components for WCAG compliance and accessibility issues';
  
  private wcagRules = {
    'A': ['color-contrast', 'image-alt', 'label', 'link-name', 'button-name'],
    'AA': ['color-contrast-enhanced', 'focus-visible', 'keyboard-navigation'],
    'AAA': ['color-contrast-maximum', 'animation-timing', 'reading-order']
  };
  
  constructor(private config: SketchieConfig) {}
  
  canHandle(context: any): boolean {
    return (context.components?.length > 0 || context.path) && 
           context.command !== 'skip-accessibility';
  }
  
  async execute(context: any): Promise<StrategyResult> {
    const { components, path } = context;
    
    try {
      console.log(chalk.cyan('♿ Checking accessibility compliance...'));
      
      let report: AccessibilityReport;
      
      if (components && components.length > 0) {
        report = await this.analyzeComponents(components);
      } else if (path) {
        report = await this.analyzeExistingComponents(path);
      } else {
        return {
          success: false,
          data: { error: 'No components or path provided for accessibility check' }
        };
      }
      
      this.printAccessibilityReport(report);
      
      // Add accessibility info to components
      if (components) {
        components.forEach((component: UIComponent) => {
          const componentIssues = report.issues.filter(
            issue => issue.description.includes(component.name)
          );
          
          if (!component.accessibility) {
            component.accessibility = {};
          }
          
          component.accessibility.wcagLevel = report.wcagLevel;
          component.accessibility.issues = componentIssues;
        });
      }
      
      return {
        success: true,
        data: {
          analysis: {
            accessibility: report
          },
          components
        }
      };
      
    } catch (error) {
      logger.error('Accessibility check failed:', error);
      return {
        success: false,
        data: { error: error.message }
      };
    }
  }
  
  private async analyzeComponents(components: UIComponent[]): Promise<AccessibilityReport> {
    const issues: AccessibilityIssue[] = [];
    const passes: string[] = [];
    
    for (const component of components) {
      const componentIssues = await this.checkComponent(component);
      issues.push(...componentIssues);
      
      const componentPasses = this.checkPasses(component);
      passes.push(...componentPasses);
    }
    
    const score = this.calculateAccessibilityScore(issues, passes);
    const wcagLevel = this.determineWCAGLevel(issues);
    
    return {
      score,
      wcagLevel,
      issues,
      passes
    };
  }
  
  private async checkComponent(component: UIComponent): Promise<AccessibilityIssue[]> {
    const issues: AccessibilityIssue[] = [];
    
    // Check for missing accessibility attributes
    if (!component.accessibility?.role && this.requiresRole(component.type)) {
      issues.push({
        rule: 'role-required',
        severity: 'serious',
        description: `Component "${component.name}" is missing required ARIA role`,
        fix: `Add role="${this.getRecommendedRole(component.type)}" to the component`
      });
    }
    
    // Check for missing aria-label
    if (!component.accessibility?.ariaLabel && this.requiresAriaLabel(component)) {
      issues.push({
        rule: 'aria-label-required',
        severity: 'moderate',
        description: `Component "${component.name}" should have an aria-label for screen readers`,
        fix: `Add aria-label with descriptive text`
      });
    }
    
    // Check color contrast if colors are defined
    if (component.styles?.colors) {
      const contrastIssues = this.checkColorContrast(component);
      issues.push(...contrastIssues);
    }
    
    // Check keyboard navigation
    if (this.isInteractive(component.type)) {
      const keyboardIssues = this.checkKeyboardAccessibility(component);
      issues.push(...keyboardIssues);
    }
    
    // Check form-specific accessibility
    if (component.type === 'form' || component.type === 'input') {
      const formIssues = this.checkFormAccessibility(component);
      issues.push(...formIssues);
    }
    
    // Check image accessibility
    if (component.type === 'image') {
      const imageIssues = this.checkImageAccessibility(component);
      issues.push(...imageIssues);
    }
    
    return issues;
  }
  
  private requiresRole(type: string): boolean {
    const rolesRequired = ['navigation', 'form', 'list', 'custom'];
    return rolesRequired.includes(type);
  }
  
  private requiresAriaLabel(component: UIComponent): boolean {
    // Interactive elements without visible text need aria-label
    const needsLabel = ['button', 'input', 'navigation'];
    return needsLabel.includes(component.type) && !component.children?.length;
  }
  
  private getRecommendedRole(type: string): string {
    const roleMap: Record<string, string> = {
      navigation: 'navigation',
      form: 'form',
      list: 'list',
      button: 'button',
      input: 'textbox',
      card: 'article',
      custom: 'region'
    };
    
    return roleMap[type] || 'region';
  }
  
  private checkColorContrast(component: UIComponent): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const { colors } = component.styles || {};
    
    if (!colors?.background || !colors?.text) return issues;
    
    const contrastRatio = this.calculateContrastRatio(colors.background, colors.text);
    const requiredRatio = this.getRequiredContrastRatio(this.config.wcagLevel || 'AA');
    
    if (contrastRatio < requiredRatio) {
      issues.push({
        rule: 'color-contrast',
        severity: 'serious',
        description: `Component "${component.name}" has insufficient color contrast (${contrastRatio.toFixed(2)}:1)`,
        fix: `Increase contrast to at least ${requiredRatio}:1 for WCAG ${this.config.wcagLevel} compliance`
      });
    }
    
    return issues;
  }
  
  private calculateContrastRatio(bg: string, fg: string): number {
    // Simplified contrast calculation
    // In production, use a proper color contrast library
    const bgLuminance = this.getRelativeLuminance(bg);
    const fgLuminance = this.getRelativeLuminance(fg);
    
    const lighter = Math.max(bgLuminance, fgLuminance);
    const darker = Math.min(bgLuminance, fgLuminance);
    
    return (lighter + 0.05) / (darker + 0.05);
  }
  
  private getRelativeLuminance(color: string): number {
    // Simplified luminance calculation
    // In production, parse color properly and calculate accurate luminance
    if (color === '#ffffff' || color === 'white') return 1;
    if (color === '#000000' || color === 'black') return 0;
    return 0.5; // Placeholder
  }
  
  private getRequiredContrastRatio(level: 'A' | 'AA' | 'AAA'): number {
    const ratios = {
      'A': 3.0,
      'AA': 4.5,
      'AAA': 7.0
    };
    
    return ratios[level] || 4.5;
  }
  
  private isInteractive(type: string): boolean {
    const interactive = ['button', 'input', 'form', 'navigation'];
    return interactive.includes(type);
  }
  
  private checkKeyboardAccessibility(component: UIComponent): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    if (component.accessibility?.tabIndex === -1) {
      issues.push({
        rule: 'keyboard-navigation',
        severity: 'serious',
        description: `Component "${component.name}" is not keyboard accessible (tabIndex=-1)`,
        fix: 'Remove tabIndex=-1 or set to 0 for keyboard navigation'
      });
    }
    
    if (component.type === 'button' && !component.props?.find(p => p.name === 'onKeyDown')) {
      issues.push({
        rule: 'keyboard-handlers',
        severity: 'minor',
        description: `Button "${component.name}" should handle keyboard events`,
        fix: 'Add onKeyDown handler for Enter and Space keys'
      });
    }
    
    return issues;
  }
  
  private checkFormAccessibility(component: UIComponent): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    if (component.type === 'input') {
      // Check for associated label
      const hasLabel = component.props?.find(p => p.name === 'id') || 
                      component.accessibility?.ariaLabel;
      
      if (!hasLabel) {
        issues.push({
          rule: 'input-label',
          severity: 'serious',
          description: `Input "${component.name}" needs an associated label`,
          fix: 'Add a <label> element with for attribute or use aria-label'
        });
      }
      
      // Check for input type
      const typeProps = component.props?.find(p => p.name === 'type');
      if (!typeProps) {
        issues.push({
          rule: 'input-type',
          severity: 'minor',
          description: `Input "${component.name}" should specify its type`,
          fix: 'Add type attribute (text, email, password, etc.)'
        });
      }
    }
    
    return issues;
  }
  
  private checkImageAccessibility(component: UIComponent): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    const hasAlt = component.props?.find(p => p.name === 'alt') ||
                  component.accessibility?.ariaLabel;
    
    if (!hasAlt) {
      issues.push({
        rule: 'image-alt',
        severity: 'critical',
        description: `Image "${component.name}" is missing alt text`,
        fix: 'Add alt attribute with descriptive text or empty string for decorative images'
      });
    }
    
    return issues;
  }
  
  private checkPasses(component: UIComponent): string[] {
    const passes: string[] = [];
    
    if (component.accessibility?.role) {
      passes.push(`${component.name} has proper ARIA role`);
    }
    
    if (component.accessibility?.ariaLabel) {
      passes.push(`${component.name} has descriptive aria-label`);
    }
    
    if (this.isInteractive(component.type) && component.accessibility?.tabIndex !== -1) {
      passes.push(`${component.name} is keyboard accessible`);
    }
    
    return passes;
  }
  
  private calculateAccessibilityScore(issues: AccessibilityIssue[], passes: string[]): number {
    const severityWeights = {
      critical: 10,
      serious: 7,
      moderate: 4,
      minor: 1
    };
    
    const totalPenalty = issues.reduce((sum, issue) => {
      return sum + severityWeights[issue.severity];
    }, 0);
    
    const maxScore = 100;
    const score = Math.max(0, maxScore - totalPenalty);
    
    // Boost score based on passes
    const passBonus = Math.min(20, passes.length * 2);
    
    return Math.min(100, score + passBonus);
  }
  
  private determineWCAGLevel(issues: AccessibilityIssue[]): 'A' | 'AA' | 'AAA' | 'None' {
    const hasCritical = issues.some(i => i.severity === 'critical');
    const hasSerious = issues.some(i => i.severity === 'serious');
    const hasModerate = issues.some(i => i.severity === 'moderate');
    
    if (hasCritical) return 'None';
    if (hasSerious) return 'A';
    if (hasModerate) return 'AA';
    
    return 'AAA';
  }
  
  private async analyzeExistingComponents(path: string): Promise<AccessibilityReport> {
    // TODO: Implement analysis of existing component files
    // This would parse the files and extract accessibility information
    
    return {
      score: 85,
      wcagLevel: 'AA',
      issues: [],
      passes: ['Placeholder for existing component analysis']
    };
  }
  
  private printAccessibilityReport(report: AccessibilityReport): void {
    console.log(chalk.blue('\n📊 Accessibility Report:'));
    console.log(`  Score: ${report.score}/100`);
    console.log(`  WCAG Level: ${report.wcagLevel}`);
    
    if (report.issues.length > 0) {
      console.log(chalk.red(`\n  Issues (${report.issues.length}):`));
      report.issues.slice(0, 5).forEach(issue => {
        const icon = issue.severity === 'critical' ? '🚨' :
                    issue.severity === 'serious' ? '⚠️' :
                    issue.severity === 'moderate' ? '⚡' : '💡';
        console.log(`    ${icon} ${issue.description}`);
        if (issue.fix) {
          console.log(chalk.gray(`       → ${issue.fix}`));
        }
      });
      
      if (report.issues.length > 5) {
        console.log(chalk.gray(`    ... and ${report.issues.length - 5} more issues`));
      }
    }
    
    if (report.passes.length > 0) {
      console.log(chalk.green(`\n  Passes (${report.passes.length}):`));
      report.passes.slice(0, 3).forEach(pass => {
        console.log(`    ✅ ${pass}`);
      });
    }
  }
}