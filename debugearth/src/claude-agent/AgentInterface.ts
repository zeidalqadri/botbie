import { DebugEarth } from '../DebugEarth';
import { DebugSession, Evidence, RootCause } from '../types';

export interface DebugContext {
  sessionId?: string;
  currentHypothesis?: string;
  evidenceCount: number;
  lastAction?: string;
}

export class DebugEarthAgent {
  private debugEarth: DebugEarth;
  private context: DebugContext;
  
  constructor(debugEarth: DebugEarth) {
    this.debugEarth = debugEarth;
    this.context = {
      evidenceCount: 0
    };
  }
  
  async startInvestigation(bugDescription: string): Promise<{
    sessionId: string;
    guidance: string;
    nextSteps: string[];
  }> {
    const session = await this.debugEarth.startDebugging(bugDescription);
    this.context.sessionId = session.id;
    
    return {
      sessionId: session.id,
      guidance: this.getInitialGuidance(bugDescription),
      nextSteps: this.suggestNextSteps(session)
    };
  }
  
  async addClue(type: Evidence['type'], data: any): Promise<{
    accepted: boolean;
    interpretation: string;
    newHypotheses?: string[];
  }> {
    if (!this.context.sessionId) {
      throw new Error('No active debug session. Start an investigation first.');
    }
    
    await this.debugEarth.addEvidence(this.context.sessionId, type, data);
    this.context.evidenceCount++;
    
    const session = this.debugEarth.getSession(this.context.sessionId);
    const interpretation = this.interpretEvidence(type, data);
    
    return {
      accepted: true,
      interpretation,
      newHypotheses: session?.hypotheses.slice(-2).map(h => h.description)
    };
  }
  
  async solve(): Promise<{
    solved: boolean;
    rootCause?: RootCause;
    explanation?: string;
    nextSteps?: string[];
  }> {
    if (!this.context.sessionId) {
      throw new Error('No active debug session');
    }
    
    const rootCause = await this.debugEarth.analyze(this.context.sessionId);
    
    if (rootCause) {
      return {
        solved: true,
        rootCause,
        explanation: this.explainRootCause(rootCause)
      };
    }
    
    const session = this.debugEarth.getSession(this.context.sessionId);
    return {
      solved: false,
      nextSteps: this.suggestNextSteps(session!)
    };
  }
  
  private getInitialGuidance(bugDescription: string): string {
    const bugType = this.categorizeBug(bugDescription);
    
    const guidance: Record<string, string> = {
      'error': 'I detect an error-related issue. Please provide the full error message and stack trace.',
      'performance': 'This seems like a performance issue. Let me help you track down the bottleneck.',
      'ui': 'UI bugs can be tricky. Can you describe what you see vs. what you expect?',
      'async': 'Async issues often hide in timing. When does this occur - immediately or after some action?',
      'default': 'Let\'s dig into this systematically. Can you provide any error messages or unusual behavior you\'ve noticed?'
    };
    
    return guidance[bugType] || guidance.default;
  }
  
  private categorizeBug(description: string): string {
    const lower = description.toLowerCase();
    
    if (lower.includes('error') || lower.includes('exception') || lower.includes('crash')) {
      return 'error';
    }
    if (lower.includes('slow') || lower.includes('performance') || lower.includes('memory')) {
      return 'performance';
    }
    if (lower.includes('ui') || lower.includes('display') || lower.includes('render')) {
      return 'ui';
    }
    if (lower.includes('async') || lower.includes('promise') || lower.includes('callback')) {
      return 'async';
    }
    
    return 'default';
  }
  
  private interpretEvidence(type: Evidence['type'], data: any): string {
    switch (type) {
      case 'stack-trace':
        const errorType = data.message?.match(/^(\w+Error):/)?.[1] || 'Error';
        return `I see a ${errorType}. The stack trace points to ${data.stack?.split('\\n')[1]?.trim() || 'unknown location'}.`;
        
      case 'console':
        if (data.level === 'error') {
          return `Error logged: "${data.message}". This is a critical clue.`;
        }
        return `Console ${data.level}: "${data.message}". Added to evidence.`;
        
      case 'performance':
        if (data.memoryUsage && data.memoryUsage > 100 * 1024 * 1024) {
          return 'High memory usage detected! Possible memory leak.';
        }
        return 'Performance metrics recorded. Analyzing patterns...';
        
      default:
        return `${type} evidence recorded. Building the puzzle...`;
    }
  }
  
  private suggestNextSteps(session: DebugSession): string[] {
    const steps: string[] = [];
    const hasStackTrace = session.evidence.some(e => e.type === 'stack-trace');
    const hasConsoleLog = session.evidence.some(e => e.type === 'console');
    const hasPerformanceData = session.evidence.some(e => e.type === 'performance');
    
    if (!hasStackTrace && session.bugDescription.toLowerCase().includes('error')) {
      steps.push('Provide the full error message and stack trace');
    }
    
    if (!hasConsoleLog) {
      steps.push('Check browser/application console for any warnings or errors');
    }
    
    if (!hasPerformanceData && session.bugDescription.match(/slow|performance|memory/i)) {
      steps.push('Run performance profiler to gather metrics');
    }
    
    if (session.evidence.length < 3) {
      steps.push('Reproduce the issue while I\'m monitoring');
      steps.push('Describe the exact steps that trigger the bug');
    }
    
    if (session.evidence.length > 5 && !session.rootCause) {
      steps.push('Let me analyze the evidence we\'ve gathered');
    }
    
    return steps.slice(0, 3);
  }
  
  private explainRootCause(rootCause: RootCause): string {
    const confidence = Math.round(rootCause.confidence * 100);
    let explanation = `With ${confidence}% confidence, I've found the root cause:\\n\\n`;
    
    explanation += `**Problem**: ${rootCause.description}\\n\\n`;
    
    explanation += `**Why it happens**:\\n${rootCause.explanation}\\n\\n`;
    
    explanation += `**Proof**:\\n`;
    rootCause.proofChain.forEach((proof, i) => {
      explanation += `${i + 1}. ${proof}\\n`;
    });
    
    explanation += `\\n**Fix**: ${rootCause.solution}`;
    
    return explanation;
  }
}