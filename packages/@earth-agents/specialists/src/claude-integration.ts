/**
 * Claude Integration for Earth Agents Specialists
 * Implements slash commands for Claude interface
 */

import { specialistRegistry, SpecialistAgentAdapter } from './SpecialistAgentAdapter';
import { SpecialistDefinition } from './types';

/**
 * Claude Slash Command Handler
 * This integrates with Claude's slash command system
 */
export class ClaudeSlashCommandHandler {
  private specialists: Map<string, SpecialistAgentAdapter> = new Map();

  constructor() {
    this.initializeSpecialists();
  }

  /**
   * Initialize all specialists as slash commands
   */
  private initializeSpecialists(): void {
    const allSpecialists = specialistRegistry.list();
    
    allSpecialists.forEach(definition => {
      const adapter = new SpecialistAgentAdapter(definition);
      const command = `/${definition.name}`;
      this.specialists.set(command, adapter);
    });
  }

  /**
   * Handle a slash command invocation
   */
  async handleSlashCommand(command: string, prompt: string, context?: any): Promise<string> {
    const specialist = this.specialists.get(command);
    
    if (!specialist) {
      return this.generateHelpMessage(command);
    }

    try {
      // Set up task tool for Claude Code integration
      // This will be set externally when integrated with Claude Code
      // specialist.setTaskTool(Task);

      const result = await specialist.invoke(prompt, context);
      
      if (result.success) {
        return this.formatSuccessResponse(command, result);
      } else {
        return this.formatErrorResponse(command, result.suggestions);
      }
    } catch (error) {
      return this.formatErrorResponse(command, [`Error: ${error}`]);
    }
  }

  /**
   * Format successful response
   */
  private formatSuccessResponse(command: string, result: any): string {
    let response = `## ${command} Specialist Response\n\n`;
    
    if (result.output) {
      response += `${result.output}\n\n`;
    }

    if (result.artifacts && result.artifacts.length > 0) {
      response += `### Generated Code/Artifacts\n\n`;
      result.artifacts.forEach((artifact: any, index: number) => {
        response += `**${artifact.name || `Artifact ${index + 1}`}**\n`;
        response += `\`\`\`${artifact.language || 'text'}\n${artifact.content}\n\`\`\`\n\n`;
      });
    }

    if (result.suggestions && result.suggestions.length > 0) {
      response += `### Recommendations\n\n`;
      result.suggestions.forEach((suggestion: string) => {
        response += `- ${suggestion}\n`;
      });
      response += '\n';
    }

    if (result.confidence) {
      response += `*Confidence: ${Math.round(result.confidence * 100)}%*\n`;
    }

    return response;
  }

  /**
   * Format error response
   */
  private formatErrorResponse(command: string, suggestions: string[]): string {
    let response = `## ${command} - Unable to Process Request\n\n`;
    
    if (suggestions && suggestions.length > 0) {
      response += `**Issues:**\n`;
      suggestions.forEach(suggestion => {
        response += `- ${suggestion}\n`;
      });
      response += '\n';
    }

    response += `**Try:**\n`;
    response += `- Being more specific about your requirements\n`;
    response += `- Providing code context or examples\n`;
    response += `- Using \`${command} help\` for guidance\n`;

    return response;
  }

  /**
   * Generate help message for unknown command or help request
   */
  private generateHelpMessage(command: string): string {
    if (command === '/help' || command === '/agents' || command === '/specialists') {
      return this.generateFullHelpMessage();
    }

    return `## Unknown Command: ${command}

**Available Specialist Commands:**

### 🔤 Language Specialists
- \`/python-pro\` - Python 3.12+ with FastAPI, async, AI/ML
- \`/rust-pro\` - Rust with async, WebAssembly, systems programming  
- \`/golang-pro\` - Go 1.21+ with concurrency, microservices
- \`/javascript-pro\` - JavaScript ES2024+ with edge computing
- \`/typescript-pro\` - TypeScript 5.3+ with advanced types

### 🏗️ Architecture & Backend
- \`/backend-architect\` - Microservices, event-driven architecture
- \`/python-backend-expert\` - FastAPI, Django, async patterns
- \`/api-designer\` - RESTful API design and best practices
- \`/database-admin\` - Database optimization and performance

### 💻 Frontend & UI
- \`/frontend-developer\` - React 19, Server Components, modern patterns
- \`/ui-engineer\` - Modern frontend development and components
- \`/ui-design\` - UI/UX design with accessibility

### ✅ Quality & Security  
- \`/code-reviewer\` - AI-powered code analysis and review
- \`/security-auditor\` - Zero-trust security and vulnerability analysis
- \`/performance-engineer\` - Core Web Vitals and optimization
- \`/test-engineer\` - AI-powered testing and automation
- \`/refactoring-expert\` - Code refactoring and architectural evolution

### ☁️ Infrastructure & DevOps
- \`/kubernetes-expert\` - K8s with latest features and patterns
- \`/cloud-architect\` - Cloud infrastructure and scaling
- \`/devops-engineer\` - CI/CD, automation, infrastructure

### 🤖 AI & Data
- \`/ml-engineer\` - LLMs, vector databases, AI/ML deployment
- \`/data-engineer\` - Modern data stack and real-time processing
- \`/prompt-engineer\` - Advanced AI prompt optimization
- \`/data-analyst\` - AI-powered analytics and BI

### 🌐 Platform Specialists
- \`/gcp-expert\` - Google Cloud Platform services
- \`/supabase-expert\` - Supabase with real-time and edge functions
- \`/n8n-expert\` - Workflow automation and integrations
- \`/cloudflare-expert\` - Cloudflare Workers and edge computing
- \`/youtube-expert\` - YouTube strategy, SEO, and automation

**Usage:** \`/command "your detailed request here"\`

**Example:** \`/python-pro "create a FastAPI app with JWT auth and PostgreSQL"\`
`;
  }

