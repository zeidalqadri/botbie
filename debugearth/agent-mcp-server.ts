#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  Tool,
  Prompt,
} from '@modelcontextprotocol/sdk/types.js';
import { createDebugEarth, DebugEarth } from './src/index';
import { DebugEarthAgent } from './src/claude-agent/AgentInterface';

// Global instances
let debugEarth: DebugEarth;
let agent: DebugEarthAgent;
const sessions = new Map<string, any>();

// Initialize
debugEarth = createDebugEarth({
  verbose: false,
  logLevel: 'info',
  enableBrowserDebugging: false,
  persistence: true
});

agent = new DebugEarthAgent(debugEarth);

// Enhanced tools for agent mode
const AGENT_TOOLS: Tool[] = [
  {
    name: 'investigate',
    description: 'Start investigating a bug with DebugEarth\'s methodical approach',
    inputSchema: {
      type: 'object',
      properties: {
        bugDescription: {
          type: 'string',
          description: 'Detailed description of the bug to investigate'
        }
      },
      required: ['bugDescription']
    }
  },
  {
    name: 'add_clue',
    description: 'Add a clue (evidence) to the current investigation',
    inputSchema: {
      type: 'object',
      properties: {
        clueType: {
          type: 'string',
          enum: ['error', 'log', 'behavior', 'performance', 'code'],
          description: 'Type of clue'
        },
        content: {
          type: 'string',
          description: 'The clue content (error message, log output, etc.)'
        },
        context: {
          type: 'object',
          description: 'Additional context for the clue',
          properties: {
            timestamp: { type: 'string' },
            location: { type: 'string' },
            userAction: { type: 'string' }
          }
        }
      },
      required: ['clueType', 'content']
    }
  },
  {
    name: 'solve',
    description: 'Attempt to solve the bug based on gathered evidence',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'debug_strategy',
    description: 'Get specific debugging strategy recommendations',
    inputSchema: {
      type: 'object',
      properties: {
        strategyType: {
          type: 'string',
          enum: ['console-detective', 'stack-archaeologist', 'performance-hunter', 'ui-surgeon'],
          description: 'Type of debugging strategy to apply'
        }
      },
      required: ['strategyType']
    }
  }
];

// Prompts for agent mode
const PROMPTS: Prompt[] = [
  {
    name: 'debug',
    description: 'Enter DebugEarth mode for methodical debugging',
    arguments: [
      {
        name: 'issue',
        description: 'Description of the bug or issue to debug',
        required: false
      }
    ]
  }
];

// Create MCP server
const server = new Server(
  {
    name: 'debugearth-agent',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {}
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: AGENT_TOOLS };
});

// Handle prompt listing
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return { prompts: PROMPTS };
});

// Handle prompt retrieval
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === 'debug') {
    const issue = args?.issue || '';
    const promptText = `# 🌍 DebugEarth Debug Mode

You are now in DebugEarth mode - a methodical debugging agent that treats each bug as an archaeological expedition to uncover the truth buried beneath layers of code.

${issue ? `## Current Issue: ${issue}` : '## Ready to Debug\\n\\nPlease describe the bug or issue you\'re experiencing.'}

## Your Debugging Approach

As DebugEarth, you will:

1. **🔍 Gather Evidence** - Use the \`add_clue\` tool to collect:
   - Error messages and stack traces
   - Console logs and outputs  
   - User actions that trigger the issue
   - System state and environment details

2. **🧪 Generate Hypotheses** - I'll automatically:
   - Use the 5 Whys methodology
   - Consider multiple possibilities
   - Rank hypotheses by likelihood

3. **🕵️ Apply Debug Strategies** - Use \`debug_strategy\` tool for:
   - **console-detective**: Strategic logging to trace execution flow
   - **stack-archaeologist**: Deep dive into error traces
   - **performance-hunter**: Track down memory leaks and bottlenecks
   - **ui-surgeon**: Visual debugging for frontend issues

4. **🎯 Find Root Cause** - Use \`solve\` tool to:
   - Test hypotheses systematically
   - Build proof chains for conclusions
   - Get confidence levels for findings

5. **✅ Get Solution** - Receive:
   - Specific code changes needed
   - Explanation of why the fix works
   - Prevention strategies for the future

## Let's Begin!

${issue ? 'I\'ll start investigating this issue. First, let me gather some initial information...' : 'What bug shall we hunt today? 🔍'}`;

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: promptText
          }
        }
      ]
    };
  }
  
  throw new Error(`Unknown prompt: ${name}`);
});

// Handle resource listing
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const resources = Array.from(sessions.entries()).map(([id, session]) => ({
    uri: `debugearth://session/${id}`,
    name: `Investigation: ${session.bugDescription}`,
    description: `Status: ${session.status} | Evidence: ${session.evidence.length} pieces`,
    mimeType: 'application/json'
  }));

  return { resources };
});

