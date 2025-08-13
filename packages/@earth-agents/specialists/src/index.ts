/**
 * Earth Agents Specialists Module
 * 
 * Integrates specialist agents from wshobson/agents into the Earth Agents ecosystem
 */

export * from './types';
export * from './SpecialistAgentAdapter';
export * from './agents';
export * from './strategies';
export * from './slash-commands';
export * from './claude-integration';

// Claude Code Bridge exports
export * from './claude-code-bridge';
export * from './claude-cli-integration';

// Re-export key items for convenience
export { SpecialistAgentAdapter, specialistRegistry } from './SpecialistAgentAdapter';
export { registerAllSpecialists } from './agents';
export { claudeSlashHandler, slash, help, youtubeExpert } from './claude-integration';
export { registerAllSlashCommands, generateSlashCommandDocs } from './slash-commands';

// Claude Code integration
export { claudeCodeBridge, handleClaudeCommand } from './claude-code-bridge';
export { EarthAgentsPlugin, registerWithClaudeCode } from './claude-cli-integration';