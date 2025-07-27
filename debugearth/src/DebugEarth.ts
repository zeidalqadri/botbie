import { 
  DebugSession, 
  DebugEarthConfig, 
  DebugStrategy,
  Evidence,
  RootCause
} from './types';
import { logger, createSessionLogger } from './utils/logger';
import { CorrelationContext } from './utils/correlator';
import { HypothesisEngine } from './engines/HypothesisEngine';
import { EvidenceCollector } from './engines/EvidenceCollector';
import { RootCauseAnalyzer } from './engines/RootCauseAnalyzer';
import { ConsoleDetective } from './strategies/ConsoleDetective';
import { UISurgeon } from './strategies/UISurgeon';
import { StackArchaeologist } from './strategies/StackArchaeologist';
import { PerformanceHunter } from './strategies/PerformanceHunter';
import chalk from 'chalk';

export class DebugEarth {
  private config: DebugEarthConfig;
  private sessions: Map<string, DebugSession> = new Map();
  private correlator = CorrelationContext.getInstance();
  private hypothesisEngine = new HypothesisEngine();
  private evidenceCollector = new EvidenceCollector();
  private rootCauseAnalyzer = new RootCauseAnalyzer();
  private strategies: DebugStrategy[] = [];
  
  constructor(config: DebugEarthConfig = {}) {
    this.config = {
      verbose: true,
      maxAttempts: 10,
      enableVisualDebugging: true,
      enableBrowserDebugging: true,
      logLevel: 'info',
      persistence: false,
      ...config
    };
    
    // Initialize strategies
    this.strategies = [
      new ConsoleDetective(),
      new UISurgeon(),
      new StackArchaeologist(),
      new PerformanceHunter()
    ];
    
    logger.level = this.config.logLevel || 'info';
    
    this.printWelcome();
  }
  
  private printWelcome(): void {
    console.log(chalk.green('\n🌍 DebugEarth Initialized!'));
    console.log(chalk.cyan('━'.repeat(50)));
    console.log(chalk.yellow('Ready to dig deep and uncover those pesky bugs!'));
    console.log(chalk.cyan('━'.repeat(50)) + '\n');
  }
  
  async startDebugging(bugDescription: string): Promise<DebugSession> {
    const sessionId = this.correlator.generateId();
    const session: DebugSession = {
      id: sessionId,
      startTime: new Date(),
      bugDescription,
      hypotheses: [],
      evidence: [],
      attempts: [],
      status: 'active'
    };
    
    this.sessions.set(sessionId, session);
    
    const sessionLogger = createSessionLogger(sessionId);
    sessionLogger.info(`🚀 Starting debug session for: "${bugDescription}"`);
    sessionLogger.info(`🔬 I LOVE debugging! Let's solve this mystery together!`);
    
    // Start evidence collection
    this.evidenceCollector.startCollecting(session);
    
    // Give user initial instructions
    if (this.config.verbose) {
      this.printDebugInstructions(session);
    }
    
    return session;
  }
  
  private printDebugInstructions(session: DebugSession): void {
    const sessionLogger = createSessionLogger(session.id);
    
    sessionLogger.info('\n📋 DEBUG INSTRUCTIONS:');
    sessionLogger.info('1. Reproduce the bug while I collect evidence');
    sessionLogger.info('2. Use console logs liberally - I\'ll analyze them');
    sessionLogger.info('3. If it\'s a UI bug, interact with the problematic elements');
    sessionLogger.info('4. Call session.analyze() when ready for root cause analysis');
    sessionLogger.info('5. I might ask you to check localhost or browser console\n');
  }
  
  async collectEvidence(sessionId: string, evidence: Evidence): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    session.evidence.push(evidence);
    
