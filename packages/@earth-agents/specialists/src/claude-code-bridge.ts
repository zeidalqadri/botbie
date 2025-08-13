/**
 * Claude Code Bridge for Earth Agents Specialists
 * 
 * This bridge integrates all Earth Agents specialists with Claude Code,
 * making them available as slash commands through a unified interface.
 */

import { specialistRegistry, SpecialistAgentAdapter } from './SpecialistAgentAdapter';
import { SpecialistDefinition } from './types';

// Import all specialist registrations to ensure they're loaded
import './agents';

/**
 * Claude Code Command Interface
 */
export interface ClaudeCommand {
  command: string;
  description: string;
  handler: (prompt: string, context?: any) => Promise<ClaudeResponse>;
  category: string;
  aliases?: string[];
}

/**
 * Claude Response Format
 */
export interface ClaudeResponse {
  success: boolean;
  output: string;
  artifacts?: Array<{
    type: string;
    name: string;
    content: string;
    language?: string;
  }>;
  suggestions?: string[];
  metadata?: {
    specialist: string;
    confidence?: number;
    category?: string;
  };
}

/**
 * Claude Code Bridge - Main integration class
 */
export class ClaudeCodeBridge {
  private commands: Map<string, ClaudeCommand> = new Map();
  private specialists: Map<string, SpecialistAgentAdapter> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize all specialists and register as Claude commands
   */
  private initialize(): void {
    if (this.initialized) return;

    console.log('🚀 Initializing Claude Code Bridge for Earth Agents...');
    
    // Get all registered specialists
    const specialists = specialistRegistry.list();
    
    // Register each specialist as a Claude command
    specialists.forEach(specialist => {
      this.registerSpecialist(specialist);
    });

    // Register special commands
    this.registerSpecialCommands();
    
    this.initialized = true;
    
    console.log(`✅ Claude Code Bridge initialized with ${this.commands.size} commands`);
  }

  /**
   * Register a specialist as a Claude command
   */
  private registerSpecialist(definition: SpecialistDefinition): void {
    const adapter = new SpecialistAgentAdapter(definition);
    const commandName = `/${definition.name.replace(/_/g, '-')}`;
    
    // Store the adapter
    this.specialists.set(commandName, adapter);
    
    // Create the command
    const command: ClaudeCommand = {
      command: commandName,
      description: definition.description,
      category: definition.category,
      handler: async (prompt: string, context?: any) => {
        return this.invokeSpecialist(commandName, prompt, context);
      }
    };
    
    // Register the command
    this.commands.set(commandName, command);
    
    // Register aliases if needed
    const aliases = this.generateAliases(definition.name);
    aliases.forEach(alias => {
      const aliasCommand = { ...command, command: alias, aliases: [commandName] };
      this.commands.set(alias, aliasCommand);
    });
  }

  /**
   * Generate command aliases for better discoverability
   */
  private generateAliases(name: string): string[] {
    const aliases: string[] = [];
    
    // Common abbreviations
    const abbreviations: Record<string, string[]> = {
      'python-pro': ['/py', '/python'],
      'javascript-pro': ['/js', '/javascript'],
      'typescript-pro': ['/ts', '/typescript'],
      'golang-pro': ['/go', '/golang'],
      'rust-pro': ['/rust'],
      'backend-architect': ['/backend', '/architect'],
      'frontend-developer': ['/frontend', '/fe'],
      'security-auditor': ['/security', '/sec'],
      'performance-engineer': ['/perf', '/performance'],
      'kubernetes-expert': ['/k8s', '/kube'],
      'ml-engineer': ['/ml', '/machine-learning'],
      'python-backend-expert': ['/py-backend', '/fastapi'],
      'supabase-expert': ['/supabase', '/supa'],
      'n8n-expert': ['/n8n', '/workflow'],
      'cloudflare-expert': ['/cloudflare', '/cf'],
      'youtube-expert': ['/youtube', '/yt']
    };
    
    const key = name.replace(/_/g, '-');
    if (abbreviations[key]) {
      aliases.push(...abbreviations[key]);
    }
    
    return aliases;
  }

