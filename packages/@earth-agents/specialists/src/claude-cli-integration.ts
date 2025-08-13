#!/usr/bin/env node

/**
 * Claude Code CLI Integration
 * 
 * This module integrates Earth Agents with Claude Code's CLI,
 * enabling slash commands to be executed directly in Claude Code.
 */

import { claudeCodeBridge, handleClaudeCommand } from './claude-code-bridge';
import { registerAllSpecialists } from './agents';

/**
 * Claude Code Plugin Interface
 */
export interface ClaudeCodePlugin {
  name: string;
  version: string;
  commands: SlashCommandDefinition[];
  onCommand: (command: string, args: string) => Promise<string>;
}

/**
 * Slash Command Definition for Claude Code
 */
export interface SlashCommandDefinition {
  name: string;
  description: string;
  usage: string;
  examples?: string[];
  category?: string;
}

/**
 * Earth Agents Claude Code Plugin
 */
export class EarthAgentsPlugin implements ClaudeCodePlugin {
  name = 'earth-agents';
  version = '1.0.0';
  commands: SlashCommandDefinition[] = [];

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the plugin
   */
  private initialize(): void {
    // Register all specialists
    registerAllSpecialists();
    
    // Build command definitions from registered specialists
    this.buildCommandDefinitions();
    
    console.log(`🚀 Earth Agents Plugin initialized with ${this.commands.length} commands`);
  }

  /**
   * Build command definitions from registered specialists
   */
  private buildCommandDefinitions(): void {
    const commands = claudeCodeBridge.getCommands();
    
    this.commands = commands.map(cmd => {
      const cleanName = cmd.substring(1); // Remove leading slash
      
      return {
        name: cleanName,
        description: this.getCommandDescription(cmd),
        usage: `${cmd} "your request here"`,
        examples: this.getCommandExamples(cmd),
        category: this.getCommandCategory(cmd)
      };
    });

    // Add special commands
    this.commands.push(
      {
        name: 'help',
        description: 'Show all available Earth Agents commands',
        usage: '/help [filter]',
        examples: ['/help', '/help python', '/help security'],
        category: 'system'
      },
      {
        name: 'agents',
        description: 'List all available Earth Agents specialists',
        usage: '/agents',
        examples: ['/agents'],
        category: 'system'
      },
      {
        name: 'search',
        description: 'Search for Earth Agents by capability',
        usage: '/search <query>',
        examples: ['/search react', '/search kubernetes', '/search optimization'],
        category: 'system'
      }
    );
  }

  /**
   * Get command description
   */
  private getCommandDescription(command: string): string {
    const descriptions: Record<string, string> = {
      '/python-pro': 'Expert Python developer with modern async patterns and ML',
      '/rust-pro': 'Expert Rust developer with systems programming expertise',
      '/golang-pro': 'Expert Go developer with cloud-native patterns',
      '/javascript-pro': 'Expert JavaScript developer with ES2024+ features',
      '/typescript-pro': 'Expert TypeScript developer with advanced type system',
      '/backend-architect': 'Expert backend architect for scalable systems',
      '/frontend-developer': 'Expert React developer with modern patterns',
      '/security-auditor': 'Expert security auditor with OWASP practices',
      '/kubernetes-expert': 'Expert Kubernetes engineer with GitOps',
      '/ml-engineer': 'Expert ML engineer with LLMs and vector databases'
    };
    
    return descriptions[command] || 'Specialist agent';
  }

  /**
   * Get command examples
   */
  private getCommandExamples(command: string): string[] {
    const examples: Record<string, string[]> = {
      '/python-pro': [
        '/python-pro "optimize this async function"',
        '/python-pro "create FastAPI app with JWT auth"'
      ],
      '/security-auditor': [
        '/security-auditor "review this authentication code"',
        '/security-auditor "check for SQL injection vulnerabilities"'
      ],
      '/backend-architect': [
        '/backend-architect "design microservices for e-commerce"',
        '/backend-architect "optimize database schema for scale"'
      ]
    };
    
    return examples[command] || [`${command} "your request"`];
  }

  /**
   * Get command category
   */
  private getCommandCategory(command: string): string {
    const categories: Record<string, string> = {
      '/python-pro': 'language',
      '/rust-pro': 'language',
      '/golang-pro': 'language',
      '/javascript-pro': 'language',
      '/typescript-pro': 'language',
      '/backend-architect': 'architecture',
      '/frontend-developer': 'development',
      '/security-auditor': 'quality',
      '/kubernetes-expert': 'infrastructure',
      '/ml-engineer': 'ai-ml'
    };
    
    return categories[command] || 'general';
  }

  /**
   * Handle a command from Claude Code
   */
  async onCommand(command: string, args: string): Promise<string> {
    const fullCommand = `/${command} ${args}`.trim();
    return handleClaudeCommand(fullCommand);
  }
}

/**
 * Register the plugin with Claude Code
 */
export function registerWithClaudeCode(): void {
  // This would be called by Claude Code's plugin system
  const plugin = new EarthAgentsPlugin();
  
  // In a real integration, this would register with Claude Code's API
  // For now, we'll export the plugin for manual integration
  if (typeof global !== 'undefined') {
    (global as any).earthAgentsPlugin = plugin;
  }
  
  console.log('✅ Earth Agents registered with Claude Code');
}

/**
 * CLI Handler for testing
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Earth Agents Claude Code Integration');
    console.log('Usage: earth-agents <command> [args]');
    console.log('Example: earth-agents python-pro "optimize this code"');
    console.log('');
    console.log('Run "earth-agents help" for all commands');
    process.exit(0);
  }

  const command = args[0];
  const prompt = args.slice(1).join(' ');

  const plugin = new EarthAgentsPlugin();
  
  plugin.onCommand(command, prompt).then(result => {
    console.log(result);
  }).catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

// Export for use in Claude Code
export default EarthAgentsPlugin;
export { registerWithClaudeCode, EarthAgentsPlugin };