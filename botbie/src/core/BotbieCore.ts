import express, { Express } from 'express';
import { Server } from 'http';
import { WebSocketService } from '../services/WebSocketService';
import { AgentManager } from '../agents/AgentManager';
import { TaskQueue } from './TaskQueue';
import { Logger } from '../utils/Logger';

export interface BotbieConfig {
  bot: {
    name: string;
    version: string;
    maxConcurrentTasks: number;
    taskTimeoutMs: number;
  };
  server: {
    port: number;
    environment: string;
  };
  api: {
    anthropicKey?: string;
    openaiKey?: string;
  };
  logging: {
    level: string;
    file: string;
  };
}

export class BotbieCore {
  private app: Express;
  private server: Server | null = null;
  private wsService: WebSocketService;
  private agentManager: AgentManager;
  private taskQueue: TaskQueue;
  private logger: Logger;

  constructor(private config: BotbieConfig) {
    this.app = express();
    this.logger = new Logger(config.logging.level);
    this.wsService = new WebSocketService(this.logger);
    this.agentManager = new AgentManager(config, this.logger);
    this.taskQueue = new TaskQueue(config.bot.maxConcurrentTasks, this.logger);
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    this.app.use((req, res, next) => {
      this.logger.info(`${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        name: this.config.bot.name,
        version: this.config.bot.version,
        uptime: process.uptime(),
      });
    });

    this.app.post('/task', async (req, res) => {
      try {
        const task = await this.taskQueue.addTask(req.body);
        res.json({ success: true, taskId: task.id });
      } catch (error) {
        this.logger.error('Failed to add task:', error);
        res.status(500).json({ success: false, error: 'Failed to add task' });
      }
    });

    this.app.get('/task/:id', async (req, res) => {
      const task = this.taskQueue.getTask(req.params.id);
      if (!task) {
        res.status(404).json({ error: 'Task not found' });
      } else {
        res.json(task);
      }
    });

    this.app.get('/agents', (req, res) => {
      res.json(this.agentManager.listAgents());
    });

    // Tender-specific endpoints
    this.app.post('/tender/analyze', async (req, res) => {
      try {
        const task = await this.taskQueue.addTask({
          type: 'tender-analysis',
          payload: req.body
        });
        res.json({ success: true, taskId: task.id });
      } catch (error) {
        this.logger.error('Failed to analyze tender:', error);
        res.status(500).json({ success: false, error: 'Failed to analyze tender' });
      }
    });

    this.app.post('/vendor/discover', async (req, res) => {
      try {
        const task = await this.taskQueue.addTask({
          type: 'vendor-discovery',
          payload: req.body
        });
        res.json({ success: true, taskId: task.id });
      } catch (error) {
        this.logger.error('Failed to discover vendors:', error);
        res.status(500).json({ success: false, error: 'Failed to discover vendors' });
      }
    });

    this.app.post('/email/generate', async (req, res) => {
      try {
        const task = await this.taskQueue.addTask({
          type: 'email-generation',
          payload: req.body
        });
        res.json({ success: true, taskId: task.id });
      } catch (error) {
        this.logger.error('Failed to generate emails:', error);
        res.status(500).json({ success: false, error: 'Failed to generate emails' });
      }
    });

    this.app.post('/tender/workflow', async (req, res) => {
      try {
        // Create a complete tender workflow
        const { documentText, location, senderInfo } = req.body;
        
        // Step 1: Analyze tender
        const analysisTask = await this.taskQueue.addTask({
          type: 'tender-analysis',
          payload: { documentText, analysisType: 'full-analysis' }
        });
        
        // Step 2: Discover vendors
        const vendorTask = await this.taskQueue.addTask({
          type: 'vendor-discovery',
          payload: { location, keywords: ['server', 'hosting', 'IT services'] }
        });
        
        // Step 3: Generate emails
        const emailTask = await this.taskQueue.addTask({
          type: 'email-generation',
          payload: { templateType: 'quotation-request', senderInfo }
        });
        
        res.json({
          success: true,
          workflow: {
            analysisTaskId: analysisTask.id,
            vendorTaskId: vendorTask.id,
            emailTaskId: emailTask.id
          }
        });
      } catch (error) {
        this.logger.error('Failed to create tender workflow:', error);
        res.status(500).json({ success: false, error: 'Failed to create tender workflow' });
      }
    });
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Botbie Core...');
    
    await this.agentManager.initialize();
    
    // Connect TaskQueue to AgentManager
    this.taskQueue.setAgentManager(this.agentManager);
    
    this.server = this.app.listen(this.config.server.port, () => {
      this.logger.info(`Server listening on port ${this.config.server.port}`);
    });
    
    this.wsService.attach(this.server);
    
    this.taskQueue.on('taskComplete', (task) => {
      this.wsService.broadcast('taskComplete', task);
    });
    
    this.taskQueue.on('taskError', (task, error) => {
      this.wsService.broadcast('taskError', { task, error: error.message });
    });
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Botbie Core...');
    
    await this.taskQueue.stop();
    this.wsService.close();
    
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => resolve());
      });
    }
    
    this.logger.info('Botbie Core shutdown complete');
  }
}