  /**
   * Generate comprehensive help message
   */
  private generateFullHelpMessage(): string {
    const specialists = Array.from(this.specialists.keys());
    
    return `# 🤖 Earth Agents Specialist Commands

**${specialists.length} Expert Specialists Available**

All specialists are updated with **2024-2025 cutting-edge technologies** and best practices.

## 🚀 Quick Start

\`\`\`bash
# Get Python help
/python-pro "optimize this async function for better performance"

# Security review
/security-auditor "review this authentication code for vulnerabilities"

# Architecture design
/backend-architect "design a microservices system for e-commerce"

# Frontend development
/frontend-developer "create a React component with TypeScript"
\`\`\`

## 📋 All Available Commands

${specialists.sort().map(cmd => `- \`${cmd}\``).join('\n')}

## 🎯 Best Practices

1. **Be Specific**: Include requirements, constraints, and context
2. **Share Code**: Provide relevant code snippets for analysis
3. **Mention Stack**: Specify frameworks, versions, tools
4. **Ask Follow-ups**: Specialists can provide deeper analysis

## 💡 Example Requests

### Complex Implementation
\`\`\`
/python-pro "Create a FastAPI application with:
- JWT authentication with refresh tokens
- PostgreSQL with async SQLAlchemy
- Redis caching layer
- Comprehensive error handling
- Docker containerization
- Unit and integration tests"
\`\`\`

### Architecture Review
\`\`\`
/backend-architect "Review this microservices architecture:
[paste your architecture]
Focus on scalability, security, and performance"
\`\`\`

### Performance Optimization
\`\`\`
/performance-engineer "Optimize this React app for Core Web Vitals:
[paste your code]
Current LCP: 3.2s, FID: 180ms, CLS: 0.15"
\`\`\`

---

**💡 Tip:** Each specialist has deep expertise in their domain with access to the latest 2024-2025 technologies and patterns.
`;
  }

  /**
   * Get all available commands
   */
  getAvailableCommands(): string[] {
    return Array.from(this.specialists.keys());
  }

  /**
   * Search commands by keyword
   */
  searchCommands(keyword: string): string[] {
    const lowerKeyword = keyword.toLowerCase();
    return Array.from(this.specialists.entries())
      .filter(([command, specialist]) => 
        command.toLowerCase().includes(lowerKeyword) ||
        specialist.description.toLowerCase().includes(lowerKeyword) ||
        specialist.focusAreas.some(area => area.toLowerCase().includes(lowerKeyword))
      )
      .map(([command]) => command);
  }
}

// Global instance
export const claudeSlashHandler = new ClaudeSlashCommandHandler();

/**
 * Direct slash command exports for easier Claude integration
 */

// Language Specialists
export const pythonPro = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/python-pro', prompt, context);

export const rustPro = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/rust-pro', prompt, context);

export const golangPro = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/golang-pro', prompt, context);

export const javascriptPro = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/javascript-pro', prompt, context);

export const typescriptPro = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/typescript-pro', prompt, context);

// Architecture & Backend
export const backendArchitect = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/backend-architect', prompt, context);

export const pythonBackendExpert = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/python-backend-expert', prompt, context);

export const apiDesigner = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/api-designer', prompt, context);

// Quality & Security
export const codeReviewer = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/code-reviewer', prompt, context);

export const securityAuditor = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/security-auditor', prompt, context);

export const performanceEngineer = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/performance-engineer', prompt, context);

export const testEngineer = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/test-engineer', prompt, context);

export const refactoringExpert = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/refactoring-expert', prompt, context);

// Frontend & UI
export const frontendDeveloper = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/frontend-developer', prompt, context);

export const uiEngineer = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/ui-engineer', prompt, context);

export const uiDesign = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/ui-design', prompt, context);

// Infrastructure
export const kubernetesExpert = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/kubernetes-expert', prompt, context);

export const cloudArchitect = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/cloud-architect', prompt, context);

export const devopsEngineer = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/devops-engineer', prompt, context);

// AI & Data
export const mlEngineer = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/ml-engineer', prompt, context);

export const dataEngineer = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/data-engineer', prompt, context);

export const promptEngineer = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/prompt-engineer', prompt, context);

export const dataAnalyst = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/data-analyst', prompt, context);

// Platform Specialists
export const gcpExpert = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/gcp-expert', prompt, context);

export const supabaseExpert = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/supabase-expert', prompt, context);

export const n8nExpert = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/n8n-expert', prompt, context);

export const cloudflareExpert = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/cloudflare-expert', prompt, context);

export const youtubeExpert = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/youtube-expert', prompt, context);

export const lintahExpert = (prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand('/lintah-expert', prompt, context);

/**
 * Universal slash command handler
 */
export const slash = (command: string, prompt: string, context?: any) => 
  claudeSlashHandler.handleSlashCommand(command, prompt, context);

// Help command
export const help = () => claudeSlashHandler.generateFullHelpMessage();