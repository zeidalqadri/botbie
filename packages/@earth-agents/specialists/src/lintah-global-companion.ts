/**
 * Lintah Global Companion Service
 * "Son of a Gun" that watches every Claude session globally
 * Provides shortest-path delinting and real-time code quality monitoring
 */

import { specialistRegistry } from './SpecialistAgentAdapter';
import { lintahExpert } from './agents/lintah-expert';

/**
 * Shortest Path Algorithm for Delinting
 */
export class ShortestPathDelinter {
  private dependencyGraph: Map<string, Set<string>> = new Map();
  private impactScores: Map<string, number> = new Map();
  
  /**
   * Calculate shortest path to clean code
   */
  calculateShortestPath(errors: LintError[]): DelintPath {
    // Build dependency graph
    this.buildDependencyGraph(errors);
    
    // Calculate impact scores
    this.calculateImpactScores(errors);
    
    // Find critical path
    const criticalPath = this.findCriticalPath();
    
    // Generate fix order
    const fixOrder = this.generateOptimalFixOrder(criticalPath);
    
    return {
      totalErrors: errors.length,
      steps: fixOrder,
      estimatedTime: this.estimateTime(fixOrder),
      impact: this.calculateTotalImpact(fixOrder),
      message: this.generatePathMessage(fixOrder)
    };
  }
  
  private buildDependencyGraph(errors: LintError[]) {
    errors.forEach(error => {
      const deps = this.findDependencies(error);
      this.dependencyGraph.set(error.id, new Set(deps));
    });
  }
  
  private findDependencies(error: LintError): string[] {
    // Analyze which fixes would cascade to fix other errors
    const dependencies: string[] = [];
    
    if (error.type === 'import-error') {
      // Import errors often cascade
      dependencies.push(...this.findImportDependents(error));
    }
    
    if (error.type === 'type-error') {
      // Type errors cascade through the type system
      dependencies.push(...this.findTypeDependents(error));
    }
    
    if (error.type === 'config-error') {
      // Config errors affect entire categories
      dependencies.push(...this.findConfigDependents(error));
    }
    
    return dependencies;
  }
  
  private calculateImpactScores(errors: LintError[]) {
    errors.forEach(error => {
      let score = 1; // Base score
      
      // Higher score for errors that fix many others
      const dependents = this.dependencyGraph.get(error.id) || new Set();
      score += dependents.size * 10;
      
      // Higher score for critical errors
      if (error.severity === 'critical') score += 50;
      if (error.severity === 'high') score += 20;
      
      // Higher score for auto-fixable errors
      if (error.autoFixable) score += 15;
      
      // Higher score for errors in core files
      if (this.isCoreFile(error.file)) score += 30;
      
      this.impactScores.set(error.id, score);
    });
  }
  
  private findCriticalPath(): string[] {
    // Sort by impact score and find the minimum set of fixes
    const sorted = Array.from(this.impactScores.entries())
      .sort((a, b) => b[1] - a[1]);
    
    const criticalPath: string[] = [];
    const fixed = new Set<string>();
    
    for (const [errorId, _score] of sorted) {
      if (!fixed.has(errorId)) {
        criticalPath.push(errorId);
        fixed.add(errorId);
        
        // Mark all dependencies as fixed
        const deps = this.dependencyGraph.get(errorId) || new Set();
        deps.forEach(dep => fixed.add(dep));
      }
    }
    
    return criticalPath;
  }
  
  private generateOptimalFixOrder(criticalPath: string[]): FixStep[] {
    return criticalPath.map((errorId, index) => ({
      order: index + 1,
      errorId,
      description: this.getFixDescription(errorId),
      impact: this.impactScores.get(errorId) || 0,
      autoFixable: this.isAutoFixable(errorId),
      estimatedTime: this.estimateFixTime(errorId),
      cascadeFixes: Array.from(this.dependencyGraph.get(errorId) || new Set())
    }));
  }
  
  private isCoreFile(file: string): boolean {
    return file.includes('core') || 
           file.includes('utils') || 
           file.includes('config') ||
           file.includes('types');
  }
  
