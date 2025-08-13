/**
 * Types for Specialist Agents integration
 */

import { Strategy, StrategyResult, MCPTool } from '@earth-agents/core';

export interface SpecialistAgent {
  name: string;
  description: string;
  category: SpecialistCategory;
  focusAreas: string[];
  tools?: string[];
  invoke(prompt: string, context?: any): Promise<SpecialistResult>;
}

export type SpecialistCategory = 
  | 'development'
  | 'architecture'
  | 'language'
  | 'infrastructure'
  | 'quality'
  | 'security'
  | 'data'
  | 'ai'
  | 'ai-optimization'
  | 'business'
  | 'marketing';

export interface SpecialistResult {
  success: boolean;
  output: any;
  suggestions?: string[];
  artifacts?: SpecialistArtifact[];
  confidence: number;
  metadata?: Record<string, any>;
}

export interface SpecialistArtifact {
  type: 'code' | 'diagram' | 'config' | 'documentation' | 'analysis';
  name: string;
  content: string;
  language?: string;
  description?: string;
}

export interface SpecialistStrategy extends Strategy {
  specialist: string;
  adaptPrompt(context: any): string;
}

export interface SpecialistDefinition {
  name: string;
  description: string;
  category: SpecialistCategory;
  focusAreas: string[];
  approaches?: string[];  // Made optional and renamed for clarity
  approach?: string[];    // Keep backward compatibility
  outputs: string[];
  keyPrinciple?: string;
  tools?: string[];
  subagentType?: string;
  examples?: SpecialistExample[];  // Few-shot examples for better performance
}

export interface SpecialistExample {
  input: string;
  output: string;
  reasoning: string;
}

export interface SpecialistRegistry {
  register(specialist: SpecialistDefinition): void;
  get(name: string): SpecialistDefinition | undefined;
  list(): SpecialistDefinition[];
  listByCategory(category: SpecialistCategory): SpecialistDefinition[];
  search(query: string): SpecialistDefinition[];
}

export interface SpecialistInvocation {
  specialist: string;
  prompt: string;
  context?: {
    codeContext?: string;
    projectType?: string;
    language?: string;
    framework?: string;
    requirements?: string[];
  };
  options?: {
    temperature?: number;
    maxTokens?: number;
    includeExamples?: boolean;
  };
}

export interface SpecialistMCPTool extends MCPTool {
  specialist: string;
  category: SpecialistCategory;
}

// Prompt Optimization Types
export interface PromptOptimizationContext {
  originalPrompt: string;
  useCase: string;
  targetModel?: string;
  performanceGoals?: {
    accuracy?: number;
    consistency?: number;
    tokenEfficiency?: number;
    responseTime?: number;
  };
  constraints?: {
    maxTokens?: number;
    outputFormat?: string;
    domainSpecific?: string[];
  };
}

export interface PromptOptimizationResult {
  originalPrompt: string;
  optimizedPrompt: string;
  improvements: PromptImprovement[];
  techniques: PromptTechnique[];
  expectedPerformance: {
    accuracy: string;
    consistency: string;
    tokenEfficiency: string;
    responseTime: string;
  };
  testingFramework: PromptTestingFramework;
  confidence: number;
}

export interface PromptImprovement {
  area: string;
  current: string;
  recommended: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
}

export interface PromptTechnique {
  name: string;
  description: string;
  benefit: string;
}

export interface PromptTestingFramework {
  testScenarios: PromptTestScenario[];
  evaluationMetrics: {
    qualityRubric: string;
    consistencyMeasure: string;
    efficiencyMetrics: string;
  };
  abTestingProtocol: {
    methodology: string;
    sampleSize: string;
    duration: string;
    successCriteria: string;
  };
  implementationGuide: string;
}

export interface PromptTestScenario {
  name: string;
  input: string;
  expectedOutputCriteria: string;
  difficulty: 'easy' | 'medium' | 'hard';
}