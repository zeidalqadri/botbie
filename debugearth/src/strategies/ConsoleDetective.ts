import { DebugStrategy, DebugSession, DebugAttempt, Evidence } from '../types';
import { createSessionLogger } from '../utils/logger';
import { CorrelationContext } from '../utils/correlator';

export class ConsoleDetective implements DebugStrategy {
  name = 'Console Detective';
  description = 'Strategic console logging to trace execution flow and variable states';
  
  private correlator = CorrelationContext.getInstance();
  
  canHandle(_session: DebugSession): boolean {
    // This strategy can handle most debugging scenarios
    return true;
  }
  
  async execute(session: DebugSession): Promise<DebugAttempt> {
    const logger = createSessionLogger(session.id);
    logger.info(`🕵️ Console Detective on the case!`);
    
    const attemptId = this.correlator.generateId();
    const actions: string[] = [];
    
    try {
      // Analyze existing console logs
      const consoleLogs = session.evidence.filter(e => e.type === 'console');
      actions.push(`Analyzed ${consoleLogs.length} existing console logs`);
      
      // Identify critical execution points
      const criticalPoints = this.identifyCriticalPoints(session);
      actions.push(`Identified ${criticalPoints.length} critical execution points`);
      
      // Generate strategic logging recommendations
      this.generateLoggingStrategy(criticalPoints, session);
      actions.push('Generated strategic logging recommendations');
      
      // Create enhanced console methods
      this.enhanceConsoleLogging(session);
      actions.push('Enhanced console logging with context tracking');
      
      // Log analysis insights
      const insights = this.analyzeLogPatterns(consoleLogs);
      if (insights.length > 0) {
        logger.info('📋 Console Analysis Insights:');
        insights.forEach(insight => {
          logger.info(`  • ${insight}`);
          actions.push(`Insight: ${insight}`);
        });
      }
      
      return {
        id: attemptId,
        strategy: this.name,
        timestamp: new Date(),
        actions,
        result: `Completed console analysis with ${insights.length} insights`,
        success: true
      };
      
    } catch (error) {
      logger.error(`Console Detective encountered an error: ${error}`);
      return {
        id: attemptId,
        strategy: this.name,
        timestamp: new Date(),
        actions,
        result: `Error during console analysis: ${error}`,
        success: false
      };
    }
  }
  
  private identifyCriticalPoints(session: DebugSession): string[] {
    const criticalPoints: string[] = [];
    
    // Analyze stack traces for function names
    const stackTraces = session.evidence.filter(e => e.type === 'stack-trace');
    stackTraces.forEach(trace => {
      if (trace.data.stackFrames) {
        trace.data.stackFrames.forEach((frame: any) => {
          if (frame.functionName && !criticalPoints.includes(frame.functionName)) {
            criticalPoints.push(frame.functionName);
          }
        });
      }
    });
    
    // Add common critical points
    const commonPoints = [
      'API calls',
      'State changes',
      'Event handlers',
      'Async operations',
      'Loop iterations',
      'Conditional branches'
    ];
    
    return [...criticalPoints, ...commonPoints];
  }
  
  private generateLoggingStrategy(_criticalPoints: string[], session: DebugSession): string[] {
    const strategy: string[] = [];
    const logger = createSessionLogger(session.id);
    
    logger.info('📝 Strategic Logging Recommendations:');
    
    // Function entry/exit logging
    strategy.push('Add console.group() at function entry and console.groupEnd() at exit');
    logger.info('  1. Wrap functions with console.group(functionName) for better trace visibility');
    
    // Variable state logging
    strategy.push('Log variable states before and after modifications');
    logger.info('  2. Use console.table() for objects and arrays to visualize data structures');
    
    // Async operation tracking
    strategy.push('Track async operations with correlation IDs');
    logger.info('  3. Add unique IDs to async operations: console.log(`[${correlationId}] Starting async op`)');
    
    // Performance timing
    strategy.push('Use console.time() and console.timeEnd() for performance analysis');
    logger.info('  4. Measure execution time of suspected slow operations');
    
    // Conditional logging
    strategy.push('Implement conditional logging based on debug levels');
    logger.info('  5. Use console.assert() for validation: console.assert(condition, "Error message")');
    
    return strategy;
  }
  
  private enhanceConsoleLogging(session: DebugSession): void {
    // Add correlation tracking to console
    const enhancedLog = (level: string) => (...args: any[]) => {
      const correlationId = this.correlator.generateId();
      const stack = new Error().stack?.split('\n')[3]?.trim() || 'unknown';
      
      // Create enhanced log entry
      const evidence: Evidence = {
        id: correlationId,
        type: 'console',
        timestamp: new Date(),
        data: {
          level,
          args,
          enhanced: true,
          callSite: stack
        },
        context: {
          sessionId: session.id
        }
      };
      
      session.evidence.push(evidence);
    };
    
    // Store reference to enhanced methods
    (global as any).__debugEarth = {
      log: enhancedLog('log'),
      error: enhancedLog('error'),
      warn: enhancedLog('warn'),
      info: enhancedLog('info'),
      debug: enhancedLog('debug'),
      trace: (...args: any[]) => {
        console.trace(...args);
        enhancedLog('trace')(...args);
      }
    };
  }
  
  private analyzeLogPatterns(logs: Evidence[]): string[] {
    const insights: string[] = [];
    
    // Analyze log frequency
    const logFrequency: Record<string, number> = {};
    logs.forEach(log => {
      const key = JSON.stringify(log.data.args);
      logFrequency[key] = (logFrequency[key] || 0) + 1;
    });
    
    // Find repeated logs (possible loops)
    Object.entries(logFrequency).forEach(([log, count]) => {
      if (count > 10) {
        insights.push(`Repeated log detected ${count} times - possible loop: ${log.substring(0, 50)}...`);
      }
    });
    
    // Analyze log timing
    if (logs.length > 1) {
      const timeDiffs = logs.slice(1).map((log, i) => 
        log.timestamp.getTime() - logs[i].timestamp.getTime()
      );
      
      const avgTimeDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
      if (avgTimeDiff < 10) {
        insights.push('Rapid logging detected - possible tight loop or performance issue');
      }
    }
    
    // Look for error patterns
    const errorLogs = logs.filter(log => 
      log.data.level === 'error' || 
      (log.data.message && log.data.message.toLowerCase().includes('error'))
    );
    
    if (errorLogs.length > 0) {
      insights.push(`Found ${errorLogs.length} error logs - check error handling`);
    }
    
    // Detect missing logs in sequences
    const numbers = logs
      .map(log => {
        const match = JSON.stringify(log.data).match(/\d+/);
        return match ? parseInt(match[0]) : null;
      })
      .filter(n => n !== null) as number[];
    
    if (numbers.length > 2) {
      const sorted = [...numbers].sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] - sorted[i-1] > 1) {
          insights.push(`Possible missing logs in sequence between ${sorted[i-1]} and ${sorted[i]}`);
        }
      }
    }
    
    return insights;
  }
}