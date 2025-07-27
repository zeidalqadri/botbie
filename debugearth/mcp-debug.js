#!/usr/bin/env node

// Enhanced MCP server with detailed logging for debugging connection issues

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

// Enhanced logger
const logger = {
  info: (msg) => console.error(`[${new Date().toISOString()}] [INFO] ${msg}`),
  error: (msg) => console.error(`[${new Date().toISOString()}] [ERROR] ${msg}`),
  debug: (msg) => console.error(`[${new Date().toISOString()}] [DEBUG] ${msg}`)
};

logger.info('Starting DebugEarth MCP server...');

// In-memory debug sessions
const sessions = new Map();
let sessionCounter = 0;

// Simple correlation ID generator
function generateId() {
  return `session-${Date.now()}-${++sessionCounter}`;
}

// Create MCP server
logger.debug('Creating MCP server instance...');
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

logger.debug('Setting up request handlers...');

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.debug('Received tools/list request');
  const tools = [
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
    }
  ];
  
  logger.debug(`Returning ${tools.length} tools`);
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  logger.debug(`Executing tool: ${name} with args: ${JSON.stringify(args)}`);

  try {
    switch (name) {
      case 'start_debug_session': {
        const { bugDescription } = args;
        const sessionId = generateId();
        const session = {
          id: sessionId,
          bugDescription,
          status: 'active',
          evidence: [],
          startTime: new Date()
        };
        sessions.set(sessionId, session);
        
        logger.info(`Started debug session: ${sessionId}`);
        
        return {
          content: [
            {
              type: 'text',
              text: `🌍 DebugEarth Session Started!\n\nSession ID: ${sessionId}\nBug: ${bugDescription}\n\nWhaddup! I'm ready to dig deep and find the root cause! Please provide:\n- Error messages or stack traces\n- Console logs\n- Steps to reproduce\n- Any other evidence`
            }
          ]
        };
      }

      case 'list_sessions': {
        const allSessions = Array.from(sessions.values());
        
        if (allSessions.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: '📋 No active debug sessions\n\nStart debugging with: start_debug_session'
              }
            ]
          };
        }
        
        const sessionList = allSessions.map(s => 
          `- ${s.id}: ${s.bugDescription} (${s.status})`
        ).join('\n');
        
        return {
          content: [
            {
              type: 'text',
              text: `📋 Active Debug Sessions:\n\n${sessionList}`
            }
          ]
        };
      }

      default:
        logger.error(`Unknown tool: ${name}`);
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    logger.error(`Tool execution error: ${error.message}`);
    throw error;
  }
});

// Start the server
async function main() {
  try {
    logger.debug('Creating transport...');
    const transport = new StdioServerTransport();
    
    logger.debug('Connecting server to transport...');
    await server.connect(transport);
    
    logger.info('DebugEarth MCP server connected and running!');
    
    // Keep the process alive
    process.on('SIGINT', () => {
      logger.info('Shutting down DebugEarth MCP server...');
      process.exit(0);
    });
    
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    logger.error(`Stack: ${error.stack}`);
    process.exit(1);
  }
}

main();