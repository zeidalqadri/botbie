import { BaseStrategy } from './BaseStrategy';
import { SpecialistAgentAdapter } from '../SpecialistAgentAdapter';
import { PromptOptimizationContext, PromptOptimizationResult } from '../types';

/**
 * Prompt Optimization Strategy using AI optimization specialists
 * Systematically improves prompts using prompt engineering best practices
 */
export class PromptOptimizationStrategy extends BaseStrategy {
  private promptEngineer: SpecialistAgentAdapter;
  private aiEngineer: SpecialistAgentAdapter;
  private optimizationSpecialist: SpecialistAgentAdapter;

  constructor() {
    super();
    this.addSpecialist('prompt-engineer', this.createAdapter('prompt-engineer'));
    this.addSpecialist('ai-engineer', this.createAdapter('ai-engineer'));
    this.addSpecialist('ai-optimization-specialist', this.createAdapter('ai-optimization-specialist'));
  }

  async optimizePrompt(context: PromptOptimizationContext): Promise<PromptOptimizationResult> {
    const { originalPrompt, useCase, targetModel, performanceGoals } = context;

    // Phase 1: Analyze current prompt structure
    const analysisResult = await this.analyzePromptStructure(originalPrompt, useCase);
    
    // Phase 2: Apply prompt engineering techniques
    const engineeredPrompt = await this.applyPromptEngineering(originalPrompt, analysisResult, targetModel);
    
    // Phase 3: Optimize for specific model and use case
    const optimizedPrompt = await this.optimizeForModel(engineeredPrompt, targetModel, performanceGoals);
    
    // Phase 4: Create testing framework
    const testingFramework = await this.createTestingFramework(originalPrompt, optimizedPrompt, useCase);

    return {
      originalPrompt,
      optimizedPrompt,
      improvements: analysisResult.improvements,
      techniques: engineeredPrompt.techniques,
      expectedPerformance: optimizedPrompt.expectedPerformance,
      testingFramework,
      confidence: this.calculateConfidence(analysisResult, engineeredPrompt, optimizedPrompt)
    };
  }

  private async analyzePromptStructure(prompt: string, useCase: string) {
    const promptEngineer = this.getSpecialist('prompt-engineer');
    
    const analysisPrompt = `
Analyze this prompt for optimization opportunities:

ORIGINAL PROMPT:
"""
${prompt}
"""

USE CASE: ${useCase}

Please analyze:
1. Current prompt structure and clarity
2. Missing prompt engineering techniques
3. Opportunities for few-shot examples
4. Chain-of-thought reasoning potential
5. Output format specification needs
6. Constitutional AI principle alignment
7. Token efficiency improvements
8. Model-specific optimization opportunities

Provide specific, actionable recommendations for each area.

Output your analysis in this JSON format:
{
  "structureAnalysis": {
    "clarity": "score 1-10 with explanation",
    "completeness": "score 1-10 with explanation",
    "specificity": "score 1-10 with explanation"
  },
  "missingTechniques": ["list of missing prompt engineering techniques"],
  "improvements": [
    {
      "area": "specific area for improvement",
      "current": "what the prompt currently does",
      "recommended": "specific recommendation",
      "impact": "expected impact (high/medium/low)",
      "effort": "implementation effort (high/medium/low)"
    }
  ],
  "overallScore": "current effectiveness score 1-100",
  "potentialScore": "potential effectiveness after optimization 1-100"
}
`;

    return await promptEngineer?.invoke(analysisPrompt, {
      focus: 'structural-analysis',
      depth: 'comprehensive',
      outputFormat: 'json'
    });
  }

  private async applyPromptEngineering(originalPrompt: string, analysis: any, targetModel: string) {
    const promptEngineer = this.getSpecialist('prompt-engineer');
    
    const engineeringPrompt = `
Apply advanced prompt engineering techniques to improve this prompt:

ORIGINAL PROMPT:
"""
${originalPrompt}
"""

ANALYSIS RESULTS:
${JSON.stringify(analysis, null, 2)}

TARGET MODEL: ${targetModel}

Apply these techniques systematically:

1. **Role Definition Enhancement**
   - Create specific, expert-level persona
   - Define clear expertise areas and experience level

2. **Few-Shot Learning**
   - Add 2-3 high-quality examples
   - Show desired input-output patterns
   - Include edge cases and complex scenarios

3. **Chain-of-Thought Reasoning**
   - Structure the thinking process
   - Show step-by-step analysis
   - Include decision points and rationale

4. **Constitutional AI Principles**
   - Emphasize helpful, harmless, honest approach
   - Add ethical considerations where relevant
   - Include bias awareness and mitigation

5. **Output Format Specification**
   - Define clear, structured output format
   - Use JSON schemas or markdown templates
   - Specify required vs optional elements

6. **Constraint Definition**
   - Set clear boundaries and limitations
   - Define scope and context requirements
   - Specify quality and completeness standards

Create an optimized prompt that incorporates these techniques while maintaining the original intent.

Output format:
{
  "optimizedPrompt": "the improved prompt with all techniques applied",
  "techniques": [
    {
      "name": "technique name",
      "description": "how it was applied",
      "benefit": "expected improvement"
    }
  ],
  "examples": [
    {
      "input": "example input",
      "output": "example expected output",
      "reasoning": "why this example is effective"
    }
  ],
  "structuralImprovements": ["list of structural changes made"]
}
`;

    return await promptEngineer?.invoke(engineeringPrompt, {
      focus: 'technique-application',
      depth: 'comprehensive',
      targetModel,
      outputFormat: 'json'
    });
  }