  /**
   * Register special commands (help, list, search)
   */
  private registerSpecialCommands(): void {
    // Help command
    this.commands.set('/help', {
      command: '/help',
      description: 'Show all available Earth Agents commands',
      category: 'system',
      handler: async (prompt: string) => {
        return {
          success: true,
          output: this.generateHelpText(prompt)
        };
      }
    });

    // List command
    this.commands.set('/agents', {
      command: '/agents',
      description: 'List all available Earth Agents specialists',
      category: 'system',
      handler: async () => {
        return {
          success: true,
          output: this.generateAgentsList()
        };
      }
    });

    // Search command
    this.commands.set('/search', {
      command: '/search',
      description: 'Search for Earth Agents by capability',
      category: 'system',
      handler: async (prompt: string) => {
        return {
          success: true,
          output: this.searchAgents(prompt)
        };
      }
    });
  }

  /**
   * Invoke a specialist with error handling
   */
  private async invokeSpecialist(
    commandName: string, 
    prompt: string, 
    context?: any
  ): Promise<ClaudeResponse> {
    const specialist = this.specialists.get(commandName);
    
    if (!specialist) {
      return {
        success: false,
        output: `Unknown command: ${commandName}`,
        suggestions: this.getSimilarCommands(commandName)
      };
    }

    try {
      const result = await specialist.invoke(prompt, context);
      
      return {
        success: result.success,
        output: result.output || '',
        artifacts: result.artifacts,
        suggestions: result.suggestions,
        metadata: {
          specialist: commandName.substring(1),
          confidence: result.confidence,
          category: specialist.category
        }
      };
    } catch (error) {
      return {
        success: false,
        output: `Error invoking ${commandName}: ${error}`,
        suggestions: [
          'Try being more specific with your request',
          'Provide code context if applicable',
          `Use "${commandName} help" for guidance`
        ]
      };
    }
  }

  /**
   * Execute a slash command
   */
  public async executeCommand(input: string): Promise<ClaudeResponse> {
    // Parse the command and prompt
    const match = input.match(/^(\/[\w-]+)\s*(.*)/);
    
    if (!match) {
      return {
        success: false,
        output: 'Invalid command format. Use: /command "your request"',
        suggestions: ['/help', '/agents', '/search']
      };
    }

    const [, commandName, prompt] = match;
    const command = this.commands.get(commandName);
    
    if (!command) {
      return {
        success: false,
        output: `Unknown command: ${commandName}`,
        suggestions: this.getSimilarCommands(commandName)
      };
    }

    return command.handler(prompt);
  }

  /**
   * Get similar commands for suggestions
   */
  private getSimilarCommands(input: string): string[] {
    const searchTerm = input.replace('/', '').toLowerCase();
    const similar: string[] = [];
    
    this.commands.forEach((cmd, name) => {
      if (name.includes(searchTerm) || 
          cmd.description.toLowerCase().includes(searchTerm)) {
        similar.push(name);
      }
    });
    
    return similar.slice(0, 5);
  }

  /**
   * Generate help text
   */
  private generateHelpText(filter?: string): string {
    const categories = new Map<string, ClaudeCommand[]>();
    
    // Group commands by category
    this.commands.forEach(cmd => {
      if (cmd.aliases) return; // Skip aliases
      
      if (!filter || 
          cmd.command.includes(filter) || 
          cmd.description.toLowerCase().includes(filter.toLowerCase())) {
        const list = categories.get(cmd.category) || [];
        list.push(cmd);
        categories.set(cmd.category, list);
      }
    });

    let help = `# 🤖 Earth Agents Specialist Commands

Available specialist agents for Claude Code:

`;

    const categoryTitles: Record<string, string> = {
      'language': '## 🔤 Language Specialists',
      'architecture': '## 🏗️ Architecture & Backend',
      'development': '## 💻 Development & Frontend',
      'quality': '## ✅ Quality & Security',
      'infrastructure': '## ☁️ Infrastructure & DevOps',
      'ai-ml': '## 🤖 AI & Machine Learning',
      'data': '## 📊 Data & Analytics',
      'platform': '## 🌐 Platform Specialists',
      'system': '## ⚙️ System Commands'
    };

    categories.forEach((commands, category) => {
      help += `${categoryTitles[category] || `## ${category}`}\n\n`;
      
      commands.sort((a, b) => a.command.localeCompare(b.command));
      commands.forEach(cmd => {
        help += `• **${cmd.command}** - ${cmd.description}\n`;
      });
      
      help += '\n';
    });

    help += `
## 🚀 Usage Examples

\`\`\`bash
# Python optimization
/python-pro "optimize this async function for better performance"

# Security review
/security-auditor "review this authentication code"

# Architecture design
/backend-architect "design microservices for e-commerce"

# Frontend development
/frontend-developer "create React component with TypeScript"
\`\`\`

## 💡 Tips

1. **Be specific** - Include context and requirements
2. **Share code** - Provide relevant code snippets
3. **Mention stack** - Specify frameworks and versions
4. **Ask follow-ups** - Specialists can dive deeper

Type **/help [keyword]** to filter commands
Type **/agents** to see all specialists
Type **/search [capability]** to find specialists by skill
`;

    return help;
  }

