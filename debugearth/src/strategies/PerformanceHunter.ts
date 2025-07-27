import { DebugStrategy, DebugSession, DebugAttempt } from '../types';
import { createSessionLogger } from '../utils/logger';
import { CorrelationContext } from '../utils/correlator';

export class PerformanceHunter implements DebugStrategy {
  name = 'Performance Hunter';
  description = 'Tracks down performance bottlenecks and memory leaks';
  
  private correlator = CorrelationContext.getInstance();
  
  canHandle(session: DebugSession): boolean {
    // Handle sessions with performance issues or when performance data exists
    return session.evidence.some(e => e.type === 'performance') ||
           session.bugDescription.toLowerCase().includes('slow') ||
           session.bugDescription.toLowerCase().includes('performance') ||
           session.bugDescription.toLowerCase().includes('memory');
  }
  
  async execute(session: DebugSession): Promise<DebugAttempt> {
    const logger = createSessionLogger(session.id);
    logger.info(`🏹 Performance Hunter tracking down bottlenecks...`);
    
    const attemptId = this.correlator.generateId();
    const actions: string[] = [];
    
    try {
      // Analyze existing performance data
      const perfData = session.evidence.filter(e => e.type === 'performance');
      actions.push(`Analyzing ${perfData.length} performance snapshots`);
      
      // Memory analysis
      const memoryAnalysis = this.analyzeMemory(perfData);
      if (memoryAnalysis.issues.length > 0) {
        actions.push(`Found ${memoryAnalysis.issues.length} memory issues`);
      }
      
      // CPU analysis
      const cpuAnalysis = this.analyzeCPU(perfData);
      if (cpuAnalysis.issues.length > 0) {
        actions.push(`Found ${cpuAnalysis.issues.length} CPU issues`);
      }
      
      // Performance timeline
      this.createPerformanceTimeline(perfData);
      actions.push('Created performance timeline');
      
      // Add performance instrumentation
      this.addPerformanceInstrumentation(session);
      actions.push('Added performance instrumentation');
      
      // Log findings
      logger.info('🎯 Performance Hunt Results:');
      
      if (memoryAnalysis.issues.length > 0) {
        logger.info('\n💾 Memory Issues:');
        memoryAnalysis.issues.forEach((issue: any) => {
          logger.info(`  • ${issue.description} (severity: ${issue.severity})`);
        });
      }
      
      if (cpuAnalysis.issues.length > 0) {
        logger.info('\n⚡ CPU Issues:');
        cpuAnalysis.issues.forEach((issue: any) => {
          logger.info(`  • ${issue.description} (severity: ${issue.severity})`);
        });
      }
      
      // Provide optimization suggestions
      const suggestions = this.generateOptimizationSuggestions(memoryAnalysis, cpuAnalysis);
      if (suggestions.length > 0) {
        logger.info('\n💡 Optimization Suggestions:');
        suggestions.forEach((suggestion, i) => {
          logger.info(`  ${i + 1}. ${suggestion}`);
        });
      }
      
      return {
        id: attemptId,
        strategy: this.name,
        timestamp: new Date(),
        actions,
        result: `Found ${memoryAnalysis.issues.length + cpuAnalysis.issues.length} performance issues`,
        success: true
      };
      
    } catch (error) {
      logger.error(`Performance Hunter error: ${error}`);
      return {
        id: attemptId,
        strategy: this.name,
        timestamp: new Date(),
        actions,
        result: `Error during performance analysis: ${error}`,
        success: false
      };
    }
  }
  