  private async optimizeForModel(engineeredPrompt: any, targetModel: string, performanceGoals: any) {
    const aiEngineer = this.getSpecialist('ai-engineer');
    
    const optimizationPrompt = `
Optimize this engineered prompt specifically for ${targetModel} and the given performance goals:

ENGINEERED PROMPT:
"""
${engineeredPrompt.optimizedPrompt}
"""

APPLIED TECHNIQUES:
${JSON.stringify(engineeredPrompt.techniques, null, 2)}

TARGET MODEL: ${targetModel}

PERFORMANCE GOALS:
${JSON.stringify(performanceGoals, null, 2)}

Model-specific optimization considerations:

For Claude:
- Emphasize Constitutional AI principles (helpful, harmless, honest)
- Use clear structure and explicit instructions
- Leverage Claude's strength in reasoning and analysis
- Optimize for context window efficiency

For GPT models:
- Use clear, direct instructions
- Provide explicit examples and formats
- Structure for consistent outputs
- Optimize token usage and costs

For other models:
- Adapt based on model-specific strengths
- Consider training data and capabilities
- Optimize for model limitations

Apply these optimizations:
1. Token efficiency improvements
2. Model-specific prompt patterns
3. Performance-cost balance optimization
4. Reliability and consistency enhancements
5. Error handling and edge case management

Output format:
{
  "modelOptimizedPrompt": "final optimized prompt for target model",
  "optimizations": [
    {
      "type": "optimization type",
      "change": "what was changed",
      "reason": "why this optimization helps",
      "expectedImpact": "performance improvement expected"
    }
  ],
  "expectedPerformance": {
    "accuracy": "expected accuracy improvement %",
    "consistency": "expected consistency improvement %",
    "tokenEfficiency": "expected token savings %",
    "responseTime": "expected speed improvement %"
  },
  "fallbackStrategies": ["strategies for handling edge cases"]
}
`;

    return await aiEngineer?.invoke(optimizationPrompt, {
      focus: 'model-optimization',
      targetModel,
      performanceGoals,
      outputFormat: 'json'
    });
  }

  private async createTestingFramework(originalPrompt: string, optimizedPrompt: any, useCase: string) {
    const optimizationSpecialist = this.getSpecialist('ai-optimization-specialist');
    
    const frameworkPrompt = `
Create a comprehensive testing framework to validate prompt optimization improvements:

ORIGINAL PROMPT:
"""
${originalPrompt}
"""

OPTIMIZED PROMPT:
"""
${optimizedPrompt.modelOptimizedPrompt}
"""

USE CASE: ${useCase}

Create a testing framework that includes:

1. **Test Scenarios**
   - Representative use cases
   - Edge cases and boundary conditions
   - Performance stress tests
   - Error condition handling

2. **Evaluation Metrics**
   - Output quality scoring rubric
   - Consistency measurement methods
   - Token usage tracking
   - Response time benchmarks

3. **A/B Testing Protocol**
   - Test design and methodology
   - Sample size recommendations
   - Statistical significance thresholds
   - Results interpretation guidelines

4. **Performance Benchmarks**
   - Baseline performance metrics
   - Target improvement thresholds
   - Success criteria definition
   - Regression detection methods

Output format:
{
  "testScenarios": [
    {
      "name": "scenario name",
      "input": "test input",
      "expectedOutputCriteria": "what makes a good output",
      "difficulty": "easy/medium/hard"
    }
  ],
  "evaluationMetrics": {
    "qualityRubric": "scoring methodology for output quality",
    "consistencyMeasure": "how to measure response consistency",
    "efficiencyMetrics": "token and time measurement methods"
  },
  "abTestingProtocol": {
    "methodology": "detailed testing approach",
    "sampleSize": "recommended test size",
    "duration": "recommended test duration",
    "successCriteria": "what constitutes successful optimization"
  },
  "implementationGuide": "step-by-step testing implementation"
}
`;

    return await optimizationSpecialist?.invoke(frameworkPrompt, {
      focus: 'testing-framework',
      useCase,
      outputFormat: 'json'
    });
  }

  private calculateConfidence(analysis: any, engineering: any, optimization: any): number {
    // Calculate confidence score based on multiple factors
    const analysisScore = analysis?.overallScore || 50;
    const improvementPotential = (analysis?.potentialScore || 80) - analysisScore;
    const techniquesApplied = engineering?.techniques?.length || 0;
    const optimizationsApplied = optimization?.optimizations?.length || 0;
    
    // Weighted confidence calculation
    const baseConfidence = Math.min(analysisScore / 100, 1) * 0.3;
    const improvementConfidence = Math.min(improvementPotential / 50, 1) * 0.3;
    const techniqueConfidence = Math.min(techniquesApplied / 6, 1) * 0.2;
    const optimizationConfidence = Math.min(optimizationsApplied / 5, 1) * 0.2;
    
    return Math.round((baseConfidence + improvementConfidence + techniqueConfidence + optimizationConfidence) * 100);
  }
}