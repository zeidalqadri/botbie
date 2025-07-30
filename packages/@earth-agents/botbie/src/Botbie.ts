import {
  EarthAgent,
  AgentConfig,
  KnowledgeGraph,
  CodeNode,
  QualityMetrics,
  CodeSmell,
  Strategy,
  logger
} from '@earth-agents/core';
import { CodeParser } from './parsers/CodeParser';
import { QualityAnalyzer } from './analyzers/QualityAnalyzer';
import { ReportGenerator } from './reports/ReportGenerator';
import chalk from 'chalk';

export interface BotbieConfig extends AgentConfig {
  enableAutoFix?: boolean;
  strictMode?: boolean;
  customRules?: string[];
  ignorePatterns?: string[];
}

export interface CodeHealthReport {
  sessionId: string;
  timestamp: Date;
  summary: {
    totalFiles: number;
    totalIssues: number;
    criticalIssues: number;
    qualityScore: number;
  };
  issues: CodeIssue[];
  suggestions: Suggestion[];
  metrics: ProjectMetrics;
}

export interface CodeIssue {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  file: string;
  line?: number;
  description: string;
  suggestion?: string;
  autoFixAvailable?: boolean;
}

export interface Suggestion {
  type: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
}

export interface ProjectMetrics {
  linesOfCode: number;
  fileCount: number;
  testCoverage?: number;
  complexityScore: number;
  maintainabilityIndex: number;
  technicalDebt: number; // in hours
}

export class Botbie extends EarthAgent {
  name = 'Botbie';
  private knowledgeGraph: KnowledgeGraph;
  private codeParser: CodeParser;
  private qualityAnalyzer: QualityAnalyzer;
  private reportGenerator: ReportGenerator;
  
  constructor(config: BotbieConfig = {}) {
    super({
      ...config,
      description: config.description || 'The proactive code quality guardian'
    });
    
    this.knowledgeGraph = new KnowledgeGraph();
    this.codeParser = new CodeParser();
    this.qualityAnalyzer = new QualityAnalyzer(this.knowledgeGraph);
    this.reportGenerator = new ReportGenerator();
  }
  
  protected async setupStrategies(): Promise<void> {
    // Strategies will be implemented in separate files
    // For now, we'll add them as we implement them
    logger.info('Setting up Botbie strategies...');
  }
  
  async execute(input: { path: string; options?: any }): Promise<CodeHealthReport> {
    const session = this.createSession(`Analyzing codebase at ${input.path}`);
    
    try {
      // Step 1: Parse code and build knowledge graph
      console.log(chalk.blue('\n📊 Building code knowledge graph...'));
      await this.buildKnowledgeGraph(input.path);
      
      // Step 2: Run quality analysis
      console.log(chalk.blue('\n🔍 Analyzing code quality...'));
      const issues = await this.analyzeCodeQuality(session.id);
      
      // Step 3: Generate suggestions
      console.log(chalk.blue('\n💡 Generating improvement suggestions...'));
      const suggestions = await this.generateSuggestions(session.id);
      
      // Step 4: Calculate metrics
      console.log(chalk.blue('\n📈 Calculating project metrics...'));
      const metrics = await this.calculateMetrics();
      
      // Step 5: Generate report
      const report: CodeHealthReport = {
        sessionId: session.id,
        timestamp: new Date(),
        summary: {
          totalFiles: this.knowledgeGraph.getStatistics().totalNodes,
          totalIssues: issues.length,
          criticalIssues: issues.filter(i => i.severity === 'critical').length,
          qualityScore: this.calculateQualityScore(issues, metrics)
        },
        issues,
        suggestions,
        metrics
      };
      
      // Step 6: Print summary
      this.printSummary(report);
      
      // Step 7: Save detailed report
      await this.reportGenerator.generateReport(report, input.options?.outputPath);
      
      session.status = 'resolved';
      
      if (this.config.webhooks?.onComplete) {
        this.config.webhooks.onComplete(report);
      }
      
      return report;
      
    } catch (error) {
      logger.error('Botbie analysis failed:', error);
      session.status = 'resolved';
      throw error;
    }
  }
  
  private async buildKnowledgeGraph(path: string): Promise<void> {
    const files = await this.codeParser.findSourceFiles(path);
    logger.info(`Found ${files.length} source files`);
    
    for (const file of files) {
      const nodes = await this.codeParser.parseFile(file);
      nodes.forEach(node => this.knowledgeGraph.addNode(node));
    }
    
    // Build relationships
    await this.codeParser.buildRelationships(this.knowledgeGraph);
    
    const stats = this.knowledgeGraph.getStatistics();
    logger.info(`Knowledge graph built: ${stats.totalNodes} nodes, ${stats.totalEdges} relationships`);
  }
  
  private async analyzeCodeQuality(sessionId: string): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    
    // Analyze each node in the graph
    const nodes = Array.from(this.knowledgeGraph['graph'].nodes.values());
    
    for (const node of nodes) {
      const nodeIssues = await this.qualityAnalyzer.analyzeNode(node);
      issues.push(...nodeIssues);
      
      // Add evidence to session
      if (nodeIssues.length > 0) {
        await this.addEvidence(sessionId, 'code-quality', {
          nodeId: node.id,
          issues: nodeIssues
        });
      }
    }
    
    // Find global issues
    const globalIssues = await this.qualityAnalyzer.findGlobalIssues();
    issues.push(...globalIssues);
    