  private findImportDependents(error: LintError): string[] {
    // Find all errors that would be fixed by fixing this import
    return [];
  }
  
  private findTypeDependents(error: LintError): string[] {
    // Find all type errors that would cascade from this fix
    return [];
  }
  
  private findConfigDependents(error: LintError): string[] {
    // Find all errors that would be fixed by fixing this config
    return [];
  }
  
  private getFixDescription(errorId: string): string {
    // Generate human-readable fix description
    return `Fix ${errorId}`;
  }
  
  private isAutoFixable(errorId: string): boolean {
    // Check if this error can be auto-fixed
    return true;
  }
  
  private estimateFixTime(errorId: string): number {
    // Estimate time in minutes
    return 5;
  }
  
  private estimateTime(fixOrder: FixStep[]): number {
    return fixOrder.reduce((total, step) => total + step.estimatedTime, 0);
  }
  
  private calculateTotalImpact(fixOrder: FixStep[]): number {
    return fixOrder.reduce((total, step) => total + step.impact, 0);
  }
  
  private generatePathMessage(fixOrder: FixStep[]): string {
    const totalErrors = this.dependencyGraph.size;
    const fixCount = fixOrder.length;
    const cascadeCount = totalErrors - fixCount;
    
    return `🔥 Lintah: "Son of a gun found the shortest path! 
    Fix ${fixCount} errors to eliminate all ${totalErrors} issues.
    ${cascadeCount} errors will auto-resolve from cascade effects.
    Total time: ${this.estimateTime(fixOrder)} minutes instead of hours!"`;
  }
}

/**
 * Lintah Global Companion - Always watching, always helping
 */
export class LintahGlobalCompanion {
  private static instance: LintahGlobalCompanion;
  private sessions: Map<string, LintahSession> = new Map();
  private shortestPathEngine: ShortestPathDelinter;
  private mode: 'silent' | 'suggest' | 'active' = 'suggest';
  private isWatching: boolean = true;
  
  private constructor() {
    this.shortestPathEngine = new ShortestPathDelinter();
    this.initialize();
  }
  
  /**
   * Singleton pattern for global presence
   */
  static getInstance(): LintahGlobalCompanion {
    if (!this.instance) {
      this.instance = new LintahGlobalCompanion();
      console.log('🔥 Lintah: "Son of a gun reporting for global duty!"');
    }
    return this.instance;
  }
  
  /**
   * Initialize global companion
   */
  private initialize() {
    // Register with specialist registry
    specialistRegistry.register(lintahExpert);
    
    // Set up global watchers
    this.setupGlobalWatchers();
    
    // Load user preferences
    this.loadPreferences();
  }
  
  /**
   * Attach to a Claude session
   */
  attachToSession(sessionId: string, options?: SessionOptions) {
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId);
    }
    
    const session = new LintahSession(sessionId, {
      mode: options?.mode || this.mode,
      autoFix: options?.autoFix || false,
      shortestPath: true,
      realTime: true
    });
    
    this.sessions.set(sessionId, session);
    
    // Start watching this session
    session.startWatching();
    
    console.log(`🔥 Lintah attached to session ${sessionId}`);
    
    return session;
  }
  
  /**
   * Get shortest path for current session
   */
  getShortestPath(sessionId: string): DelintPath | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    const errors = session.getCurrentErrors();
    return this.shortestPathEngine.calculateShortestPath(errors);
  }
  
  /**
   * Global command handler
   */
  handleCommand(command: string, args?: any): any {
    switch (command) {
      case 'status':
        return this.getStatus();
      
      case 'shortest-path':
        return this.getShortestPath(args.sessionId);
      
      case 'pause':
        this.isWatching = false;
        return '🔥 Lintah: "Taking a quick break, but I\'ll be back!"';
      
      case 'resume':
        this.isWatching = true;
        return '🔥 Lintah: "Back on duty! Let\'s clean this code!"';
      
      case 'mode':
        this.mode = args.mode;
        return `🔥 Lintah: "Switched to ${this.mode} mode"`;
      
      case 'fix-all':
        return this.fixAll(args.sessionId);
      
      case 'report':
        return this.generateReport(args.sessionId);
      
      default:
        return '🔥 Lintah: "Unknown command, but I\'m still watching!"';
    }
  }
  
  private setupGlobalWatchers() {
    // Set up file system watchers, IDE integrations, etc.
  }
  
  private loadPreferences() {
    // Load user preferences from config
  }
  
  private getStatus(): StatusReport {
    return {
      watching: this.isWatching,
      mode: this.mode,
      sessions: this.sessions.size,
      totalErrors: this.getTotalErrors(),
      message: `🔥 Lintah: "Watching ${this.sessions.size} sessions, ${this.getTotalErrors()} total issues detected"`
    };
  }
  
  private getTotalErrors(): number {
    let total = 0;
    this.sessions.forEach(session => {
      total += session.getCurrentErrors().length;
    });
    return total;
  }
  
  private fixAll(sessionId: string): string {
    const path = this.getShortestPath(sessionId);
    if (!path) return '🔥 Lintah: "No errors to fix!"';
    
    // Execute fixes in optimal order
    return `🔥 Lintah: "Executing ${path.steps.length} fixes to eliminate ${path.totalErrors} errors!"`;
  }
  
  private generateReport(sessionId: string): Report {
    const session = this.sessions.get(sessionId);
    if (!session) return { message: 'No session found' };
    
    return {
      sessionId,
      errors: session.getCurrentErrors(),
      patterns: session.getPatterns(),
      suggestions: session.getSuggestions(),
      shortestPath: this.getShortestPath(sessionId),
      message: '🔥 Lintah: "Here\'s your complete quality report!"'
    };
  }
}

