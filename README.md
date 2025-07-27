# 🌍 DebugEarth Ecosystem

A comprehensive debugging platform that treats every bug as a mystery to be solved with passion and mathematical precision!

## Projects

### 🔬 [DebugEarth Core](./debugearth/)
The main debugging framework with methodical root cause analysis, evidence-based debugging, and mathematical proof generation.

**Key Features:**
- 🕵️ Four specialized debugging strategies
- 📊 Evidence collection and correlation  
- 🎯 Hypothesis generation and testing
- 📐 Mathematical proof chains for root causes
- 🤖 Claude Desktop MCP integration
- 🌐 Cross-platform support (Node.js & browser)

### 🖥️ [VS Code Extension](./vscode-debugearth/)
Native VS Code integration bringing DebugEarth's debugging capabilities directly into your development environment.

**Key Features:**
- 📋 Interactive debugging sessions
- 🚀 One-click session creation
- 📊 Real-time evidence visualization
- 🔄 Auto-refresh capabilities
- ⚙️ Configuration integration
- 🎨 Theme-aware interface

## Quick Start

### Install DebugEarth Core
```bash
cd debugearth
npm install
npm run build
```

### Install VS Code Extension
```bash
cd vscode-debugearth
npm install
npm run compile
# Press F5 in VS Code to launch Extension Development Host
```

### Set up Claude Desktop Integration
```bash
cd debugearth
npm install -g .
# Follow MCP-SETUP.md for Claude Desktop configuration
```

## Architecture

```
DebugEarth Ecosystem
├── debugearth/              # Core debugging framework
│   ├── src/                 # TypeScript source code
│   │   ├── DebugEarth.ts   # Main debugging class
│   │   ├── strategies/     # Debugging strategies
│   │   ├── engines/        # Analysis engines
│   │   └── utils/          # Utilities and helpers
│   ├── examples/           # Usage examples
│   └── tests/              # Test suite
└── vscode-debugearth/      # VS Code extension
    ├── src/                # Extension source code
    │   ├── extension.ts    # Main extension entry
    │   ├── providers/      # Tree view providers
    │   └── panels/         # Webview panels
    └── out/                # Compiled JavaScript
```

## Debugging Strategies

### 🕵️ Console Detective
Strategic console logging analysis that identifies patterns, detects loops, and suggests optimal logging placement.

### 🔬 UI Surgeon  
Visual debugging for browser environments with debug overlays, element highlighting, and interactive inspection.

### 🏺 Stack Archaeologist
Deep stack trace analysis that extracts error patterns, identifies propagation chains, and correlates multiple traces.

### 🏹 Performance Hunter
Performance issue tracking with memory leak detection, CPU monitoring, and optimization suggestions.

## Evidence Types

- **Console**: Console outputs and error messages
- **Stack Trace**: Error call hierarchies and traces  
- **Network**: Request/response data and timing
- **Performance**: Memory usage and CPU metrics
- **UI**: DOM events and element interactions
- **User Report**: Manual observations and reports

## Root Cause Analysis

DebugEarth provides comprehensive analysis including:

1. **Description**: Clear root cause explanation
2. **Evidence**: Supporting data correlation
3. **Explanation**: Detailed causal analysis  
4. **Solution**: Actionable fix recommendations
5. **Confidence**: Statistical confidence scoring (0-100%)
6. **Proof Chain**: Mathematical-style proof steps

## Usage Examples

### Node.js Application
```typescript
import { createDebugEarth } from 'debugearth';

const debugEarth = createDebugEarth({ verbose: true });
const session = await debugEarth.startDebugging('API timeout errors');

// Your application code here...
try {
  const response = await fetch('/api/data');
} catch (error) {
  console.error('API call failed:', error);
}

const rootCause = await debugEarth.analyze(session.id);
console.log('Root Cause:', rootCause?.description);
```

### Browser Application
```html
<script type="module">
  import { createDebugEarth } from 'debugearth';
  
  const debugEarth = createDebugEarth({
    enableVisualDebugging: true
  });
  
  const session = await debugEarth.startDebugging('Button not responding');
  // Visual debugging overlay will appear
</script>
```

### VS Code Extension
1. Press `Ctrl+Shift+P` and type "DebugEarth: Start Debugging Session"
2. Enter bug description
3. Interact with your application while DebugEarth collects evidence
4. Click "Analyze Session" to generate root cause analysis
5. Review solution recommendations in the debug panel

### Claude Desktop MCP
```
/debug user authentication failing

Claude: 🌍 DebugEarth activated! Let's systematically investigate this authentication issue...
```

## Configuration

### DebugEarth Core
```typescript
const debugEarth = createDebugEarth({
  verbose: true,
  maxAttempts: 10,
  enableVisualDebugging: true,
  logLevel: 'info',
  webhooks: {
    onRootCause: (rootCause) => {
      console.log('Found root cause:', rootCause.description);
    }
  }
});
```

### VS Code Extension
```json
{
  "debugearth.verbose": true,
  "debugearth.maxAttempts": 10,
  "debugearth.enableVisualDebugging": true,
  "debugearth.autoRefresh": true
}
```

## Development

### Prerequisites
- Node.js 18+
- TypeScript 5+
- VS Code (for extension development)

### Building
```bash
# Build core package
cd debugearth && npm run build

# Build VS Code extension  
cd vscode-debugearth && npm run compile
```

### Testing
```bash
# Test core package
cd debugearth && npm test

# Test VS Code extension
# Open vscode-debugearth in VS Code and press F5
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Submit a pull request

## License

MIT

## Philosophy

> "Every bug is a mystery waiting to be solved. DebugEarth doesn't just find bugs - it LOVES finding them, treating each debugging session as an archaeological expedition to uncover the truth buried beneath layers of code."

DebugEarth transforms debugging from guesswork into systematic investigation, using mathematical rigor to prove root causes and provide actionable solutions.

---

🌍 **DebugEarth**: Where bugs meet their match through methodical investigation and mathematical precision! 🔍