    return issues;
  }
  
  private async generateSuggestions(sessionId: string): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];
    const stats = this.knowledgeGraph.getStatistics();
    
    // Architecture suggestions
    if (stats.avgConnections > 10) {
      suggestions.push({
        type: 'architecture',
        description: 'Consider implementing a more modular architecture to reduce coupling',
        impact: 'high',
        effort: 'high'
      });
    }
    
    // Testing suggestions
    const testFiles = Array.from(this.knowledgeGraph['graph'].nodes.values())
      .filter(n => n.filePath.includes('test') || n.filePath.includes('spec'));
    
    if (testFiles.length < stats.totalNodes * 0.3) {
      suggestions.push({
        type: 'testing',
        description: 'Increase test coverage - currently below 30% of source files have tests',
        impact: 'high',
        effort: 'medium'
      });
    }
    
    // Documentation suggestions
    const undocumentedNodes = Array.from(this.knowledgeGraph['graph'].nodes.values())
      .filter(n => !n.quality || n.quality.documentationScore < 0.5);
    
    if (undocumentedNodes.length > stats.totalNodes * 0.5) {
      suggestions.push({
        type: 'documentation',
        description: 'Add documentation to public APIs - over 50% lack proper documentation',
        impact: 'medium',
        effort: 'low'
      });
    }
    
    await this.generateHypothesis(
      sessionId,
      `Generated ${suggestions.length} improvement suggestions`,
      0.9
    );
    
    return suggestions;
  }
  
  private async calculateMetrics(): Promise<ProjectMetrics> {
    const nodes = Array.from(this.knowledgeGraph['graph'].nodes.values());
    
    let totalLOC = 0;
    let totalComplexity = 0;
    let totalMaintainability = 0;
    
    nodes.forEach(node => {
      if (node.quality) {
        totalLOC += node.quality.linesOfCode || 0;
        totalComplexity += node.quality.complexity || 0;
        totalMaintainability += node.quality.maintainability || 0;
      }
    });
    
    const avgComplexity = totalComplexity / nodes.length;
    const avgMaintainability = totalMaintainability / nodes.length;
    
    return {
      linesOfCode: totalLOC,
      fileCount: new Set(nodes.map(n => n.filePath)).size,
      complexityScore: avgComplexity,
      maintainabilityIndex: avgMaintainability,
      technicalDebt: this.calculateTechnicalDebt(avgComplexity, avgMaintainability)
    };
  }
  
  private calculateQualityScore(issues: CodeIssue[], metrics: ProjectMetrics): number {
    let score = 100;
    
    // Deduct points for issues
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical': score -= 10; break;
        case 'high': score -= 5; break;
        case 'medium': score -= 2; break;
        case 'low': score -= 0.5; break;
      }
    });
    
    // Adjust for metrics
    if (metrics.complexityScore > 10) score -= 10;
    if (metrics.maintainabilityIndex < 50) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateTechnicalDebt(complexity: number, maintainability: number): number {
    // Simple technical debt calculation in hours
    const complexityDebt = Math.max(0, (complexity - 5) * 2);
    const maintainabilityDebt = Math.max(0, (100 - maintainability) * 0.5);
    
    return Math.round(complexityDebt + maintainabilityDebt);
  }
  
  private printSummary(report: CodeHealthReport): void {
    console.log(chalk.cyan('\n━'.repeat(50)));
    console.log(chalk.green.bold('\n📊 Code Health Report Summary\n'));
    
    // Quality score with color
    const scoreColor = report.summary.qualityScore >= 80 ? chalk.green :
                      report.summary.qualityScore >= 60 ? chalk.yellow :
                      chalk.red;
    
    console.log(`${chalk.bold('Quality Score:')} ${scoreColor(report.summary.qualityScore.toFixed(1) + '/100')}`);
    console.log(`${chalk.bold('Total Files:')} ${report.summary.totalFiles}`);
    console.log(`${chalk.bold('Total Issues:')} ${report.summary.totalIssues}`);
    console.log(`${chalk.bold('Critical Issues:')} ${chalk.red(report.summary.criticalIssues)}`);
    console.log(`${chalk.bold('Technical Debt:')} ${report.metrics.technicalDebt} hours`);
    
    // Top issues
    if (report.issues.length > 0) {
      console.log(chalk.yellow('\n🔍 Top Issues:'));
      report.issues
        .filter(i => i.severity === 'critical' || i.severity === 'high')
        .slice(0, 5)
        .forEach(issue => {
          const severityColor = issue.severity === 'critical' ? chalk.red : chalk.yellow;
          console.log(`  ${severityColor(`[${issue.severity.toUpperCase()}]`)} ${issue.description}`);
          if (issue.file) {
            console.log(`    ${chalk.gray(`└─ ${issue.file}${issue.line ? `:${issue.line}` : ''}`)}`);
          }
        });
    }
    
    // Top suggestions
    if (report.suggestions.length > 0) {
      console.log(chalk.blue('\n💡 Top Suggestions:'));
      report.suggestions
        .filter(s => s.impact === 'high')
        .slice(0, 3)
        .forEach(suggestion => {
          console.log(`  • ${suggestion.description}`);
          console.log(`    ${chalk.gray(`Impact: ${suggestion.impact}, Effort: ${suggestion.effort}`)}`);
        });
    }
    
    console.log(chalk.cyan('\n━'.repeat(50)));
  }
  
  // Public API methods inspired by Potpie
  async getCodeFromNodeId(nodeId: string): Promise<CodeNode | undefined> {
    return this.knowledgeGraph.getNode(nodeId);
  }
  
  async getCodeFromProbableNodeName(name: string): Promise<CodeNode[]> {
    return this.knowledgeGraph.findNodesByName(name);
  }
  
  async askKnowledgeGraphQueries(query: string): Promise<any> {
    return this.knowledgeGraph.query(query);
  }
  
  async detectChanges(basePath: string, headPath: string): Promise<any> {
    // TODO: Implement change detection
    logger.info('Change detection not yet implemented');
    return [];
  }
}