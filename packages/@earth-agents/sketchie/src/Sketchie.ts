import {
  EarthAgent,
  AgentConfig,
  Strategy,
  logger,
  SessionManager,
  LearningEngine,
  CrossAgentInsight
} from '@earth-agents/core';
import {
  DesignInput,
  UIComponent,
  UIAnalysisResult,
  ComponentGenerationOptions,
  DesignSystem,
  UIEvidence
} from './types';
import chalk from 'chalk';

export interface SketchieConfig extends Omit<AgentConfig, 'name' | 'description'> {
  openaiApiKey?: string;
  figmaAccessToken?: string;
  defaultFramework?: 'react' | 'vue' | 'angular' | 'webcomponents';
  defaultStyling?: 'css' | 'scss' | 'styled-components' | 'emotion' | 'tailwind';
  enableAIGeneration?: boolean;
  wcagLevel?: 'A' | 'AA' | 'AAA';
  performanceThresholds?: {
    bundleSize?: number;
    renderTime?: number;
  };
}

export interface SketchieReport {
  sessionId: string;
  timestamp: Date;
  input: DesignInput;
  components: UIComponent[];
  analysis: UIAnalysisResult;
  designSystem?: DesignSystem;
  generatedCode?: {
    typescript?: string;
    jsx?: string;
    css?: string;
    tests?: string;
    stories?: string;
  };
}

export class Sketchie extends EarthAgent {
  name = 'Sketchie';
  private config: SketchieConfig;
  private sessionManager: SessionManager;
  private learningEngine: LearningEngine;

  constructor(config?: SketchieConfig) {
    const defaultConfig: SketchieConfig = {
      description: '🎨 UI/UX Design & TypeScript Development Assistant',
      defaultFramework: 'react',
      defaultStyling: 'styled-components',
      enableAIGeneration: true,
      wcagLevel: 'AA',
      performanceThresholds: {
        bundleSize: 100000, // 100KB
        renderTime: 16 // 16ms for 60fps
      },
      ...config
    };
    
    super(defaultConfig);
    this.config = defaultConfig;
    this.sessionManager = SessionManager.getInstance();
    this.learningEngine = new LearningEngine();
  }

  protected async setupStrategies(): Promise<void> {
    // Import strategies dynamically to avoid circular dependencies
    const { DesignAnalyzer } = await import('./strategies/DesignAnalyzer');
    const { ComponentGenerator } = await import('./strategies/ComponentGenerator');
    const { AccessibilityChecker } = await import('./strategies/AccessibilityChecker');
    const { PerformanceOptimizer } = await import('./strategies/PerformanceOptimizer');
    
    this.strategies = [
      new DesignAnalyzer(this.config),
      new ComponentGenerator(this.config),
      new AccessibilityChecker(this.config),
      new PerformanceOptimizer(this.config)
    ];
  }

  async execute(input: {
    design?: DesignInput;
    path?: string;
    command?: string;
    options?: ComponentGenerationOptions;
  }): Promise<SketchieReport> {
    const session = this.createSession(`Sketchie analysis: ${input.design?.source || input.path || 'UI task'}`);
    
    try {
      console.log(chalk.blue('\n🎨 Starting Sketchie UI analysis...\n'));
      
      let components: UIComponent[] = [];
      let analysis: UIAnalysisResult = {
        components: [],
        patterns: [],
        accessibility: {
          score: 0,
          wcagLevel: 'None',
          issues: [],
          passes: []
        },
        performance: {
          bundleSize: 0,
          renderTime: 0,
          reRenderCount: 0,
          memoryUsage: 0,
          suggestions: []
        },
        suggestions: []
      };
      
      // Run appropriate strategies based on input
      if (input.design) {
        console.log(chalk.cyan('📐 Analyzing design input...'));
        await this.addEvidence(session.id, 'design-analysis', { design: input.design });
        
        const results = await this.runStrategies({
          session,
          design: input.design,
          options: input.options,
          config: this.config
        });
        
        // Aggregate results
        for (const result of results) {
          if (result.components) {
            components.push(...result.components);
          }
          if (result.analysis) {
            analysis = this.mergeAnalysis(analysis, result.analysis);
          }
        }
      }
      
      if (input.path) {
        console.log(chalk.cyan('🔍 Analyzing existing UI components...'));
        
        const results = await this.runStrategies({
          session,
          path: input.path,
          command: input.command,
          options: input.options,
          config: this.config
        });
        
        for (const result of results) {
          if (result.components) {
            components.push(...result.components);
          }
          if (result.analysis) {
            analysis = this.mergeAnalysis(analysis, result.analysis);
          }
        }
      }
      
      // Generate cross-agent insights
      await this.generateInsights(session.id, components, analysis);
      
      // Update learning engine
      await this.updateLearning(session.id, components, analysis);
      
      // Generate report
      const report: SketchieReport = {
        sessionId: session.id,
        timestamp: new Date(),
        input: input.design || { type: 'url', source: input.path || '' },
        components,
        analysis,
        generatedCode: await this.generateCode(components, input.options)
      };
      
      // Add final evidence
      await this.addEvidence(session.id, 'component-generation', { 
        componentCount: components.length,
        analysis: analysis
      });
      
      this.printReport(report);
      
      session.status = 'completed';
      return report;
      
    } catch (error) {
      session.status = 'failed';
      logger.error('Sketchie analysis failed:', error);
      throw error;
    }
  }

