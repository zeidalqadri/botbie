#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { createDebugEarth, DebugEarth } from './src/index';

// Global DebugEarth instance
let debugEarth: DebugEarth;
const sessions = new Map<string, any>();

// Initialize DebugEarth
debugEarth = createDebugEarth({
  verbose: false,
  logLevel: 'info',
  enableBrowserDebugging: false, // MCP runs in Node.js
  persistence: true
});

// Define available tools
const TOOLS: Tool[] = [
  {
    name: 'start_debug_session',
    description: 'Start a new debugging session for a specific bug',
    inputSchema: {
      type: 'object',
      properties: {
        bugDescription: {
          type: 'string',
          description: 'Detailed description of the bug to debug'
        }
      },
      required: ['bugDescription']
    }
  },
  {
    name: 'analyze_session',
    description: 'Analyze a debug session to find root cause',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'The session ID to analyze'
        }
      },
      required: ['sessionId']
    }
  },
  {
    name: 'add_evidence',
    description: 'Add evidence to a debugging session',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'The session ID'
        },
        evidenceType: {
          type: 'string',
          enum: ['console', 'stack-trace', 'network', 'performance', 'ui', 'user-report'],
          description: 'Type of evidence'
        },
        data: {
          type: 'object',
          description: 'The evidence data'
        }
      },
      required: ['sessionId', 'evidenceType', 'data']
    }
  },
  {
    name: 'get_session_status',
    description: 'Get the current status of a debug session',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'The session ID'
        }
      },
      required: ['sessionId']
    }
  },
  {
    name: 'list_sessions',
    description: 'List all debugging sessions',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'simulate_error',
    description: 'Simulate various types of errors for debugging practice',
    inputSchema: {
      type: 'object',
      properties: {
        errorType: {
          type: 'string',
          enum: ['type-error', 'reference-error', 'async-error', 'memory-leak', 'slow-loop'],
          description: 'Type of error to simulate'
        }
      },
      required: ['errorType']
    }
  }
];

// Create MCP server
const server = new Server(
  {
    name: 'debugearth',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {}
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS
  };
});

// Handle resource listing
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const resources = Array.from(sessions.entries()).map(([id, session]) => ({
    uri: `debugearth://session/${id}`,
    name: `Debug Session: ${session.bugDescription}`,
    description: `Status: ${session.status}`,
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
            hasRootCause: !!session.rootCause
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
    case 'start_debug_session': {
      const { bugDescription } = args as { bugDescription: string };
      const session = await debugEarth.startDebugging(bugDescription);
      sessions.set(session.id, session);
      
      return {
        content: [
          {
            type: 'text',
            text: `Started debug session ${session.id} for: ${bugDescription}\n\nDebugEarth is now collecting evidence. Reproduce the bug or add evidence manually.`
          }
        ]
      };
    }

    case 'analyze_session': {
      const { sessionId } = args as { sessionId: string };
      const rootCause = await debugEarth.analyze(sessionId);
      
      if (rootCause) {
        return {
          content: [
            {
              type: 'text',
              text: `🎯 ROOT CAUSE FOUND!\n\n${rootCause.description}\n\n📐 Proof:\n${rootCause.proofChain.join('\n')}\n\n✅ Solution:\n${rootCause.solution}\n\nConfidence: ${Math.round(rootCause.confidence * 100)}%`
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: 'Root cause not yet determined. Need more evidence! Try:\n- Adding more console logs\n- Providing stack traces\n- Adding performance data\n- Running the buggy code again'
            }
          ]
        };
      }
    }

    case 'add_evidence': {
      const { sessionId, evidenceType, data } = args as any;
      await debugEarth.addEvidence(sessionId, evidenceType, data);
      
      return {
        content: [
          {
            type: 'text',
            text: `Added ${evidenceType} evidence to session ${sessionId}`
          }
        ]
      };
    }

    case 'get_session_status': {
      const { sessionId } = args as { sessionId: string };
      const session = debugEarth.getSession(sessionId);
      
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `Session ${sessionId}:\n- Status: ${session.status}\n- Evidence collected: ${session.evidence.length}\n- Hypotheses generated: ${session.hypotheses.length}\n- Debugging attempts: ${session.attempts.length}\n- Root cause found: ${session.rootCause ? 'Yes' : 'No'}`
          }
        ]
      };
    }

    case 'list_sessions': {
      const allSessions = debugEarth.getSessions();
      const sessionList = allSessions.map(s => 
        `- ${s.id}: ${s.bugDescription} (${s.status})`
      ).join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: sessionList.length > 0 
              ? `Active debug sessions:\n${sessionList}` 
              : 'No active debug sessions'
          }
        ]
      };
    }

    case 'simulate_error': {
      const { errorType } = args as { errorType: string };
      let errorMessage = '';
      
      try {
        switch (errorType) {
          case 'type-error':
            const obj: any = null;
            console.log(obj.property); // This will throw
            break;
            
          case 'reference-error':
            // @ts-ignore
            nonExistentFunction(); // This will throw
            break;
            
          case 'async-error':
            await Promise.reject(new Error('Simulated async rejection'));
            break;
            
          case 'memory-leak':
            const leak: any[] = [];
            for (let i = 0; i < 1000000; i++) {
              leak.push({ data: new Array(1000).fill('leak') });
            }
            errorMessage = 'Simulated memory leak - large array created';
            break;
            
          case 'slow-loop':
            const start = Date.now();
            let result = 0;
            for (let i = 0; i < 100000000; i++) {
              result += Math.sqrt(i);
            }
            const duration = Date.now() - start;
            errorMessage = `Simulated slow loop - took ${duration}ms`;
            break;
        }
      } catch (error: any) {
        errorMessage = `Simulated ${errorType}: ${error.message}\n\nStack trace:\n${error.stack}`;
      }
      
      return {
        content: [
          {
            type: 'text',
            text: errorMessage || `Simulated ${errorType} completed`
          }
        ]
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
  console.error('DebugEarth MCP server running...');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});