  /**
   * Generate agents list
   */
  private generateAgentsList(): string {
    let list = `# 📋 All Earth Agents Specialists\n\n`;
    const specialists = specialistRegistry.list();
    
    const byCategory = new Map<string, SpecialistDefinition[]>();
    specialists.forEach(spec => {
      const list = byCategory.get(spec.category) || [];
      list.push(spec);
      byCategory.set(spec.category, list);
    });

    byCategory.forEach((specs, category) => {
      list += `## ${category}\n\n`;
      specs.forEach(spec => {
        list += `### /${spec.name.replace(/_/g, '-')}\n`;
        list += `${spec.description}\n`;
        list += `**Focus Areas:** ${spec.focusAreas.slice(0, 3).join(', ')}\n\n`;
      });
    });

    list += `\n**Total: ${specialists.length} specialists available**`;
    
    return list;
  }

  /**
   * Search agents by capability
   */
  private searchAgents(query: string): string {
    const specialists = specialistRegistry.list();
    const matches: SpecialistDefinition[] = [];
    const searchTerm = query.toLowerCase();
    
    specialists.forEach(spec => {
      if (spec.name.toLowerCase().includes(searchTerm) ||
          spec.description.toLowerCase().includes(searchTerm) ||
          spec.focusAreas.some(area => area.toLowerCase().includes(searchTerm)) ||
          spec.capabilities.some(cap => cap.toLowerCase().includes(searchTerm))) {
        matches.push(spec);
      }
    });

    if (matches.length === 0) {
      return `No specialists found for "${query}". Try /agents to see all available.`;
    }

    let result = `# 🔍 Search Results for "${query}"\n\n`;
    result += `Found ${matches.length} specialist(s):\n\n`;
    
    matches.forEach(spec => {
      result += `• **/${spec.name.replace(/_/g, '-')}** - ${spec.description}\n`;
    });

    return result;
  }

  /**
   * Get all available commands
   */
  public getCommands(): string[] {
    return Array.from(this.commands.keys()).filter(cmd => !this.commands.get(cmd)?.aliases);
  }

  /**
   * Check if a command exists
   */
  public hasCommand(command: string): boolean {
    return this.commands.has(command);
  }
}

// Global instance
export const claudeCodeBridge = new ClaudeCodeBridge();

/**
 * Main entry point for Claude Code
 */
export async function handleClaudeCommand(input: string): Promise<string> {
  const response = await claudeCodeBridge.executeCommand(input);
  
  // Format the response for Claude Code display
  let output = '';
  
  if (response.output) {
    output += response.output + '\n';
  }
  
  if (response.artifacts && response.artifacts.length > 0) {
    output += '\n## 📦 Generated Code\n\n';
    response.artifacts.forEach(artifact => {
      output += `### ${artifact.name}\n`;
      output += `\`\`\`${artifact.language || 'text'}\n`;
      output += artifact.content;
      output += '\n\`\`\`\n\n';
    });
  }
  
  if (!response.success && response.suggestions) {
    output += '\n## 💡 Suggestions\n\n';
    response.suggestions.forEach(suggestion => {
      output += `• ${suggestion}\n`;
    });
  }
  
  if (response.metadata) {
    output += `\n---\n`;
    output += `*Specialist: ${response.metadata.specialist}`;
    if (response.metadata.confidence) {
      output += ` | Confidence: ${Math.round(response.metadata.confidence * 100)}%`;
    }
    output += '*\n';
  }
  
  return output;
}

// Export convenience functions
export const slash = handleClaudeCommand;
export const help = () => handleClaudeCommand('/help');
export const agents = () => handleClaudeCommand('/agents');
export const search = (query: string) => handleClaudeCommand(`/search ${query}`);