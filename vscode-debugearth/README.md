# 🌍 DebugEarth VS Code Extension

A methodical debug agent that digs deep to uncover root causes, now integrated directly into VS Code! DebugEarth doesn't just find bugs - it LOVES finding them, treating each debugging session as an archaeological expedition to uncover the truth buried beneath layers of code.

## Features

- **🔬 Methodical Root Cause Analysis**: Uses the 5 Whys methodology and mathematical proof generation
- **🕵️ Multiple Debug Strategies**: Console Detective, UI Surgeon, Stack Archaeologist, and Performance Hunter
- **📊 Evidence-Based Debugging**: Collects and correlates console logs, stack traces, performance metrics, and UI events
- **🎯 Hypothesis Testing**: Generates and tests hypotheses about bug causes
- **✨ Visual Debugging**: Creates temporary UI elements to visualize issues
- **📈 Performance Monitoring**: Tracks memory leaks and CPU bottlenecks
- **🖥️ VS Code Integration**: Sidebar panels, command palette, webview panels

## Installation

### From Source

1. Clone this repository
2. Open the extension folder in VS Code
3. Press `F5` to run the extension in a new Extension Development Host window

### For Development

```bash
git clone <repository-url>
cd vscode-debugearth
npm install
npm run compile
```

## Usage

### Starting a Debug Session

1. **Command Palette**: Press `Ctrl+Shift+P` and type "DebugEarth: Start Debugging Session"
2. **Activity Bar**: Click the DebugEarth icon in the activity bar and click "Start Debugging"
3. **Tree View**: Right-click in the DebugEarth Sessions panel and select "Start Debugging"

Enter a description of the bug you want to debug (e.g., "Button click not working", "API timeout errors").

### Using the Session Panel

Once a session is started, you'll see:

- **Session Tree View**: Shows all debug sessions with their status and details
- **Evidence Tree View**: Shows collected evidence organized by session
- **Debug Panel**: A webview panel with detailed session information and controls

### Adding Evidence

You can add evidence to your debugging session in several ways:

1. **Quick Evidence Buttons**: Use pre-defined evidence types in the debug panel
2. **Custom Evidence**: Select evidence type and enter details manually
3. **Automatic Collection**: DebugEarth automatically collects console logs and errors

### Analyzing Sessions

Click "🧩 Analyze Session" to run DebugEarth's debugging strategies and generate:

- **Hypotheses**: Potential explanations for the bug
- **Evidence Correlation**: Connections between different pieces of evidence
- **Root Cause Analysis**: Mathematical proof-style explanation of the bug
- **Solution Recommendations**: Specific fixes you can apply

## Commands

- `debugearth.startDebugging`: Start a new debugging session
- `debugearth.analyzeSession`: Analyze the current session for root causes
- `debugearth.addEvidence`: Add evidence to an active session
- `debugearth.stopSession`: Stop an active debugging session
- `debugearth.showSessions`: Show all sessions in a quick pick
- `debugearth.clearSessions`: Clear all debugging sessions
- `debugearth.refreshSessions`: Refresh the session tree views

## Configuration

Configure DebugEarth through VS Code settings:

```json
{
  "debugearth.verbose": true,
  "debugearth.maxAttempts": 10,
  "debugearth.enableVisualDebugging": true,
  "debugearth.autoRefresh": true
}
```

### Settings

- **`debugearth.verbose`**: Enable verbose logging (default: true)
- **`debugearth.maxAttempts`**: Maximum debugging attempts per session (default: 10)
- **`debugearth.enableVisualDebugging`**: Enable visual debugging features (default: true)
- **`debugearth.autoRefresh`**: Auto-refresh sessions view (default: true)

## Debug Strategies

### 🕵️ Console Detective
Strategic console logging analysis that identifies patterns in console output, detects repeated logs indicating loops, and suggests optimal logging placement.

### 🔬 UI Surgeon
Visual debugging for browser environments that creates debug overlays with real-time information, highlights problematic DOM elements, and provides interactive element inspection.

### 🏺 Stack Archaeologist
Deep stack trace analysis that extracts error types and patterns, identifies error propagation chains, and correlates multiple stack traces.

### 🏹 Performance Hunter
Tracks down performance issues by detecting memory leaks, monitoring CPU usage, tracking event loop lag, and analyzing network request timing.

## Evidence Types

- **Console**: Console log outputs and error messages
- **Stack Trace**: Error stack traces and call hierarchies
- **Network**: Network request/response data and timing
- **Performance**: Memory usage, CPU metrics, and timing data
- **UI**: DOM events, interactions, and element states
- **User Report**: Manual bug reports and observations

## Root Cause Analysis

DebugEarth provides comprehensive root cause analysis including:

1. **Description**: Clear explanation of the root cause
2. **Evidence**: All correlated evidence supporting the conclusion
3. **Explanation**: Detailed analysis with causal chain
4. **Solution**: Specific fix recommendations with code examples
5. **Confidence**: Statistical confidence level (0-100%)
6. **Proof Chain**: Mathematical-style proof of the root cause

## Workflow Example

1. **Start Session**: Create a new debugging session with bug description
2. **Reproduce Bug**: Perform actions that trigger the bug while DebugEarth collects evidence
3. **Add Evidence**: Manually add any additional observations or error messages
4. **Analyze**: Run analysis to generate hypotheses and test them
5. **Review Results**: Examine the root cause analysis and proposed solutions
6. **Apply Fix**: Implement the recommended solution
7. **Verify**: Test the fix and close the session

## Integration with DebugEarth Core

This extension uses the [DebugEarth npm package](../debugearth) as its core engine. All debugging logic, strategies, and analysis capabilities are provided by the core library.

## Development

### Building

```bash
npm run compile
```

### Watching

```bash
npm run watch
```

### Testing

The extension can be tested by:

1. Opening it in VS Code
2. Pressing `F5` to launch Extension Development Host
3. Testing commands and functionality in the new window

## Troubleshooting

### Extension Not Loading
- Check that DebugEarth npm package is installed in parent directory
- Verify TypeScript compilation completed successfully
- Check VS Code Developer Console for error messages

### Commands Not Working
- Ensure extension is activated (start a debugging session)
- Check that workspace has files (some commands require an active workspace)
- Verify configuration settings are valid

### Sessions Not Showing
- Click refresh button in session tree view
- Check that `debugearth.autoRefresh` is enabled
- Verify session was created successfully in output panel

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the extension thoroughly
5. Submit a pull request

## Architecture

The extension consists of several key components:

- **Extension**: Main extension entry point and command registration
- **DebugEarthManager**: Bridge between VS Code and DebugEarth core
- **SessionTreeProvider**: Tree view for debugging sessions
- **EvidenceTreeProvider**: Tree view for evidence management
- **DebugPanel**: Webview panel for detailed session interaction

## License

MIT

---

## Using with DebugEarth MCP Server

This extension complements the [DebugEarth MCP server](../debugearth/MCP-SETUP.md) for Claude Desktop. You can use both together:

1. Use the VS Code extension for in-editor debugging
2. Use the MCP server for Claude-powered debugging conversations
3. Share session data between both tools for comprehensive debugging

*Remember: DebugEarth doesn't just debug - it treats each bug as a mystery to be solved with passion and mathematical precision!* 🌍🔍