    // Trigger webhooks if configured
    if (this.config.webhooks?.onEvidence) {
      this.config.webhooks.onEvidence(evidence);
    }
  }
  
  async runStrategies(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    const sessionLogger = createSessionLogger(sessionId);
    sessionLogger.info('🎯 Running debugging strategies...');
    
    for (const strategy of this.strategies) {
      if (strategy.canHandle(session) && session.attempts.length < (this.config.maxAttempts || 10)) {
        sessionLogger.info(`\n🔧 Applying strategy: ${strategy.name}`);
        
        const attempt = await strategy.execute(session);
        session.attempts.push(attempt);
        
        if (attempt.success) {
          sessionLogger.info(`✅ ${strategy.name} completed successfully`);
        } else {
          sessionLogger.warn(`⚠️ ${strategy.name} encountered issues`);
        }
      }
    }
  }
  
  async analyze(sessionId: string): Promise<RootCause | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    const sessionLogger = createSessionLogger(sessionId);
    sessionLogger.info('\n🧩 STARTING ROOT CAUSE ANALYSIS...');
    sessionLogger.info('This is my favorite part! Let me dig deep into this bug...\n');
    
    session.status = 'exploring';
    
    // Collect any remaining evidence
    const remainingEvidence = this.evidenceCollector.stopCollecting();
    session.evidence.push(...remainingEvidence);
    
    sessionLogger.info(`📊 Collected ${session.evidence.length} pieces of evidence`);
    
    // Generate hypotheses
    session.hypotheses = await this.hypothesisEngine.generateHypotheses(session);
    sessionLogger.info(`💡 Generated ${session.hypotheses.length} hypotheses`);
    
    // Trigger webhook
    if (this.config.webhooks?.onHypothesis) {
      session.hypotheses.forEach(h => this.config.webhooks!.onHypothesis!(h));
    }
    
    // Test hypotheses
    sessionLogger.info('\n🧪 Testing hypotheses...');
    for (const hypothesis of session.hypotheses) {
      await this.hypothesisEngine.testHypothesis(hypothesis, session);
    }
    
    // Run debugging strategies
    await this.runStrategies(sessionId);
    
    // Analyze for root cause
    const rootCause = await this.rootCauseAnalyzer.analyze(session);
    
    if (rootCause) {
      session.rootCause = rootCause;
      session.status = 'resolved';
      
      this.printRootCauseReport(rootCause, session);
      
      // Trigger webhook
      if (this.config.webhooks?.onRootCause) {
        this.config.webhooks.onRootCause(rootCause);
      }
    } else {
      session.status = 'exploring';
      sessionLogger.warn('\n❓ Root cause not yet determined. Need more evidence!');
      this.suggestNextSteps(session);
    }
    
    return rootCause;
  }
  
  private printRootCauseReport(rootCause: RootCause, session: DebugSession): void {
    
    console.log('\n' + chalk.green('═'.repeat(60)));
    console.log(chalk.green.bold('🎉 ROOT CAUSE FOUND! 🎉'));
    console.log(chalk.green('═'.repeat(60)) + '\n');
    
    console.log(chalk.yellow.bold('🐛 Bug Description:'));
    console.log(chalk.white(session.bugDescription));
    
    console.log('\n' + chalk.cyan.bold('🎯 Root Cause:'));
    console.log(chalk.white(rootCause.description));
    
    console.log('\n' + chalk.magenta.bold('📐 Mathematical Proof:'));
    rootCause.proofChain.forEach((step, i) => {
      console.log(chalk.gray(`${i + 1}. `) + chalk.white(step));
    });
    
    console.log('\n' + chalk.blue.bold('🔬 Detailed Explanation:'));
    console.log(chalk.white(rootCause.explanation));
    
    console.log('\n' + chalk.green.bold('✅ Solution:'));
    console.log(chalk.white(rootCause.solution));
    
    console.log('\n' + chalk.yellow.bold(`📊 Confidence: ${Math.round(rootCause.confidence * 100)}%`));
    
    console.log('\n' + chalk.green('═'.repeat(60)));
    console.log(chalk.cyan('🌍 DebugEarth: Another bug bites the dust!'));
    console.log(chalk.green('═'.repeat(60)) + '\n');
  }
  
  private suggestNextSteps(session: DebugSession): void {
    const logger = createSessionLogger(session.id);
    
    logger.info('\n📝 SUGGESTED NEXT STEPS:');
    
    // Analyze what evidence we're missing
    const evidenceTypes = new Set(session.evidence.map(e => e.type));
    
    if (!evidenceTypes.has('console')) {
      logger.info('• Add more console.log statements at critical points');
    }
    
    if (!evidenceTypes.has('network')) {
      logger.info('• Check network requests in browser DevTools');
    }
    
    if (!evidenceTypes.has('performance')) {
      logger.info('• Profile the application for performance issues');
    }
    
    if (typeof window !== 'undefined') {
      logger.info('• Open browser console and look for additional errors');
      logger.info('• Try the UI Surgeon visual debugging tools');
    }
    
    logger.info('• Provide more specific bug reproduction steps');
    logger.info('• Run session.addEvidence() with any new findings');
    logger.info('• Call session.analyze() again after gathering more evidence');
  }
  
  async addEvidence(sessionId: string, type: Evidence['type'], data: any): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    const evidence: Evidence = {
      id: this.correlator.generateId(),
      type,
      timestamp: new Date(),
      data,
      context: {
        sessionId,
        addedManually: true
      }
    };
    
    session.evidence.push(evidence);
    
    const sessionLogger = createSessionLogger(sessionId);
    sessionLogger.info(`📎 Added ${type} evidence to session`);
  }
  
  getSession(sessionId: string): DebugSession | undefined {
    return this.sessions.get(sessionId);
  }
  
  getSessions(): DebugSession[] {
    return Array.from(this.sessions.values());
  }
  
  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    const sessionLogger = createSessionLogger(sessionId);
    const duration = Date.now() - session.startTime.getTime();
    
    sessionLogger.info(`\n👋 Ending debug session`);
    sessionLogger.info(`Duration: ${Math.round(duration / 1000)}s`);
    sessionLogger.info(`Evidence collected: ${session.evidence.length}`);
    sessionLogger.info(`Strategies attempted: ${session.attempts.length}`);
    sessionLogger.info(`Status: ${session.status}`);
    
    if (!this.config.persistence) {
      this.sessions.delete(sessionId);
    }
  }
}

// Export convenience function
export function createDebugEarth(config?: DebugEarthConfig): DebugEarth {
  return new DebugEarth(config);
}