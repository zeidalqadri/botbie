# 🧪 DebugEarth VS Code Extension Testing Guide

This guide provides steps to manually test and validate the DebugEarth VS Code extension functionality.

## Prerequisites

1. VS Code installed
2. DebugEarth npm package built and available
3. Extension compiled successfully (`npm run compile`)

## Manual Testing Checklist

### ✅ Extension Loading

1. **Open Extension in Development Mode**
   - Open the `vscode-debugearth` folder in VS Code
   - Press `F5` to launch Extension Development Host
   - New VS Code window should open with extension loaded

2. **Verify Extension Activation**
   - Check that "🌍 DebugEarth is ready to dig deep into your bugs!" message appears
   - Verify DebugEarth icon appears in Activity Bar
   - Confirm extension shows in Extensions panel as loaded

### ✅ Command Registration

Test each command from Command Palette (`Ctrl+Shift+P`):

1. **DebugEarth: Start Debugging Session**
   - Should open input box for bug description
   - Should create new session and show confirmation
   - Should offer to show debug panel

2. **DebugEarth: Show Sessions**
   - Should list all active sessions
   - Should allow selection to open panel

3. **DebugEarth: Analyze Session** *(requires active session)*
   - Should show progress notification
   - Should run analysis and show results

4. **DebugEarth: Add Evidence** *(requires active session)*
   - Should show evidence type picker
   - Should show input box for evidence data
   - Should confirm evidence addition

5. **DebugEarth: Stop Session** *(requires active session)*
   - Should stop active session
   - Should show confirmation message

6. **DebugEarth: Clear Sessions**
   - Should show confirmation dialog
   - Should clear all sessions when confirmed

### ✅ Tree Views

#### Session Tree View

1. **Empty State**
   - Should show empty tree when no sessions exist
   - Should show "Start Debugging" button

2. **With Sessions**
   - Should show session items with status icons
   - Should be expandable to show session details
   - Should show evidence count, hypothesis count, attempts, duration

3. **Context Menu Actions**
   - Right-click active session should show Analyze, Stop, Add Evidence
   - Right-click inactive session should show limited options

#### Evidence Tree View

1. **Empty State**
   - Should show empty when no evidence exists

2. **With Evidence**
   - Should group evidence by session
   - Should show evidence type icons
   - Should be expandable to show evidence details

### ✅ Debug Panel (Webview)

1. **Panel Opening**
   - Should open when clicking "Show Panel" after session creation
   - Should open when selecting session from quick pick

2. **Session Information**
   - Should display session ID, status, duration, evidence count
   - Should show bug description in code block

3. **Action Buttons**
   - "🧩 Analyze Session" should work and update panel
   - "🛑 Stop Session" should work and disable actions
   - "🔄 Refresh" should update panel content

4. **Evidence Addition**
   - Quick evidence buttons should add evidence and refresh panel
   - Custom evidence form should work with all evidence types
   - Evidence should appear in evidence list immediately

5. **Root Cause Display**
   - Should show root cause section after analysis
   - Should display confidence bar and percentage
   - Should show solution and explanation
   - Should show proof chain if available

### ✅ Configuration

Test VS Code settings:

1. **Open Settings** (`Ctrl+,`)
2. **Search for "debugearth"**
3. **Verify Settings Available:**
   - `debugearth.verbose`
   - `debugearth.maxAttempts`
   - `debugearth.enableVisualDebugging`
   - `debugearth.autoRefresh`

4. **Test Setting Changes**
   - Change `debugearth.autoRefresh` to false
   - Verify auto-refresh stops working
   - Change back to true and verify it resumes

### ✅ Error Handling

1. **Invalid Bug Description**
   - Try empty description - should show error or handle gracefully

2. **No Active Sessions**
   - Try "Analyze Session" with no sessions - should show warning
   - Try "Add Evidence" with no sessions - should show warning

3. **Extension Errors**
   - Check Developer Console (`Help > Toggle Developer Tools`)
   - Should not show any errors during normal operation

### ✅ Integration Testing

1. **With DebugEarth Core**
   - Verify extension can load DebugEarth npm package
   - Test that debugging strategies are available
   - Confirm evidence collection works

2. **Cross-Session Management**
   - Create multiple sessions
   - Switch between sessions
   - Verify session isolation

### ✅ Performance Testing

1. **Memory Usage**
   - Monitor VS Code memory usage during testing
   - Should not show excessive memory growth

2. **Responsiveness**
   - UI should remain responsive during analysis
   - Tree views should update quickly
   - Panel should load without delays

## Testing Scenarios

### Scenario 1: Complete Debugging Workflow

1. Start new debugging session with description "Button click not working"
2. Add console evidence: "Uncaught TypeError: Cannot read property 'click'"
3. Add UI evidence: "Button element has no event listener"
4. Run analysis
5. Verify root cause is found
6. Check solution recommendations
7. Stop session

### Scenario 2: Multiple Sessions

1. Create 3 different debugging sessions
2. Add evidence to each session
3. Switch between sessions using tree view
4. Analyze different sessions
5. Verify session isolation

### Scenario 3: Evidence Management

1. Create session
2. Add all evidence types (console, stack-trace, network, performance, ui, user-report)
3. Verify evidence appears in tree view
4. Check evidence details in panel
5. Verify evidence correlation in analysis

## Expected Results

✅ **All commands work without errors**  
✅ **Tree views populate and refresh correctly**  
✅ **Debug panel displays all information**  
✅ **Evidence collection and analysis functions**  
✅ **Root cause analysis produces results**  
✅ **Configuration settings take effect**  
✅ **No console errors or warnings**  
✅ **Good performance and responsiveness**  

## Troubleshooting Test Issues

### Extension Won't Load
- Check compilation: `npm run compile`
- Verify DebugEarth package exists in parent directory
- Check for TypeScript errors

### Commands Not Available
- Restart Extension Development Host
- Check extension activation events
- Verify package.json contribution points

### Tree Views Empty
- Click refresh button
- Check if sessions were created successfully
- Verify auto-refresh setting

### Panel Won't Open
- Check Developer Console for errors
- Verify webview permissions
- Try refreshing the session

## Automated Testing (Future)

For future development, consider adding:

- Unit tests for providers and managers
- Integration tests with mock VS Code API
- E2E tests using VS Code extension testing framework
- Performance benchmarks
- Cross-platform testing

---

**Testing Status**: Manual testing required before release  
**Last Updated**: Initial version - December 2024