  private analyzeMemory(perfData: any[]): any {
    const issues: any[] = [];
    const memoryTrend: number[] = [];
    
    perfData.forEach(snapshot => {
      if (snapshot.data.memory) {
        const memory = snapshot.data.memory;
        const heapUsed = memory.heapUsed;
        const heapTotal = memory.heapTotal;
        const usage = (heapUsed / heapTotal) * 100;
        
        memoryTrend.push(heapUsed);
        
        // Check for high memory usage
        if (usage > 90) {
          issues.push({
            type: 'high-memory',
            description: `Heap usage at ${usage.toFixed(1)}%`,
            severity: 'critical',
            timestamp: snapshot.timestamp
          });
        } else if (usage > 70) {
          issues.push({
            type: 'moderate-memory',
            description: `Heap usage at ${usage.toFixed(1)}%`,
            severity: 'warning',
            timestamp: snapshot.timestamp
          });
        }
      }
      
      if (snapshot.data.browserMemory) {
        const browserMem = snapshot.data.browserMemory;
        const jsHeapUsage = (browserMem.usedJSHeapSize / browserMem.jsHeapSizeLimit) * 100;
        
        if (jsHeapUsage > 90) {
          issues.push({
            type: 'browser-memory',
            description: `Browser JS heap at ${jsHeapUsage.toFixed(1)}% of limit`,
            severity: 'critical',
            timestamp: snapshot.timestamp
          });
        }
      }
    });
    
    // Check for memory leaks (continuous growth)
    if (memoryTrend.length > 3) {
      const isGrowing = memoryTrend.every((val, i) => 
        i === 0 || val > memoryTrend[i - 1]
      );
      
      if (isGrowing) {
        const growth = memoryTrend[memoryTrend.length - 1] - memoryTrend[0];
        issues.push({
          type: 'memory-leak',
          description: `Potential memory leak detected - ${(growth / 1048576).toFixed(1)}MB growth`,
          severity: 'critical'
        });
      }
    }
    
    return { issues, trend: memoryTrend };
  }
  
  private analyzeCPU(perfData: any[]): any {
    const issues: any[] = [];
    
    perfData.forEach(snapshot => {
      if (snapshot.data.cpu) {
        const cpu = snapshot.data.cpu;
        
        // High CPU usage
        if (cpu.usage > 80) {
          issues.push({
            type: 'high-cpu',
            description: `CPU usage at ${cpu.usage}%`,
            severity: 'critical',
            timestamp: snapshot.timestamp
          });
        }
      }
      
      if (snapshot.data.pageLoad) {
        const pageLoad = snapshot.data.pageLoad;
        
        // Slow page load times
        if (pageLoad.loadComplete > 3000) {
          issues.push({
            type: 'slow-load',
            description: `Page load took ${(pageLoad.loadComplete / 1000).toFixed(1)}s`,
            severity: 'warning'
          });
        }
        
        if (pageLoad.domContentLoaded > 1500) {
          issues.push({
            type: 'slow-dom',
            description: `DOM content loaded in ${(pageLoad.domContentLoaded / 1000).toFixed(1)}s`,
            severity: 'warning'
          });
        }
      }
    });
    
    return { issues };
  }
  
  private createPerformanceTimeline(perfData: any[]): any[] {
    return perfData
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map(snapshot => {
        const summary: any = {
          time: snapshot.timestamp,
          metrics: {}
        };
        
        if (snapshot.data.memory) {
          summary.metrics.heapUsed = (snapshot.data.memory.heapUsed / 1048576).toFixed(1) + 'MB';
        }
        
        if (snapshot.data.cpu) {
          summary.metrics.cpu = snapshot.data.cpu.usage + '%';
        }
        
        return summary;
      });
  }
  
  private addPerformanceInstrumentation(session: DebugSession): void {
    // Add performance marks
    if (typeof window !== 'undefined' && window.performance) {
      // Monkey patch common async methods
      this.instrumentPromises(session);
      this.instrumentTimers(session);
      this.instrumentFetch(session);
    }
    
    if (typeof process !== 'undefined') {
      this.instrumentNodePerformance(session);
    }
  }
  
