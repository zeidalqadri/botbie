import { DebugStrategy, DebugSession, DebugAttempt, Evidence } from '../types';
import { createSessionLogger } from '../utils/logger';
import { CorrelationContext } from '../utils/correlator';
import * as StackTrace from 'stacktrace-js';

export class StackArchaeologist implements DebugStrategy {
  name = 'Stack Archaeologist';
  description = 'Deep analysis of stack traces to uncover hidden bug origins';
  
  private correlator = CorrelationContext.getInstance();
  
  canHandle(session: DebugSession): boolean {
    // Handle sessions with stack trace evidence
    return session.evidence.some(e => e.type === 'stack-trace');
  }
  
  async execute(session: DebugSession): Promise<DebugAttempt> {
    const logger = createSessionLogger(session.id);
    logger.info(`🏺 Stack Archaeologist excavating error layers...`);
    
    const attemptId = this.correlator.generateId();
    const actions: string[] = [];
    
    try {
      // Get all stack traces
      const stackTraces = session.evidence.filter(e => e.type === 'stack-trace');
      actions.push(`Found ${stackTraces.length} stack traces to analyze`);
      
      // Analyze each stack trace
      await Promise.all(
        stackTraces.map(trace => this.analyzeStackTrace(trace, session))
      );
      
      // Find patterns across stack traces
      const patterns = this.findStackPatterns(stackTraces);
      actions.push(`Identified ${patterns.length} patterns across stack traces`);
      
      // Create stack trace timeline
      this.createErrorTimeline(stackTraces);
      actions.push('Created error occurrence timeline');
      
      // Identify error propagation chain
      const propagationChain = this.tracePropagation(stackTraces);
      if (propagationChain.length > 0) {
        actions.push(`Traced error propagation through ${propagationChain.length} functions`);
      }
      
      // Log findings
      logger.info('🗿 Archaeological Findings:');
      
      if (patterns.length > 0) {
        logger.info('\n📊 Common Patterns:');
        patterns.forEach(pattern => {
          logger.info(`  • ${pattern.description} (${pattern.occurrences} times)`);
        });
      }
      
      if (propagationChain.length > 0) {
        logger.info('\n🔗 Error Propagation Chain:');
        propagationChain.forEach((link, i) => {
          logger.info(`  ${i + 1}. ${link}`);
        });
      }
      
      // Analyze source maps if available
      const sourceMappedFrames = await this.enhanceWithSourceMaps(stackTraces);
      if (sourceMappedFrames.length > 0) {
        actions.push('Enhanced stack traces with source maps');
      }
      
      return {
        id: attemptId,
        strategy: this.name,
        timestamp: new Date(),
        actions,
        result: `Analyzed ${stackTraces.length} stack traces, found ${patterns.length} patterns`,
        success: true
      };
      
    } catch (error) {
      logger.error(`Stack Archaeologist error: ${error}`);
      return {
        id: attemptId,
        strategy: this.name,
        timestamp: new Date(),
        actions,
        result: `Error during stack analysis: ${error}`,
        success: false
      };
    }
  }
  
  private async analyzeStackTrace(trace: Evidence, _session: DebugSession): Promise<any> {
    const analysis: any = {
      id: trace.id,
      errorType: this.extractErrorType(trace),
      topFrame: this.extractTopFrame(trace),
      depth: this.getStackDepth(trace),
      libraries: this.extractLibraries(trace),
      userCode: this.extractUserCode(trace)
    };
    
    // Check for async boundaries
    if (this.hasAsyncBoundary(trace)) {
      (analysis as any).asyncBoundary = true;
    }
    
    return analysis;
  }
  
  private extractErrorType(trace: Evidence): string {
    const data = trace.data;
    
    if (data.message) {
      // Extract error type from message
      const typeMatch = data.message.match(/^(\w+Error):/);
      if (typeMatch) {
        return typeMatch[1];
      }
    }
    
    if (data.stack) {
      const stackTypeMatch = data.stack.match(/^(\w+Error):/);
      if (stackTypeMatch) {
        return stackTypeMatch[1];
      }
    }
    
    return 'UnknownError';
  }
  
  private extractTopFrame(trace: Evidence): any {
    if (trace.data.stackFrames && trace.data.stackFrames.length > 0) {
      return trace.data.stackFrames[0];
    }
    
    if (trace.data.stack) {
      const lines = trace.data.stack.split('\n');
      if (lines.length > 1) {
        return this.parseStackLine(lines[1]);
      }
    }
    
    return null;
  }
  
  private parseStackLine(line: string): any {
    const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
    if (match) {
      return {
        functionName: match[1],
        fileName: match[2],
        lineNumber: parseInt(match[3]),
        columnNumber: parseInt(match[4])
      };
    }
    return null;
  }
  
  private getStackDepth(trace: Evidence): number {
    if (trace.data.stackFrames) {
      return trace.data.stackFrames.length;
    }
    
    if (trace.data.stack) {
      return trace.data.stack.split('\n').length - 1;
    }
    
    return 0;
  }
  
