import { Agent, AgentConfig, Strategy, Evidence, Hypothesis, Session } from './types';
import { logger } from './utils/logger';
import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';

export abstract class EarthAgent implements Agent {
  abstract name: string;
  config: AgentConfig;
  strategies: Strategy[] = [];
  protected sessions: Map<string, Session> = new Map();
  
  constructor(config: AgentConfig) {
    this.config = {
      verbose: true,
      maxAttempts: 10,
      logLevel: 'info',
      ...config
    };
    
    logger.level = this.config.logLevel || 'info';
  }
  
  async initialize(): Promise<void> {
    this.printWelcome();
    await this.setupStrategies();
    logger.info(`${this.name} initialized with ${this.strategies.length} strategies`);
  }
  
  protected abstract setupStrategies(): Promise<void>;
  
  protected printWelcome(): void {
    console.log(chalk.green(`\n🌍 ${this.name} Initialized!`));
    console.log(chalk.cyan('━'.repeat(50)));
    console.log(chalk.yellow(this.config.description));
    console.log(chalk.cyan('━'.repeat(50)) + '\n');
  }
  
  protected createSession(description: string): Session {
    const session: Session = {
      id: uuidv4(),
      startTime: new Date(),
      description,
      hypotheses: [],
      evidence: [],
      status: 'active'
    };
    
    this.sessions.set(session.id, session);
    logger.info(`Created session ${session.id}: ${description}`);
    
    return session;
  }
  
  protected async addEvidence(sessionId: string, type: Evidence['type'], data: any): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    const evidence: Evidence = {
      id: uuidv4(),
      type,
      timestamp: new Date(),
      data,
      context: {},
      correlationId: sessionId
    };
    
    session.evidence.push(evidence);
    
    if (this.config.webhooks?.onEvidence) {
      this.config.webhooks.onEvidence(evidence);
    }
    
    logger.debug(`Added ${type} evidence to session ${sessionId}`);
  }
  
  protected async generateHypothesis(sessionId: string, description: string, confidence: number): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    const hypothesis: Hypothesis = {
      id: uuidv4(),
      description,
      confidence,
      evidence: session.evidence.map(e => e.id),
      tested: false
    };
    
    session.hypotheses.push(hypothesis);
    
    if (this.config.webhooks?.onHypothesis) {
      this.config.webhooks.onHypothesis(hypothesis);
    }
    
    logger.info(`Generated hypothesis: ${description} (confidence: ${confidence})`);
  }
  
  protected async runStrategies(context: any): Promise<any[]> {
    const results = [];
    
    for (const strategy of this.strategies) {
      if (strategy.canHandle(context)) {
        logger.info(`Running strategy: ${strategy.name}`);
        try {
          const result = await strategy.execute(context);
          results.push(result);
          
          if (result.success && this.config.verbose) {
            console.log(chalk.green(`✓ ${strategy.name} completed`));
          }
        } catch (error) {
          logger.error(`Strategy ${strategy.name} failed:`, error);
          if (this.config.verbose) {
            console.log(chalk.red(`✗ ${strategy.name} failed`));
          }
        }
      }
    }
    
    return results;
  }
  
  abstract execute(input: any): Promise<any>;
  
  async shutdown(): Promise<void> {
    logger.info(`Shutting down ${this.name}`);
    // Clean up resources
    this.sessions.clear();
  }
  
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }
  
  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }
}