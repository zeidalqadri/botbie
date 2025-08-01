/**
 * Earth Agents Specialists Module
 * 
 * Integrates specialist agents from wshobson/agents into the Earth Agents ecosystem
 */

export * from './types';
export * from './SpecialistAgentAdapter';
export * from './agents';
export * from './strategies';

// Re-export key items for convenience
export { SpecialistAgentAdapter, specialistRegistry } from './SpecialistAgentAdapter';
export { registerAllSpecialists } from './agents';