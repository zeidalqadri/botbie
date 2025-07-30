# Earth Agents Claude Code Integration

This directory contains Claude Code slash commands and configuration for the Earth Agents ecosystem.

## 🚀 Quick Setup

### 1. Copy Slash Commands
These commands are automatically available when you have this `.claude/` directory in your project:

- `/earth` - Main Earth Agents command with overview
- `/earth:analyze` - Code quality analysis with Botbie
- `/earth:debug` - Debugging sessions with DebugEarth
- `/earth:workflow` - Intelligent cross-agent workflows
- `/earth:insights` - Cross-agent insights and patterns
- `/earth:session` - Session management and analytics
- `/earth:fix` - Auto-fix engine for code improvements
- `/earth:learn` - Learning engine patterns and feedback

### 2. MCP Server Setup (Optional)
For advanced features, set up the MCP server integration:

1. Copy the MCP configuration:
   ```bash
   cp .claude/claude_desktop_config.json ~/.config/claude-desktop/config.json
   ```

2. Ensure Earth Agents CLI is installed and built:
   ```bash
   npm install
   npm run build
   npm link  # Makes 'earth' and 'earth-mcp' commands available globally
   ```

3. Test the MCP server:
   ```bash
   earth mcp  # Should show MCP server configuration
   ```

4. Restart Claude Desktop to load the new configuration

## 📋 Available Commands

### Core Commands

#### `/earth`
Main Earth Agents overview and quick start guide
- Shows ecosystem overview
- Lists all available commands
- Provides examples and workflows

#### `/earth:analyze`
**Botbie Code Quality Analysis**
- Comprehensive code quality assessment  
- Architecture, security, performance, documentation analysis
- Generates quality scores and actionable recommendations
- Integrates with learning engine for continuous improvement

Usage examples:
- `/earth:analyze` - Analyze current directory
- `/earth:analyze ./src` - Analyze specific path
- `/earth:analyze security` - Security-focused analysis

#### `/earth:debug`
**DebugEarth Methodical Debugging**
- Systematic debugging with evidence collection
- Root cause analysis with mathematical proofs
- Multiple debugging strategies (Console Detective, Stack Archaeologist, etc.)
- Session management for tracking debugging progress

Usage examples:
- `/earth:debug API returns 404 randomly` - Start new debugging session
- `/earth:debug analyze` - Analyze current session for root cause
- `/earth:debug add error <stack-trace>` - Add evidence to session

### Workflow Commands

#### `/earth:workflow`
**Intelligent Cross-Agent Workflows**
- **Preventive**: Proactive quality analysis to prevent bugs
- **Detective**: Reactive investigation when issues occur
- **Comprehensive**: Full spectrum analysis combining both agents
- AI-powered workflow selection based on project context

Usage examples:
- `/earth:workflow preventive` - Proactive quality checks
- `/earth:workflow detective` - Investigate existing issues
- `/earth:workflow comprehensive` - Complete analysis

#### `/earth:fix`
**Auto-Fix Engine**
- Automatic code improvements and repairs
- Documentation generation, import organization, formatting fixes
- Security vulnerability fixes with confirmation
- Transaction-based fixing with rollback capability

Usage examples:
- `/earth:fix` - Auto-fix all applicable issues
- `/earth:fix documentation` - Generate missing JSDoc
- `/earth:fix security` - Address security vulnerabilities

### Intelligence Commands

#### `/earth:insights`
**Cross-Agent Insights and Patterns**
- View insights shared between Botbie and DebugEarth
- Pattern recognition and correlation analysis
- Predictive analytics for bug prevention
- Team-specific learning and recommendations

Usage examples:
- `/earth:insights` - View all cross-agent insights
- `/earth:insights botbie` - Botbie-specific insights
- `/earth:insights critical` - High-impact insights only

#### `/earth:learn`
**Learning Engine Analytics**
- Pattern recognition and continuous improvement
- Feedback loop management and effectiveness tracking
- Team adaptation and preference learning
- Predictive capabilities for bug and performance issues

