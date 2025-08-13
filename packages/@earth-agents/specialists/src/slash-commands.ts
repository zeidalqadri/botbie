/**
 * Slash Command Integration for Earth Agents Specialists
 * Registers all specialist agents as Claude slash commands
 */

import { specialistRegistry } from './SpecialistAgentAdapter';

// Available specialist slash commands
export const SLASH_COMMANDS = {
  // Language Specialists
  '/python-pro': 'Expert Python developer with 3.12+ features, FastAPI, async patterns, and ML libraries',
  '/rust-pro': 'Expert Rust developer with async patterns, WebAssembly, and systems programming',
  '/golang-pro': 'Expert Go developer with advanced concurrency, microservices, and cloud-native patterns',
  '/javascript-pro': 'Expert JavaScript developer with ES2024+, WebComponents, and edge computing',
  '/typescript-pro': 'Expert TypeScript developer with 5.3+ features and advanced type system',

  // Backend & Architecture
  '/backend-architect': 'Expert backend architect with microservices, event-driven, and cloud-native patterns',
  '/python-backend-expert': 'Expert Python backend developer with FastAPI, Django, and async patterns',
  '/api-designer': 'Expert API designer following REST principles and modern practices',
  '/database-admin': 'Expert database administrator with optimization and performance tuning',
  '/cloud-architect': 'Expert cloud architect with AWS, GCP, Azure, and infrastructure as code',

  // Frontend & UI
  '/frontend-developer': 'Expert React developer with React 19, Server Components, and modern patterns',
  '/ui-engineer': 'Expert UI engineer with modern frontend patterns and component libraries',
  '/ui-design': 'Expert UI/UX designer with accessibility and modern design systems',

  // Quality & Security
  '/code-reviewer': 'Expert code reviewer with AI-powered analysis and security best practices',
  '/security-auditor': 'Expert security auditor with zero-trust, AI security, and OWASP practices',
  '/performance-engineer': 'Expert performance engineer with Core Web Vitals and optimization',
  '/test-engineer': 'Expert test engineer with AI-powered testing and modern frameworks',
  '/refactoring-expert': 'Expert refactoring specialist with architectural evolution patterns',

  // Infrastructure & DevOps
  '/kubernetes-expert': 'Expert Kubernetes engineer with latest features and cloud-native patterns',
  '/docker-expert': 'Expert Docker specialist with containerization and orchestration',
  '/devops-engineer': 'Expert DevOps engineer with CI/CD, infrastructure, and automation',
  '/monitoring-expert': 'Expert monitoring specialist with observability and alerting',

  // AI & Data
  '/ml-engineer': 'Expert ML engineer with LLMs, vector databases, and AI/ML deployment',
  '/data-engineer': 'Expert data engineer with modern data stack and real-time processing',
  '/prompt-engineer': 'Expert prompt engineer with advanced AI techniques and optimization',
  '/data-analyst': 'Expert data analyst with AI-powered analytics and modern BI tools',

  // Cloud Platforms
  '/gcp-expert': 'Expert Google Cloud Platform engineer with latest services and best practices',
  '/aws-expert': 'Expert AWS engineer with serverless, containers, and cloud-native services',
  '/azure-expert': 'Expert Azure engineer with cloud services and enterprise patterns',

  // Specialized Tools
  '/supabase-expert': 'Expert Supabase developer with real-time, auth, and edge functions',
  '/n8n-expert': 'Expert n8n workflow automation specialist with advanced integrations',
  '/cloudflare-expert': 'Expert Cloudflare engineer with Workers, R2, and edge computing',

  // Optimization & Analysis
  '/prompt-optimizer': 'Expert prompt optimization specialist for AI model efficiency',
  '/cost-optimizer': 'Expert cost optimization specialist for cloud and infrastructure',
  '/green-computing': 'Expert sustainability engineer for carbon-aware computing',
  
  // The Ultimate Linting Expert
  '/lintah': 'The ultimate "son of a gun" linting expert with shortest-path algorithms and global companion mode',
  '/lint': 'Quick access to Lintah shortest-path delinting',
  '/delint': 'Execute optimal fix order to clean all code'
} as const;

/**
 * Generate slash command documentation
 */
