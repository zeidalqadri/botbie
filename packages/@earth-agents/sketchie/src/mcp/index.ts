export * from './tools';
export * from './resources';
export * from './prompts';

import { sketchieTools } from './tools';
import { sketchieResources } from './resources';
import { sketchiePrompts } from './prompts';

export const sketchMCP = {
  tools: sketchieTools,
  resources: sketchieResources,
  prompts: sketchiePrompts
};