#!/usr/bin/env node

/**
 * Test script for n8n MCP server
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing n8n MCP Server...');

const serverPath = join(__dirname, 'mcp-server.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// Test initialization message
const initMessage = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  }
}) + '\n';

server.stdout.on('data', (data) => {
  const response = data.toString();
  console.log('📤 Server response:', response);
  
  try {
    const parsed = JSON.parse(response);
    if (parsed.result && parsed.result.capabilities) {
      console.log('✅ MCP Server initialized successfully!');
      console.log('🛠️  Available capabilities:', Object.keys(parsed.result.capabilities));
      server.kill();
      process.exit(0);
    }
  } catch (e) {
    // Not JSON, continue
  }
});

server.on('error', (error) => {
  console.error('❌ Server error:', error.message);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code === 0) {
    console.log('✅ Server test completed successfully');
  } else {
    console.log(`❌ Server exited with code: ${code}`);
  }
});

// Send initialization message
console.log('📥 Sending initialization message...');
server.stdin.write(initMessage);

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Test timeout - killing server');
  server.kill();
  process.exit(0);
}, 10000);