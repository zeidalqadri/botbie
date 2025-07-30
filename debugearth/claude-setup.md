# 🌍 DebugEarth Claude Agent Setup

## Installation

### 1. Install DebugEarth globally
```bash
npm install -g debugearth
```

### 2. Configure Claude Desktop

Add DebugEarth to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "debugearth": {
      "command": "node",
      "args": ["/path/to/debugearth/dist/agent-mcp-server.js"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "debugearth": {
      "command": "debugearth-agent"
    }
  }
}
```

### 3. Restart Claude Desktop

After updating the configuration, restart Claude Desktop to load the DebugEarth agent.

## Usage

### Enter Debug Mode

Use the slash command to activate DebugEarth:

```
/debug
```

Or start with a specific issue:

```
/debug my app crashes when clicking submit button
```

### Example Debugging Session

```
You: /debug TypeError: Cannot read property 'name' of undefined

Claude: 🌍 DebugEarth Investigation Started!

Session ID: debug_abc123

I detect an error-related issue. Please provide the full error message and stack trace.

**Next steps:**
1. Provide the full error message and stack trace
2. Check browser/application console for any warnings or errors
3. Describe the exact steps that trigger the bug

You: Here's the stack trace:
TypeError: Cannot read property 'name' of undefined
    at UserProfile.render (UserProfile.js:42:23)
    at renderComponent (react-dom.js:1234:12)

Claude: 📎 Clue added!

I see a TypeError. The stack trace points to UserProfile.js:42:23.

**New hypotheses:**
1. User object is undefined when component renders
2. Async data fetch hasn't completed before render

Let me help you investigate further. Can you show me the code around line 42 in UserProfile.js?

You: [provides code]

Claude: [continues investigation using agent tools...]
```

### Available Tools

1. **investigate** - Start a new debugging investigation
2. **add_clue** - Add evidence to the current investigation
3. **solve** - Attempt to solve based on gathered evidence
4. **debug_strategy** - Get specific debugging strategies

### Debug Strategies

Request specific debugging approaches:

```
Use debug_strategy with:
- console-detective: For tracing execution flow
- stack-archaeologist: For analyzing error traces
- performance-hunter: For performance issues
- ui-surgeon: For UI/rendering bugs
```

## Features

- **Methodical Approach**: Uses 5 Whys and systematic hypothesis testing
- **Evidence-Based**: Collects and correlates multiple types of evidence
- **Smart Suggestions**: Provides contextual next steps based on the bug type
- **Confidence Scoring**: Shows confidence levels for root cause findings
- **Proof Chains**: Builds mathematical-style proofs for conclusions

## Tips

1. **Be Specific**: Provide detailed bug descriptions for better analysis
2. **Add Context**: Include error messages, logs, and reproduction steps
3. **Follow Suggestions**: DebugEarth will guide you to gather the right evidence
4. **Trust the Process**: Let DebugEarth methodically work through the evidence

Remember: DebugEarth doesn't just debug - it treats each bug as a mystery to be solved with passion and precision! 🌍🔍