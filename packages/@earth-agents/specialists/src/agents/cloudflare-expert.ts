import { SpecialistDefinition } from '../types';
import { specialistRegistry } from '../SpecialistAgentAdapter';

// Cloudflare Expert with 2024-2025 Features

export const cloudflareExpert: SpecialistDefinition = {
  name: 'cloudflare-expert',
  description: 'Expert in Cloudflare's edge computing platform specializing in Workers AI, D1 database, R2 storage, Durable Objects, and modern edge architectures. Proficient in building globally distributed applications with Cloudflare's 2024-2025 features including Vectorize, Hyperdrive, and Browser Rendering.',
  category: 'infrastructure',
  focusAreas: [
    'Cloudflare Workers with native AI inference (Workers AI)',
    'D1 serverless SQL database with global replication',
    'R2 object storage with zero egress fees',
    'Durable Objects for stateful edge computing',
    'Vectorize for vector embeddings at the edge',
    'Hyperdrive for database connection pooling',
    'Pages for full-stack applications with Functions',
    'Browser Rendering API for dynamic content',
    'Email Workers for serverless email handling',
    'Queues for distributed message processing',
    'KV storage for global key-value data',
    'Analytics Engine for custom metrics',
    'Zero Trust security with Access and Tunnel',
    'Stream for video delivery and processing',
    'Images for on-the-fly optimization',
    'Constellation for running ML models at edge'
  ],
  approaches: [
    'Design edge-first architectures for global performance',
    'Implement AI inference directly at edge locations',
    'Use D1 for globally distributed SQL databases',
    'Store assets in R2 with automatic global distribution',
    'Build stateful applications with Durable Objects',
    'Implement vector search with Vectorize',
    'Optimize database connections with Hyperdrive',
    'Deploy full-stack apps with Pages and Functions',
    'Process emails serverlessly with Email Workers',
    'Handle async tasks with Queues',
    'Cache data globally with Workers KV',
    'Monitor with Analytics Engine and Logpush',
    'Secure with Zero Trust and Web Application Firewall',
    'Stream video with adaptive bitrate delivery'
  ],
  outputs: [
    'Workers AI implementations with LLM inference',
    'D1 database schemas with global replication',
    'R2 storage integrations with lifecycle rules',
    'Durable Objects for real-time collaboration',
    'Vectorize implementations for semantic search',
    'Hyperdrive configurations for connection pooling',
    'Pages deployments with edge functions',
    'Email processing workflows',
    'Queue-based distributed systems',
    'Performance optimization strategies',
    'Zero Trust security configurations',
    'Cost optimization recommendations',
    'Edge migration roadmaps',
    'Monitoring and observability setups'
  ],
  subagentType: 'cloudflare-expert',
  keyPrinciple: 'Build globally distributed, AI-powered applications at the edge with Cloudflare's comprehensive platform, achieving exceptional performance and cost efficiency through edge-first architecture',
  
  examples: [
    {
      input: 'Build an AI-powered application using Cloudflare Workers AI, D1, and Vectorize',
      output: `## AI-Powered Edge Application with Cloudflare (2024-2025)

### Architecture Overview
Building a semantic search application with:
- Workers AI for LLM inference and embeddings
- D1 for storing structured data
- Vectorize for vector similarity search
- R2 for document storage
- Pages for the frontend

### 1. Worker with AI Inference

\`\`\`typescript
// src/index.ts
import { Ai } from '@cloudflare/ai';
import { D1Database, R2Bucket, VectorizeIndex, Env } from '@cloudflare/workers-types';

export interface Env {
  AI: Ai;
  DB: D1Database;
  VECTORIZE: VectorizeIndex;
  BUCKET: R2Bucket;
  DOCUMENTS_QUEUE: Queue;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Route handlers
    if (url.pathname === '/api/search' && request.method === 'GET') {
      return handleSearch(request, env);
    } else if (url.pathname === '/api/documents' && request.method === 'POST') {
      return handleDocumentUpload(request, env);
    } else if (url.pathname === '/api/chat' && request.method === 'POST') {
      return handleChat(request, env);
    }
    
    return new Response('Not Found', { status: 404 });
  },
  
  // Queue handler for async processing
  async queue(batch: MessageBatch<any>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      await processDocument(message.body, env);
      message.ack();
    }
  }
};

// Semantic search with Vectorize
async function handleSearch(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  const limit = parseInt(url.searchParams.get('limit') || '10');
  
  // Generate embedding for query
  const embeddingResponse = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
    text: query
  });
  
  const queryEmbedding = embeddingResponse.data[0];
  
  // Search similar vectors
  const results = await env.VECTORIZE.query(queryEmbedding, {
    topK: limit,
    namespace: 'documents'
  });
  
  // Fetch metadata from D1
  const ids = results.matches.map(m => m.id);
  const { results: documents } = await env.DB.prepare(
    \`SELECT * FROM documents WHERE id IN (\${ids.map(() => '?').join(',')})\`
  ).bind(...ids).all();
  
  // Enhance results with AI summaries
  const enhancedResults = await Promise.all(
    documents.map(async (doc: any) => {
      const match = results.matches.find(m => m.id === doc.id);
      
      // Generate contextual summary
      const summary = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        prompt: \`Summarize this document in relation to the query "\${query}":
        
        Title: \${doc.title}
        Content: \${doc.content.substring(0, 500)}...
        
        Provide a 2-3 sentence summary highlighting relevance.\`,
        max_tokens: 100
      });
      
      return {
        id: doc.id,
        title: doc.title,
        score: match?.score || 0,
        summary: summary.response,
        url: doc.url
      };
    })
  );
  
  return Response.json({
    query,
    results: enhancedResults,
    total: results.matches.length
  });
}

// Document upload and processing
async function handleDocumentUpload(request: Request, env: Env): Promise<Response> {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const title = formData.get('title') as string;
  
  if (!file || !title) {
    return new Response('Missing file or title', { status: 400 });
  }
  
  // Generate document ID
  const docId = crypto.randomUUID();
  
  // Store file in R2
  await env.BUCKET.put(\`documents/\${docId}\`, file.stream(), {
    httpMetadata: {
      contentType: file.type
    },
    customMetadata: {
      title,
      uploadedAt: new Date().toISOString()
    }
  });
  
  // Queue for async processing
  await env.DOCUMENTS_QUEUE.send({
    id: docId,
    title,
    type: file.type
  });
  
  return Response.json({
    id: docId,
    message: 'Document queued for processing'
  });
}

// Async document processing
async function processDocument(data: any, env: Env): Promise<void> {
  const { id, title, type } = data;
  
  // Fetch document from R2
  const object = await env.BUCKET.get(\`documents/\${id}\`);
  if (!object) return;
  
  // Extract text content
  let content = '';
  if (type === 'text/plain') {
    content = await object.text();
  } else if (type === 'application/pdf') {
    // Use AI to extract text from PDF
    const pdfBytes = await object.arrayBuffer();
    const extraction = await env.AI.run('@cf/meta/m2m100-1.2b', {
      task: 'pdf-to-text',
      data: pdfBytes
    });
    content = extraction.text;
  }
  
  // Chunk document for embedding
  const chunks = chunkText(content, 512);
  const embeddings = [];
  
  for (const chunk of chunks) {
    const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: chunk
    });
    
    embeddings.push({
      id: \`\${id}-\${embeddings.length}\`,
      values: embedding.data[0],
      namespace: 'documents',
      metadata: {
        documentId: id,
        chunkIndex: embeddings.length,
        text: chunk
      }
    });
  }
  
  // Store embeddings in Vectorize
  await env.VECTORIZE.upsert(embeddings);
  
  // Store metadata in D1
  await env.DB.prepare(
    'INSERT INTO documents (id, title, content, chunk_count, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, title, content, chunks.length, new Date().toISOString()).run();
}

// Chat with documents using RAG
async function handleChat(request: Request, env: Env): Promise<Response> {
  const { message, sessionId } = await request.json();
  
  // Get conversation history from D1
  const { results: history } = await env.DB.prepare(
    'SELECT * FROM chat_history WHERE session_id = ? ORDER BY created_at DESC LIMIT 10'
  ).bind(sessionId).all();
  
  // Search relevant documents
  const searchResponse = await handleSearch(
    new Request(\`https://example.com/api/search?q=\${encodeURIComponent(message)}&limit=3\`),
    env
  );
  const searchResults = await searchResponse.json();
  
  // Build context from search results
  const context = searchResults.results
    .map((r: any) => \`Title: \${r.title}\\nContent: \${r.summary}\`)
    .join('\\n\\n');
  
  // Generate response with context
  const chatResponse = await env.AI.run('@cf/meta/llama-3-70b-instruct', {
    messages: [
      {
        role: 'system',
        content: \`You are a helpful assistant with access to a document knowledge base. 
        Use the provided context to answer questions accurately. 
        If the context doesn't contain relevant information, say so.\`
      },
      ...history.reverse().map((h: any) => ({
        role: h.role,
        content: h.content
      })),
      {
        role: 'user',
        content: \`Context from documents:\\n\${context}\\n\\nUser question: \${message}\`
      }
    ],
    max_tokens: 500
  });
  
  // Store in chat history
  await env.DB.prepare(
    'INSERT INTO chat_history (session_id, role, content, created_at) VALUES (?, ?, ?, ?)'
  ).bind(sessionId, 'user', message, new Date().toISOString()).run();
  
  await env.DB.prepare(
    'INSERT INTO chat_history (session_id, role, content, created_at) VALUES (?, ?, ?, ?)'
  ).bind(sessionId, 'assistant', chatResponse.response, new Date().toISOString()).run();
  
  return Response.json({
    response: chatResponse.response,
    sources: searchResults.results.map((r: any) => ({
      title: r.title,
      url: r.url
    }))
  });
}

// Helper function to chunk text
function chunkText(text: string, maxLength: number): string[] {
  const chunks = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}
\`\`\`

### 2. D1 Database Schema

\`\`\`sql
-- schema.sql
-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  chunk_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_documents_title ON documents(title);

-- Chat history table
CREATE TABLE IF NOT EXISTS chat_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_chat_session ON chat_history(session_id, created_at);

-- User sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  created_at TEXT NOT NULL,
  last_active TEXT NOT NULL,
  metadata TEXT
);
\`\`\`

### 3. Wrangler Configuration

\`\`\`toml
# wrangler.toml
name = "ai-search-app"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[ai]
binding = "AI"

[[d1_databases]]
binding = "DB"
database_name = "ai-search-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "ai-search-documents"

[[vectorize]]
binding = "VECTORIZE"
index_name = "document-embeddings"

[[queues.producers]]
binding = "DOCUMENTS_QUEUE"
queue = "document-processing"

[[queues.consumers]]
queue = "document-processing"
max_batch_size = 10
max_batch_timeout = 30

[vars]
OPENAI_API_KEY = "your-api-key-here"

# Cron trigger for maintenance
[triggers]
crons = ["0 */6 * * *"]
\`\`\`

### 4. Pages Frontend Integration

\`\`\`tsx
// pages/app/page.tsx
import { useState } from 'react';

export default function SearchApp() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  
  const handleSearch = async () => {
    const response = await fetch(\`/api/search?q=\${encodeURIComponent(query)}\`);
    const data = await response.json();
    setResults(data.results);
  };
  
  const handleChat = async (message: string) => {
    setChatMessages(prev => [...prev, { role: 'user', content: message }]);
    
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        sessionId: getSessionId()
      })
    });
    
    const data = await response.json();
    setChatMessages(prev => [...prev, { 
      role: 'assistant', 
      content: data.response,
      sources: data.sources 
    }]);
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">AI-Powered Search</h1>
      
      {/* Search Interface */}
      <div className="mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search documents..."
          className="w-full p-3 border rounded-lg"
        />
        
        <div className="mt-4 space-y-4">
          {results.map((result: any) => (
            <div key={result.id} className="p-4 border rounded-lg">
              <h3 className="font-semibold">{result.title}</h3>
              <p className="text-gray-600 mt-2">{result.summary}</p>
              <p className="text-sm text-gray-500 mt-1">
                Relevance: {(result.score * 100).toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Chat Interface */}
      <div className="border rounded-lg p-4">
        <h2 className="text-2xl font-semibold mb-4">Ask AI</h2>
        <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={\`p-3 rounded-lg \${
              msg.role === 'user' ? 'bg-blue-100 ml-auto max-w-[80%]' : 'bg-gray-100 max-w-[80%]'
            }\`}>
              <p>{msg.content}</p>
              {msg.sources && (
                <div className="mt-2 text-sm text-gray-600">
                  Sources: {msg.sources.map((s: any) => s.title).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
        <input
          type="text"
          placeholder="Ask a question..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value) {
              handleChat(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
          className="w-full p-3 border rounded-lg"
        />
      </div>
    </div>
  );
}
\`\`\`

### 5. Deployment

\`\`\`bash
# Create D1 database
wrangler d1 create ai-search-db

# Create Vectorize index
wrangler vectorize create document-embeddings --dimensions=768 --metric=cosine

# Create R2 bucket
wrangler r2 bucket create ai-search-documents

# Create Queue
wrangler queues create document-processing

# Apply D1 migrations
wrangler d1 execute ai-search-db --file=./schema.sql

# Deploy Worker
wrangler deploy

# Deploy Pages
npm run build
wrangler pages deploy dist/
\`\`\``,
      reasoning: 'This example demonstrates a comprehensive AI-powered application using Cloudflare's latest 2024-2025 features including Workers AI for LLM inference, Vectorize for vector search, D1 for data storage, R2 for object storage, and Queues for async processing, all running at the edge.'
    },
    {
      input: 'Implement a real-time collaborative application using Durable Objects and WebSockets',
      output: `## Real-Time Collaboration with Durable Objects

### 1. Durable Object for Room State

\`\`\`typescript
// src/room.ts
import { DurableObject } from 'cloudflare:workers';

export class CollaborationRoom extends DurableObject {
  private sessions: Map<WebSocket, SessionInfo> = new Map();
  private documentState: DocumentState;
  private operationHistory: Operation[] = [];
  
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    
    // Initialize document state
    this.documentState = {
      content: '',
      version: 0,
      lastModified: new Date().toISOString()
    };
  }
  
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    switch (url.pathname) {
      case '/websocket':
        return this.handleWebSocket(request);
      case '/state':
        return this.getState();
      case '/history':
        return this.getHistory();
      default:
        return new Response('Not Found', { status: 404 });
    }
  }
  
  async handleWebSocket(request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    
    // Accept WebSocket
    this.ctx.acceptWebSocket(server);
    
    // Parse auth from headers
    const userId = request.headers.get('X-User-Id') || 'anonymous';
    const userName = request.headers.get('X-User-Name') || 'Anonymous';
    
    // Store session info
    const session: SessionInfo = {
      userId,
      userName,
      connectedAt: new Date().toISOString(),
      cursor: null
    };
    
    this.sessions.set(server, session);
    
    // Send initial state
    server.send(JSON.stringify({
      type: 'init',
      data: {
        document: this.documentState,
        users: Array.from(this.sessions.values()),
        userId
      }
    }));
    
    // Notify others
    this.broadcast({
      type: 'user-joined',
      data: session
    }, server);
    
    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
  
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const session = this.sessions.get(ws);
    if (!session) return;
    
    try {
      const data = JSON.parse(message as string);
      
      switch (data.type) {
        case 'operation':
          await this.handleOperation(ws, session, data.operation);
          break;
          
        case 'cursor':
          await this.handleCursor(ws, session, data.position);
          break;
          
        case 'presence':
          await this.handlePresence(ws, session, data.status);
          break;
          
        case 'save':
          await this.saveDocument();
          break;
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        error: error.message
      }));
    }
  }
  
  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    const session = this.sessions.get(ws);
    if (session) {
      this.sessions.delete(ws);
      
      // Notify others
      this.broadcast({
        type: 'user-left',
        data: { userId: session.userId }
      });
    }
  }
  
  private async handleOperation(ws: WebSocket, session: SessionInfo, operation: Operation) {
    // Validate operation
    if (operation.baseVersion !== this.documentState.version) {
      // Handle conflict - transform operation
      operation = this.transformOperation(operation, this.operationHistory);
    }
    
    // Apply operation
    this.documentState = this.applyOperation(this.documentState, operation);
    this.documentState.version++;
    this.documentState.lastModified = new Date().toISOString();
    
    // Store in history
    this.operationHistory.push({
      ...operation,
      userId: session.userId,
      timestamp: Date.now()
    });
    
    // Acknowledge to sender
    ws.send(JSON.stringify({
      type: 'ack',
      version: this.documentState.version
    }));
    
    // Broadcast to others
    this.broadcast({
      type: 'operation',
      data: {
        operation,
        userId: session.userId,
        version: this.documentState.version
      }
    }, ws);
    
    // Auto-save periodically
    if (this.documentState.version % 10 === 0) {
      await this.saveDocument();
    }
  }
  
  private async handleCursor(ws: WebSocket, session: SessionInfo, position: CursorPosition) {
    session.cursor = position;
    
    // Broadcast cursor position
    this.broadcast({
      type: 'cursor',
      data: {
        userId: session.userId,
        position
      }
    }, ws);
  }
  
  private applyOperation(state: DocumentState, operation: Operation): DocumentState {
    const newContent = [...state.content];
    
    switch (operation.type) {
      case 'insert':
        newContent.splice(operation.position, 0, operation.text);
        break;
        
      case 'delete':
        newContent.splice(operation.position, operation.length);
        break;
        
      case 'replace':
        newContent.splice(operation.position, operation.length, operation.text);
        break;
    }
    
    return {
      ...state,
      content: newContent.join('')
    };
  }
  
  private transformOperation(op: Operation, history: Operation[]): Operation {
    // Operational Transform algorithm
    let transformed = { ...op };
    
    for (const histOp of history) {
      if (histOp.timestamp > op.timestamp) {
        // Transform against concurrent operation
        if (histOp.type === 'insert' && histOp.position <= transformed.position) {
          transformed.position += histOp.text.length;
        } else if (histOp.type === 'delete' && histOp.position < transformed.position) {
          transformed.position -= Math.min(histOp.length, transformed.position - histOp.position);
        }
      }
    }
    
    return transformed;
  }
  
  private broadcast(message: any, exclude?: WebSocket) {
    const data = JSON.stringify(message);
    
    for (const [ws, session] of this.sessions) {
      if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }
  
  private async saveDocument() {
    // Save to D1
    await this.env.DB.prepare(
      'INSERT OR REPLACE INTO documents (room_id, content, version, last_modified) VALUES (?, ?, ?, ?)'
    ).bind(
      this.ctx.id.toString(),
      this.documentState.content,
      this.documentState.version,
      this.documentState.lastModified
    ).run();
    
    // Save snapshot to R2 for backup
    if (this.documentState.version % 100 === 0) {
      await this.env.BUCKET.put(
        \`snapshots/\${this.ctx.id}/v\${this.documentState.version}.json\`,
        JSON.stringify({
          state: this.documentState,
          history: this.operationHistory.slice(-1000) // Keep last 1000 ops
        })
      );
    }
  }
  
  private async getState(): Promise<Response> {
    return Response.json({
      document: this.documentState,
      users: Array.from(this.sessions.values()),
      connections: this.sessions.size
    });
  }
}

// Type definitions
interface SessionInfo {
  userId: string;
  userName: string;
  connectedAt: string;
  cursor: CursorPosition | null;
}

interface DocumentState {
  content: string;
  version: number;
  lastModified: string;
}

interface Operation {
  type: 'insert' | 'delete' | 'replace';
  position: number;
  length?: number;
  text?: string;
  baseVersion: number;
  timestamp?: number;
  userId?: string;
}

interface CursorPosition {
  line: number;
  column: number;
}
\`\`\`

### 2. Worker Entry Point

\`\`\`typescript
// src/index.ts
export { CollaborationRoom } from './room';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle room creation/joining
    if (url.pathname.startsWith('/room/')) {
      const roomId = url.pathname.split('/')[2];
      
      if (!roomId) {
        return new Response('Room ID required', { status: 400 });
      }
      
      // Get or create room
      const id = env.ROOMS.idFromName(roomId);
      const room = env.ROOMS.get(id);
      
      // Forward request to Durable Object
      return room.fetch(request);
    }
    
    // Create new room
    if (url.pathname === '/create' && request.method === 'POST') {
      const { name, template } = await request.json();
      const roomId = name || crypto.randomUUID();
      
      // Initialize room with template if provided
      if (template) {
        const id = env.ROOMS.idFromName(roomId);
        const room = env.ROOMS.get(id);
        
        await room.fetch(new Request('https://internal/init', {
          method: 'POST',
          body: JSON.stringify({ template })
        }));
      }
      
      return Response.json({ roomId, url: \`/room/\${roomId}\` });
    }
    
    // List active rooms (for dashboard)
    if (url.pathname === '/rooms' && request.method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT room_id, version, last_modified FROM documents ORDER BY last_modified DESC LIMIT 50'
      ).all();
      
      return Response.json({ rooms: results });
    }
    
    return new Response('Not Found', { status: 404 });
  }
};
\`\`\`

### 3. Client SDK

\`\`\`typescript
// client/collaboration-sdk.ts
export class CollaborationClient {
  private ws: WebSocket | null = null;
  private roomId: string;
  private userId: string;
  private userName: string;
  private eventHandlers: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  
  constructor(config: {
    roomId: string;
    userId: string;
    userName: string;
    serverUrl: string;
  }) {
    this.roomId = config.roomId;
    this.userId = config.userId;
    this.userName = config.userName;
    this.connect(config.serverUrl);
  }
  
  private connect(serverUrl: string) {
    const wsUrl = \`\${serverUrl.replace('http', 'ws')}/room/\${this.roomId}/websocket\`;
    
    this.ws = new WebSocket(wsUrl, {
      headers: {
        'X-User-Id': this.userId,
        'X-User-Name': this.userName
      }
    });
    
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.emit('connected');
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
    
    this.ws.onclose = () => {
      this.emit('disconnected');
      this.reconnect();
    };
    
    this.ws.onerror = (error) => {
      this.emit('error', error);
    };
  }
  
  private handleMessage(message: any) {
    switch (message.type) {
      case 'init':
        this.emit('initialized', message.data);
        break;
        
      case 'operation':
        this.emit('remoteOperation', message.data);
        break;
        
      case 'cursor':
        this.emit('cursorUpdate', message.data);
        break;
        
      case 'user-joined':
        this.emit('userJoined', message.data);
        break;
        
      case 'user-left':
        this.emit('userLeft', message.data);
        break;
        
      case 'ack':
        this.emit('operationAck', message);
        break;
    }
  }
  
  sendOperation(operation: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'operation',
        operation
      }));
    }
  }
  
  updateCursor(position: { line: number; column: number }) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'cursor',
        position
      }));
    }
  }
  
  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }
  
  private emit(event: string, data?: any) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }
  
  private reconnect() {
    if (this.reconnectAttempts < 5) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect(this.serverUrl);
      }, Math.pow(2, this.reconnectAttempts) * 1000);
    }
  }
}
\`\`\`

### 4. React Integration

\`\`\`tsx
// components/CollaborativeEditor.tsx
import { useEffect, useRef, useState } from 'react';
import { CollaborationClient } from '../collaboration-sdk';

export function CollaborativeEditor({ roomId, userId, userName }) {
  const [content, setContent] = useState('');
  const [users, setUsers] = useState([]);
  const [cursors, setCursors] = useState({});
  const clientRef = useRef<CollaborationClient>();
  const editorRef = useRef<HTMLTextAreaElement>();
  
  useEffect(() => {
    const client = new CollaborationClient({
      roomId,
      userId,
      userName,
      serverUrl: window.location.origin
    });
    
    clientRef.current = client;
    
    // Handle initialization
    client.on('initialized', (data) => {
      setContent(data.document.content);
      setUsers(data.users);
    });
    
    // Handle remote operations
    client.on('remoteOperation', (data) => {
      // Apply operation to local state
      const { operation } = data;
      setContent(prev => {
        const chars = [...prev];
        
        switch (operation.type) {
          case 'insert':
            chars.splice(operation.position, 0, operation.text);
            break;
          case 'delete':
            chars.splice(operation.position, operation.length);
            break;
        }
        
        return chars.join('');
      });
    });
    
    // Handle user presence
    client.on('userJoined', (user) => {
      setUsers(prev => [...prev, user]);
    });
    
    client.on('userLeft', (data) => {
      setUsers(prev => prev.filter(u => u.userId !== data.userId));
      setCursors(prev => {
        const next = { ...prev };
        delete next[data.userId];
        return next;
      });
    });
    
    // Handle cursors
    client.on('cursorUpdate', (data) => {
      setCursors(prev => ({
        ...prev,
        [data.userId]: data.position
      }));
    });
    
    return () => {
      client.disconnect();
    };
  }, [roomId, userId, userName]);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const oldContent = content;
    
    // Detect operation type
    let operation;
    if (newContent.length > oldContent.length) {
      // Insert operation
      const position = e.target.selectionStart - (newContent.length - oldContent.length);
      const text = newContent.slice(position, e.target.selectionStart);
      
      operation = {
        type: 'insert',
        position,
        text,
        baseVersion: 0 // Will be set by server
      };
    } else {
      // Delete operation
      const position = e.target.selectionStart;
      const length = oldContent.length - newContent.length;
      
      operation = {
        type: 'delete',
        position,
        length,
        baseVersion: 0
      };
    }
    
    // Send operation
    clientRef.current?.sendOperation(operation);
    
    // Optimistically update local state
    setContent(newContent);
  };
  
  const handleCursorChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const position = getLineColumn(target.value, target.selectionStart);
    clientRef.current?.updateCursor(position);
  };
  
  return (
    <div className="flex h-screen">
      <div className="flex-1 p-4">
        <textarea
          ref={editorRef}
          value={content}
          onChange={handleChange}
          onSelect={handleCursorChange}
          className="w-full h-full p-4 font-mono text-sm border rounded-lg"
          placeholder="Start typing..."
        />
        
        {/* Render remote cursors */}
        {Object.entries(cursors).map(([userId, position]) => {
          const user = users.find(u => u.userId === userId);
          if (!user) return null;
          
          return (
            <div
              key={userId}
              className="absolute w-0.5 h-5 bg-blue-500"
              style={{
                left: \`\${position.column * 8}px\`,
                top: \`\${position.line * 20}px\`
              }}
            >
              <span className="absolute -top-6 left-0 text-xs bg-blue-500 text-white px-1 rounded">
                {user.userName}
              </span>
            </div>
          );
        })}
      </div>
      
      <div className="w-64 p-4 border-l">
        <h3 className="font-semibold mb-4">Active Users</h3>
        <ul className="space-y-2">
          {users.map(user => (
            <li key={user.userId} className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>{user.userName}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
\`\`\``,
      reasoning: 'This example showcases Cloudflare Durable Objects for building a real-time collaborative editor with WebSocket connections, operational transformation for conflict resolution, presence awareness, and state persistence, demonstrating stateful edge computing capabilities.'
    },
    {
      input: 'Create a video streaming platform using Cloudflare Stream, R2, and Workers',
      output: `## Video Streaming Platform with Cloudflare

### 1. Video Upload and Processing Worker

\`\`\`typescript
// src/video-platform.ts
import { Env } from './types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Route handlers
    switch (url.pathname) {
      case '/api/upload/request':
        return handleUploadRequest(request, env);
      case '/api/upload/complete':
        return handleUploadComplete(request, env);
      case '/api/videos':
        return handleVideoList(request, env);
      case '/api/video':
        return handleVideoDetails(request, env);
      case '/api/stream/webhook':
        return handleStreamWebhook(request, env);
      default:
        if (url.pathname.startsWith('/watch/')) {
          return handleVideoPlayer(request, env);
        }
        return new Response('Not Found', { status: 404 });
    }
  }
};

// Generate presigned URL for direct upload to Stream
async function handleUploadRequest(request: Request, env: Env): Promise<Response> {
  const { title, description, creator } = await request.json();
  
  // Validate user authorization
  const user = await validateAuth(request, env);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Create Stream upload URL
  const uploadResponse = await fetch(
    \`https://api.cloudflare.com/client/v4/accounts/\${env.CF_ACCOUNT_ID}/stream/direct_upload\`,
    {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${env.CF_API_TOKEN}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        maxDurationSeconds: 3600, // 1 hour max
        requireSignedURLs: false,
        allowedOrigins: [env.ALLOWED_ORIGIN],
        thumbnailTimestampPct: 0.1,
        meta: {
          title,
          description,
          creator: user.id,
          uploadedAt: new Date().toISOString()
        }
      })
    }
  );
  
  const streamData = await uploadResponse.json();
  
  if (!streamData.success) {
    return Response.json({ error: 'Failed to create upload URL' }, { status: 500 });
  }
  
  // Store pending upload in D1
  await env.DB.prepare(
    \`INSERT INTO uploads (
      id, user_id, stream_id, title, description, 
      status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)\`
  ).bind(
    crypto.randomUUID(),
    user.id,
    streamData.result.uid,
    title,
    description,
    'pending',
    new Date().toISOString()
  ).run();
  
  return Response.json({
    uploadURL: streamData.result.uploadURL,
    streamId: streamData.result.uid,
    expires: streamData.result.expires
  });
}

// Handle upload completion
async function handleUploadComplete(request: Request, env: Env): Promise<Response> {
  const { streamId, thumbnailTime } = await request.json();
  
  // Update upload status
  await env.DB.prepare(
    'UPDATE uploads SET status = ? WHERE stream_id = ?'
  ).bind('processing', streamId).run();
  
  // Generate custom thumbnail if requested
  if (thumbnailTime) {
    await generateThumbnail(streamId, thumbnailTime, env);
  }
  
  // Trigger AI analysis
  await env.ANALYSIS_QUEUE.send({
    type: 'analyze_video',
    streamId,
    tasks: ['transcription', 'content_moderation', 'auto_chapters']
  });
  
  return Response.json({ status: 'processing', streamId });
}

// Stream webhook handler for processing updates
async function handleStreamWebhook(request: Request, env: Env): Promise<Response> {
  const signature = request.headers.get('CF-Webhook-Signature');
  
  // Verify webhook signature
  if (!await verifyWebhookSignature(request, signature, env.WEBHOOK_SECRET)) {
    return new Response('Invalid signature', { status: 401 });
  }
  
  const event = await request.json();
  
  switch (event.type) {
    case 'video.ready':
      await handleVideoReady(event.data, env);
      break;
    case 'video.error':
      await handleVideoError(event.data, env);
      break;
    case 'live.started':
      await handleLiveStreamStarted(event.data, env);
      break;
    case 'live.ended':
      await handleLiveStreamEnded(event.data, env);
      break;
  }
  
  return new Response('OK');
}

// Video ready handler
async function handleVideoReady(data: any, env: Env): Promise<void> {
  const { uid, duration, input, playback } = data;
  
  // Get video metadata
  const videoInfo = await fetch(
    \`https://api.cloudflare.com/client/v4/accounts/\${env.CF_ACCOUNT_ID}/stream/\${uid}\`,
    {
      headers: {
        'Authorization': \`Bearer \${env.CF_API_TOKEN}\`
      }
    }
  ).then(r => r.json());
  
  // Update database with video info
  await env.DB.prepare(
    \`UPDATE uploads 
     SET status = ?, duration = ?, playback_url = ?, 
         hls_url = ?, dash_url = ?, thumbnail_url = ?,
         size_bytes = ?, width = ?, height = ?, fps = ?
     WHERE stream_id = ?\`
  ).bind(
    'ready',
    duration,
    playback.hls,
    playback.hls,
    playback.dash,
    videoInfo.result.thumbnail,
    input.size,
    input.width,
    input.height,
    input.fps,
    uid
  ).run();
  
  // Generate multiple quality versions
  await generateQualityVariants(uid, env);
  
  // Extract and store metadata in R2
  const metadata = {
    streamId: uid,
    duration,
    resolution: \`\${input.width}x\${input.height}\`,
    bitrate: input.bitrate,
    codec: input.codec,
    fps: input.fps,
    createdAt: new Date().toISOString()
  };
  
  await env.BUCKET.put(
    \`metadata/\${uid}.json\`,
    JSON.stringify(metadata),
    {
      httpMetadata: {
        contentType: 'application/json'
      }
    }
  );
}

// AI-powered video analysis queue handler
export async function scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
  // Process analysis queue
  const batch = await env.ANALYSIS_QUEUE.receive({ maxBatchSize: 10 });
  
  for (const message of batch.messages) {
    const { streamId, tasks } = message.body;
    
    if (tasks.includes('transcription')) {
      await generateTranscription(streamId, env);
    }
    
    if (tasks.includes('content_moderation')) {
      await moderateContent(streamId, env);
    }
    
    if (tasks.includes('auto_chapters')) {
      await generateChapters(streamId, env);
    }
    
    message.ack();
  }
}

// Generate transcription using Whisper API
async function generateTranscription(streamId: string, env: Env): Promise<void> {
  // Download audio track
  const audioUrl = \`https://customer-\${env.CF_ACCOUNT_HASH}.cloudflarestream.com/\${streamId}/audio.mp3\`;
  
  // Use Workers AI Whisper model
  const audioResponse = await fetch(audioUrl);
  const audioBuffer = await audioResponse.arrayBuffer();
  
  const transcription = await env.AI.run('@cf/openai/whisper', {
    audio: [...new Uint8Array(audioBuffer)]
  });
  
  // Store transcription in R2
  await env.BUCKET.put(
    \`transcriptions/\${streamId}.vtt\`,
    convertToWebVTT(transcription),
    {
      httpMetadata: {
        contentType: 'text/vtt'
      }
    }
  );
  
  // Update Stream with caption URL
  await fetch(
    \`https://api.cloudflare.com/client/v4/accounts/\${env.CF_ACCOUNT_ID}/stream/\${streamId}/captions/en\`,
    {
      method: 'PUT',
      headers: {
        'Authorization': \`Bearer \${env.CF_API_TOKEN}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: \`\${env.WORKER_URL}/captions/\${streamId}.vtt\`
      })
    }
  );
}

// Content moderation using AI
async function moderateContent(streamId: string, env: Env): Promise<void> {
  // Extract frames for analysis
  const frames = await extractKeyFrames(streamId, env);
  
  for (const frame of frames) {
    // Use Workers AI vision model for content moderation
    const moderation = await env.AI.run('@cf/meta/llama-3-vision', {
      image: frame.data,
      prompt: 'Analyze this image for inappropriate content including violence, adult content, or hate symbols. Return a safety score from 0-1 where 1 is completely safe.'
    });
    
    if (moderation.safetyScore < 0.7) {
      // Flag video for review
      await env.DB.prepare(
        'UPDATE uploads SET moderation_status = ?, moderation_notes = ? WHERE stream_id = ?'
      ).bind('flagged', moderation.details, streamId).run();
      
      // Notify moderators
      await env.MODERATION_QUEUE.send({
        streamId,
        reason: moderation.details,
        timestamp: frame.timestamp
      });
      
      break;
    }
  }
}

// Generate chapters using AI
async function generateChapters(streamId: string, env: Env): Promise<void> {
  // Get transcription
  const transcription = await env.BUCKET.get(\`transcriptions/\${streamId}.vtt\`);
  const text = await transcription.text();
  
  // Use AI to identify chapters
  const chapters = await env.AI.run('@cf/meta/llama-3-70b-instruct', {
    prompt: \`Analyze this video transcription and identify logical chapter breaks. 
    Return a JSON array of chapters with timestamp and title.
    
    Transcription:
    \${text}
    
    Format: [{"start": "00:00", "title": "Introduction"}, ...]
    \`,
    max_tokens: 1000
  });
  
  // Store chapters
  await env.BUCKET.put(
    \`chapters/\${streamId}.json\`,
    JSON.stringify(chapters),
    {
      httpMetadata: {
        contentType: 'application/json'
      }
    }
  );
}

// Video player page
async function handleVideoPlayer(request: Request, env: Env): Promise<Response> {
  const videoId = request.url.split('/watch/')[1];
  
  // Get video details
  const video = await env.DB.prepare(
    'SELECT * FROM uploads WHERE stream_id = ? AND status = ?'
  ).bind(videoId, 'ready').first();
  
  if (!video) {
    return new Response('Video not found', { status: 404 });
  }
  
  // Get chapters and transcription
  const [chapters, captions] = await Promise.all([
    env.BUCKET.get(\`chapters/\${videoId}.json\`),
    env.BUCKET.get(\`transcriptions/\${videoId}.vtt\`)
  ]);
  
  // Generate player HTML
  const html = \`
<!DOCTYPE html>
<html>
<head>
  <title>\${video.title} - CloudStream</title>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
  <style>
    body { margin: 0; font-family: sans-serif; background: #000; }
    .player-container { position: relative; max-width: 1280px; margin: 0 auto; }
    video { width: 100%; height: auto; }
    .chapters { position: absolute; bottom: 60px; left: 10px; background: rgba(0,0,0,0.8); padding: 10px; }
    .chapter { cursor: pointer; padding: 5px; color: white; }
    .chapter:hover { background: rgba(255,255,255,0.2); }
  </style>
</head>
<body>
  <div class="player-container">
    <video id="video" controls>
      <track kind="captions" src="/captions/\${videoId}.vtt" srclang="en" label="English" default>
    </video>
    
    <div class="chapters" id="chapters"></div>
  </div>
  
  <script>
    const video = document.getElementById('video');
    const hlsUrl = '\${video.hls_url}';
    const chapters = \${chapters ? await chapters.text() : '[]'};
    
    // Initialize HLS.js
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, function() {
        // Auto-quality selection
        hls.currentLevel = -1;
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
    }
    
    // Render chapters
    const chaptersDiv = document.getElementById('chapters');
    chapters.forEach(chapter => {
      const div = document.createElement('div');
      div.className = 'chapter';
      div.textContent = \`\${chapter.start} - \${chapter.title}\`;
      div.onclick = () => {
        const [min, sec] = chapter.start.split(':');
        video.currentTime = parseInt(min) * 60 + parseInt(sec);
      };
      chaptersDiv.appendChild(div);
    });
    
    // Analytics
    let watchTime = 0;
    let lastTime = 0;
    
    video.addEventListener('timeupdate', () => {
      if (video.currentTime > lastTime) {
        watchTime += video.currentTime - lastTime;
      }
      lastTime = video.currentTime;
    });
    
    window.addEventListener('beforeunload', () => {
      // Send analytics
      navigator.sendBeacon('/api/analytics', JSON.stringify({
        videoId: '\${videoId}',
        watchTime,
        completed: video.currentTime / video.duration
      }));
    });
  </script>
</body>
</html>
  \`;
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

// Live streaming with WebRTC
export class LiveStreamRoom extends DurableObject {
  private viewers: Set<WebSocket> = new Set();
  private broadcaster: WebSocket | null = null;
  
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/broadcast') {
      return this.handleBroadcaster(request);
    } else if (url.pathname === '/view') {
      return this.handleViewer(request);
    }
    
    return new Response('Not Found', { status: 404 });
  }
  
  async handleBroadcaster(request: Request): Promise<Response> {
    if (this.broadcaster) {
      return new Response('Broadcaster already connected', { status: 409 });
    }
    
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    
    this.broadcaster = server;
    this.ctx.acceptWebSocket(server);
    
    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
  
  async handleViewer(request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    
    this.viewers.add(server);
    this.ctx.acceptWebSocket(server);
    
    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
  
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (ws === this.broadcaster) {
      // Forward to all viewers
      for (const viewer of this.viewers) {
        viewer.send(message);
      }
    }
  }
  
  async webSocketClose(ws: WebSocket) {
    if (ws === this.broadcaster) {
      this.broadcaster = null;
      // Notify viewers
      for (const viewer of this.viewers) {
        viewer.send(JSON.stringify({ type: 'broadcaster_disconnected' }));
      }
    } else {
      this.viewers.delete(ws);
    }
  }
}
\`\`\`

### 2. Database Schema

\`\`\`sql
-- D1 schema
CREATE TABLE uploads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  stream_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  duration REAL,
  playback_url TEXT,
  hls_url TEXT,
  dash_url TEXT,
  thumbnail_url TEXT,
  size_bytes INTEGER,
  width INTEGER,
  height INTEGER,
  fps REAL,
  moderation_status TEXT DEFAULT 'pending',
  moderation_notes TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE INDEX idx_uploads_user ON uploads(user_id);
CREATE INDEX idx_uploads_status ON uploads(status);
CREATE INDEX idx_uploads_created ON uploads(created_at);

CREATE TABLE analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id TEXT NOT NULL,
  viewer_id TEXT,
  watch_time REAL,
  completion_rate REAL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (video_id) REFERENCES uploads(stream_id)
);

CREATE INDEX idx_analytics_video ON analytics(video_id);
\`\`\`

### 3. Deployment Configuration

\`\`\`toml
# wrangler.toml
name = "video-platform"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[durable_objects]
bindings = [
  { name = "LIVE_ROOMS", class_name = "LiveStreamRoom" }
]

[[d1_databases]]
binding = "DB"
database_name = "video-platform"
database_id = "your-database-id"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "video-assets"

[[queues.producers]]
binding = "ANALYSIS_QUEUE"
queue = "video-analysis"

[[queues.producers]]
binding = "MODERATION_QUEUE"
queue = "content-moderation"

[[queues.consumers]]
queue = "video-analysis"
max_batch_size = 10
max_batch_timeout = 30

[ai]
binding = "AI"

[vars]
CF_ACCOUNT_ID = "your-account-id"
CF_API_TOKEN = "your-api-token"
CF_ACCOUNT_HASH = "your-account-hash"
WEBHOOK_SECRET = "your-webhook-secret"
ALLOWED_ORIGIN = "https://your-domain.com"
WORKER_URL = "https://your-worker.workers.dev"

# Cron for cleanup
[triggers]
crons = ["0 2 * * *"]
\`\`\``,
      reasoning: 'This example demonstrates a comprehensive video streaming platform using Cloudflare Stream for video processing, R2 for asset storage, Workers AI for transcription and content analysis, D1 for metadata, and Durable Objects for live streaming with WebRTC.'
    }
  ]
};

// Register the Cloudflare specialist
export function registerCloudflareSpecialist(): void {
  specialistRegistry.register(cloudflareExpert);
}