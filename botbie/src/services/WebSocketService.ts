import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { Logger } from '../utils/Logger';

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  constructor(private logger: Logger) {}

  attach(server: Server): void {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket) => {
      this.logger.info('New WebSocket connection established');
      this.clients.add(ws);

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          this.logger.error('Failed to parse WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.logger.info('WebSocket connection closed');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        this.logger.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      ws.send(JSON.stringify({ type: 'connected', message: 'Welcome to Botbie!' }));
    });
  }

  private handleMessage(ws: WebSocket, message: any): void {
    this.logger.debug('Received message:', message);
    
    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      case 'subscribe':
        ws.send(JSON.stringify({ type: 'subscribed', channel: message.channel }));
        break;
      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
    }
  }

  broadcast(type: string, data: any): void {
    const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
    
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
    
    this.logger.debug(`Broadcast message to ${this.clients.size} clients`);
  }

  close(): void {
    this.clients.forEach((client) => {
      client.close();
    });
    this.clients.clear();
    
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}