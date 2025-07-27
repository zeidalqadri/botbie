import { DebugSession, Hypothesis, Evidence } from '../types';
import { CorrelationContext } from '../utils/correlator';
import { createSessionLogger } from '../utils/logger';

export class HypothesisEngine {
  private correlator = CorrelationContext.getInstance();
  
  async generateHypotheses(session: DebugSession): Promise<Hypothesis[]> {
    const logger = createSessionLogger(session.id);
    logger.info('🧠 Generating hypotheses based on available evidence...');
    
    const hypotheses: Hypothesis[] = [];
    
    // Analyze stack traces
    const stackTraces = session.evidence.filter(e => e.type === 'stack-trace');
    if (stackTraces.length > 0) {
      hypotheses.push(...this.analyzeStackTraces(stackTraces));
    }
    
    // Analyze console logs
    const consoleLogs = session.evidence.filter(e => e.type === 'console');
    if (consoleLogs.length > 0) {
      hypotheses.push(...this.analyzeConsoleLogs(consoleLogs));
    }
    
    // Analyze performance data
    const perfData = session.evidence.filter(e => e.type === 'performance');
    if (perfData.length > 0) {
      hypotheses.push(...this.analyzePerformance(perfData));
    }
    
    // Apply 5 Whys methodology
    if (session.bugDescription) {
      hypotheses.push(...await this.apply5Whys(session.bugDescription, session.evidence));
    }
    
    logger.info(`Generated ${hypotheses.length} hypotheses`);
    return hypotheses;
  }
  
  private analyzeStackTraces(stackTraces: Evidence[]): Hypothesis[] {
    const hypotheses: Hypothesis[] = [];
    
    for (const trace of stackTraces) {
      const stack = trace.data;
      
      // Look for common patterns
      if (stack.includes('TypeError')) {
        hypotheses.push({
          id: this.correlator.generateId(),
          description: 'Type mismatch or undefined value access',
          confidence: 0.8,
          evidence: [trace.id],
          tested: false
        });
      }
      
      if (stack.includes('ReferenceError')) {
        hypotheses.push({
          id: this.correlator.generateId(),
          description: 'Variable or function not defined in scope',
          confidence: 0.9,
          evidence: [trace.id],
          tested: false
        });
      }
      
      if (stack.includes('Maximum call stack')) {
        hypotheses.push({
          id: this.correlator.generateId(),
          description: 'Infinite recursion or circular dependency',
          confidence: 0.95,
          evidence: [trace.id],
          tested: false
        });
      }
    }
    
    return hypotheses;
  }
  
  private analyzeConsoleLogs(logs: Evidence[]): Hypothesis[] {
    const hypotheses: Hypothesis[] = [];
    const errorPatterns = [
      { pattern: /null|undefined/i, hypothesis: 'Null or undefined value causing issues' },
      { pattern: /timeout|timed out/i, hypothesis: 'Operation timing out' },
      { pattern: /connection|network/i, hypothesis: 'Network connectivity issue' },
      { pattern: /permission|denied/i, hypothesis: 'Permission or access control issue' },
      { pattern: /memory|heap/i, hypothesis: 'Memory leak or allocation issue' }
    ];
    
    for (const log of logs) {
      const logText = JSON.stringify(log.data);
      
      for (const { pattern, hypothesis } of errorPatterns) {
        if (pattern.test(logText)) {
          hypotheses.push({
            id: this.correlator.generateId(),
            description: hypothesis,
            confidence: 0.7,
            evidence: [log.id],
            tested: false
          });
        }
      }
    }
    
    return hypotheses;
  }
  
  private analyzePerformance(perfData: Evidence[]): Hypothesis[] {
    const hypotheses: Hypothesis[] = [];
    
    for (const perf of perfData) {
      const metrics = perf.data;
      
      if (metrics.memory && metrics.memory.heapUsed > metrics.memory.heapTotal * 0.9) {
        hypotheses.push({
          id: this.correlator.generateId(),
          description: 'Memory pressure - heap usage above 90%',
          confidence: 0.85,
          evidence: [perf.id],
          tested: false
        });
      }
      
      if (metrics.cpu && metrics.cpu.usage > 90) {
        hypotheses.push({
          id: this.correlator.generateId(),
          description: 'High CPU usage indicating possible infinite loop or heavy computation',
          confidence: 0.75,
          evidence: [perf.id],
          tested: false
        });
      }
    }
    
    return hypotheses;
  }
  
  private async apply5Whys(description: string, evidence: Evidence[]): Promise<Hypothesis[]> {
    const hypotheses: Hypothesis[] = [];
    const whyChain: string[] = [description];
    
    // Simulate 5 Whys analysis
    const whyPatterns = [
      { trigger: /error|fail|crash/i, why: 'Invalid input or state' },
      { trigger: /slow|performance/i, why: 'Resource contention or inefficient algorithm' },
      { trigger: /not work|broken/i, why: 'Missing dependency or configuration' },
      { trigger: /unexpected|wrong/i, why: 'Logic error or race condition' }
    ];
    
    let currentWhy = description;
    for (let i = 0; i < 5 && i < whyPatterns.length; i++) {
      for (const pattern of whyPatterns) {
        if (pattern.trigger.test(currentWhy)) {
          whyChain.push(pattern.why);
          currentWhy = pattern.why;
          break;
        }
      }
    }
    
    if (whyChain.length > 1) {
      hypotheses.push({
        id: this.correlator.generateId(),
        description: `Root cause chain: ${whyChain.join(' → ')}`,
        confidence: 0.6 + (whyChain.length * 0.05),
        evidence: evidence.map(e => e.id),
        tested: false
      });
    }
    
    return hypotheses;
  }
  
  async testHypothesis(hypothesis: Hypothesis, session: DebugSession): Promise<void> {
    const logger = createSessionLogger(session.id);
    logger.info(`🧪 Testing hypothesis: ${hypothesis.description}`);
    
    // In a real implementation, this would execute specific tests
    // For now, we'll simulate testing based on evidence correlation
    const relatedEvidence = session.evidence.filter(e => 
      hypothesis.evidence.includes(e.id)
    );
    
    if (relatedEvidence.length >= hypothesis.evidence.length * 0.8) {
      hypothesis.result = 'confirmed';
      hypothesis.confidence = Math.min(hypothesis.confidence * 1.2, 1.0);
    } else if (relatedEvidence.length >= hypothesis.evidence.length * 0.5) {
      hypothesis.result = 'partial';
    } else {
      hypothesis.result = 'rejected';
      hypothesis.confidence *= 0.5;
    }
    
    hypothesis.tested = true;
    logger.info(`Hypothesis ${hypothesis.result}: ${hypothesis.description} (confidence: ${hypothesis.confidence})`);
  }
}