/**
 * Register all specialist agents
 */

import { registerDevelopmentSpecialists } from './development';
import { registerLanguageSpecialists } from './languages';
import { registerQualitySecuritySpecialists } from './quality-security';
import { registerInfrastructureSpecialists } from './infrastructure';
import { registerDataAISpecialists } from './data-ai';
import { registerAIOptimizationSpecialists } from './ai-optimization';

export * from './development';
export * from './languages';
export * from './quality-security';
export * from './infrastructure';
export * from './data-ai';
export * from './ai-optimization';

/**
 * Register all specialists with the global registry
 */
export function registerAllSpecialists(): void {
  registerDevelopmentSpecialists();
  registerLanguageSpecialists();
  registerQualitySecuritySpecialists();
  registerInfrastructureSpecialists();
  registerDataAISpecialists();
  registerAIOptimizationSpecialists();
}

// Auto-register on import
registerAllSpecialists();