export function generateSlashCommandDocs(): string {
  const specialists = specialistRegistry.list();
  let docs = `# 🤖 Earth Agents Specialist Slash Commands

Available specialist agents that can be invoked with slash commands:

## 🔤 Language Specialists
`;

  // Group by category
  const categories = {
    language: '🔤 Language Specialists',
    architecture: '🏗️ Architecture & Backend',
    development: '💻 Development & Frontend', 
    quality: '✅ Quality & Security',
    infrastructure: '☁️ Infrastructure & DevOps',
    'ai-ml': '🤖 AI & Machine Learning',
    platform: '🌐 Cloud Platforms',
    tools: '🛠️ Specialized Tools'
  };

  Object.entries(categories).forEach(([category, title]) => {
    const categorySpecialists = specialists.filter(s => s.category === category);
    if (categorySpecialists.length > 0) {
      docs += `\n## ${title}\n\n`;
      categorySpecialists.forEach(specialist => {
        const command = `/${specialist.name}`;
        docs += `### ${command}\n`;
        docs += `${specialist.description}\n\n`;
        docs += `**Focus Areas:**\n`;
        specialist.focusAreas.forEach(area => {
          docs += `- ${area}\n`;
        });
        docs += `\n**Usage:** \`${command} "your request here"\`\n\n`;
      });
    }
  });

  docs += `
## 🚀 How to Use

Simply type any slash command followed by your request:

\`\`\`
/python-pro "help me optimize this async function for better performance"
/security-auditor "review this authentication code for vulnerabilities" 
/frontend-developer "create a React component with TypeScript"
/kubernetes-expert "help me set up autoscaling for this deployment"
\`\`\`

## 🎯 Best Practices

1. **Be Specific**: Include context, requirements, and constraints
2. **Provide Code**: Share relevant code snippets for better analysis
3. **Mention Tech Stack**: Specify frameworks, versions, and tools you're using
4. **Ask Follow-ups**: Specialists can dive deeper based on your needs

## 📊 Example Requests

\`\`\`bash
# Code Review
/code-reviewer "review this React component for performance and security issues"

# Architecture Design  
/backend-architect "design a microservices architecture for an e-commerce platform"

# Performance Optimization
/performance-engineer "optimize this web app for Core Web Vitals"

# Security Analysis
/security-auditor "audit this authentication system for vulnerabilities"

# AI Integration
/ml-engineer "help me implement RAG with vector search for document Q&A"
\`\`\`

## 🔧 Advanced Usage

Specialists can handle complex, multi-step requests:

\`\`\`bash
/python-pro "Create a FastAPI application with:
- JWT authentication
- PostgreSQL integration  
- Async request handling
- Comprehensive error handling
- Docker containerization
- Include tests and documentation"
\`\`\`

---

*All specialists are updated with 2024-2025 best practices and cutting-edge technologies.*
`;

  return docs;
}

/**
 * Register all specialists as slash commands
 * This function should be called during application initialization
 */
export function registerAllSlashCommands(): void {
  const specialists = specialistRegistry.list();
  
  console.log('🤖 Registering Earth Agents Slash Commands...');
  
  specialists.forEach(specialist => {
    const command = `/${specialist.name}`;
    console.log(`  ✅ ${command} - ${specialist.description.substring(0, 60)}...`);
  });
  
  console.log(`\n🎉 Successfully registered ${specialists.length} specialist slash commands!`);
  console.log('\n📚 Usage: Type any command followed by your request');
  console.log('   Example: /python-pro "help me optimize this code"');
  console.log('\n📖 Full documentation available via generateSlashCommandDocs()');
}

/**
 * Get slash command by name
 */
export function getSlashCommand(command: string): string | undefined {
  const cleanCommand = command.startsWith('/') ? command : `/${command}`;
  return SLASH_COMMANDS[cleanCommand as keyof typeof SLASH_COMMANDS];
}

/**
 * List all available slash commands
 */
export function listSlashCommands(): string[] {
  return Object.keys(SLASH_COMMANDS);
}

/**
 * Search slash commands by keyword
 */
export function searchSlashCommands(keyword: string): string[] {
  const lowerKeyword = keyword.toLowerCase();
  return Object.entries(SLASH_COMMANDS)
    .filter(([command, description]) => 
      command.toLowerCase().includes(lowerKeyword) ||
      description.toLowerCase().includes(lowerKeyword)
    )
    .map(([command]) => command);
}

// Auto-register on import (optional)
if (typeof window === 'undefined') {
  // Only auto-register in Node.js environment
  registerAllSlashCommands();
}