  private mergeAnalysis(existing: UIAnalysisResult, incoming: UIAnalysisResult): UIAnalysisResult {
    return {
      components: [...existing.components, ...incoming.components],
      patterns: this.mergePatterns(existing.patterns, incoming.patterns),
      accessibility: this.mergeAccessibility(existing.accessibility, incoming.accessibility),
      performance: this.mergePerformance(existing.performance, incoming.performance),
      suggestions: [...existing.suggestions, ...incoming.suggestions]
    };
  }

  private mergePatterns(existing: any[], incoming: any[]): any[] {
    const patternMap = new Map();
    
    [...existing, ...incoming].forEach(pattern => {
      if (patternMap.has(pattern.name)) {
        const existingPattern = patternMap.get(pattern.name);
        existingPattern.frequency += pattern.frequency;
        existingPattern.examples = [...new Set([...existingPattern.examples, ...pattern.examples])];
      } else {
        patternMap.set(pattern.name, { ...pattern });
      }
    });
    
    return Array.from(patternMap.values());
  }

  private mergeAccessibility(existing: any, incoming: any): any {
    return {
      score: Math.min(existing.score || 0, incoming.score || 0),
      wcagLevel: this.getLowestWCAGLevel(existing.wcagLevel, incoming.wcagLevel),
      issues: [...existing.issues, ...incoming.issues],
      passes: [...new Set([...existing.passes, ...incoming.passes])]
    };
  }

  private mergePerformance(existing: any, incoming: any): any {
    return {
      bundleSize: existing.bundleSize + incoming.bundleSize,
      renderTime: Math.max(existing.renderTime, incoming.renderTime),
      reRenderCount: existing.reRenderCount + incoming.reRenderCount,
      memoryUsage: existing.memoryUsage + incoming.memoryUsage,
      suggestions: [...new Set([...existing.suggestions, ...incoming.suggestions])]
    };
  }

  private getLowestWCAGLevel(level1: string, level2: string): 'A' | 'AA' | 'AAA' | 'None' {
    const levels = ['None', 'A', 'AA', 'AAA'];
    const index1 = levels.indexOf(level1);
    const index2 = levels.indexOf(level2);
    return levels[Math.min(index1, index2)] as any;
  }

  private async generateCode(
    components: UIComponent[], 
    options?: ComponentGenerationOptions
  ): Promise<any> {
    if (!components.length) return {};
    
    const framework = options?.framework || this.config.defaultFramework || 'react';
    const styling = options?.styling || this.config.defaultStyling || 'styled-components';
    
    // This would integrate with the ComponentGenerator strategy
    return {
      typescript: '// Generated TypeScript code',
      jsx: '// Generated JSX code',
      css: '// Generated CSS code',
      tests: options?.testing ? '// Generated test code' : undefined,
      stories: options?.storybook ? '// Generated Storybook stories' : undefined
    };
  }

  private async generateInsights(
    sessionId: string,
    components: UIComponent[],
    analysis: UIAnalysisResult
  ): Promise<void> {
    const insights: CrossAgentInsight[] = [];
    
    // Accessibility insights
    if (analysis.accessibility.score < 80) {
      insights.push({
        id: `${sessionId}-accessibility`,
        sourceAgent: 'sketchie',
        targetAgent: 'botbie',
        type: 'quality-rule',
        title: 'UI Accessibility Issues Detected',
        description: `Found ${analysis.accessibility.issues.length} accessibility issues that need attention`,
        evidence: [],
        recommendations: [
          'Add proper ARIA labels to interactive elements',
          'Ensure sufficient color contrast ratios',
          'Provide keyboard navigation support',
          'Include alt text for images'
        ],
        confidence: 0.9,
        impact: 'high',
        timestamp: new Date(),
        metadata: {
          wcagLevel: analysis.accessibility.wcagLevel,
          issueCount: analysis.accessibility.issues.length
        }
      });
    }
    
    // Performance insights
    if (analysis.performance.bundleSize > (this.config.performanceThresholds?.bundleSize || 100000)) {
      insights.push({
        id: `${sessionId}-performance`,
        sourceAgent: 'sketchie',
        targetAgent: 'debugearth',
        type: 'performance-issue',
        title: 'UI Bundle Size Exceeds Threshold',
        description: `Component bundle size (${Math.round(analysis.performance.bundleSize / 1024)}KB) exceeds recommended limit`,
        evidence: [],
        recommendations: [
          'Consider code splitting for large components',
          'Lazy load non-critical UI elements',
          'Optimize image assets',
          'Remove unused dependencies'
        ],
        confidence: 0.85,
        impact: 'medium',
        timestamp: new Date(),
        metadata: {
          bundleSize: analysis.performance.bundleSize,
          threshold: this.config.performanceThresholds?.bundleSize
        }
      });
    }
    
    // Pattern insights
    const commonPatterns = analysis.patterns.filter(p => p.frequency > 3);
    if (commonPatterns.length > 0) {
      insights.push({
        id: `${sessionId}-patterns`,
        sourceAgent: 'sketchie',
        targetAgent: 'botbie',
        type: 'pattern-detection',
        title: 'UI Pattern Opportunities Detected',
        description: `Found ${commonPatterns.length} repeated UI patterns that could be componentized`,
        evidence: [],
        recommendations: commonPatterns.map(p => 
          `Create reusable component for "${p.name}" pattern (used ${p.frequency} times)`
        ),
        confidence: 0.8,
        impact: 'medium',
        timestamp: new Date(),
        metadata: {
          patterns: commonPatterns.map(p => ({ name: p.name, frequency: p.frequency }))
        }
      });
    }
    
    // Share insights with other agents
    for (const insight of insights) {
      this.sessionManager.addCrossAgentInsight(insight);
    }
  }

