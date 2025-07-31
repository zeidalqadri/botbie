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
import { createBotbie } from '@earth-agents/botbie';
import { createSketchie } from '@earth-agents/sketchie';
import { sketchMCP } from '@earth-agents/sketchie/mcp';
import { SessionManager, CrossAgentInsight } from '@earth-agents/core';
import * as path from 'path';
import * as fs from 'fs';

interface UnifiedAnalysisResult {
  sessionId: string;
  timestamp: Date;
  botbieReport?: any;
  debugearthSession?: any;
  sketchieAnalysis?: any;
  crossAgentInsights: CrossAgentInsight[];
  recommendations: string[];
  overallScore: number;
}

class UnifiedEarthAgentsMCPServer {
  private server: Server;
  private sessionManager: SessionManager;
  private botbie: any;
  private sketchie: any;
  private latestResult: UnifiedAnalysisResult | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'earth-agents-unified',
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

    this.sessionManager = SessionManager.getInstance();
    this.setupToolHandlers();
    this.setupResourceHandlers();
    this.setupPromptHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      // Combine all tools from different agents
      const unifiedTools = [
          {
            name: 'unified_analysis',
            description: 'Run comprehensive analysis combining both Botbie and DebugEarth',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to the project directory to analyze'
                },
                analysisType: {
                  type: 'string',
                  enum: ['preventive', 'detective', 'comprehensive'],
                  description: 'Type of analysis workflow to run'
                },
                outputPath: {
                  type: 'string',
                  description: 'Optional output path for reports'
                },
                bugDescription: {
                  type: 'string',
                  description: 'Bug description for detective analysis'
                }
              },
              required: ['path']
            }
          },
          {
            name: 'cross_agent_insights',
            description: 'Get cross-agent insights and patterns',
            inputSchema: {
              type: 'object',
              properties: {
                agentType: {
                  type: 'string',
                  enum: ['botbie', 'debugearth', 'all'],
                  description: 'Filter insights by agent type'
                },
                impactLevel: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'critical'],
                  description: 'Minimum impact level'
                }
              }
            }
          },
          {
            name: 'session_management',
            description: 'Manage and view active sessions',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['list', 'get', 'statistics'],
                  description: 'Session management action'
                },
                sessionId: {
                  type: 'string',
                  description: 'Session ID for get action'
                }
              },
              required: ['action']
            }
          },
          {
            name: 'workflow_orchestration',
            description: 'Orchestrate intelligent workflows between agents',
            inputSchema: {
              type: 'object',
              properties: {
                workflow: {
                  type: 'string',
                  enum: ['quality-first', 'debug-guided', 'learning-loop'],
                  description: 'Workflow orchestration pattern'
                },
                projectPath: {
                  type: 'string',
                  description: 'Project path for analysis'
                },
                contextData: {
                  type: 'object',
                  description: 'Additional context for workflow'
                }
              },
              required: ['workflow', 'projectPath']
            }
          },
          {
            name: 'pattern_analysis',
            description: 'Analyze patterns across code quality and debugging sessions',
            inputSchema: {
              type: 'object',
              properties: {
                patternType: {
                  type: 'string',
                  enum: ['recurring-bugs', 'quality-degradation', 'performance-issues'],
                  description: 'Type of pattern to analyze'
                },
                timeframe: {
                  type: 'string',
                  description: 'Time frame for pattern analysis (e.g., "7d", "1m")'
                }
              },
              required: ['patternType']
            }
          }
        ];

      // Add Sketchie tools with prefixed names
      const sketchieToolsWithPrefix = sketchMCP.tools.map(tool => ({
        ...tool,
        name: `sketchie_${tool.name}`,
        description: `[Sketchie] ${tool.description}`
      }));

      return {
        tools: [...unifiedTools, ...sketchieToolsWithPrefix]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'unified_analysis':
            return await this.handleUnifiedAnalysis(args);
          
          case 'cross_agent_insights':
            return await this.handleCrossAgentInsights(args);
          
          case 'session_management':
            return await this.handleSessionManagement(args);
          
          case 'workflow_orchestration':
            return await this.handleWorkflowOrchestration(args);
          
          case 'pattern_analysis':
            return await this.handlePatternAnalysis(args);
          
          default:
            // Check if it's a Sketchie tool
            if (name.startsWith('sketchie_')) {
              const sketchieToolName = name.replace('sketchie_', '');
              const sketchTool = sketchMCP.tools.find(t => t.name === sketchieToolName);
              
              if (sketchTool && sketchTool.handler) {
                try {
                  const result = await sketchTool.handler(args);
                  return {
                    content: [
                      {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                      }
                    ]
                  };
                } catch (error) {
                  throw new Error(`Sketchie tool error: ${error}`);
                }
              }
            }
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
      const unifiedResources = [
          {
            uri: 'earth-agents://latest-unified-analysis',
            name: 'Latest Unified Analysis',
            description: 'The most recent unified analysis result',
            mimeType: 'application/json'
          },
          {
            uri: 'earth-agents://cross-agent-insights',
            name: 'Cross-Agent Insights',
            description: 'Current cross-agent insights and patterns',
            mimeType: 'application/json'
          },
          {
            uri: 'earth-agents://session-statistics',
            name: 'Session Statistics',
            description: 'Overall session and correlation statistics',
            mimeType: 'application/json'
          },
          {
            uri: 'earth-agents://learning-patterns',
            name: 'Learning Patterns',
            description: 'Learned patterns and recommendations',
            mimeType: 'application/json'
          }
        ];

      // Add Sketchie resources
      const sketchieResourcesWithPrefix = sketchMCP.resources.map(resource => ({
        ...resource,
        uri: resource.uri.replace('sketchie://', 'earth-agents://sketchie/'),
        name: `[Sketchie] ${resource.name}`
      }));

      return {
        resources: [...unifiedResources, ...sketchieResourcesWithPrefix]
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case 'earth-agents://latest-unified-analysis':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(this.latestResult || { message: 'No analysis performed yet' }, null, 2)
              }
            ]
          };
        
        case 'earth-agents://cross-agent-insights':
          const allInsights = [
            ...this.sessionManager.getInsightsForAgent('botbie'),
            ...this.sessionManager.getInsightsForAgent('debugearth')
          ];
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(allInsights, null, 2)
              }
            ]
          };
        
        case 'earth-agents://session-statistics':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(this.sessionManager.getStatistics(), null, 2)
              }
            ]
          };
        
        case 'earth-agents://learning-patterns':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(this.generateLearningPatterns(), null, 2)
              }
            ]
          };
        
        default:
          // Check if it's a Sketchie resource
          if (uri.startsWith('earth-agents://sketchie/')) {
            // For now, return placeholder data for Sketchie resources
            // In a real implementation, this would query Sketchie's internal state
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify({
                    message: 'Sketchie resource data would be here',
                    resource: uri
                  }, null, 2)
                }
              ]
            };
          }
          throw new Error(`Unknown resource: ${uri}`);
      }
    });
  }

  private setupPromptHandlers() {
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const unifiedPrompts = [
          {
            name: 'unified_analysis_session',
            description: 'Start a comprehensive analysis session with both agents',
            arguments: [
              {
                name: 'project_path',
                description: 'Path to the project directory',
                required: false
              },
              {
                name: 'focus_area',
                description: 'Specific area to focus on',
                required: false
              }
            ]
          },
          {
            name: 'cross_agent_collaboration',
            description: 'Collaborate between Botbie and DebugEarth for complex issues',
            arguments: [
              {
                name: 'issue_description',
                description: 'Description of the issue to investigate',
                required: false
              }
            ]
          },
          {
            name: 'learning_optimization',
            description: 'Optimize based on learned patterns and insights',
            arguments: [
              {
                name: 'optimization_target',
                description: 'What to optimize (quality, performance, debugging)',
                required: false
              }
            ]
          }
        ];

      // Add Sketchie prompts with prefixed names
      const sketchiePromptsWithPrefix = sketchMCP.prompts.map(prompt => ({
        ...prompt,
        name: `sketchie_${prompt.name}`,
        description: `[Sketchie] ${prompt.description}`
      }));

      return {
        prompts: [...unifiedPrompts, ...sketchiePromptsWithPrefix]
      };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'unified_analysis_session':
          return {
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: this.getUnifiedAnalysisPrompt(args?.project_path, args?.focus_area)
                }
              }
            ]
          };
        
        case 'cross_agent_collaboration':
          return {
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: this.getCrossAgentCollaborationPrompt(args?.issue_description)
                }
              }
            ]
          };
        
        case 'learning_optimization':
          return {
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: this.getLearningOptimizationPrompt(args?.optimization_target)
                }
              }
            ]
          };
        
        default:
          // Check if it's a Sketchie prompt
          if (name.startsWith('sketchie_')) {
            const sketchiePromptName = name.replace('sketchie_', '');
            return {
              messages: [
                {
                  role: 'user',
                  content: {
                    type: 'text',
                    text: this.getSketchiePrompt(sketchiePromptName, args)
                  }
                }
              ]
            };
          }
          throw new Error(`Unknown prompt: ${name}`);
      }
    });
  }

  private async handleUnifiedAnalysis(args: any) {
    const { path: projectPath, analysisType = 'comprehensive', outputPath, bugDescription } = args;

    if (!this.botbie) {
      this.botbie = createBotbie({ verbose: false });
      await this.botbie.initialize();
    }

    const session = this.sessionManager.createSession(
      `Unified analysis of ${projectPath}`,
      'unified'
    );

    let result: UnifiedAnalysisResult = {
      sessionId: session.id,
      timestamp: new Date(),
      crossAgentInsights: [],
      recommendations: [],
      overallScore: 0
    };

    try {
      // Step 1: Run Botbie analysis
      const botbieReport = await this.botbie.execute({
        path: projectPath,
        options: { outputPath }
      });

      result.botbieReport = botbieReport;

      // Add Botbie evidence
      this.sessionManager.addEvidence(session.id, {
        type: 'code-quality',
        data: botbieReport,
        context: { phase: 'botbie-analysis' },
        confidence: 0.9,
        impact: botbieReport.summary.criticalIssues > 0 ? 'high' : 'medium'
      });

      // Step 2: Simulate DebugEarth integration (if bug description provided)
      if (bugDescription) {
        // This would integrate with DebugEarth in a real implementation
        this.sessionManager.addEvidence(session.id, {
          type: 'user-report',
          data: { description: bugDescription },
          context: { phase: 'debugearth-analysis' },
          confidence: 0.8,
          impact: 'high'
        });
      }

      // Step 3: Generate cross-agent insights
      result.crossAgentInsights = this.sessionManager.getInsightsForAgent('botbie');

      // Step 4: Generate unified recommendations
      result.recommendations = this.generateUnifiedRecommendations(botbieReport, result.crossAgentInsights);
      result.overallScore = this.calculateOverallScore(botbieReport, result.crossAgentInsights);

      this.latestResult = result;

      return {
        content: [
          {
            type: 'text',
            text: this.formatUnifiedAnalysisResult(result)
          }
        ]
      };

    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Unified analysis failed: ${error}`
          }
        ]
      };
    }
  }

  private async handleCrossAgentInsights(args: any) {
    const { agentType = 'all', impactLevel = 'medium' } = args;

    let insights: CrossAgentInsight[] = [];

    if (agentType === 'all') {
      insights = [
        ...this.sessionManager.getInsightsForAgent('botbie'),
        ...this.sessionManager.getInsightsForAgent('debugearth')
      ];
    } else {
      insights = this.sessionManager.getInsightsForAgent(agentType);
    }

    // Filter by impact level
    const impactLevels = ['low', 'medium', 'high', 'critical'];
    const minImpactIndex = impactLevels.indexOf(impactLevel);
    insights = insights.filter(insight => 
      impactLevels.indexOf(insight.impact) >= minImpactIndex
    );

    return {
      content: [
        {
          type: 'text',
          text: this.formatInsights(insights)
        }
      ]
    };
  }

  private async handleSessionManagement(args: any) {
    const { action, sessionId } = args;

    switch (action) {
      case 'list':
        // This would return all sessions in a real implementation
        return {
          content: [
            {
              type: 'text',
              text: 'Session list functionality would be implemented here'
            }
          ]
        };
      
      case 'get':
        if (!sessionId) {
          throw new Error('Session ID required for get action');
        }
        const session = this.sessionManager.getSession(sessionId);
        return {
          content: [
            {
              type: 'text',
              text: session ? JSON.stringify(session, null, 2) : 'Session not found'
            }
          ]
        };
      
      case 'statistics':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(this.sessionManager.getStatistics(), null, 2)
            }
          ]
        };
      
      default:
        throw new Error(`Unknown session action: ${action}`);
    }
  }

  private async handleWorkflowOrchestration(args: any) {
    const { workflow, projectPath, contextData } = args;

    return {
      content: [
        {
          type: 'text',
          text: `Workflow orchestration for "${workflow}" would be implemented here for ${projectPath}`
        }
      ]
    };
  }

  private async handlePatternAnalysis(args: any) {
    const { patternType, timeframe = '7d' } = args;

    return {
      content: [
        {
          type: 'text',
          text: `Pattern analysis for "${patternType}" over ${timeframe} would be implemented here`
        }
      ]
    };
  }

  private generateUnifiedRecommendations(botbieReport: any, insights: CrossAgentInsight[]): string[] {
    const recommendations: string[] = [];

    // From Botbie report
    if (botbieReport.summary.criticalIssues > 0) {
      recommendations.push(`Address ${botbieReport.summary.criticalIssues} critical code quality issues`);
    }

    if (botbieReport.summary.qualityScore < 70) {
      recommendations.push('Focus on improving overall code quality - score is below 70');
    }

    // From cross-agent insights
    insights.forEach(insight => {
      if (insight.impact === 'high' || insight.impact === 'critical') {
        recommendations.push(`${insight.sourceAgent} → ${insight.targetAgent}: ${insight.title}`);
      }
    });

    return recommendations;
  }

  private calculateOverallScore(botbieReport: any, insights: CrossAgentInsight[]): number {
    let score = botbieReport.summary.qualityScore;

    // Adjust based on insights
    insights.forEach(insight => {
      if (insight.impact === 'critical') score -= 10;
      else if (insight.impact === 'high') score -= 5;
      else if (insight.impact === 'medium') score -= 2;
    });

    return Math.max(0, Math.min(100, score));
  }

  private formatUnifiedAnalysisResult(result: UnifiedAnalysisResult): string {
    return `# 🌍 Unified Earth Agents Analysis

## Overall Score: ${result.overallScore}/100

## Botbie Analysis
- Quality Score: ${result.botbieReport?.summary.qualityScore || 'N/A'}/100
- Total Issues: ${result.botbieReport?.summary.totalIssues || 0}
- Critical Issues: ${result.botbieReport?.summary.criticalIssues || 0}

## Cross-Agent Insights
${result.crossAgentInsights.length} insights generated

## Unified Recommendations
${result.recommendations.map(r => `- ${r}`).join('\n')}

Generated at: ${result.timestamp.toISOString()}
Session ID: ${result.sessionId}`;
  }

  private formatInsights(insights: CrossAgentInsight[]): string {
    if (insights.length === 0) {
      return '# Cross-Agent Insights\n\nNo insights available yet. Run some analyses to generate insights!';
    }

    return `# Cross-Agent Insights (${insights.length} total)

${insights.map((insight, i) => `
## ${i + 1}. ${insight.title}
- **Source:** ${insight.sourceAgent} → ${insight.targetAgent}
- **Impact:** ${insight.impact}
- **Confidence:** ${Math.round(insight.confidence * 100)}%
- **Description:** ${insight.description}
- **Recommendations:**
${insight.recommendations.map(r => `  - ${r}`).join('\n')}
`).join('\n')}`;
  }

  private generateLearningPatterns() {
    // This would analyze patterns from session history
    return {
      patterns: [
        {
          type: 'quality-bug-correlation',
          description: 'High complexity code tends to have more runtime bugs',
          confidence: 0.85,
          recommendations: ['Implement complexity gates', 'Add monitoring for complex functions']
        }
      ],
      lastUpdated: new Date()
    };
  }

  private getUnifiedAnalysisPrompt(projectPath?: string, focusArea?: string): string {
    return `🌍 **Unified Earth Agents Analysis Session**

I'm ready to perform a comprehensive analysis${projectPath ? ` on ${projectPath}` : ''} using both Botbie (proactive) and DebugEarth (reactive) agents.

${focusArea ? `**Focus Area:** ${focusArea}\n` : ''}

**Analysis Capabilities:**
- **Code Quality Assessment** (Botbie)
- **Bug Pattern Detection** (Cross-agent insights)
- **Root Cause Analysis** (DebugEarth integration)
- **Performance Optimization** (Combined approach)

Use the \`unified_analysis\` tool to begin the analysis.

What type of analysis would you like to run?
- preventive: Proactive quality checks
- detective: Bug investigation
- comprehensive: Full spectrum analysis`;
  }

  private getCrossAgentCollaborationPrompt(issueDescription?: string): string {
    return `🤝 **Cross-Agent Collaboration Session**

${issueDescription ? `**Issue:** ${issueDescription}\n` : ''}

I'll coordinate between Botbie and DebugEarth to provide comprehensive analysis:

1. **Quality Pre-scan** (Botbie) - Identify potential quality issues
2. **Root Cause Investigation** (DebugEarth) - Deep debugging analysis  
3. **Pattern Correlation** - Find connections between quality and bugs
4. **Unified Recommendations** - Combined insights from both agents

Use \`cross_agent_insights\` to see current patterns and \`unified_analysis\` to start investigation.

What would you like to investigate?`;
  }

  private getLearningOptimizationPrompt(optimizationTarget?: string): string {
    return `🧠 **Learning-Based Optimization**

${optimizationTarget ? `**Target:** ${optimizationTarget}\n` : ''}

I'll analyze learned patterns to optimize your development process:

- **Pattern Recognition** - Identify recurring issues
- **Preventive Measures** - Suggest proactive improvements  
- **Workflow Optimization** - Streamline analysis processes
- **Custom Rules** - Generate project-specific quality rules

Use \`pattern_analysis\` to explore learned patterns and trends.

What aspect would you like to optimize?`;
  }

  private getSketchiePrompt(promptName: string, args?: any): string {
    const prompt = sketchMCP.prompts.find(p => p.name === promptName);
    if (!prompt) {
      return `Unknown Sketchie prompt: ${promptName}`;
    }

    // Build dynamic prompt based on the prompt type and arguments
    let text = `🎨 **Sketchie ${prompt.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}**\n\n`;
    text += `${prompt.description}\n\n`;

    if (args) {
      text += '**Configuration:**\n';
      Object.entries(args).forEach(([key, value]) => {
        text += `- ${key.replace(/_/g, ' ')}: ${value}\n`;
      });
      text += '\n';
    }

    text += `Use \`sketchie_${promptName}\` tool to execute this workflow.`;
    
    return text;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Unified Earth Agents MCP server running on stdio');
  }
}

const server = new UnifiedEarthAgentsMCPServer();
server.run().catch(console.error);