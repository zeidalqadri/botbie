import { BaseAgent } from './BaseAgent';
import { Logger } from '../utils/Logger';

export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  status: 'active' | 'inactive' | 'error';
}

export class AgentManager {
  private agents: Map<string, BaseAgent> = new Map();
  
  constructor(
    private config: any,
    private logger: Logger
  ) {}

  async initialize(): Promise<void> {
    this.logger.info('Initializing Agent Manager...');
    
    // Import and register tender management agents
    const { TenderAnalysisAgent } = await import('./TenderAnalysisAgent');
    const { VendorDiscoveryAgent } = await import('./VendorDiscoveryAgent');
    const { EmailGenerationAgent } = await import('./EmailGenerationAgent');
    const { TextAnalysisAgent } = await import('./TextAnalysisAgent');
    
    // Create agent instances
    const tenderAgent = new TenderAnalysisAgent();
    const vendorAgent = new VendorDiscoveryAgent();
    const emailAgent = new EmailGenerationAgent();
    const textAgent = new TextAnalysisAgent();
    
    // Initialize and register agents
    await tenderAgent.activate();
    this.registerAgent(tenderAgent);
    
    await vendorAgent.activate();
    this.registerAgent(vendorAgent);
    
    await emailAgent.activate();
    this.registerAgent(emailAgent);
    
    await textAgent.activate();
    this.registerAgent(textAgent);
    
    this.logger.info(`Agent Manager initialized with ${this.agents.size} agents`);
  }

  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.id, agent);
    this.logger.info(`Agent ${agent.name} registered`);
  }

  getAgent(id: string): BaseAgent | undefined {
    return this.agents.get(id);
  }

  listAgents(): AgentInfo[] {
    return Array.from(this.agents.values()).map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      capabilities: agent.capabilities,
      status: agent.status,
    }));
  }

  async executeTask(agentId: string, task: any): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (agent.status !== 'active') {
      throw new Error(`Agent ${agentId} is not active`);
    }

    return agent.execute(task);
  }
}