// Handle resource reading
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const match = request.params.uri.match(/^debugearth:\/\/session\/(.+)$/);
  if (!match) {
    throw new Error('Invalid resource URI');
  }

  const sessionId = match[1];
  const session = debugEarth.getSession(sessionId);
  
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  return {
    contents: [
      {
        uri: request.params.uri,
        mimeType: 'application/json',
        text: JSON.stringify({
          ...session,
          summary: {
            evidenceCount: session.evidence.length,
            hypothesesCount: session.hypotheses.length,
            attemptsCount: session.attempts.length,
            hasRootCause: !!session.rootCause,
            topHypotheses: session.hypotheses
              .sort((a, b) => b.confidence - a.confidence)
              .slice(0, 3)
              .map(h => ({ description: h.description, confidence: h.confidence }))
          }
        }, null, 2)
      }
    ]
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'investigate': {
      const { bugDescription } = args as { bugDescription: string };
      const result = await agent.startInvestigation(bugDescription);
      sessions.set(result.sessionId, { bugDescription, status: 'investigating' });
      
      return {
        content: [
          {
            type: 'text',
            text: `🌍 DebugEarth Investigation Started!\\n\\nSession ID: ${result.sessionId}\\n\\n${result.guidance}\\n\\n**Next steps:**\\n${result.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\\n')}`
          }
        ]
      };
    }

    case 'add_clue': {
      const { clueType, content, context } = args as any;
      
      // Map clue types to evidence types
      const evidenceTypeMap: Record<string, string> = {
        'error': 'stack-trace',
        'log': 'console',
        'behavior': 'user-report',
        'performance': 'performance',
        'code': 'console'
      };
      
      const evidenceType = evidenceTypeMap[clueType] || 'user-report';
      const evidenceData = {
        message: content,
        ...context,
        level: clueType === 'error' ? 'error' : 'info',
        timestamp: context?.timestamp || new Date().toISOString()
      };
      
      const result = await agent.addClue(evidenceType as any, evidenceData);
      
      let response = `📎 Clue added!\\n\\n${result.interpretation}`;
      
      if (result.newHypotheses && result.newHypotheses.length > 0) {
        response += `\\n\\n**New hypotheses:**\\n${result.newHypotheses.map((h, i) => `${i + 1}. ${h}`).join('\\n')}`;
      }
      
      return {
        content: [{ type: 'text', text: response }]
      };
    }

    case 'solve': {
      const result = await agent.solve();
      
      if (result.solved && result.rootCause) {
        return {
          content: [
            {
              type: 'text', 
              text: `🎯 **MYSTERY SOLVED!**\\n\\n${result.explanation}\\n\\n---\\n\\n🌍 DebugEarth loves finding bugs. Got another mystery to solve?`
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: `🔍 Not enough evidence yet...\\n\\n**Try these:**\\n${result.nextSteps?.map((s, i) => `${i + 1}. ${s}`).join('\\n')}\\n\\nAdd more clues and try solving again!`
            }
          ]
        };
      }
    }

    case 'debug_strategy': {
      const { strategyType } = args as { strategyType: string };
      
      const strategies: Record<string, string> = {
        'console-detective': `🕵️ **Console Detective Strategy**\\n\\n1. Add strategic console.log statements:\\n   - At function entry/exit points\\n   - Before/after suspicious operations\\n   - Inside conditional blocks\\n\\n2. Log with context:\\n   \`\`\`js\\n   console.log('[ComponentName] functionName:', { params, state, timestamp: Date.now() });\\n   \`\`\`\\n\\n3. Use console.group() for nested operations\\n4. Track variable values over time\\n5. Use console.trace() at critical points`,
        
        'stack-archaeologist': `🏺 **Stack Archaeologist Strategy**\\n\\n1. Capture full stack traces:\\n   \`\`\`js\\n   console.trace('Checkpoint');\\n   new Error().stack\\n   \`\`\`\\n\\n2. Look for patterns:\\n   - Repeated function calls (infinite recursion?)\\n   - Missing async/await\\n   - Null/undefined access points\\n\\n3. Map the error propagation path\\n4. Check error boundaries\\n5. Verify error handling at each level`,
        
        'performance-hunter': `🏹 **Performance Hunter Strategy**\\n\\n1. Add performance marks:\\n   \`\`\`js\\n   performance.mark('operation-start');\\n   // ... code ...\\n   performance.mark('operation-end');\\n   performance.measure('operation', 'operation-start', 'operation-end');\\n   \`\`\`\\n\\n2. Monitor memory:\\n   - Check for detached DOM nodes\\n   - Look for growing arrays/objects\\n   - Verify event listener cleanup\\n\\n3. Profile with Chrome DevTools\\n4. Check for synchronous operations in async contexts\\n5. Analyze network waterfall`,
        
        'ui-surgeon': `🔬 **UI Surgeon Strategy**\\n\\n1. Inspect element states:\\n   \`\`\`js\\n   console.log(element.getBoundingClientRect());\\n   console.log(window.getComputedStyle(element));\\n   \`\`\`\\n\\n2. Monitor DOM mutations:\\n   - Use MutationObserver\\n   - Check element lifecycle\\n   - Verify event bubbling\\n\\n3. Debug render cycles:\\n   - Add render counters\\n   - Check prop changes\\n   - Monitor state updates\\n\\n4. Use React/Vue/Angular DevTools\\n5. Test with different viewport sizes`
      };
      
      const strategy = strategies[strategyType] || 'Unknown strategy';
      
      return {
        content: [{ type: 'text', text: strategy }]
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🌍 DebugEarth Agent MCP server running...');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});