import { Strategy } from '@earth-agents/core';
import { CodeAnalysisContext, CodeAnalysisResult } from '@earth-agents/types';

/**
 * Base strategy class for Botbie analysis strategies
 */
export abstract class BaseStrategy implements Strategy {
  name: string;
  description: string;

  constructor() {
    this.name = this.constructor.name;
    this.description = 'Base Botbie analysis strategy';
  }

  /**
   * Execute the strategy
   */
  async execute(context: any): Promise<any> {
    // If context contains code and analysis-specific data, use analyze
    if (context.code && (context.filePath || context.language)) {
      return this.analyze(context as CodeAnalysisContext);
    }
    
    // Otherwise, return a generic result
    return {
      success: true,
      findings: [],
      suggestions: []
    };
  }

  /**
   * Analyze code with this strategy
   * To be implemented by concrete strategies
   */
  abstract analyze(context: CodeAnalysisContext): Promise<CodeAnalysisResult>;
}