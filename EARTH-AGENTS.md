# 🌍 Earth Agents: Integrated Code Health Platform

Earth Agents combines the power of **Botbie** (proactive code quality guardian) and **DebugEarth** (reactive debugging expert) into a comprehensive code health management system.

## Architecture Overview

```
Earth Agents Ecosystem
├── 🤖 Botbie (Proactive)
│   ├── Knowledge Graph Builder (Potpie-inspired)
│   ├── Quality Analysis Engine
│   ├── Code Smell Detection
│   └── Automated Fix Generation
├── 🌍 DebugEarth (Reactive)
│   ├── Root Cause Analysis
│   ├── Evidence Collection
│   ├── Debugging Strategies
│   └── Mathematical Proofs
└── 🔗 Shared Infrastructure
    ├── MCP Integration
    ├── Unified CLI
    ├── Knowledge Graph
    └── Reporting System
```

## Key Features

### Botbie - Proactive Quality Guardian
- **Knowledge Graph Construction**: Builds a comprehensive understanding of your codebase
- **Multi-Language Support**: Analyzes TypeScript, JavaScript, Python, Go, and more
- **Quality Metrics**: Complexity, maintainability, test coverage analysis
- **Code Smell Detection**: Identifies anti-patterns and bad practices
- **Automated Fixes**: Can automatically fix common issues
- **Beautiful Reports**: HTML and Markdown reports with actionable insights

### DebugEarth - Reactive Debugging Expert
- **Methodical Analysis**: Uses 5 Whys and evidence-based approach
- **Multiple Strategies**: Console Detective, Stack Archaeologist, Performance Hunter
- **Real-time Monitoring**: Captures errors as they happen
- **Root Cause Analysis**: Mathematical proof chains for bug causes
- **Cross-Platform**: Works in Node.js and browser environments

### Integration Benefits
- **Shared Knowledge**: Bugs found by DebugEarth inform Botbie's patterns
- **Unified Workflow**: Single CLI for all code health needs
- **Continuous Learning**: System improves over time
- **Preventive Maintenance**: Botbie prevents bugs DebugEarth would find

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd earth-agents

# Install dependencies
npm install

# Build all packages
npm run build

# Link CLI globally
npm link
```

## Quick Start

### 1. Initialize Configuration
```bash
earth init
```

### 2. Analyze Code Quality
```bash
# Analyze current directory
earth analyze

# Analyze specific directory
earth analyze ./src

# Generate detailed reports
earth analyze --output ./reports
```

### 3. Debug Issues
```bash
# Start debugging session
earth debug "API returns 404 errors"

# Debug with verbose output
earth debug --verbose "Memory leak in production"
```

### 4. Monitor Continuously
```bash
# Monitor code health every 30 minutes
earth monitor

# Custom interval
earth monitor --interval 60
```

## Integrated Workflows

### Workflow 1: Quality Gate in CI/CD
```yaml
# .github/workflows/quality-check.yml
name: Code Quality Check
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g @earth-agents/cli
      - run: earth analyze --strict
```

### Workflow 2: Bug Prevention
```bash
# Before committing
earth analyze --fix

# After finding a bug with DebugEarth
earth analyze --type similar-patterns
```

### Workflow 3: Real-time Monitoring
```bash
# Development mode
earth monitor --interval 5

# Production monitoring
earth monitor --interval 60 --output ./logs
```

## Configuration

Create `.earthagents.json` in your project root:

```json
{
  "version": "1.0.0",
  "botbie": {
    "enableAutoFix": true,
    "strictMode": false,
    "ignorePatterns": ["node_modules", "dist", "build"],
    "customRules": ["no-console", "prefer-const"],
    "thresholds": {
      "complexity": 10,
      "maintainability": 65,
      "duplicateThreshold": 0.8
    }
  },
  "debugearth": {
    "verbose": true,
    "maxAttempts": 10,
    "strategies": ["console", "stack", "performance", "ui"],
    "persistence": true
  },
  "integration": {
    "shareKnowledge": true,
    "autoReport": true,
    "webhooks": {
      "onCriticalIssue": "https://your-webhook.com/critical",
      "onRootCauseFound": "https://your-webhook.com/debug"
    }
  }
}
```

## API Usage

### TypeScript/JavaScript
```typescript
import { createBotbie } from '@earth-agents/botbie';
import { createDebugEarth } from 'debugearth';

// Proactive analysis
const botbie = createBotbie({ strictMode: true });
const report = await botbie.analyze('./src');

// Reactive debugging
const debugEarth = createDebugEarth();
const session = await debugEarth.startDebugging('Performance degradation');
```

### Knowledge Graph Queries
```typescript
// Query the knowledge graph
const classInfo = await botbie.askKnowledgeGraphQueries(
  "find all classes with more than 10 methods"
);

// Get code relationships
const dependencies = await botbie.getCodeFromNodeId(nodeId);
```

## Advanced Features

### 1. Custom Strategies
```typescript
// Add custom Botbie strategy
botbie.addStrategy(new SecurityAuditor());

// Add custom DebugEarth strategy
debugEarth.addStrategy(new DatabaseDebugger());
```

### 2. MCP Integration
```json
// claude_desktop_config.json
{
  "mcpServers": {
    "earth-agents": {
      "command": "earth",
      "args": ["mcp-server"]
    }
  }
}
```

### 3. Webhooks & Integrations
```typescript
const botbie = createBotbie({
  webhooks: {
    onCriticalIssue: async (issue) => {
      // Send to Slack, create Jira ticket, etc.
    }
  }
});
```

## Best Practices

1. **Regular Analysis**: Run Botbie analysis before each commit
2. **Continuous Monitoring**: Use `earth monitor` during development
3. **Fix Immediately**: Address critical issues as soon as they're found
4. **Learn from Bugs**: Let DebugEarth findings improve Botbie's rules
5. **Custom Rules**: Add project-specific quality rules
6. **Team Sharing**: Share `.earthagents.json` with your team

## Troubleshooting

### Common Issues

**Q: Botbie is too strict**
A: Adjust thresholds in `.earthagents.json` or disable strict mode

**Q: DebugEarth not capturing errors**
A: Ensure the debugging session is started before the error occurs

**Q: Performance impact**
A: Use sampling in production environments

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

## License

MIT

---

## Philosophy

> "Prevention is better than cure, but when bugs strike, strike back with precision."

Earth Agents embodies this philosophy by combining:
- **Proactive Prevention** (Botbie): Stop bugs before they start
- **Reactive Resolution** (DebugEarth): Solve bugs with scientific precision
- **Continuous Learning**: Each bug makes the system smarter

Together, they create a comprehensive code health management system that keeps your codebase clean, robust, and beautiful.

🌍 + 🤖 = ❤️ Happy Coding!