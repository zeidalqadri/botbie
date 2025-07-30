# Botbie MCP Integration Setup

This guide helps you integrate Botbie with Claude Desktop using the Model Context Protocol (MCP).

## Prerequisites

1. **Claude Desktop** - Download from [Anthropic](https://claude.ai/download)
2. **Node.js 18+** - Required for running Botbie
3. **Built Botbie** - Run `npm run build` in the Botbie directory

## Setup Steps

### 1. Build Botbie

```bash
cd packages/@earth-agents/botbie
npm install
npm run build
```

### 2. Configure Claude Desktop

#### macOS/Linux
Edit your Claude Desktop configuration file:
```bash
# macOS
nano ~/Library/Application\ Support/Claude\ Code/claude_desktop_config.json

# Linux
nano ~/.config/claude-desktop/claude_desktop_config.json
```

#### Windows
Edit the configuration file at:
```
%APPDATA%\Claude\claude_desktop_config.json
```

### 3. Add Botbie Configuration

Add the Botbie MCP server to your configuration:

```json
{
  "mcpServers": {
    "botbie": {
      "command": "node",
      "args": ["./dist/mcp-server.js"],
      "cwd": "/path/to/your/project/packages/@earth-agents/botbie",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Important:** Replace `/path/to/your/project/` with the actual path to your Earth Agents project.

### 4. Restart Claude Desktop

After saving the configuration, restart Claude Desktop to load the MCP server.

## Available Tools

Once configured, you'll have access to these Botbie tools in Claude Desktop:

### 🔍 `analyze_code_quality`
Perform comprehensive code quality analysis
```
Parameters:
- path (required): Project directory to analyze
- outputPath (optional): Where to save reports
- enableAutoFix (optional): Enable automatic fixes
- strictMode (optional): Use strict analysis rules
```

### 🧠 `query_knowledge_graph`
Query the code knowledge graph with natural language
```
Parameters:
- query (required): Natural language question about the code
- projectPath (optional): Project path if different from last analysis
```

### 📄 `get_code_from_node`
Retrieve specific code from the knowledge graph
```
Parameters:
- nodeId (optional): Specific node ID to retrieve
- nodeName (optional): Name of code element to find
```

### 🔎 `detect_similar_issues`
Find similar code quality issues across the codebase
```
Parameters:
- issueType (required): Type of issue to find
- filePath (optional): Context file path
```

### 🔧 `suggest_refactoring`
Get refactoring suggestions for specific code
```
Parameters:
- filePath (required): File to analyze
- startLine (optional): Start line of code section
- endLine (optional): End line of code section
```

## Available Resources

Botbie provides these resources you can reference:

- `botbie://latest-report` - Most recent analysis report
- `botbie://project-metrics` - Current project quality metrics  
- `botbie://knowledge-graph` - Code knowledge graph summary

## Slash Commands

Use these prompts for guided sessions:

### `/analyze [project_path]`
Start a comprehensive code quality analysis session

### `/fix_issues [severity]`
Interactive session to fix code quality issues

### `/architecture_review [focus_area]`
Focused architectural analysis and recommendations

## Example Usage

### Basic Analysis
```
User: I want to analyze my project for code quality issues.

Claude: I'll help you analyze your project with Botbie. Let me start by running a comprehensive code quality analysis.

[Claude uses analyze_code_quality tool]

Based on the analysis, your project has a quality score of 78/100 with 23 total issues, including 3 critical ones...
```

### Knowledge Graph Query
```
User: What classes in my codebase have more than 10 methods?

Claude: Let me query the knowledge graph for classes with many methods.

[Claude uses query_knowledge_graph tool]

I found 4 classes with more than 10 methods:
- UserManager (15 methods) - may violate Single Responsibility Principle
- OrderProcessor (12 methods) - consider splitting by responsibility
...
```

### Architecture Review
```
User: /architecture_review coupling

Claude: I'll conduct a focused architectural review with emphasis on coupling analysis.

[Guided session begins with analysis and specific recommendations]
```

## Troubleshooting

### Server Not Starting
1. Check that Node.js is installed: `node --version`
2. Verify Botbie is built: `ls dist/mcp-server.js`
3. Check the cwd path in configuration is correct
4. Look at Claude Desktop logs for error messages

### Tools Not Available
1. Restart Claude Desktop after configuration changes
2. Verify JSON syntax in configuration file
3. Check file permissions on the mcp-server.js file

### Analysis Fails  
1. Ensure the project path exists and is readable
2. Check that the project contains source code files
3. Verify sufficient disk space for reports and analysis

### Configuration Path Issues
Make sure to use absolute paths in the MCP configuration:
```json
{
  "mcpServers": {
    "botbie": {
      "command": "node",
      "args": ["./dist/mcp-server.js"],
      "cwd": "/Users/yourname/projects/earth-agents/packages/@earth-agents/botbie"
    }
  }
}
```

## Advanced Configuration

### Custom Environment Variables
```json
{
  "mcpServers": {
    "botbie": {
      "command": "node",
      "args": ["./dist/mcp-server.js"],
      "cwd": "/path/to/botbie",
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info",
        "BOTBIE_CACHE_DIR": "/tmp/botbie-cache"
      }
    }
  }
}
```

### Multiple Projects
You can configure multiple Botbie instances for different projects:
```json
{
  "mcpServers": {
    "botbie-frontend": {
      "command": "node",
      "args": ["./dist/mcp-server.js"],
      "cwd": "/path/to/frontend-project/botbie"
    },
    "botbie-backend": {
      "command": "node", 
      "args": ["./dist/mcp-server.js"],
      "cwd": "/path/to/backend-project/botbie"
    }
  }
}
```

## Integration with Development Workflow

### Pre-commit Analysis
```bash
# Add to .git/hooks/pre-commit
#!/bin/bash
node packages/@earth-agents/botbie/dist/cli.js analyze --strict
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Code Quality Analysis
  run: |
    npm install -g @earth-agents/cli
    earth analyze --output ./reports --strict
```

---

**Need help?** Check the [main documentation](../../EARTH-AGENTS.md) or create an issue in the repository.