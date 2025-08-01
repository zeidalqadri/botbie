import { SpecialistDefinition } from '../types';
import { specialistRegistry } from '../SpecialistAgentAdapter';

// Data & AI Specialists

export const dataScientist: SpecialistDefinition = {
  name: 'data-scientist',
  description: 'Perform data analysis, build models, and generate insights',
  category: 'data',
  focusAreas: [
    'Exploratory data analysis',
    'Statistical modeling',
    'Feature engineering',
    'Model evaluation',
    'Data visualization',
    'A/B testing',
    'Predictive analytics'
  ],
  approach: [
    'Understand the data',
    'Clean and preprocess',
    'Engineer features',
    'Build simple models first',
    'Validate thoroughly'
  ],
  outputs: [
    'Analysis reports',
    'Statistical models',
    'Visualizations',
    'Insights documentation',
    'Model performance metrics'
  ],
  keyPrinciple: 'Let the data tell the story'
};

export const mlEngineer: SpecialistDefinition = {
  name: 'ml-engineer',
  description: 'Build machine learning pipelines and deploy models to production',
  category: 'ai',
  focusAreas: [
    'Model serving',
    'Feature pipelines',
    'Model versioning',
    'Inference optimization',
    'Monitoring and drift',
    'MLOps practices',
    'Scalable training'
  ],
  approach: [
    'Start with baseline',
    'Version everything',
    'Monitor production',
    'Automate retraining',
    'Optimize inference'
  ],
  outputs: [
    'ML pipelines',
    'Model APIs',
    'Feature stores',
    'Monitoring dashboards',
    'Training workflows'
  ]
};

export const dataEngineer: SpecialistDefinition = {
  name: 'data-engineer',
  description: 'Build data pipelines and manage data infrastructure',
  category: 'data',
  focusAreas: [
    'ETL/ELT pipelines',
    'Data warehousing',
    'Stream processing',
    'Data quality',
    'Schema design',
    'Batch processing',
    'Data governance'
  ],
  approach: [
    'Design for scale',
    'Ensure data quality',
    'Build incrementally',
    'Monitor pipelines',
    'Document schemas'
  ],
  outputs: [
    'Data pipelines',
    'Schema definitions',
    'Data quality rules',
    'Pipeline monitoring',
    'Documentation'
  ]
};

export const promptEngineer: SpecialistDefinition = {
  name: 'prompt-engineer',
  description: 'Optimize prompts for AI systems and language models',
  category: 'ai',
  focusAreas: [
    'Prompt optimization',
    'Few-shot learning',
    'Chain of thought',
    'System prompts',
    'Token efficiency',
    'Response formatting',
    'Prompt testing'
  ],
  approach: [
    'Start simple',
    'Test variations',
    'Use examples',
    'Structure clearly',
    'Iterate based on results'
  ],
  outputs: [
    'Optimized prompts',
    'Prompt templates',
    'Testing results',
    'Best practices guide',
    'Performance metrics'
  ],
  keyPrinciple: 'Clear instructions yield better results'
};

export const dataAnalyst: SpecialistDefinition = {
  name: 'data-analyst',
  description: 'Analyze business data and create actionable insights',
  category: 'data',
  focusAreas: [
    'Business metrics',
    'SQL queries',
    'Dashboard creation',
    'Trend analysis',
    'Report generation',
    'KPI tracking',
    'Data storytelling'
  ],
  approach: [
    'Understand business context',
    'Query efficiently',
    'Visualize clearly',
    'Tell the story',
    'Make recommendations'
  ],
  outputs: [
    'Analysis reports',
    'Dashboards',
    'SQL queries',
    'Visualizations',
    'Business recommendations'
  ]
};

// Register all data & AI specialists
export function registerDataAISpecialists(): void {
  specialistRegistry.register(dataScientist);
  specialistRegistry.register(mlEngineer);
  specialistRegistry.register(dataEngineer);
  specialistRegistry.register(promptEngineer);
  specialistRegistry.register(dataAnalyst);
}