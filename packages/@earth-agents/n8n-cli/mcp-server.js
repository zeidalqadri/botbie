#!/usr/bin/env node

/**
 * N8N MCP Server for Claude Desktop
 * Provides n8n workflow integration capabilities
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// N8N Configuration
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

// Create MCP server
const server = new Server(
  {
    name: 'n8n-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper function for N8N API calls
async function callN8NApi(endpoint, method = 'GET', data = null) {
  try {
    const response = await axios({
      method,
      url: `${N8N_BASE_URL}/api/v1${endpoint}`,
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
      },
      data,
    });
    return response.data;
  } catch (error) {
    console.error(`N8N API Error: ${error.message}`);
    throw error;
  }
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_workflows',
        description: 'List all workflows in n8n',
        inputSchema: {
          type: 'object',
          properties: {
            active: {
              type: 'boolean',
              description: 'Filter by active status',
            },
          },
        },
      },
      {
        name: 'execute_workflow',
        description: 'Execute a workflow by ID or name',
        inputSchema: {
          type: 'object',
          properties: {
            workflowId: {
              type: 'string',
              description: 'Workflow ID or name',
            },
            data: {
              type: 'object',
              description: 'Input data for the workflow',
            },
          },
          required: ['workflowId'],
        },
      },
      {
        name: 'get_workflow',
        description: 'Get workflow details by ID',
        inputSchema: {
          type: 'object',
          properties: {
            workflowId: {
              type: 'string',
              description: 'Workflow ID',
            },
          },
          required: ['workflowId'],
        },
      },
      {
        name: 'get_executions',
        description: 'Get workflow executions',
        inputSchema: {
          type: 'object',
          properties: {
            workflowId: {
              type: 'string',
              description: 'Filter by workflow ID',
            },
            limit: {
              type: 'number',
              description: 'Number of executions to return',
              default: 10,
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_workflows': {
        const workflows = await callN8NApi('/workflows');
        const filtered = args.active !== undefined 
          ? workflows.data.filter(w => w.active === args.active)
          : workflows.data;
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(filtered, null, 2),
            },
          ],
        };
      }

      case 'execute_workflow': {
        const result = await callN8NApi(
          `/workflows/${args.workflowId}/execute`,
          'POST',
          args.data || {}
        );
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_workflow': {
        const workflow = await callN8NApi(`/workflows/${args.workflowId}`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(workflow, null, 2),
            },
          ],
        };
      }

      case 'get_executions': {
        const endpoint = args.workflowId 
          ? `/executions?workflowId=${args.workflowId}&limit=${args.limit || 10}`
          : `/executions?limit=${args.limit || 10}`;
        
        const executions = await callN8NApi(endpoint);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(executions, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('N8N MCP Server running...');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});