Usage examples:
- `/earth:learn` - View learning metrics and patterns
- `/earth:learn patterns` - All learned patterns
- `/earth:learn feedback` - Active feedback loops

#### `/earth:session`
**Session Management**
- Track sessions across Earth Agents ecosystem
- Cross-agent session correlation and analytics
- Session history and outcome analysis
- Real-time session monitoring

Usage examples:
- `/earth:session` - Current session status
- `/earth:session active` - Active sessions
- `/earth:session stats` - Detailed analytics

## 🎯 Usage Patterns

### Quick Quality Check
```
/earth:analyze
```
Fast code quality assessment with immediate feedback

### Comprehensive Analysis
```
/earth:workflow comprehensive
```
Full spectrum analysis combining proactive and reactive approaches

### Bug Investigation
```
/earth:debug [issue description]
```
Start systematic debugging session with evidence collection

### Learning from Patterns
```
/earth:insights
/earth:learn patterns
```
Understand what the system has learned about your codebase

### Automated Improvements
```
/earth:fix
```
Apply safe, automatic code improvements

## 🔧 Advanced Configuration

### MCP Server Features
When the MCP server is configured, you get access to:

- **Advanced Tools**: 13+ specialized tools for analysis and debugging
- **Resource Access**: Live access to analysis results and session data
- **Intelligent Prompts**: Context-aware prompts for different scenarios
- **Real-Time Integration**: Live updates and streaming analysis

### Custom Workflows
You can create custom workflows by:

1. Using the learning engine to discover team patterns
2. Configuring analysis thresholds based on learned patterns
3. Setting up project-specific quality rules
4. Creating custom fix rules and automation

### Team Integration
For team use:

1. **Shared Configuration**: Commit `.claude/` directory to version control
2. **Team Standards**: Use learning engine to establish team coding standards
3. **Consistent Analysis**: Everyone gets the same quality analysis
4. **Knowledge Sharing**: Cross-agent insights benefit the entire team

## 🐛 Troubleshooting

### Command Not Found
If slash commands don't appear:
1. Ensure `.claude/commands/` directory exists in project root
2. Restart Claude Code
3. Check that `.md` files are properly formatted

### MCP Server Issues
If MCP server features don't work:
1. Verify `earth-mcp` command is available: `which earth-mcp`
2. Test MCP server: `earth mcp`
3. Check Claude Desktop configuration: `~/.config/claude-desktop/config.json`
4. Restart Claude Desktop after configuration changes

### Analysis Issues
If analysis doesn't work as expected:
1. Ensure project has proper file structure
2. Check that source files are in expected locations
3. Verify dependencies are installed: `npm install`
4. Try building the project: `npm run build`

## 📚 Examples

### Complete Development Workflow
```
1. /earth:analyze                    # Check code quality
2. /earth:fix documentation         # Fix missing docs
3. /earth:workflow preventive       # Run preventive analysis
4. /earth:debug [any issues found]  # Debug specific problems
5. /earth:insights                  # Learn from patterns
```

### Bug Investigation Workflow
```
1. /earth:debug [issue description]     # Start debugging session
2. /earth:debug add error [stack trace] # Add evidence
3. /earth:debug analyze                 # Run root cause analysis
4. /earth:insights                      # Check for related patterns
5. /earth:fix                          # Apply preventive fixes
```

### Learning and Improvement Workflow
```
1. /earth:learn patterns              # Review learned patterns
2. /earth:insights                    # Check cross-agent insights
3. /earth:session stats               # Review session analytics
4. /earth:workflow comprehensive      # Apply learned optimizations
```

## 🚀 Getting Started

1. **Start Simple**: Try `/earth:analyze` on your current project
2. **Explore Workflows**: Use `/earth:workflow smart` for AI-recommended approach
3. **Debug Issues**: Use `/earth:debug [description]` when problems arise
4. **Learn Patterns**: Check `/earth:insights` and `/earth:learn` regularly
5. **Automate Fixes**: Use `/earth:fix` for safe automatic improvements

The Earth Agents ecosystem becomes more intelligent and helpful the more you use it, learning your team's patterns and preferences to provide better recommendations over time.

Happy coding! 🌍🤖