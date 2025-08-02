import { 
  WorkflowTemplate, 
  WorkflowExecution, 
  WorkflowNode,
  WorkflowLog,
  WorkflowError 
} from './types';
import { createBotbie } from '@earth-agents/botbie';
import { createDebugEarth } from '@earth-agents/debugearth';
import { createSketchie } from '@earth-agents/sketchie';
import { WorkflowOrchestrator } from '@earth-agents/cli';
import { EventEmitter } from 'events';

export class WorkflowExecutor extends EventEmitter {
  private execution: WorkflowExecution;
  private agents: Map<string, any> = new Map();
  private orchestrator: WorkflowOrchestrator;
  private abortController: AbortController;

  constructor(private template: WorkflowTemplate, private inputs: Record<string, any>) {
    super();
    this.abortController = new AbortController();
    this.orchestrator = new WorkflowOrchestrator();
    
    this.execution = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      templateId: template.id,
      startTime: new Date(),
      status: 'pending',
      progress: 0,
      results: {},
      logs: []
    };
  }

  /**
   * Execute the workflow
   */
  async execute(): Promise<WorkflowExecution> {
    try {
      this.execution.status = 'running';
      this.emit('start', this.execution);
      
      // Initialize agents
      await this.initializeAgents();
      
      // Execute nodes
      await this.executeNodes();
      
      // Generate outputs
      await this.generateOutputs();
      
      // Complete execution
      this.execution.status = 'completed';
      this.execution.endTime = new Date();
      this.execution.progress = 100;
      
      this.emit('complete', this.execution);
      
    } catch (error) {
      this.handleError(error as Error);
    }
    
    return this.execution;
  }

  /**
   * Cancel the workflow execution
   */
  cancel(): void {
    this.abortController.abort();
    this.execution.status = 'cancelled';
    this.execution.endTime = new Date();
    this.emit('cancelled', this.execution);
  }

  /**
   * Get current execution status
   */
  getStatus(): WorkflowExecution {
    return { ...this.execution };
  }

  // Private methods

  private async initializeAgents(): Promise<void> {
    this.log('info', 'Initializing agents...');
    
    const agentTypes = new Set(this.template.nodes.map(n => n.agent));
    
    if (agentTypes.has('botbie')) {
      const botbie = createBotbie({ verbose: false });
      await botbie.initialize();
      this.agents.set('botbie', botbie);
    }
    
    if (agentTypes.has('debugearth')) {
      const debugearth = createDebugEarth({ verbose: false });
      await debugearth.initialize();
      this.agents.set('debugearth', debugearth);
    }
    
    if (agentTypes.has('sketchie')) {
      const sketchie = createSketchie({ verbose: false });
      await sketchie.initialize();
      this.agents.set('sketchie', sketchie);
    }
    
    this.agents.set('orchestrator', this.orchestrator);
    
    this.log('info', `Initialized ${this.agents.size} agents`);
  }

  private async executeNodes(): Promise<void> {
    const executedNodes = new Set<string>();
    const nodeResults = new Map<string, any>();
    
    while (executedNodes.size < this.template.nodes.length) {
      // Check for cancellation
      if (this.abortController.signal.aborted) {
        throw new Error('Workflow cancelled');
      }
      
      // Find next executable nodes
      const executableNodes = this.template.nodes.filter(node => {
        if (executedNodes.has(node.id)) return false;
        
        // Check dependencies
        if (node.dependsOn) {
          return node.dependsOn.every(dep => executedNodes.has(dep));
        }
        
        return true;
      });
      
      if (executableNodes.length === 0) {
        throw new Error('No executable nodes found - possible circular dependency');
      }
      
      // Execute nodes (parallel if configured)
      if (this.template.config.parallelExecution) {
        await Promise.all(
          executableNodes.map(node => this.executeNode(node, nodeResults))
        );
      } else {
        for (const node of executableNodes) {
          await this.executeNode(node, nodeResults);
        }
      }
      
      // Mark as executed
      executableNodes.forEach(node => executedNodes.add(node.id));
      
      // Update progress
      this.execution.progress = Math.round((executedNodes.size / this.template.nodes.length) * 100);
      this.emit('progress', this.execution);
    }
    
    this.execution.results = Object.fromEntries(nodeResults);
  }

  private async executeNode(node: WorkflowNode, results: Map<string, any>): Promise<void> {
    this.log('info', `Executing node: ${node.name}`, node.id);
    this.execution.currentNode = node.id;
    
    try {
      // Check conditions
      if (node.conditions && !this.evaluateConditions(node.conditions, results)) {
        this.log('info', `Skipping node due to conditions: ${node.name}`, node.id);
        results.set(node.id, { skipped: true });
        return;
      }
      
      // Get agent
      const agent = this.agents.get(node.agent);
      if (!agent) {
        throw new Error(`Agent not found: ${node.agent}`);
      }
      
      // Prepare inputs
      const inputs = this.resolveInputs(node.inputs || {}, results);
      
      // Execute action
      let result;
      const timeout = node.timeout || this.template.config.timeoutMinutes * 60 * 1000;
      
      switch (node.type) {
        case 'analysis':
        case 'action':
          result = await this.executeWithTimeout(
            agent[node.action](inputs),
            timeout
          );
          break;
          
        case 'parallel':
          result = await this.executeParallelTasks(node, results);
          break;
          
        case 'decision':
          result = await this.executeDecision(node, results);
          break;
          
        case 'merge':
          result = await this.executeMerge(node, results);
          break;
          
        case 'loop':
          result = await this.executeLoop(node, results);
          break;
          
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }
      
      results.set(node.id, result);
      this.log('info', `Node completed: ${node.name}`, node.id);
      
    } catch (error) {
      await this.handleNodeError(node, error as Error);
    }
  }

  private async executeWithTimeout(promise: Promise<any>, timeout: number): Promise<any> {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), timeout);
    });
    
    return Promise.race([promise, timeoutPromise]);
  }

  private async executeParallelTasks(node: WorkflowNode, results: Map<string, any>): Promise<any> {
    // Implementation for parallel task execution
    const tasks = (node as any).tasks || [];
    const taskResults = await Promise.all(
      tasks.map((task: any) => {
        const agent = this.agents.get(task.agent);
        const inputs = this.resolveInputs(task.inputs || {}, results);
        return agent[task.action](inputs);
      })
    );
    
    return { tasks: taskResults };
  }

  private async executeDecision(node: WorkflowNode, results: Map<string, any>): Promise<any> {
    // Implementation for decision nodes
    const conditions = node.conditions || [];
    for (const condition of conditions) {
      if (this.evaluateCondition(condition, results)) {
        return { decision: condition.action };
      }
    }
    return { decision: 'default' };
  }

  private async executeMerge(node: WorkflowNode, results: Map<string, any>): Promise<any> {
    // Implementation for merge nodes
    const dependencies = node.dependsOn || [];
    const mergedResults: any = {};
    
    dependencies.forEach(dep => {
      mergedResults[dep] = results.get(dep);
    });
    
    return mergedResults;
  }

  private async executeLoop(node: WorkflowNode, results: Map<string, any>): Promise<any> {
    // Implementation for loop nodes
    const loopResults: any[] = [];
    const maxIterations = (node as any).maxIterations || 10;
    
    for (let i = 0; i < maxIterations; i++) {
      // Execute loop body
      const iterationResult = await this.executeNode(
        { ...node, type: 'action' },
        results
      );
      
      loopResults.push(iterationResult);
      
      // Check loop condition
      if ((node as any).exitCondition) {
        const shouldExit = this.evaluateCondition((node as any).exitCondition, results);
        if (shouldExit) break;
      }
    }
    
    return { iterations: loopResults };
  }

  private evaluateConditions(conditions: any[], results: Map<string, any>): boolean {
    return conditions.every(condition => this.evaluateCondition(condition, results));
  }

  private evaluateCondition(condition: any, results: Map<string, any>): boolean {
    const value = this.resolveValue(condition.field, results);
    
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'greater_than':
        return value > condition.value;
      case 'less_than':
        return value < condition.value;
      case 'contains':
        return String(value).includes(condition.value);
      case 'regex':
        return new RegExp(condition.value).test(String(value));
      default:
        return false;
    }
  }

  private resolveInputs(inputs: Record<string, any>, results: Map<string, any>): Record<string, any> {
    const resolved: Record<string, any> = {};
    
    Object.entries(inputs).forEach(([key, value]) => {
      resolved[key] = this.resolveValue(value, results);
    });
    
    return resolved;
  }

  private resolveValue(value: any, results: Map<string, any>): any {
    if (typeof value !== 'string') return value;
    
    // Check for variable references ${...}
    const variablePattern = /\$\{([^}]+)\}/g;
    let resolved = value;
    
    resolved = resolved.replace(variablePattern, (match, path) => {
      // Handle different path types
      if (path.startsWith('inputs.')) {
        return this.getNestedValue(this.inputs, path.substring(7));
      } else if (path.startsWith('nodes.')) {
        const parts = path.substring(6).split('.');
        const nodeId = parts[0];
        const resultPath = parts.slice(1).join('.');
        const nodeResult = results.get(nodeId);
        return this.getNestedValue(nodeResult, resultPath);
      } else if (path.startsWith('env.')) {
        return process.env[path.substring(4)] || '';
      } else {
        return this.inputs[path] || match;
      }
    });
    
    return resolved;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async generateOutputs(): Promise<void> {
    this.log('info', 'Generating outputs...');
    
    for (const output of this.template.outputs) {
      try {
        // Generate output based on type
        switch (output.type) {
          case 'report':
            await this.generateReport(output);
            break;
          case 'artifact':
            await this.generateArtifact(output);
            break;
          case 'metric':
            await this.generateMetric(output);
            break;
          case 'notification':
            await this.sendNotification(output);
            break;
        }
      } catch (error) {
        this.log('error', `Failed to generate output: ${output.name}`, undefined, error as Error);
      }
    }
  }

  private async generateReport(output: any): Promise<void> {
    // Implementation for report generation
    this.log('info', `Generating report: ${output.name}`);
  }

  private async generateArtifact(output: any): Promise<void> {
    // Implementation for artifact generation
    this.log('info', `Generating artifact: ${output.name}`);
  }

  private async generateMetric(output: any): Promise<void> {
    // Implementation for metric generation
    this.log('info', `Generating metric: ${output.name}`);
  }

  private async sendNotification(output: any): Promise<void> {
    // Implementation for notification sending
    this.log('info', `Sending notification: ${output.name}`);
  }

  private async handleNodeError(node: WorkflowNode, error: Error): Promise<void> {
    const workflowError: WorkflowError = {
      nodeId: node.id,
      timestamp: new Date(),
      message: error.message,
      stack: error.stack,
      recoverable: node.retryPolicy ? true : false
    };
    
    if (!this.execution.errors) {
      this.execution.errors = [];
    }
    this.execution.errors.push(workflowError);
    
    // Attempt retry if configured
    if (node.retryPolicy && node.retryPolicy.maxAttempts > 0) {
      this.log('warn', `Retrying node: ${node.name}`, node.id);
      // Implement retry logic
    } else {
      throw error;
    }
  }

  private handleError(error: Error): void {
    this.execution.status = 'failed';
    this.execution.endTime = new Date();
    
    if (!this.execution.errors) {
      this.execution.errors = [];
    }
    
    this.execution.errors.push({
      nodeId: this.execution.currentNode || 'unknown',
      timestamp: new Date(),
      message: error.message,
      stack: error.stack,
      recoverable: false
    });
    
    this.emit('error', error, this.execution);
  }

  private log(level: WorkflowLog['level'], message: string, nodeId?: string, error?: Error): void {
    const log: WorkflowLog = {
      timestamp: new Date(),
      level,
      message,
      nodeId
    };
    
    if (error) {
      log.data = { error: error.message, stack: error.stack };
    }
    
    this.execution.logs.push(log);
    this.emit('log', log);
  }
}