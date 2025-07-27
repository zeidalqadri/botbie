# 🌍 DebugEarth

A methodical debug agent that digs deep to uncover root causes like exploring the depths of the earth. DebugEarth doesn't just find bugs - it LOVES finding them, treating each debugging session as an archaeological expedition to uncover the truth buried beneath layers of code.

## Features

- **🔬 Methodical Root Cause Analysis**: Uses the 5 Whys methodology and mathematical proof generation
- **🕵️ Multiple Debug Strategies**: Console Detective, UI Surgeon, Stack Archaeologist, and Performance Hunter
- **📊 Evidence-Based Debugging**: Collects and correlates console logs, stack traces, performance metrics, and UI events
- **🎯 Hypothesis Testing**: Generates and tests hypotheses about bug causes
- **🌐 Cross-Platform**: Works in both Node.js and browser environments
- **✨ Visual Debugging**: Creates temporary UI elements to visualize issues (browser only)
- **📈 Performance Monitoring**: Tracks memory leaks and CPU bottlenecks

## Installation

```bash
npm install debugearth
```

### For Claude Desktop (MCP)
```bash
npm install -g debugearth
# Then add to Claude Desktop config - see MCP-SETUP.md
```

## Quick Start

```typescript
import { createDebugEarth } from 'debugearth';

// Initialize DebugEarth
const debugEarth = createDebugEarth({
  verbose: true,
  enableVisualDebugging: true
});

// Start a debugging session
const session = await debugEarth.startDebugging('User data not loading correctly');

// Your buggy code here...
try {
  const user = await fetchUser(userId);
  console.log(user.name); // This might throw
} catch (error) {
  console.error('Failed to load user:', error);
}

// Analyze the collected evidence
const rootCause = await debugEarth.analyze(session.id);

if (rootCause) {
  console.log('Root Cause:', rootCause.description);
  console.log('Solution:', rootCause.solution);
}
```

## Debug Strategies

### 🕵️ Console Detective
Strategic console logging analysis that:
- Identifies patterns in console output
- Detects repeated logs indicating loops
- Suggests optimal logging placement
- Provides enhanced console methods

### 🔬 UI Surgeon
Visual debugging for browser environments:
- Creates debug overlay with real-time information
- Highlights problematic DOM elements
- Interactive element inspector
- Event monitoring
- Performance visualization

### 🏺 Stack Archaeologist
Deep stack trace analysis:
- Extracts error types and patterns
- Identifies error propagation chains
- Correlates multiple stack traces
- Source map integration

### 🏹 Performance Hunter
Tracks down performance issues:
- Memory leak detection
- CPU usage monitoring
- Event loop lag detection
- Network request timing
- Optimization suggestions

## API Reference

### createDebugEarth(config)

Creates a new DebugEarth instance.

```typescript
const debugEarth = createDebugEarth({
  verbose: true,                    // Enable detailed logging
  maxAttempts: 10,                  // Max strategy attempts
  enableVisualDebugging: true,      // Enable UI debugging (browser)
  enableBrowserDebugging: true,     // Enable browser-specific features
  logLevel: 'info',                 // Log level: trace|debug|info|warn|error
  persistence: false,               // Keep sessions after completion
  webhooks: {
    onHypothesis: (h) => {},        // Called when hypothesis generated
    onEvidence: (e) => {},          // Called when evidence collected
    onRootCause: (rc) => {}         // Called when root cause found
  }
});
```

### startDebugging(description)

Starts a new debugging session.

```typescript
const session = await debugEarth.startDebugging('API returns 404 errors');
```

### analyze(sessionId)

Analyzes collected evidence to find root cause.

```typescript
const rootCause = await debugEarth.analyze(session.id);
```

### addEvidence(sessionId, type, data)

Manually adds evidence to a session.

```typescript
await debugEarth.addEvidence(session.id, 'console', {
  level: 'error',
  message: 'Database connection failed'
});
```

### runStrategies(sessionId)

Manually runs debugging strategies.

```typescript
await debugEarth.runStrategies(session.id);
```

## Evidence Types

