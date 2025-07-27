import { v4 as uuidv4 } from 'uuid';

export class CorrelationContext {
  private static instance: CorrelationContext;
  private correlations: Map<string, Set<string>> = new Map();
  
  static getInstance(): CorrelationContext {
    if (!CorrelationContext.instance) {
      CorrelationContext.instance = new CorrelationContext();
    }
    return CorrelationContext.instance;
  }
  
  generateId(): string {
    return uuidv4();
  }
  
  correlate(id1: string, id2: string): void {
    if (!this.correlations.has(id1)) {
      this.correlations.set(id1, new Set());
    }
    if (!this.correlations.has(id2)) {
      this.correlations.set(id2, new Set());
    }
    
    this.correlations.get(id1)!.add(id2);
    this.correlations.get(id2)!.add(id1);
  }
  
  getCorrelated(id: string): string[] {
    return Array.from(this.correlations.get(id) || []);
  }
  
  clear(): void {
    this.correlations.clear();
  }
}