  private extractLibraries(trace: Evidence): string[] {
    const libraries = new Set<string>();
    const nodeModulesPattern = /node_modules[\/\\]([^\/\\]+)/;
    
    const processFrame = (frame: any) => {
      if (frame.fileName) {
        const match = frame.fileName.match(nodeModulesPattern);
        if (match) {
          libraries.add(match[1]);
        }
      }
    };
    
    if (trace.data.stackFrames) {
      trace.data.stackFrames.forEach(processFrame);
    }
    
    if (trace.data.stack) {
      const lines = trace.data.stack.split('\n');
      lines.forEach((line: string) => {
        const match = line.match(nodeModulesPattern);
        if (match) {
          libraries.add(match[1]);
        }
      });
    }
    
    return Array.from(libraries);
  }
  
  private extractUserCode(trace: Evidence): any[] {
    const userFrames: any[] = [];
    
    const isUserCode = (fileName: string) => {
      return fileName && 
             !fileName.includes('node_modules') &&
             !fileName.startsWith('internal/') &&
             !fileName.includes('<anonymous>');
    };
    
    if (trace.data.stackFrames) {
      userFrames.push(...trace.data.stackFrames.filter((f: any) => 
        isUserCode(f.fileName)
      ));
    }
    
    return userFrames;
  }
  
  private hasAsyncBoundary(trace: Evidence): boolean {
    const asyncKeywords = ['async', 'await', 'Promise', 'then', 'catch', 'finally'];
    const stack = trace.data.stack || '';
    
    return asyncKeywords.some(keyword => stack.includes(keyword));
  }
  
  private findStackPatterns(traces: Evidence[]): any[] {
    const patterns: any[] = [];
    const functionCounts: Record<string, number> = {};
    const errorPairs: Record<string, number> = {};
    
    traces.forEach(trace => {
      // Count function occurrences
      if (trace.data.stackFrames) {
        trace.data.stackFrames.forEach((frame: any) => {
          if (frame.functionName) {
            functionCounts[frame.functionName] = (functionCounts[frame.functionName] || 0) + 1;
          }
        });
      }
      
      // Track error type pairs
      const errorType = this.extractErrorType(trace);
      const topFrame = this.extractTopFrame(trace);
      if (topFrame && topFrame.functionName) {
        const pair = `${errorType} in ${topFrame.functionName}`;
        errorPairs[pair] = (errorPairs[pair] || 0) + 1;
      }
    });
    
    // Identify recurring functions
    Object.entries(functionCounts).forEach(([func, count]) => {
      if (count > 1) {
        patterns.push({
          type: 'recurring-function',
          description: `Function "${func}" appears in multiple stack traces`,
          occurrences: count
        });
      }
    });
    
    // Identify recurring error patterns
    Object.entries(errorPairs).forEach(([pair, count]) => {
      if (count > 1) {
        patterns.push({
          type: 'recurring-error',
          description: pair,
          occurrences: count
        });
      }
    });
    
    return patterns.sort((a, b) => b.occurrences - a.occurrences);
  }
  
  private createErrorTimeline(traces: Evidence[]): any[] {
    return traces
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map(trace => ({
        time: trace.timestamp,
        type: this.extractErrorType(trace),
        location: this.extractTopFrame(trace)?.functionName || 'unknown'
      }));
  }
  
  private tracePropagation(traces: Evidence[]): string[] {
    const propagation: string[] = [];
    
    // Sort by timestamp
    const sortedTraces = traces.sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
    
    // Look for function calls that appear in multiple stack traces
    const functionChain = new Map<string, Set<string>>();
    
    sortedTraces.forEach(trace => {
      if (trace.data.stackFrames) {
        for (let i = 0; i < trace.data.stackFrames.length - 1; i++) {
          const caller = trace.data.stackFrames[i + 1]?.functionName;
          const callee = trace.data.stackFrames[i]?.functionName;
          
          if (caller && callee) {
            if (!functionChain.has(caller)) {
              functionChain.set(caller, new Set());
            }
            functionChain.get(caller)!.add(callee);
          }
        }
      }
    });
    
    // Build propagation description
    functionChain.forEach((callees, caller) => {
      if (callees.size > 0) {
        propagation.push(`${caller} → ${Array.from(callees).join(', ')}`);
      }
    });
    
    return propagation;
  }
  
  private async enhanceWithSourceMaps(traces: Evidence[]): Promise<any[]> {
    const enhanced: any[] = [];
    
    for (const trace of traces) {
      if (trace.data.stackFrames) {
        try {
          // StackTrace.js can enhance frames with source maps
          const enhancedFrames = await StackTrace.fromError({
            stack: trace.data.stack,
            message: trace.data.message
          } as any);
          
          enhanced.push({
            original: trace,
            enhanced: enhancedFrames
          });
        } catch (error) {
          // Source map enhancement failed, continue with original
        }
      }
    }
    
    return enhanced;
  }
}