const WebSocket = require('ws');

// Connect to Botbie WebSocket server
const ws = new WebSocket('ws://localhost:3333');

ws.on('open', () => {
  console.log('✅ Connected to Botbie WebSocket');
  
  // Send a ping message
  ws.send(JSON.stringify({ type: 'ping' }));
  
  // Subscribe to task updates
  ws.send(JSON.stringify({ 
    type: 'subscribe', 
    channel: 'tasks' 
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('📨 Received:', message);
  
  // Handle different message types
  switch(message.type) {
    case 'connected':
      console.log('🤝 Server says:', message.message);
      break;
    case 'pong':
      console.log('🏓 Pong received!');
      break;
    case 'taskComplete':
      console.log('✅ Task completed:', message.data);
      break;
    case 'taskError':
      console.log('❌ Task error:', message.data);
      break;
    default:
      console.log('📦 Message:', message);
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

ws.on('close', () => {
  console.log('👋 Disconnected from Botbie');
});

// Keep the connection alive
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000);