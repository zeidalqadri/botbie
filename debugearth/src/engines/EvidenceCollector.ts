import { Evidence, DebugSession } from '../types';
import { CorrelationContext } from '../utils/correlator';
import { createSessionLogger } from '../utils/logger';
import * as StackTrace from 'stacktrace-js';

export class EvidenceCollector {
  private correlator = CorrelationContext.getInstance();
  private originalConsole: any = {};
  private evidenceBuffer: Evidence[] = [];
  
  startCollecting(session: DebugSession): void {
    const logger = createSessionLogger(session.id);
    logger.info('🔍 Starting evidence collection...');
    
    this.interceptConsole(session);
    this.setupErrorHandlers(session);
    this.setupPerformanceMonitoring(session);
  }
  
  stopCollecting(): Evidence[] {
    this.restoreConsole();
    const collected = [...this.evidenceBuffer];
    this.evidenceBuffer = [];
    return collected;
  }
  
  private interceptConsole(session: DebugSession): void {
    const methods = ['log', 'error', 'warn', 'info', 'debug'] as const;
    
    methods.forEach(method => {
      this.originalConsole[method] = console[method];
      
      console[method] = (...args: any[]) => {
        const evidence: Evidence = {
          id: this.correlator.generateId(),
          type: 'console',
          timestamp: new Date(),
          data: {
            level: method,
            message: args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '),
            args: args
          },
          context: {
            sessionId: session.id,
            stack: new Error().stack
          }
        };
        
        this.evidenceBuffer.push(evidence);
        session.evidence.push(evidence);
        
        // Call original method
        this.originalConsole[method].apply(console, args);
      };
    });
  }
  
  private restoreConsole(): void {
    Object.keys(this.originalConsole).forEach(method => {
      (console as any)[method] = this.originalConsole[method];
    });
  }
  
  private setupErrorHandlers(session: DebugSession): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', async (event) => {
        const stackFrames = await StackTrace.fromError(event.error);
        
        const evidence: Evidence = {
          id: this.correlator.generateId(),
          type: 'stack-trace',
          timestamp: new Date(),
          data: {
            message: event.message,
            filename: event.filename,
            line: event.lineno,
            column: event.colno,
            stack: event.error?.stack,
            stackFrames: stackFrames
          },
          context: {
            sessionId: session.id,
            userAgent: navigator.userAgent,
            url: window.location.href
          }
        };
        
        this.evidenceBuffer.push(evidence);
        session.evidence.push(evidence);
      });
      
      window.addEventListener('unhandledrejection', async (event) => {
        const evidence: Evidence = {
          id: this.correlator.generateId(),
          type: 'stack-trace',
          timestamp: new Date(),
          data: {
            reason: event.reason,
            promise: event.promise
          },
          context: {
            sessionId: session.id,
            type: 'unhandled-promise-rejection'
          }
        };
        
        this.evidenceBuffer.push(evidence);
        session.evidence.push(evidence);
      });
    }
    
    if (typeof process !== 'undefined') {
      process.on('uncaughtException', async (error) => {
        const stackFrames = await StackTrace.fromError(error);
        
        const evidence: Evidence = {
          id: this.correlator.generateId(),
          type: 'stack-trace',
          timestamp: new Date(),
          data: {
            message: error.message,
            stack: error.stack,
            stackFrames: stackFrames
          },
          context: {
            sessionId: session.id,
            type: 'uncaught-exception',
            nodeVersion: process.version
          }
        };
        
        this.evidenceBuffer.push(evidence);
        session.evidence.push(evidence);
      });
      
      process.on('unhandledRejection', (reason, promise) => {
        const evidence: Evidence = {
          id: this.correlator.generateId(),
          type: 'stack-trace',
          timestamp: new Date(),
          data: {
            reason: reason,
            promise: promise
          },
          context: {
            sessionId: session.id,
            type: 'unhandled-promise-rejection'
          }
        };
        
        this.evidenceBuffer.push(evidence);
        session.evidence.push(evidence);
      });
    }
  }
  
  private setupPerformanceMonitoring(session: DebugSession): void {
    const capturePerformance = () => {
      const evidence: Evidence = {
        id: this.correlator.generateId(),
        type: 'performance',
        timestamp: new Date(),
        data: this.getPerformanceMetrics(),
        context: {
          sessionId: session.id
        }
      };
      
      this.evidenceBuffer.push(evidence);
      session.evidence.push(evidence);
    };
    
    // Capture performance data periodically
    const interval = setInterval(capturePerformance, 5000);
    
    // Store interval ID for cleanup
    (this as any).performanceInterval = interval;
  }
  
  private getPerformanceMetrics(): any {
    const metrics: any = {};
    
    if (typeof process !== 'undefined') {
      metrics.memory = process.memoryUsage();
      metrics.cpu = process.cpuUsage();
      metrics.uptime = process.uptime();
    }
    
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as any;
      if (navigation) {
        metrics.pageLoad = {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          domInteractive: navigation.domInteractive - navigation.fetchStart
        };
      }
      
      if ((performance as any).memory) {
        metrics.browserMemory = {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        };
      }
    }
    
    return metrics;
  }
  
  collectNetworkData(request: any): void {
    const evidence: Evidence = {
      id: this.correlator.generateId(),
      type: 'network',
      timestamp: new Date(),
      data: {
        url: request.url,
        method: request.method,
        status: request.status,
        duration: request.duration,
        headers: request.headers,
        body: request.body,
        response: request.response
      },
      context: {
        sessionId: (this as any).currentSessionId
      }
    };
    
    this.evidenceBuffer.push(evidence);
  }
  
  collectUIEvent(event: any): void {
    const evidence: Evidence = {
      id: this.correlator.generateId(),
      type: 'ui',
      timestamp: new Date(),
      data: {
        type: event.type,
        target: event.target,
        detail: event.detail
      },
      context: {
        sessionId: (this as any).currentSessionId
      }
    };
    
    this.evidenceBuffer.push(evidence);
  }
}