#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createBotbie } from './index.js';
import { CodeHealthReport } from './Botbie.js';
import * as path from 'path';
import * as fs from 'fs';

class BotbieMCPServer {
  private server: Server;
  private botbie: any;

  constructor() {
    this.server = new Server(
      {
        name: 'botbie-mcp-server',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        }
      }
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();
    this.setupPromptHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'analyze_code_quality',
            description: 'Analyze code quality for a project or directory',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to the project directory to analyze'
                },
                outputPath: {
                  type: 'string',
                  description: 'Optional output path for reports'
                },
                enableAutoFix: {
                  type: 'boolean',
                  description: 'Enable automatic fixing of issues'
                },
                strictMode: {
                  type: 'boolean',
                  description: 'Enable strict analysis mode'
                }
              },
              required: ['path']
            }
          },
          {
            name: 'query_knowledge_graph',
            description: 'Query the code knowledge graph with natural language',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Natural language query about the codebase'
                },
                projectPath: {
                  type: 'string',
                  description: 'Path to the project (if different from last analysis)'
                }
              },
              required: ['query']
            }
          },
          {
            name: 'get_code_from_node',
            description: 'Get code content from a specific node in the knowledge graph',
            inputSchema: {
              type: 'object',
              properties: {
                nodeId: {
                  type: 'string',
                  description: 'ID of the code node to retrieve'
                },
                nodeName: {
                  type: 'string',
                  description: 'Name of the code node to search for'
                }
              }
            }
          },
          {
            name: 'detect_similar_issues',
            description: 'Find similar code quality issues across the codebase',
            inputSchema: {
              type: 'object',
              properties: {
                issueType: {
                  type: 'string',
                  description: 'Type of issue to find similar instances of'
                },
                filePath: {
                  type: 'string',
                  description: 'File path where the original issue was found'
                }
              },
              required: ['issueType']
            }
          },
          {
            name: 'suggest_refactoring',
            description: 'Get refactoring suggestions for specific code',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Path to the file to analyze'
                },
                startLine: {
                  type: 'number',
                  description: 'Start line of code to refactor'
                },
                endLine: {
                  type: 'number',
                  description: 'End line of code to refactor'
                }
              },
              required: ['filePath']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'analyze_code_quality':
            return await this.handleAnalyzeCodeQuality(args);
          
          case 'query_knowledge_graph':
            return await this.handleQueryKnowledgeGraph(args);
          
          case 'get_code_from_node':
            return await this.handleGetCodeFromNode(args);
          
          case 'detect_similar_issues':
            return await this.handleDetectSimilarIssues(args);
          
          case 'suggest_refactoring':
            return await this.handleSuggestRefactoring(args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error}`
            }
          ]
        };
      }
    });
  }

  private setupResourceHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'botbie://latest-report',
            name: 'Latest Analysis Report',
            description: 'The most recent code quality analysis report',
            mimeType: 'application/json'
          },
          {
            uri: 'botbie://project-metrics',
            name: 'Project Metrics',
            description: 'Current project quality metrics',
            mimeType: 'application/json'
          },
          {
            uri: 'botbie://knowledge-graph',
            name: 'Code Knowledge Graph',
            description: 'The current code knowledge graph structure',
            mimeType: 'application/json'
          }
        ]
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case 'botbie://latest-report':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(this.getLatestReport(), null, 2)
              }
            ]
          };
        
        case 'botbie://project-metrics':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(this.getProjectMetrics(), null, 2)
              }
            ]
          };
        
        case 'botbie://knowledge-graph':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(this.getKnowledgeGraphSummary(), null, 2)
              }
            ]
          };
        
        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });
  }

  private setupPromptHandlers() {
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: 'analyze',
            description: 'Start a comprehensive code quality analysis session',
            arguments: [
              {
                name: 'project_path',
                description: 'Path to the project directory',
                required: false
              }
            ]
          },
          {
            name: 'fix_issues',
            description: 'Interactive session to fix code quality issues',
            arguments: [
              {
                name: 'severity',
                description: 'Minimum severity level (low, medium, high, critical)',
                required: false
              }
            ]
          },
          {
            name: 'architecture_review',
            description: 'Focused architectural analysis and recommendations',
            arguments: [
              {
                name: 'focus_area',
                description: 'Specific area to focus on (coupling, cohesion, layering)',
                required: false
              }
            ]
          }
        ]
      };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'analyze':
          return {
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: this.getAnalysisPrompt(args?.project_path)
                }
              }
            ]
          };
        
        case 'fix_issues':
          return {
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: this.getFixIssuesPrompt(args?.severity)
                }
              }
            ]
          };
        
        case 'architecture_review':
          return {
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: this.getArchitectureReviewPrompt(args?.focus_area)
                }
              }
            ]
          };
        
        default:
          throw new Error(`Unknown prompt: ${name}`);
      }
    });
  }

  private async handleAnalyzeCodeQuality(args: any) {
    const { path: projectPath, outputPath, enableAutoFix, strictMode } = args;

    if (!this.botbie) {
      this.botbie = createBotbie({
        enableAutoFix: enableAutoFix || false,
        strictMode: strictMode || false,
        verbose: false
      });
      await this.botbie.initialize();
    }

    const report = await this.botbie.execute({
      path: projectPath,
      options: { outputPath }
    });

    // Store the latest report
    this.storeLatestReport(report);

    return {
      content: [
        {
          type: 'text',
          text: this.formatAnalysisReport(report)
        }
      ]
    };
  }

  private async handleQueryKnowledgeGraph(args: any) {
    const { query, projectPath } = args;

    if (!this.botbie) {
      throw new Error('No analysis has been performed yet. Run analyze_code_quality first.');
    }

    const result = await this.botbie.askKnowledgeGraphQueries(query);

    return {
      content: [
        {
          type: 'text',
          text: `**Query:** ${query}\n\n**Results:**\n${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  private async handleGetCodeFromNode(args: any) {
    const { nodeId, nodeName } = args;

    if (!this.botbie) {
      throw new Error('No analysis has been performed yet. Run analyze_code_quality first.');
    }

    let result;
    if (nodeId) {
      result = await this.botbie.getCodeFromNodeId(nodeId);
    } else if (nodeName) {
      result = await this.botbie.getCodeFromProbableNodeName(nodeName);
    } else {
      throw new Error('Either nodeId or nodeName must be provided');
    }

    return {
      content: [
        {
          type: 'text',
          text: result ? JSON.stringify(result, null, 2) : 'No code found for the specified node'
        }
      ]
    };
  }

  private async handleDetectSimilarIssues(args: any) {
    const { issueType, filePath } = args;

    // This would integrate with the quality analyzer to find similar patterns
    return {
      content: [
        {
          type: 'text',
          text: `Searching for similar issues of type "${issueType}"${filePath ? ` in context of ${filePath}` : ''}...\n\n(Feature coming soon - will scan knowledge graph for similar patterns)`
        }
      ]
    };
  }

  private async handleSuggestRefactoring(args: any) {
    const { filePath, startLine, endLine } = args;

    return {
      content: [
        {
          type: 'text',
          text: `Analyzing code in ${filePath}${startLine ? ` (lines ${startLine}-${endLine || startLine})` : ''} for refactoring opportunities...\n\n(Feature coming soon - will provide specific refactoring suggestions)`
        }
      ]
    };
  }

  private formatAnalysisReport(report: CodeHealthReport): string {
    return `# 🤖 Botbie Code Quality Analysis

## Summary
- **Quality Score:** ${report.summary.qualityScore.toFixed(1)}/100
- **Total Files:** ${report.summary.totalFiles}
- **Total Issues:** ${report.summary.totalIssues}
- **Critical Issues:** ${report.summary.criticalIssues}

## Project Metrics
- **Lines of Code:** ${report.metrics.linesOfCode.toLocaleString()}
- **Technical Debt:** ${report.metrics.technicalDebt} hours
- **Maintainability Index:** ${report.metrics.maintainabilityIndex.toFixed(1)}
- **Complexity Score:** ${report.metrics.complexityScore.toFixed(1)}

## Top Issues
${report.issues
  .filter(i => i.severity === 'critical' || i.severity === 'high')
  .slice(0, 5)
  .map(issue => `- **[${issue.severity.toUpperCase()}]** ${issue.description} (${issue.file}${issue.line ? `:${issue.line}` : ''})`)
  .join('\n')}

## Key Suggestions
${report.suggestions
  .filter(s => s.impact === 'high')
  .slice(0, 3)
  .map(s => `- ${s.description}`)
  .join('\n')}

Run \`botbie analyze --output ./reports\` to generate detailed HTML reports.
`;
  }

  private getAnalysisPrompt(projectPath?: string): string {
    return `🤖 **Botbie Analysis Session**

I'm ready to perform a comprehensive code quality analysis${projectPath ? ` on ${projectPath}` : ''}.

Let's start by analyzing your codebase for:
- **Architecture issues** (coupling, cohesion, SOLID principles)
- **Code quality** (complexity, readability, maintainability)
- **Security vulnerabilities** (hardcoded secrets, injection risks)
- **Performance bottlenecks** (inefficient algorithms, memory leaks)
- **Documentation quality** (missing docs, API documentation)

Use the \`analyze_code_quality\` tool to begin the analysis, or specify a different project path if needed.

What would you like to focus on first?`;
  }

  private getFixIssuesPrompt(severity?: string): string {
    return `🔧 **Interactive Issue Fixing Session**

I'll help you systematically fix code quality issues${severity ? ` with ${severity} severity or higher` : ''}.

Available approaches:
1. **Auto-fix** - Automatically fix simple issues (imports, formatting, documentation)
2. **Guided refactoring** - Step-by-step guidance for complex issues
3. **Architecture improvements** - Strategic changes for better structure

Let's start by identifying the issues you'd like to address. Use \`analyze_code_quality\` if you haven't run an analysis yet.

Which type of issues would you like to tackle first?`;
  }

  private getArchitectureReviewPrompt(focusArea?: string): string {
    return `🏗️ **Architecture Review Session**

I'll conduct a focused architectural analysis${focusArea ? ` with emphasis on ${focusArea}` : ''}.

Review areas:
- **Coupling analysis** - Dependencies between modules
- **Cohesion evaluation** - Internal module organization  
- **Layer violations** - Architectural boundary breaches
- **SOLID principles** - Design principle adherence

Use \`analyze_code_quality\` to generate architectural insights, then we can dive deep into specific areas that need attention.

What architectural aspect concerns you most?`;
  }

  private storeLatestReport(report: CodeHealthReport) {
    // In a real implementation, you might store this in a database or file
    // For now, we'll keep it in memory
    (this as any).latestReport = report;
  }

  private getLatestReport() {
    return (this as any).latestReport || { message: 'No analysis has been performed yet' };
  }

  private getProjectMetrics() {
    const report = (this as any).latestReport;
    return report ? report.metrics : { message: 'No metrics available' };
  }

  private getKnowledgeGraphSummary() {
    if (this.botbie && this.botbie.knowledgeGraph) {
      return this.botbie.knowledgeGraph.getStatistics();
    }
    return { message: 'No knowledge graph available' };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Botbie MCP server running on stdio');
  }
}

const server = new BotbieMCPServer();
server.run().catch(console.error);