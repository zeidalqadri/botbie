import { SpecialistDefinition } from '../types';
import { specialistRegistry } from '../SpecialistAgentAdapter';

// n8n Workflow Automation Expert

export const n8nExpert: SpecialistDefinition = {
  name: 'n8n-expert',
  description: 'Expert in n8n workflow automation platform specializing in AI integrations, custom nodes, webhook orchestration, and enterprise deployments. Proficient in building complex automation workflows with LangChain, custom code integration, and 400+ service integrations.',
  category: 'infrastructure',
  focusAreas: [
    'n8n workflow design and optimization',
    'AI workflow automation with LangChain integration',
    'Custom node development in JavaScript/Python',
    'Webhook triggers and HTTP request handling',
    'Integration with 400+ services and APIs',
    'Self-hosted and cloud deployment strategies',
    'Enterprise features (SSO, permissions, air-gapped)',
    'Workflow versioning and collaboration',
    'Error handling and retry mechanisms',
    'Data transformation and manipulation',
    'Cron-based scheduling and event triggers',
    'Database integrations (PostgreSQL, MySQL, MongoDB)',
    'AI integrations (OpenAI, Gemini, Ollama, Claude)',
    'Real-time workflow monitoring and debugging'
  ],
  approaches: [
    'Design modular, reusable workflow components',
    'Implement AI-powered automation with LangChain nodes',
    'Build custom nodes for specific business logic',
    'Use webhook triggers for real-time event processing',
    'Apply error handling and retry strategies',
    'Optimize workflow performance with parallel execution',
    'Implement proper authentication and security',
    'Version control workflows with Git integration',
    'Monitor workflow execution with built-in tools',
    'Document workflows for team collaboration'
  ],
  outputs: [
    'Complex workflow automations with AI integration',
    'Custom n8n nodes for specific use cases',
    'Webhook-based event processing systems',
    'Data pipeline implementations',
    'AI agent workflows with RAG capabilities',
    'Error handling and monitoring strategies',
    'Deployment configurations (Docker, Kubernetes)',
    'Workflow templates and documentation',
    'Integration patterns for various services',
    'Performance optimization reports'
  ],
  subagentType: 'n8n-expert',
  keyPrinciple: 'Build powerful workflow automations combining visual design with custom code, leveraging AI capabilities and 400+ integrations for comprehensive business process automation',
  
  examples: [
    {
      input: 'Create an AI-powered customer support automation workflow in n8n',
      output: `## AI-Powered Customer Support Workflow in n8n

### Workflow Overview
Building an intelligent support system that:
- Receives tickets via multiple channels (email, webhook, Slack)
- Uses AI to categorize and prioritize tickets
- Generates draft responses using RAG
- Routes to appropriate agents
- Tracks resolution metrics

### 1. Webhook Trigger Configuration

\`\`\`json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "support-ticket",
        "responseMode": "onReceived",
        "responseData": "firstEntryJson",
        "responsePropertyName": "data",
        "options": {
          "responseHeaders": {
            "values": {
              "entries": [
                {
                  "name": "X-Webhook-Status",
                  "value": "received"
                }
              ]
            }
          }
        }
      },
      "name": "Webhook - Ticket Receiver",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1.1,
      "position": [250, 300]
    }
  ]
}
\`\`\`

### 2. AI Classification with LangChain

\`\`\`javascript
// Custom Code Node - Prepare for AI Classification
const ticketData = $input.first().json;

// Extract relevant information
const ticketInfo = {
  subject: ticketData.subject,
  description: ticketData.description,
  customer_email: ticketData.email,
  timestamp: new Date().toISOString()
};

// Prepare prompt for classification
const classificationPrompt = \`
Analyze this customer support ticket and provide:
1. Category (technical, billing, feature_request, complaint)
2. Priority (high, medium, low)
3. Sentiment (positive, neutral, negative)
4. Suggested department (tech_support, billing, product, management)

Ticket Subject: \${ticketInfo.subject}
Ticket Description: \${ticketInfo.description}

Respond in JSON format.
\`;

return {
  json: {
    ticket: ticketInfo,
    prompt: classificationPrompt
  }
};
\`\`\`

### 3. LangChain AI Agent Configuration

\`\`\`json
{
  "nodes": [
    {
      "parameters": {
        "model": "gpt-4-turbo-preview",
        "options": {
          "temperature": 0.3,
          "maxTokens": 500
        }
      },
      "name": "OpenAI Chat Model",
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "position": [450, 200]
    },
    {
      "parameters": {
        "text": "={{ $json.prompt }}",
        "outputKey": "classification"
      },
      "name": "AI Chain - Classify Ticket",
      "type": "@n8n/n8n-nodes-langchain.chainLlm",
      "position": [650, 300]
    }
  ]
}
\`\`\`

### 4. Vector Store for RAG Responses

\`\`\`javascript
// Initialize Pinecone Vector Store
const pineconeConfig = {
  "nodes": [
    {
      "parameters": {
        "pineconeIndex": "support-knowledge-base",
        "pineconeNamespace": "solutions",
        "topK": 5
      },
      "name": "Pinecone Vector Store",
      "type": "@n8n/n8n-nodes-langchain.vectorStorePinecone",
      "position": [450, 400]
    }
  ]
};

// Document Loader for Knowledge Base
const documentLoader = {
  "parameters": {
    "mode": "jsonInput",
    "jsonData": "={{ $json.ticket.description }}",
    "options": {
      "metadata": {
        "source": "ticket",
        "timestamp": "={{ $json.ticket.timestamp }}"
      }
    }
  },
  "name": "Document Loader",
  "type": "@n8n/n8n-nodes-langchain.documentDefaultDataLoader"
};
\`\`\`

### 5. Generate AI Response with Context

\`\`\`json
{
  "nodes": [
    {
      "parameters": {
        "text": "={{ $json.ticket.description }}",
        "topK": 3,
        "model": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
        "systemMessage": "You are a helpful customer support agent. Use the provided context to answer the customer's question accurately and professionally."
      },
      "name": "Retrieval QA Chain",
      "type": "@n8n/n8n-nodes-langchain.chainRetrievalQa",
      "position": [850, 300]
    }
  ]
}
\`\`\`

### 6. Workflow Router with Switch Node

\`\`\`javascript
// Switch Node Configuration
{
  "parameters": {
    "conditions": {
      "rules": [
        {
          "value1": "={{ $json.classification.priority }}",
          "operation": "equals",
          "value2": "high",
          "output": 0
        },
        {
          "value1": "={{ $json.classification.category }}",
          "operation": "equals", 
          "value2": "technical",
          "output": 1
        },
        {
          "value1": "={{ $json.classification.category }}",
          "operation": "equals",
          "value2": "billing",
          "output": 2
        }
      ]
    },
    "fallbackOutput": 3
  },
  "name": "Route by Priority/Category",
  "type": "n8n-nodes-base.switch",
  "position": [1050, 300]
}
\`\`\`

### 7. Integration Nodes

\`\`\`json
// Slack Notification for High Priority
{
  "parameters": {
    "channel": "#urgent-support",
    "text": "🚨 High Priority Ticket",
    "attachments": [
      {
        "color": "#ff0000",
        "fields": {
          "values": [
            {
              "title": "Subject",
              "value": "={{ $json.ticket.subject }}",
              "short": false
            },
            {
              "title": "AI Classification",
              "value": "Category: {{ $json.classification.category }}\\nSentiment: {{ $json.classification.sentiment }}",
              "short": true
            }
          ]
        }
      }
    ]
  },
  "name": "Slack - Urgent Alert",
  "type": "n8n-nodes-base.slack"
}

// Create Jira Ticket
{
  "parameters": {
    "operation": "create",
    "project": "SUPPORT",
    "issueType": "Support Ticket",
    "summary": "={{ $json.ticket.subject }}",
    "description": "={{ $json.ticket.description }}\\n\\n**AI Analysis:**\\n{{ $json.classification }}\\n\\n**Suggested Response:**\\n{{ $json.ai_response }}",
    "additionalFields": {
      "priority": {
        "name": "={{ $json.classification.priority }}"
      },
      "labels": ["={{ $json.classification.category }}"]
    }
  },
  "name": "Jira - Create Ticket",
  "type": "n8n-nodes-base.jira"
}
\`\`\`

### 8. Custom Node for Metrics Tracking

\`\`\`javascript
// Custom function node for metrics
const metrics = {
  ticket_id: $json.ticket_id,
  classification: $json.classification,
  response_time: Date.now() - new Date($json.ticket.timestamp).getTime(),
  ai_confidence: $json.ai_confidence,
  resolution_path: $json.resolution_path
};

// Store in database
const postgresQuery = \`
  INSERT INTO support_metrics 
  (ticket_id, category, priority, sentiment, response_time_ms, ai_confidence, created_at)
  VALUES ($1, $2, $3, $4, $5, $6, NOW())
\`;

return {
  json: {
    metrics: metrics,
    query: postgresQuery,
    values: [
      metrics.ticket_id,
      metrics.classification.category,
      metrics.classification.priority,
      metrics.classification.sentiment,
      metrics.response_time,
      metrics.ai_confidence
    ]
  }
};
\`\`\`

### 9. Error Handling Pattern

\`\`\`json
{
  "nodes": [
    {
      "parameters": {
        "continueOnFail": true,
        "errorMessage": "Failed to process ticket"
      },
      "name": "Error Trigger",
      "type": "n8n-nodes-base.errorTrigger",
      "position": [250, 600]
    },
    {
      "parameters": {
        "functionCode": "// Log error details\\nconst errorDetails = {\\n  workflow: $workflow.name,\\n  node: $json.error.node,\\n  message: $json.error.message,\\n  timestamp: new Date().toISOString(),\\n  execution_id: $execution.id\\n};\\n\\n// Send to monitoring service\\nreturn {\\n  json: errorDetails\\n};"
      },
      "name": "Process Error",
      "type": "n8n-nodes-base.functionItem"
    }
  ]
}
\`\`\`

### 10. Complete Workflow Structure

\`\`\`yaml
workflow:
  name: AI Customer Support Automation
  nodes:
    - webhook_trigger
    - data_validation
    - ai_classification
    - vector_search
    - response_generation
    - priority_router
    - slack_notification
    - jira_creation
    - email_response
    - metrics_tracking
    - error_handling
  
  connections:
    webhook_trigger -> data_validation
    data_validation -> ai_classification
    ai_classification -> vector_search
    vector_search -> response_generation
    response_generation -> priority_router
    priority_router -> [slack_notification, jira_creation, email_response]
    all_nodes -> metrics_tracking
    all_nodes -> error_handling (on error)
  
  settings:
    executionTimeout: 300
    saveDataSuccessExecution: true
    saveExecutionProgress: true
    saveManualExecutions: true
\`\`\`

### 11. Deployment Configuration

\`\`\`yaml
# docker-compose.yml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=\${N8N_PASSWORD}
      - N8N_HOST=n8n.company.com
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - N8N_NODE_ENV=production
      - WEBHOOK_URL=https://n8n.company.com/
      - GENERIC_TIMEZONE=America/New_York
      - N8N_METRICS=true
      - N8N_TEMPLATES_ENABLED=true
      - N8N_PERSONALIZATION_ENABLED=false
    volumes:
      - n8n_data:/home/node/.n8n
      - ./custom-nodes:/home/node/.n8n/custom
    ports:
      - "5678:5678"
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=n8n
      - POSTGRES_PASSWORD=\${DB_PASSWORD}
      - POSTGRES_DB=n8n
    volumes:
      - db_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  n8n_data:
  db_data:
\`\`\``,
      reasoning: 'This example demonstrates advanced n8n workflow automation with AI integration, showing webhook triggers, LangChain nodes, vector stores for RAG, multi-channel routing, error handling, and production deployment configurations.'
    },
    {
      input: 'Build a custom n8n node for specialized data processing',
      output: `## Custom n8n Node Development

### 1. Node Structure and TypeScript Setup

\`\`\`typescript
// nodes/DataProcessor/DataProcessor.node.ts
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

export class DataProcessor implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Advanced Data Processor',
    name: 'dataProcessor',
    icon: 'file:dataprocessor.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Advanced data processing with ML capabilities',
    defaults: {
      name: 'Data Processor',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'dataProcessorApi',
        required: false,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Data',
            value: 'data',
          },
          {
            name: 'Analytics',
            value: 'analytics',
          },
          {
            name: 'ML Pipeline',
            value: 'mlPipeline',
          },
        ],
        default: 'data',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['data'],
          },
        },
        options: [
          {
            name: 'Transform',
            value: 'transform',
            description: 'Transform data structure',
            action: 'Transform data',
          },
          {
            name: 'Aggregate',
            value: 'aggregate',
            description: 'Aggregate data points',
            action: 'Aggregate data',
          },
          {
            name: 'Validate',
            value: 'validate',
            description: 'Validate data against schema',
            action: 'Validate data',
          },
        ],
        default: 'transform',
      },
      // Transform Options
      {
        displayName: 'Transform Type',
        name: 'transformType',
        type: 'options',
        displayOptions: {
          show: {
            resource: ['data'],
            operation: ['transform'],
          },
        },
        options: [
          {
            name: 'JSON Path',
            value: 'jsonPath',
          },
          {
            name: 'Custom Script',
            value: 'script',
          },
          {
            name: 'Template',
            value: 'template',
          },
        ],
        default: 'jsonPath',
      },
      {
        displayName: 'Mapping Rules',
        name: 'mappingRules',
        type: 'fixedCollection',
        placeholder: 'Add Mapping Rule',
        typeOptions: {
          multipleValues: true,
        },
        displayOptions: {
          show: {
            resource: ['data'],
            operation: ['transform'],
            transformType: ['jsonPath'],
          },
        },
        default: {},
        options: [
          {
            name: 'rules',
            displayName: 'Rules',
            values: [
              {
                displayName: 'Source Path',
                name: 'sourcePath',
                type: 'string',
                default: '',
                placeholder: '$.data.items[*].id',
              },
              {
                displayName: 'Target Path',
                name: 'targetPath',
                type: 'string',
                default: '',
                placeholder: 'processedItems[].identifier',
              },
              {
                displayName: 'Transform Function',
                name: 'transformFunction',
                type: 'options',
                options: [
                  {
                    name: 'None',
                    value: 'none',
                  },
                  {
                    name: 'To Upper Case',
                    value: 'toUpperCase',
                  },
                  {
                    name: 'To Lower Case',
                    value: 'toLowerCase',
                  },
                  {
                    name: 'Parse Date',
                    value: 'parseDate',
                  },
                  {
                    name: 'Custom',
                    value: 'custom',
                  },
                ],
                default: 'none',
              },
              {
                displayName: 'Custom Function',
                name: 'customFunction',
                type: 'string',
                typeOptions: {
                  alwaysOpenEditWindow: true,
                  rows: 5,
                },
                displayOptions: {
                  show: {
                    transformFunction: ['custom'],
                  },
                },
                default: 'return value.toString();',
                placeholder: 'return value.toFixed(2);',
              },
            ],
          },
        ],
      },
      // ML Pipeline Options
      {
        displayName: 'ML Model',
        name: 'mlModel',
        type: 'options',
        displayOptions: {
          show: {
            resource: ['mlPipeline'],
          },
        },
        options: [
          {
            name: 'Sentiment Analysis',
            value: 'sentiment',
          },
          {
            name: 'Text Classification',
            value: 'classification',
          },
          {
            name: 'Anomaly Detection',
            value: 'anomaly',
          },
        ],
        default: 'sentiment',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const resource = this.getNodeParameter('resource', 0);
    const operation = this.getNodeParameter('operation', 0);

    for (let i = 0; i < items.length; i++) {
      try {
        const item = items[i];

        if (resource === 'data') {
          if (operation === 'transform') {
            const transformedData = await this.transformData(item, i);
            returnData.push({ json: transformedData });
          } else if (operation === 'aggregate') {
            const aggregatedData = await this.aggregateData(items);
            return [aggregatedData];
          } else if (operation === 'validate') {
            const validationResult = await this.validateData(item, i);
            returnData.push({ json: validationResult });
          }
        } else if (resource === 'mlPipeline') {
          const mlResult = await this.runMLPipeline(item, i);
          returnData.push({ json: mlResult });
        }
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error.message,
              item: items[i].json,
            },
          });
          continue;
        }
        throw new NodeOperationError(this.getNode(), error);
      }
    }

    return [returnData];
  }

  private async transformData(
    item: INodeExecutionData,
    itemIndex: number
  ): Promise<any> {
    const transformType = this.getNodeParameter('transformType', itemIndex) as string;
    
    if (transformType === 'jsonPath') {
      const mappingRules = this.getNodeParameter(
        'mappingRules.rules',
        itemIndex,
        []
      ) as Array<{
        sourcePath: string;
        targetPath: string;
        transformFunction: string;
        customFunction?: string;
      }>;

      const transformedData: any = {};

      for (const rule of mappingRules) {
        const sourceValue = this.extractValueByPath(item.json, rule.sourcePath);
        const transformedValue = this.applyTransformation(
          sourceValue,
          rule.transformFunction,
          rule.customFunction
        );
        this.setValueByPath(transformedData, rule.targetPath, transformedValue);
      }

      return transformedData;
    }

    return item.json;
  }

  private extractValueByPath(data: any, path: string): any {
    // Simple JSONPath implementation
    const keys = path.replace('$.', '').split('.');
    let value = data;

    for (const key of keys) {
      if (key.includes('[*]')) {
        const arrayKey = key.replace('[*]', '');
        if (Array.isArray(value[arrayKey])) {
          value = value[arrayKey];
        }
      } else {
        value = value?.[key];
      }
    }

    return value;
  }

  private setValueByPath(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  private applyTransformation(
    value: any,
    transformFunction: string,
    customFunction?: string
  ): any {
    switch (transformFunction) {
      case 'toUpperCase':
        return String(value).toUpperCase();
      case 'toLowerCase':
        return String(value).toLowerCase();
      case 'parseDate':
        return new Date(value).toISOString();
      case 'custom':
        if (customFunction) {
          // Safe evaluation of custom function
          const func = new Function('value', customFunction);
          return func(value);
        }
        return value;
      default:
        return value;
    }
  }

  private async aggregateData(items: INodeExecutionData[]): Promise<INodeExecutionData[]> {
    // Implement aggregation logic
    const aggregated = {
      count: items.length,
      items: items.map(item => item.json),
      timestamp: new Date().toISOString(),
    };

    return [{ json: aggregated }];
  }

  private async validateData(
    item: INodeExecutionData,
    itemIndex: number
  ): Promise<any> {
    // Implement validation logic
    const schema = this.getNodeParameter('validationSchema', itemIndex, {}) as any;
    const errors: string[] = [];
    
    // Simple validation example
    for (const [key, rules] of Object.entries(schema)) {
      if (rules.required && !(key in item.json)) {
        errors.push(\`Missing required field: \${key}\`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      data: item.json,
    };
  }

  private async runMLPipeline(
    item: INodeExecutionData,
    itemIndex: number
  ): Promise<any> {
    const mlModel = this.getNodeParameter('mlModel', itemIndex) as string;
    
    // Simulate ML processing
    const results = {
      model: mlModel,
      input: item.json,
      prediction: null,
      confidence: 0,
      metadata: {},
    };

    switch (mlModel) {
      case 'sentiment':
        results.prediction = 'positive';
        results.confidence = 0.87;
        break;
      case 'classification':
        results.prediction = 'category_a';
        results.confidence = 0.92;
        break;
      case 'anomaly':
        results.prediction = 'normal';
        results.confidence = 0.95;
        break;
    }

    return results;
  }
}
\`\`\`

### 2. Credentials Definition

\`\`\`typescript
// credentials/DataProcessorApi.credentials.ts
import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class DataProcessorApi implements ICredentialType {
  name = 'dataProcessorApi';
  displayName = 'Data Processor API';
  documentationUrl = 'dataprocessor';
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
    },
    {
      displayName: 'API URL',
      name: 'apiUrl',
      type: 'string',
      default: 'https://api.dataprocessor.com',
      placeholder: 'https://api.dataprocessor.com',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '={{"Bearer " + $credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.apiUrl}}',
      url: '/health',
    },
  };
}
\`\`\`

### 3. Package Configuration

\`\`\`json
{
  "name": "n8n-nodes-dataprocessor",
  "version": "0.1.0",
  "description": "Advanced data processing nodes for n8n",
  "keywords": [
    "n8n-community-node-package"
  ],
  "license": "MIT",
  "homepage": "https://github.com/yourorg/n8n-nodes-dataprocessor",
  "author": {
    "name": "Your Name",
    "email": "email@example.com"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/yourorg/n8n-nodes-dataprocessor.git"
  },
  "main": "index.js",
  "scripts": {
    "build": "tsc && gulp build:icons",
    "dev": "tsc --watch",
    "format": "prettier nodes credentials --write",
    "lint": "eslint nodes credentials package.json",
    "lintfix": "eslint nodes credentials package.json --fix",
    "prepublishOnly": "npm run build && npm run lint -c .eslintrc.prepublish.js nodes credentials package.json"
  },
  "files": [
    "dist"
  ],
  "n8n": {
    "n8nNodesApiVersion": 1,
    "credentials": [
      "dist/credentials/DataProcessorApi.credentials.js"
    ],
    "nodes": [
      "dist/nodes/DataProcessor/DataProcessor.node.js"
    ]
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@typescript-eslint/parser": "^6.19.0",
    "eslint": "^8.56.0",
    "eslint-plugin-n8n-nodes-base": "^1.16.1",
    "gulp": "^4.0.2",
    "n8n-workflow": "^1.25.0",
    "prettier": "^3.2.4",
    "typescript": "^5.3.3"
  },
  "peerDependencies": {
    "n8n-workflow": "^1.25.0"
  }
}
\`\`\`

### 4. Build Configuration

\`\`\`javascript
// gulpfile.js
const { src, dest } = require('gulp');

function copyIcons() {
  return src('nodes/**/*.{png,svg}')
    .pipe(dest('dist/nodes'));
}

exports['build:icons'] = copyIcons;
\`\`\`

### 5. Testing the Custom Node

\`\`\`typescript
// __tests__/DataProcessor.test.ts
import { DataProcessor } from '../nodes/DataProcessor/DataProcessor.node';
import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

describe('DataProcessor Node', () => {
  let dataProcessor: DataProcessor;
  let executeFunctions: IExecuteFunctions;

  beforeEach(() => {
    dataProcessor = new DataProcessor();
    executeFunctions = {
      getInputData: jest.fn(),
      getNodeParameter: jest.fn(),
      continueOnFail: jest.fn().mockReturnValue(false),
      getNode: jest.fn(),
    } as unknown as IExecuteFunctions;
  });

  test('should transform data correctly', async () => {
    const inputData: INodeExecutionData[] = [
      {
        json: {
          name: 'john doe',
          age: 30,
        },
      },
    ];

    (executeFunctions.getInputData as jest.Mock).mockReturnValue(inputData);
    (executeFunctions.getNodeParameter as jest.Mock).mockImplementation(
      (paramName: string) => {
        if (paramName === 'resource') return 'data';
        if (paramName === 'operation') return 'transform';
        if (paramName === 'transformType') return 'jsonPath';
        if (paramName === 'mappingRules.rules') {
          return [
            {
              sourcePath: '$.name',
              targetPath: 'fullName',
              transformFunction: 'toUpperCase',
            },
          ];
        }
        return undefined;
      }
    );

    const result = await dataProcessor.execute.call(executeFunctions);

    expect(result[0][0].json).toEqual({
      fullName: 'JOHN DOE',
    });
  });
});
\`\`\`

### 6. Installation and Usage

\`\`\`bash
# Build the node
npm run build

# Link for local development
npm link

# In your n8n installation
cd ~/.n8n
npm link n8n-nodes-dataprocessor

# Or install from npm
npm install n8n-nodes-dataprocessor

# Restart n8n
n8n start
\`\`\``,
      reasoning: 'This example shows how to build a sophisticated custom n8n node with TypeScript, including complex data transformations, ML pipeline integration, proper error handling, credentials management, and testing setup.'
    }
  ]
};

// Register the n8n specialist
export function registerN8nSpecialist(): void {
  specialistRegistry.register(n8nExpert);
}