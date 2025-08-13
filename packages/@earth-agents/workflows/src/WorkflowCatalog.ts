import { WorkflowTemplate, WorkflowCategory } from './types';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';

export class WorkflowCatalog {
  private templates: Map<string, WorkflowTemplate> = new Map();
  private templatePath: string;

  constructor(templatePath: string = path.join(__dirname, '../templates')) {
    this.templatePath = templatePath;
  }

  async initialize(): Promise<void> {
    await this.loadTemplates();
  }

  private async loadTemplates(): Promise<void> {
    try {
      const files = await fs.readdir(this.templatePath);
      const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

      for (const file of yamlFiles) {
        const content = await fs.readFile(path.join(this.templatePath, file), 'utf-8');
        const template = yaml.load(content) as WorkflowTemplate;
        this.templates.set(template.id, template);
      }

      console.log(`Loaded ${this.templates.size} workflow templates`);
    } catch (error) {
      console.error('Error loading workflow templates:', error);
      throw error;
    }
  }

  /**
   * Get all available workflow templates
   */
  getAllTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get a specific workflow template by ID
   */
  getTemplate(id: string): WorkflowTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: WorkflowCategory): WorkflowTemplate[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }

  /**
   * Get templates by tier
   */
  getTemplatesByTier(tier: 'starter' | 'professional' | 'enterprise'): WorkflowTemplate[] {
    return this.getAllTemplates().filter(t => t.tier === tier);
  }

  /**
   * Search templates by tags
   */
  searchByTags(tags: string[]): WorkflowTemplate[] {
    return this.getAllTemplates().filter(template =>
      tags.some(tag => template.tags.includes(tag))
    );
  }

  /**
   * Search templates by industry
   */
  searchByIndustry(industry: string): WorkflowTemplate[] {
    return this.getAllTemplates().filter(template =>
      template.industry?.includes(industry)
    );
  }

  /**
   * Get recommended templates based on user context
   */
  getRecommendedTemplates(context: {
    framework?: string;
    projectType?: string;
    teamSize?: number;
    industry?: string;
  }): WorkflowTemplate[] {
    let templates = this.getAllTemplates();
    let scores = new Map<string, number>();

    // Score based on context matching
    templates.forEach(template => {
      let score = 0;

      // Industry match
      if (context.industry && template.industry?.includes(context.industry)) {
        score += 10;
      }

      // Framework relevance
      if (context.framework) {
        const hasFramework = JSON.stringify(template).includes(context.framework);
        if (hasFramework) score += 5;
      }

      // Team size appropriateness
      if (context.teamSize) {
        if (context.teamSize < 5 && template.tier === 'starter') score += 3;
        else if (context.teamSize < 20 && template.tier === 'professional') score += 3;
        else if (context.teamSize >= 20 && template.tier === 'enterprise') score += 3;
      }

      // Project type relevance
      if (context.projectType && template.tags.includes(context.projectType)) {
        score += 5;
      }

      scores.set(template.id, score);
    });

    // Sort by score and return top recommendations
    return templates
      .sort((a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0))
      .slice(0, 5);
  }

  /**
   * Get workflow statistics
   */
  getStatistics(): {
    total: number;
    byCategory: Record<string, number>;
    byTier: Record<string, number>;
    averageExecutionTime: number;
    mostPopular: WorkflowTemplate[];
  } {
    const templates = this.getAllTemplates();
    
    const byCategory: Record<string, number> = {};
    const byTier: Record<string, number> = {};
    let totalExecutionTime = 0;

    templates.forEach(template => {
      // Category counts
      byCategory[template.category] = (byCategory[template.category] || 0) + 1;
      
      // Tier counts
      byTier[template.tier] = (byTier[template.tier] || 0) + 1;
      
      // Execution time
      const avgTime = parseInt(template.estimatedTime.split('-')[0]);
      totalExecutionTime += avgTime;
    });

    // Most popular based on execution count and rating
    const mostPopular = templates
      .filter(t => t.metrics)
      .sort((a, b) => {
        const scoreA = (a.metrics?.totalExecutions || 0) * (a.metrics?.userRating || 0);
        const scoreB = (b.metrics?.totalExecutions || 0) * (b.metrics?.userRating || 0);
        return scoreB - scoreA;
      })
      .slice(0, 3);

    return {
      total: templates.length,
      byCategory,
      byTier,
      averageExecutionTime: totalExecutionTime / templates.length,
      mostPopular
    };
  }

  /**
   * Export catalog as JSON
   */
  async exportCatalog(outputPath: string): Promise<void> {
    const catalog = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      templates: this.getAllTemplates(),
      statistics: this.getStatistics()
    };

    await fs.writeFile(outputPath, JSON.stringify(catalog, null, 2));
  }

  /**
   * Generate markdown documentation for all templates
   */
  async generateDocumentation(outputPath: string): Promise<void> {
    const templates = this.getAllTemplates();
    let markdown = '# Earth Agents Workflow Catalog\n\n';
    
    // Table of contents
    markdown += '## Table of Contents\n\n';
    templates.forEach(template => {
      markdown += `- [${template.name}](#${template.id})\n`;
    });
    markdown += '\n---\n\n';

    // Template details
    templates.forEach(template => {
      markdown += `## ${template.name} {#${template.id}}\n\n`;
      markdown += `**Category:** ${template.category}  \n`;
      markdown += `**Tier:** ${template.tier}  \n`;
      markdown += `**Difficulty:** ${template.difficulty}  \n`;
      markdown += `**Estimated Time:** ${template.estimatedTime}  \n\n`;
      
      markdown += `### Description\n${template.description}\n\n`;
      
      markdown += `### Tags\n${template.tags.map(t => `\`${t}\``).join(', ')}\n\n`;
      
      if (template.industry) {
        markdown += `### Industries\n${template.industry.join(', ')}\n\n`;
      }
      
      markdown += `### Workflow Steps\n`;
      template.nodes.forEach((node, index) => {
        markdown += `${index + 1}. **${node.name}** - ${node.description}\n`;
      });
      
      if (template.metrics) {
        markdown += `\n### Performance Metrics\n`;
        markdown += `- Success Rate: ${template.metrics.successRate}%\n`;
        markdown += `- Average Execution Time: ${template.metrics.averageExecutionTime} minutes\n`;
        markdown += `- User Rating: ${template.metrics.userRating}/5\n`;
      }
      
      markdown += '\n---\n\n';
    });

    await fs.writeFile(outputPath, markdown);
  }
}