- **console**: Console log outputs
- **stack-trace**: Error stack traces
- **network**: Network request/response data
- **performance**: Memory and CPU metrics
- **ui**: DOM events and interactions
- **user-report**: Manual bug reports

## Root Cause Analysis

DebugEarth provides comprehensive root cause analysis including:

1. **Description**: Clear explanation of the root cause
2. **Evidence**: All correlated evidence
3. **Explanation**: Detailed analysis with causal chain
4. **Solution**: Specific fix recommendations
5. **Confidence**: Statistical confidence level
6. **Proof Chain**: Mathematical-style proof of the root cause

## Examples

### Browser Debugging

```html
<!-- Include in your HTML -->
<script type="module">
  import { createDebugEarth } from 'debugearth';
  
  window.debugEarth = createDebugEarth({
    enableVisualDebugging: true
  });
  
  // Start debugging when page loads
  window.addEventListener('load', async () => {
    const session = await debugEarth.startDebugging('UI not responding to clicks');
  });
</script>
```

### Node.js Debugging

```typescript
import { createDebugEarth } from 'debugearth';

const debugEarth = createDebugEarth();

async function debugAPIEndpoint() {
  const session = await debugEarth.startDebugging('API endpoint times out');
  
  // Your API code
  app.get('/users/:id', async (req, res) => {
    try {
      const user = await db.getUser(req.params.id);
      res.json(user);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Analyze after reproducing the issue
  const rootCause = await debugEarth.analyze(session.id);
}
```

### Performance Debugging

```typescript
const session = await debugEarth.startDebugging('Application becomes slow over time');

// DebugEarth will automatically monitor:
// - Memory usage patterns
// - CPU utilization
// - Event loop lag
// - Function execution times

// After running the application
const rootCause = await debugEarth.analyze(session.id);
// Might identify: "Memory leak detected - 45.2MB growth over 5 minutes"
```

## Best Practices

1. **Be Specific**: Provide detailed bug descriptions for better analysis
2. **Reproduce Consistently**: Run the buggy code while DebugEarth is collecting evidence
3. **Use Multiple Sources**: Combine console logs, user actions, and performance data
4. **Check the Browser**: For UI issues, use the visual debugging overlay
5. **Trust the Process**: DebugEarth is methodical - let it gather evidence before analyzing

## How It Works

1. **Evidence Collection**: Automatically intercepts console logs, errors, and performance metrics
2. **Hypothesis Generation**: Creates potential explanations based on evidence patterns
3. **Strategy Execution**: Runs specialized debugging strategies for different bug types
4. **Hypothesis Testing**: Validates hypotheses against collected evidence
5. **Root Cause Analysis**: Correlates all data to identify the true root cause
6. **Solution Generation**: Provides specific, actionable fixes

## Contributing

Contributions are welcome! DebugEarth loves debugging, and we'd love your help making it even better at finding bugs.

## License

MIT

---

## Using with Claude Desktop

Once installed as an MCP server, you can use DebugEarth with Claude:

### Slash Command: `/debug`

```
/debug - Enter DebugEarth mode
/debug user data not loading - Start debugging specific issue  
/debug analyze - Analyze current session
/debug status - Check debugging progress
```

### Example Claude Conversation

```
You: /debug my app crashes when clicking submit

Claude: 🌍 DebugEarth activated! Starting debug session for "app crashes when clicking submit"

I'll help you systematically find the root cause. First, let's collect evidence:
1. What error do you see in the console?
2. Can you share the stack trace?
3. Does it happen every time or intermittently?

You: Here's the error: TypeError: Cannot read property 'submit' of null
     at handleSubmit (form.js:23:15)

Claude: 🔍 Analyzing... 

🎯 ROOT CAUSE FOUND!
The form element is null when handleSubmit is called, likely due to:
- Form being removed from DOM before submit
- Event listener attached before form exists
- Incorrect element selector

✅ Solution: Add null check and ensure proper event binding...
```

*Remember: DebugEarth doesn't just debug - it treats each bug as a mystery to be solved with passion and mathematical precision!* 🌍🔍