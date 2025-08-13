# 🤖 Earth Agents Slash Commands Integration

**All specialist agents are now available as Claude slash commands!**

## 🚁 Quick Activation

The specialists are **automatically activated** when you import the module:

```typescript
import '@earth-agents/specialists';
// ✅ All slash commands are now active!
```

## 🎯 Available Commands

### 🔤 Language Specialists
- `/python-pro` - Python 3.12+ with FastAPI, async, AI/ML libraries
- `/rust-pro` - Rust with async, WebAssembly, systems programming  
- `/golang-pro` - Go 1.21+ with concurrency, microservices, K8s
- `/javascript-pro` - JavaScript ES2024+ with WebComponents, edge computing
- `/typescript-pro` - TypeScript 5.3+ with advanced type system

### 🏗️ Architecture & Backend
- `/backend-architect` - Microservices, event-driven, serverless architecture
- `/python-backend-expert` - FastAPI, Django 5.0+, async patterns
- `/api-designer` - RESTful API design with OpenAPI best practices
- `/database-admin` - Database optimization, indexing, performance tuning
- `/cloud-architect` - AWS, GCP, Azure infrastructure design

### 💻 Frontend & UI
- `/frontend-developer` - React 19, Server Components, Next.js 15
- `/ui-engineer` - Modern frontend patterns, component libraries
- `/ui-design` - UI/UX design with accessibility, design systems

### ✅ Quality & Security  
- `/code-reviewer` - AI-powered code analysis with security focus
- `/security-auditor` - Zero-trust, AI security, OWASP 2023 practices
- `/performance-engineer` - Core Web Vitals, edge optimization, WASM
- `/test-engineer` - AI-powered testing, contract testing, visual regression
- `/refactoring-expert` - Microservices extraction, architectural evolution

### ☁️ Infrastructure & DevOps
- `/kubernetes-expert` - K8s 1.29+, service mesh, GitOps patterns
- `/devops-engineer` - CI/CD, infrastructure as code, automation
- `/monitoring-expert` - Observability, OpenTelemetry, SRE practices

### 🤖 AI & Data
- `/ml-engineer` - LLMs, vector databases, RAG systems, model deployment
- `/data-engineer` - Lakehouse, data mesh, real-time streaming (Kafka, Flink)
- `/prompt-engineer` - Advanced prompt optimization, AI evaluation
- `/data-analyst` - AI-powered analytics, modern BI tools

### 🌐 Platform Specialists
- `/gcp-expert` - Google Cloud Platform services and best practices
- `/supabase-expert` - Supabase with real-time, auth, edge functions
- `/n8n-expert` - Workflow automation and advanced integrations
- `/cloudflare-expert` - Workers, R2, D1, AI, edge computing
- `/youtube-expert` - YouTube strategy, SEO, automation, growth

## 🚀 Usage Examples

### Simple Request
```bash
/python-pro "help me optimize this async function for better performance"
```

### Complex Implementation
```bash
/backend-architect "Design a microservices architecture for an e-commerce platform with:
- User management service
- Product catalog with search
- Order processing with payments
- Real-time notifications
- Event-driven communication
- Auto-scaling capabilities"
```

### Code Review
```bash
/security-auditor "Review this authentication code for vulnerabilities:
[paste your code here]"
```

### Performance Optimization
```bash
/performance-engineer "Optimize this React app for Core Web Vitals:
Current metrics: LCP: 3.2s, FID: 180ms, CLS: 0.15
[include your code/setup details]"
```

## 🎯 Best Practices

1. **Be Specific**: Include context, requirements, and constraints
2. **Share Code**: Provide relevant code snippets for better analysis  
3. **Mention Tech Stack**: Specify frameworks, versions, tools you're using
4. **Include Metrics**: For performance issues, share current measurements
5. **Ask Follow-ups**: Specialists can provide deeper analysis

## 🔧 Advanced Integration

### Programmatic Usage
```typescript
import { slash, help } from '@earth-agents/specialists';

// Use any specialist programmatically
const result = await slash('/python-pro', 'optimize this function', {
  codeContext: 'FastAPI application',
  framework: 'FastAPI',
  language: 'Python 3.12'
});

// Get help
const helpText = help();
```

### Context-Aware Requests
```typescript
import { pythonPro } from '@earth-agents/specialists';

const result = await pythonPro('create an async web scraper', {
  projectType: 'web-scraping',
  framework: 'aiohttp',
  requirements: ['rate limiting', 'error handling', 'concurrent requests'],
  constraints: ['memory efficient', 'respect robots.txt']
});
```

## 📊 Response Format

Each specialist provides structured responses:

```typescript
{
  success: boolean,
  output: string,           // Main response
  artifacts: Array<{        // Generated code/files
    type: 'code',
    name: string,
    content: string,
    language: string
  }>,
  suggestions: string[],    // Recommendations
  confidence: number,       // 0-1 confidence score
  metadata: {
    specialist: string,
    category: string
  }
}
```

## 🔍 Discovery Commands

```bash
# Get all available commands
/help

# Search for specific expertise
/help security    # Find security-related specialists
/help react       # Find React specialists  
/help performance # Find performance specialists
```

## 🎭 Help & Support

- **Full Command List**: Use `/help` to see all available specialists
- **Search Commands**: Use `/help [keyword]` to find relevant specialists
- **Documentation**: Each specialist provides context-aware help

## 🔄 Updates

All specialists are continuously updated with:
- **2024-2025 technologies** and frameworks
- **Latest best practices** and patterns  
- **Cutting-edge tools** and techniques
- **Real-world examples** and implementations

---

**🎉 Ready to use!** Start with `/help` to explore all available specialists, or jump right in with any specialist command!

*All 30+ specialists are now active and ready to assist with your 2024-2025 development challenges.*