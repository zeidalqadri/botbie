import { 
  SpecialistAgent, 
  SpecialistResult, 
  SpecialistInvocation,
  SpecialistRegistry,
  SpecialistDefinition,
  SpecialistCategory
} from './types';
import { Task } from '@earth-agents/core';

export class SpecialistAgentAdapter implements SpecialistAgent {
  name: string;
  description: string;
  category: SpecialistCategory;
  focusAreas: string[];
  tools?: string[];
  private taskTool?: typeof Task;

  constructor(definition: SpecialistDefinition) {
    this.name = definition.name;
    this.description = definition.description;
    this.category = definition.category;
    this.focusAreas = definition.focusAreas;
    this.tools = definition.tools;
  }

  /**
   * Set the Task tool for invoking specialists through Claude Code
   */
  setTaskTool(taskTool: typeof Task): void {
    this.taskTool = taskTool;
  }

  /**
   * Invoke the specialist agent
   */
  async invoke(prompt: string, context?: any): Promise<SpecialistResult> {
    if (!this.taskTool) {
      throw new Error('Task tool not configured. Call setTaskTool() first.');
    }

    try {
      // Build the specialist prompt with context
      const fullPrompt = this.buildPrompt(prompt, context);

      // Invoke through Claude Code Task tool
      const result = await this.taskTool({
        description: `Invoke ${this.name} specialist`,
        prompt: fullPrompt,
        subagent_type: this.name.toLowerCase().replace(/\s+/g, '-')
      });

      // Parse and structure the result
      return this.parseResult(result);
    } catch (error) {
      return {
        success: false,
        output: null,
        suggestions: [`Error invoking ${this.name}: ${error}`],
        confidence: 0
      };
    }
  }

  /**
   * Build a contextualized prompt for the specialist
   */
  private buildPrompt(prompt: string, context?: any): string {
    let fullPrompt = `As a ${this.name} specialist:\n\n`;
    
    // Add context if provided
    if (context) {
      if (context.codeContext) {
        fullPrompt += `Code Context:\n${context.codeContext}\n\n`;
      }
      if (context.projectType) {
        fullPrompt += `Project Type: ${context.projectType}\n`;
      }
      if (context.language) {
        fullPrompt += `Language: ${context.language}\n`;
      }
      if (context.framework) {
        fullPrompt += `Framework: ${context.framework}\n`;
      }
      if (context.requirements?.length) {
        fullPrompt += `Requirements:\n${context.requirements.map(r => `- ${r}`).join('\n')}\n`;
      }
      fullPrompt += '\n';
    }

    // Add the main prompt
    fullPrompt += `Task: ${prompt}\n\n`;
    
    // Add focus areas
    fullPrompt += `Focus on: ${this.focusAreas.join(', ')}\n`;

    return fullPrompt;
  }

  /**
   * Parse the specialist result into structured format
   */
  private parseResult(rawResult: any): SpecialistResult {
    // If result is already structured
    if (rawResult && typeof rawResult === 'object' && 'success' in rawResult) {
      return rawResult;
    }

    // Parse text result
    const artifacts = this.extractArtifacts(rawResult);
    const suggestions = this.extractSuggestions(rawResult);

    return {
      success: true,
      output: rawResult,
      artifacts,
      suggestions,
      confidence: 0.85,
      metadata: {
        specialist: this.name,
        category: this.category
      }
    };
  }

  /**
   * Extract code artifacts from the result
   */
  private extractArtifacts(result: any): any[] {
    const artifacts: any[] = [];
    const resultStr = typeof result === 'string' ? result : JSON.stringify(result);

    // Extract code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(resultStr)) !== null) {
      artifacts.push({
        type: 'code',
        name: `code-${artifacts.length + 1}`,
        content: match[2],
        language: match[1] || 'plaintext'
      });
    }

    return artifacts;
  }

  /**
   * Extract suggestions from the result
   */
  private extractSuggestions(result: any): string[] {
    const suggestions: string[] = [];
    const resultStr = typeof result === 'string' ? result : JSON.stringify(result);

    // Look for bullet points that might be suggestions
    const bulletRegex = /^[\s]*[-*]\s+(.+)$/gm;
    let match;
    
    while ((match = bulletRegex.exec(resultStr)) !== null) {
      const line = match[1].trim();
      if (line.length > 20 && line.length < 200) {
        suggestions.push(line);
      }
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }
}

/**
 * Specialist Registry implementation
 */
export class SpecialistRegistryImpl implements SpecialistRegistry {
  private specialists: Map<string, SpecialistDefinition> = new Map();

  register(specialist: SpecialistDefinition): void {
    this.specialists.set(specialist.name, specialist);
  }

  get(name: string): SpecialistDefinition | undefined {
    return this.specialists.get(name);
  }

  list(): SpecialistDefinition[] {
    return Array.from(this.specialists.values());
  }

  listByCategory(category: SpecialistCategory): SpecialistDefinition[] {
    return this.list().filter(s => s.category === category);
  }

  search(query: string): SpecialistDefinition[] {
    const lowerQuery = query.toLowerCase();
    return this.list().filter(s => 
      s.name.toLowerCase().includes(lowerQuery) ||
      s.description.toLowerCase().includes(lowerQuery) ||
      s.focusAreas.some(f => f.toLowerCase().includes(lowerQuery))
    );
  }
}

// Global registry instance
export const specialistRegistry = new SpecialistRegistryImpl();