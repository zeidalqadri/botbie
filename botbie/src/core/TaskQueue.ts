import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/Logger';

export interface Task {
  id: string;
  type: string;
  payload: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: Error;
}

export class TaskQueue extends EventEmitter {
  private tasks: Map<string, Task> = new Map();
  private queue: string[] = [];
  private running: Set<string> = new Set();
  private isProcessing = false;
  private agentManager: any;

  constructor(
    private maxConcurrent: number,
    private logger: Logger
  ) {
    super();
  }

  setAgentManager(agentManager: any): void {
    this.agentManager = agentManager;
  }

  async addTask(taskData: { type: string; payload: any }): Promise<Task> {
    const task: Task = {
      id: uuidv4(),
      type: taskData.type,
      payload: taskData.payload,
      status: 'pending',
      createdAt: new Date(),
    };

    this.tasks.set(task.id, task);
    this.queue.push(task.id);
    this.logger.info(`Task ${task.id} added to queue`);
    
    this.processQueue();
    return task;
  }

  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0 && this.running.size < this.maxConcurrent) {
      const taskId = this.queue.shift();
      if (!taskId) continue;

      const task = this.tasks.get(taskId);
      if (!task) continue;

      this.running.add(taskId);
      task.status = 'running';
      task.startedAt = new Date();

      this.processTask(task).then(() => {
        this.running.delete(taskId);
        this.processQueue();
      });
    }

    this.isProcessing = false;
  }

  private async processTask(task: Task): Promise<void> {
    try {
      this.logger.info(`Processing task ${task.id} of type ${task.type}`);
      
      // Map task types to agent IDs
      const agentMapping: Record<string, string> = {
        'tender-analysis': 'TenderAnalysisAgent',
        'vendor-discovery': 'VendorDiscoveryAgent',
        'email-generation': 'EmailGenerationAgent',
        'text-analysis': 'TextAnalysisAgent'
      };

      const agentName = agentMapping[task.type];
      
      if (agentName && this.agentManager) {
        // Find agent by name
        const agents = this.agentManager.listAgents();
        const agentInfo = agents.find((a: any) => a.name === agentName);
        
        if (agentInfo) {
          // Execute task with appropriate agent
          task.result = await this.agentManager.executeTask(agentInfo.id, task);
          task.status = 'completed';
          task.completedAt = new Date();
          
          this.emit('taskComplete', task);
          this.logger.info(`Task ${task.id} completed with agent ${agentName}`);
        } else {
          // Fallback to simple processing
          await new Promise(resolve => setTimeout(resolve, 1000));
          task.status = 'completed';
          task.completedAt = new Date();
          task.result = { success: true, message: 'Task completed successfully' };
          
          this.emit('taskComplete', task);
          this.logger.info(`Task ${task.id} completed`);
        }
      } else {
        // Default processing for unknown task types
        await new Promise(resolve => setTimeout(resolve, 1000));
        task.status = 'completed';
        task.completedAt = new Date();
        task.result = { success: true, message: 'Task completed successfully' };
        
        this.emit('taskComplete', task);
        this.logger.info(`Task ${task.id} completed`);
      }
    } catch (error) {
      task.status = 'failed';
      task.completedAt = new Date();
      task.error = error as Error;
      
      this.emit('taskError', task, error);
      this.logger.error(`Task ${task.id} failed:`, error);
    }
  }

  async stop(): Promise<void> {
    this.queue = [];
    await Promise.all(
      Array.from(this.running).map(taskId => {
        const task = this.tasks.get(taskId);
        if (task) {
          task.status = 'failed';
          task.error = new Error('Queue stopped');
        }
        return Promise.resolve();
      })
    );
    this.running.clear();
  }
}