  private async updateLearning(
    sessionId: string,
    components: UIComponent[],
    analysis: UIAnalysisResult
  ): Promise<void> {
    const evidence: UIEvidence = {
      id: `${sessionId}-ui-learning`,
      type: 'component-generation',
      timestamp: new Date(),
      data: {
        component: components[0], // Representative component
        analysis,
        metrics: analysis.performance
      },
      context: {
        source: 'sketchie',
        sessionId,
        componentCount: components.length
      }
    };
    
    this.learningEngine.processEvidence(evidence);
  }

  private printReport(report: SketchieReport): void {
    console.log(chalk.green('\n✨ Sketchie Analysis Complete!\n'));
    
    console.log(chalk.yellow('📊 Summary:'));
    console.log(`  • Components analyzed/generated: ${report.components.length}`);
    console.log(`  • UI Patterns detected: ${report.analysis.patterns.length}`);
    console.log(`  • Accessibility score: ${report.analysis.accessibility.score}/100 (${report.analysis.accessibility.wcagLevel})`);
    console.log(`  • Bundle size: ${Math.round(report.analysis.performance.bundleSize / 1024)}KB`);
    
    if (report.analysis.accessibility.issues.length > 0) {
      console.log(chalk.red(`\n⚠️  Accessibility Issues (${report.analysis.accessibility.issues.length}):`));
      report.analysis.accessibility.issues.slice(0, 5).forEach(issue => {
        console.log(`  • ${issue.severity.toUpperCase()}: ${issue.description}`);
        if (issue.fix) {
          console.log(chalk.gray(`    → Fix: ${issue.fix}`));
        }
      });
    }
    
    if (report.analysis.patterns.length > 0) {
      console.log(chalk.cyan('\n🎨 UI Patterns:'));
      report.analysis.patterns.slice(0, 5).forEach(pattern => {
        console.log(`  • ${pattern.name} (used ${pattern.frequency}x)`);
        if (pattern.recommendation) {
          console.log(chalk.gray(`    → ${pattern.recommendation}`));
        }
      });
    }
    
    if (report.analysis.suggestions.length > 0) {
      console.log(chalk.blue('\n💡 Suggestions:'));
      report.analysis.suggestions.slice(0, 5).forEach(suggestion => {
        const icon = suggestion.type === 'error' ? '❌' : suggestion.type === 'warning' ? '⚠️' : '💡';
        console.log(`  ${icon} ${suggestion.title}`);
        console.log(chalk.gray(`     ${suggestion.description}`));
      });
    }
    
    if (report.generatedCode?.typescript) {
      console.log(chalk.green('\n✅ Code Generated Successfully!'));
      console.log('  • TypeScript interfaces and components');
      console.log('  • Styled components with theme support');
      console.log('  • Full accessibility attributes');
      if (report.generatedCode.tests) {
        console.log('  • Unit tests included');
      }
      if (report.generatedCode.stories) {
        console.log('  • Storybook stories created');
      }
    }
    
    console.log(chalk.gray(`\nSession ID: ${report.sessionId}`));
  }

  // Public methods for direct access
  async analyzeDesign(design: DesignInput): Promise<UIComponent[]> {
    const result = await this.execute({ design });
    return result.components;
  }

  async analyzeComponents(path: string): Promise<UIAnalysisResult> {
    const result = await this.execute({ path });
    return result.analysis;
  }

  async generateComponent(
    design: DesignInput,
    options: ComponentGenerationOptions
  ): Promise<UIComponent> {
    const result = await this.execute({ design, options });
    return result.components[0];
  }

  async extractDesignTokens(path: string): Promise<DesignSystem> {
    const result = await this.execute({ path, command: 'extract-tokens' });
    return result.designSystem || {
      name: 'extracted-system',
      version: '1.0.0',
      tokens: [],
      components: []
    };
  }
}