/**
 * Register all specialist agents
 */

import { registerDevelopmentSpecialists } from './development';
import { registerLanguageSpecialists } from './languages';
import { registerQualitySecuritySpecialists } from './quality-security';
import { registerInfrastructureSpecialists } from './infrastructure';
import { registerDataAISpecialists } from './data-ai';
import { registerAIOptimizationSpecialists } from './ai-optimization';
import { registerPythonBackendSpecialist } from './python-backend-expert';
import { registerSupabaseSpecialist } from './supabase-expert';
import { registerN8nSpecialist } from './n8n-expert';
import { registerCloudflareSpecialist } from './cloudflare-expert';
import { registerYouTubeExpert } from './youtube-expert';
import { registerLintahExpert } from './lintah-expert';

export * from './development';
export * from './languages';
export * from './quality-security';
export * from './infrastructure';
export * from './data-ai';
export * from './ai-optimization';
export * from './python-backend-expert';
export * from './supabase-expert';
export * from './n8n-expert';
export * from './cloudflare-expert';
export * from './youtube-expert';
export * from './lintah-expert';

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
  registerPythonBackendSpecialist();
  registerSupabaseSpecialist();
  registerN8nSpecialist();
  registerCloudflareSpecialist();
  registerYouTubeExpert();
  registerLintahExpert();
}

// Auto-register on import
registerAllSpecialists();