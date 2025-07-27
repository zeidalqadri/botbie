# 🤖 DebugEarth as a Claude MCP Agent

This guide shows how to set up DebugEarth as an MCP (Model Context Protocol) server that Claude can use to help debug code.

## Installation

### 1. Install DebugEarth globally
```bash
npm install -g debugearth
```

### 2. Or install locally and build
```bash
cd debugearth
npm install
npm run build
npm run build:mcp
```

## Setting up in Claude Desktop

### 1. Edit Claude Desktop Configuration

Open your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### 2. Add DebugEarth MCP Server

Add this to your `mcpServers` configuration:

```json
{
  "mcpServers": {
    "debugearth": {
      "command": "node",
      "args": ["/path/to/debugearth/dist/mcp-server.js"],
      "env": {}
    }
  }
}
```

Or if installed globally:
```json
{
  "mcpServers": {
    "debugearth": {
      "command": "debugearth-mcp",
      "env": {}
    }
  }
}
```

### 3. Restart Claude Desktop

After saving the configuration, restart Claude Desktop to load the MCP server.

## Using DebugEarth in Claude

### Available Commands

Once connected, Claude can use these DebugEarth tools:

#### 1. **start_debug_session**
Start a new debugging session for a specific bug.
```
Claude, start a debug session for "API returns 404 errors randomly"
```

#### 2. **analyze_session**
Analyze collected evidence to find root cause.
```
Claude, analyze the debug session <session-id>
```

#### 3. **add_evidence**
Add evidence to help with debugging.
```
Claude, add this stack trace to the session:
TypeError: Cannot read property 'name' of undefined
  at getUserData (app.js:45:23)
```

#### 4. **get_session_status**
Check the status of a debugging session.
```
Claude, what's the status of debug session <session-id>?
```

#### 5. **list_sessions**
See all active debugging sessions.
```
Claude, list all debug sessions
```

#### 6. **simulate_error**
Test DebugEarth with simulated errors.
```
Claude, simulate a type-error to test debugging
```

## Example Debugging Workflow

### 1. Start a Session
```
You: "Claude, I have a bug where user data sometimes doesn't load. Can you help debug?"

Claude: [Uses start_debug_session tool]
"I've started debug session abc-123 for 'user data sometimes doesn't load'. 
Let me help you debug this systematically."
```

### 2. Add Evidence
```
You: "Here's the error I'm seeing in console:
TypeError: Cannot read property 'profile' of undefined
  at loadUserProfile (user.js:23:17)"

Claude: [Uses add_evidence tool]
"I've added that stack trace to the session. This suggests the user object 
is undefined when trying to access the profile property."
```

### 3. Analyze
```
You: "Can you analyze what might be causing this?"

Claude: [Uses analyze_session tool]
"🎯 ROOT CAUSE FOUND!

The user object is undefined due to a race condition in async data loading.

📐 Mathematical Proof:
1. Given: Bug manifestation observed
2. Axiom: 1 stack-trace evidence collected
3. Lemma 1: TypeError occurs at user.profile access
4. Lemma 2: User object is undefined at time of access
5. Therefore: Data loading completes after access attempt

✅ Solution:
Add null checking and implement proper async/await pattern:
```javascript
async function loadUserProfile(userId) {
  const user = await fetchUser(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return user.profile;
}
```

Confidence: 85%"
```

## Advanced Usage

### Debugging Complex Issues

```
You: "My React app has a memory leak that happens after 10 minutes of use"

Claude: [Creates session, asks for performance data]
"I've started a debug session. Can you:
1. Open DevTools and take a heap snapshot
2. Use the app normally for 10 minutes
3. Take another heap snapshot
4. Share any console errors you see"

[After you provide data]

Claude: [Analyzes the evidence]
"The memory leak is caused by event listeners not being removed 
in useEffect cleanup functions..."
```

### Collaborative Debugging

DebugEarth works best when you provide:
- Specific error messages and stack traces
- Steps to reproduce the bug
- Any patterns you've noticed
- Performance metrics if relevant

## Tips for Best Results

1. **Be Specific**: Describe the bug in detail when starting a session
2. **Share Evidence**: Copy/paste error messages, stack traces, and logs
3. **Reproduce**: Tell Claude the steps that trigger the bug
4. **Context**: Share relevant code snippets around the error
5. **Iterate**: DebugEarth gets smarter with more evidence

## Troubleshooting MCP Setup

### Server not connecting?
1. Check the path in `claude_desktop_config.json` is correct
2. Ensure DebugEarth is built: `npm run build && npm run build:mcp`
3. Check Claude Desktop logs for errors

### Tools not showing?
1. Restart Claude Desktop completely
2. Verify the MCP server is listed in settings
3. Try running the server manually to check for errors:
   ```bash
   node /path/to/debugearth/dist/mcp-server.js
   ```

## Example Prompts

- "Start debugging my authentication issue"
- "My app crashes when clicking the submit button"
- "Analyze why this function returns undefined"
- "Help me find a memory leak in my Node.js app"
- "Debug this TypeScript error I'm getting"
- "The API works locally but fails in production"

DebugEarth will systematically help you dig deep into these issues and find the root cause!