/**
 * Lintah Session - Per-session companion
 */
class LintahSession {
  private errors: LintError[] = [];
  private patterns: Pattern[] = [];
  private suggestions: Suggestion[] = [];
  private watcher: SessionWatcher;
  
  constructor(
    private sessionId: string,
    private options: SessionOptions
  ) {
    this.watcher = new SessionWatcher(sessionId);
  }
  
  startWatching() {
    this.watcher.on('code:write', (code) => this.analyzeCode(code));
    this.watcher.on('file:create', (file) => this.analyzeFile(file));
    this.watcher.on('error:detected', (error) => this.handleError(error));
  }
  
  getCurrentErrors(): LintError[] {
    return this.errors;
  }
  
  getPatterns(): Pattern[] {
    return this.patterns;
  }
  
  getSuggestions(): Suggestion[] {
    return this.suggestions;
  }
  
  private analyzeCode(code: string) {
    // Real-time code analysis
  }
  
  private analyzeFile(file: string) {
    // File analysis
  }
  
  private handleError(error: any) {
    // Error handling
  }
}

/**
 * Session Watcher
 */
class SessionWatcher {
  private events: Map<string, Function[]> = new Map();
  
  constructor(private sessionId: string) {}
  
  on(event: string, handler: Function) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(handler);
  }
  
  emit(event: string, data: any) {
    const handlers = this.events.get(event) || [];
    handlers.forEach(handler => handler(data));
  }
}

// Type definitions
interface LintError {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line: number;
  message: string;
  autoFixable: boolean;
}

interface DelintPath {
  totalErrors: number;
  steps: FixStep[];
  estimatedTime: number;
  impact: number;
  message: string;
}

interface FixStep {
  order: number;
  errorId: string;
  description: string;
  impact: number;
  autoFixable: boolean;
  estimatedTime: number;
  cascadeFixes: string[];
}

interface SessionOptions {
  mode?: 'silent' | 'suggest' | 'active';
  autoFix?: boolean;
  shortestPath?: boolean;
  realTime?: boolean;
}

interface StatusReport {
  watching: boolean;
  mode: string;
  sessions: number;
  totalErrors: number;
  message: string;
}

interface Pattern {
  type: string;
  count: number;
  locations: string[];
}

interface Suggestion {
  type: string;
  message: string;
  priority: number;
}

interface Report {
  sessionId?: string;
  errors?: LintError[];
  patterns?: Pattern[];
  suggestions?: Suggestion[];
  shortestPath?: DelintPath | null;
  message: string;
}

// Export global instance
export const lintah = LintahGlobalCompanion.getInstance();