  private instrumentPromises(session: DebugSession): void {
    const originalThen = Promise.prototype.then;
    const self = this;
    
    (Promise.prototype as any).then = function(this: any, onFulfilled: any, onRejected: any) {
      const startTime = performance.now();
      const promiseId = self.correlator.generateId();
      
      return originalThen.call(this as any, 
        function(value: any) {
          const duration = performance.now() - startTime;
          if (duration > 100) {
            session.evidence.push({
              id: self.correlator.generateId(),
              type: 'performance',
              timestamp: new Date(),
              data: {
                type: 'slow-promise',
                duration,
                promiseId
              },
              context: { sessionId: session.id }
            });
          }
          return onFulfilled ? onFulfilled(value) : value;
        },
        onRejected
      );
    } as any;
  }
  
  private instrumentTimers(session: DebugSession): void {
    const originalSetTimeout = window.setTimeout;
    const self = this;
    
    (window as any).setTimeout = function(callback: any, delay: number, ...args: any[]) {
      const timerId = self.correlator.generateId();
      
      if (delay > 5000) {
        session.evidence.push({
          id: self.correlator.generateId(),
          type: 'performance',
          timestamp: new Date(),
          data: {
            type: 'long-timer',
            delay,
            timerId
          },
          context: { sessionId: session.id }
        });
      }
      
      return originalSetTimeout(callback, delay, ...args);
    };
  }
  
  private instrumentFetch(session: DebugSession): void {
    if (typeof window !== 'undefined' && window.fetch) {
      const originalFetch = window.fetch;
      const self = this;
      
      window.fetch = async function(...args) {
        const startTime = performance.now();
        const requestId = self.correlator.generateId();
        
        try {
          const response = await originalFetch.apply(this, args);
          const duration = performance.now() - startTime;
          
          if (duration > 1000) {
            session.evidence.push({
              id: self.correlator.generateId(),
              type: 'performance',
              timestamp: new Date(),
              data: {
                type: 'slow-request',
                url: args[0],
                duration,
                requestId
              },
              context: { sessionId: session.id }
            });
          }
          
          return response;
        } catch (error) {
          throw error;
        }
      };
    }
  }
  
  private instrumentNodePerformance(session: DebugSession): void {
    // Monitor event loop lag
    let lastCheck = Date.now();
    
    setInterval(() => {
      const now = Date.now();
      const lag = now - lastCheck - 1000;
      
      if (lag > 50) {
        session.evidence.push({
          id: this.correlator.generateId(),
          type: 'performance',
          timestamp: new Date(),
          data: {
            type: 'event-loop-lag',
            lag
          },
          context: { sessionId: session.id }
        });
      }
      
      lastCheck = now;
    }, 1000);
  }
  
  private generateOptimizationSuggestions(memoryAnalysis: any, cpuAnalysis: any): string[] {
    const suggestions: string[] = [];
    
    // Memory optimization suggestions
    memoryAnalysis.issues.forEach((issue: any) => {
      if (issue.type === 'memory-leak') {
        suggestions.push('Check for event listeners not being removed');
        suggestions.push('Ensure large objects are dereferenced when no longer needed');
        suggestions.push('Use WeakMap/WeakSet for object references where appropriate');
      } else if (issue.type === 'high-memory') {
        suggestions.push('Implement pagination or virtual scrolling for large lists');
        suggestions.push('Lazy load images and other media resources');
        suggestions.push('Consider using object pooling for frequently created objects');
      }
    });
    
    // CPU optimization suggestions
    cpuAnalysis.issues.forEach((issue: any) => {
      if (issue.type === 'high-cpu') {
        suggestions.push('Profile code to identify hot functions');
        suggestions.push('Use Web Workers for CPU-intensive operations');
        suggestions.push('Implement debouncing/throttling for frequent operations');
      } else if (issue.type === 'slow-load') {
        suggestions.push('Enable code splitting and lazy loading');
        suggestions.push('Optimize bundle size by removing unused dependencies');
        suggestions.push('Use a CDN for static assets');
      }
    });
    
    // Remove duplicates
    return [...new Set(suggestions)];
  }
}