import { Session, Evidence, CrossAgentInsight, Hypothesis } from './types';
import { logger } from './logger';
import { EventEmitter } from 'events';
import { LearningEngine } from './LearningEngine';

export interface SessionCorrelation {
  sessionId: string;
  agentType: 'botbie' | 'debugearth';
  correlatedSessions: string[];
  sharedContext: Record<string, any>;
}

export class SessionManager extends EventEmitter {
  private static instance: SessionManager;
  private sessions: Map<string, Session> = new Map();
  private correlations: Map<string, SessionCorrelation> = new Map();
  private insights: Map<string, CrossAgentInsight> = new Map();
  private learningEngine: LearningEngine;
  
  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }
  
  private constructor() {
    super();
    this.learningEngine = new LearningEngine();
    this.setupLearningIntegration();
    logger.info('SessionManager initialized with learning engine');
  }
  
  /**
   * Set up learning engine integration
   */
  private setupLearningIntegration(): void {
    // Listen to learning engine events
    this.learningEngine.on('feedbackLoopCreated', (feedback) => {
      logger.info(`Learning feedback created: ${feedback.description}`);
      this.emit('learningFeedback', feedback);
    });

    this.learningEngine.on('patternsAnalyzed', (patterns) => {
      logger.debug(`Analyzed ${patterns.length} learning patterns`);
      this.emit('learningPatternsUpdated', patterns);
    });

    this.learningEngine.on('insightPatternDetected', (pattern) => {
      logger.info(`Insight pattern detected: ${pattern.type} from ${pattern.sourceAgent}`);
      this.emit('insightPatternDetected', pattern);
    });
  }
  
  /**
   * Create a new session with cross-agent correlation support
   */
  createSession(
    description: string,
    agentType: 'botbie' | 'debugearth' | 'unified',
    parentSessionId?: string
  ): Session {
    const sessionId = this.generateSessionId();
    
    const session: Session = {
      id: sessionId,
      startTime: new Date(),
      description,
      hypotheses: [],
      evidence: [],
      status: 'active',
      agentType,
      parentSessionId,
      crossAgentInsights: [],
      relatedSessions: []
    };
    
    this.sessions.set(sessionId, session);
    
    // Set up correlation if this is a cross-agent session
    if (parentSessionId && this.sessions.has(parentSessionId)) {
      this.createCorrelation(sessionId, parentSessionId, agentType);
    }
    
    this.emit('sessionCreated', session);
    logger.info(`Created ${agentType} session: ${sessionId}`);
    
    return session;
  }
  
  /**
   * Get a session by ID
   */
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }
  
  /**
   * Add evidence to a session with cross-agent enhancement
   */
  addEvidence(
    sessionId: string,
    evidence: Omit<Evidence, 'id' | 'timestamp'>
  ): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      logger.warn(`Session ${sessionId} not found`);
      return false;
    }
    
    const enhancedEvidence: Evidence = {
      ...evidence,
      id: this.generateEvidenceId(),
      timestamp: new Date(),
      agentSource: session.agentType === 'unified' ? 'system' : session.agentType,
      crossAgentId: this.generateCrossAgentId(sessionId, evidence.type)
    };
    
    session.evidence.push(enhancedEvidence);
    
    // Feed to learning engine
    this.learningEngine.processEvidence(enhancedEvidence);
    
    // Check for cross-agent correlations
    this.analyzeForCrossAgentPatterns(sessionId, enhancedEvidence);
    
    this.emit('evidenceAdded', sessionId, enhancedEvidence);
    logger.debug(`Added evidence to session ${sessionId}: ${evidence.type}`);
    
    return true;
  }
  
  /**
   * Add a hypothesis to a session
   */
  addHypothesis(sessionId: string, hypothesis: Omit<Hypothesis, 'id'>): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      logger.warn(`Session ${sessionId} not found`);
      return false;
    }
    
    const enhancedHypothesis: Hypothesis = {
      ...hypothesis,
      id: this.generateHypothesisId()
    };
    
    session.hypotheses.push(enhancedHypothesis);
    
    this.emit('hypothesisAdded', sessionId, enhancedHypothesis);
    logger.debug(`Added hypothesis to session ${sessionId}`);
    
    return true;
  }
  
  /**
   * Create a cross-agent insight
   */
  createInsight(insight: Omit<CrossAgentInsight, 'id' | 'timestamp'>): string {
    const insightId = this.generateInsightId();
    
    const enhancedInsight: CrossAgentInsight = {
      ...insight,
      id: insightId,
      timestamp: new Date()
    };
    
    this.insights.set(insightId, enhancedInsight);
    
    // Feed to learning engine
    this.learningEngine.processInsight(enhancedInsight);
    
    // Propagate insight to target agents
    this.propagateInsight(enhancedInsight);
    
    this.emit('insightCreated', enhancedInsight);
    logger.info(`Created cross-agent insight: ${insight.title}`);
    
    return insightId;
  }
  
  /**
   * Get insights for a specific agent
   */
  getInsightsForAgent(agentType: 'botbie' | 'debugearth'): CrossAgentInsight[] {
    return Array.from(this.insights.values()).filter(
      insight => insight.targetAgent === agentType || insight.targetAgent === 'all'
    );
  }
  
  /**
   * Find related sessions based on patterns
   */
  findRelatedSessions(sessionId: string): Session[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    
    const relatedSessions: Session[] = [];
    
    // Find sessions with similar evidence patterns
    for (const [otherId, otherSession] of this.sessions) {
      if (otherId === sessionId) continue;
      
      const similarity = this.calculateSessionSimilarity(session, otherSession);
      if (similarity > 0.7) {
        relatedSessions.push(otherSession);
      }
    }
    
    return relatedSessions;
  }
  
  /**
   * Update session status
   */
  updateSessionStatus(
    sessionId: string,
    status: 'active' | 'resolved' | 'exploring'
  ): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    const oldStatus = session.status;
    session.status = status;
    
    // If session is completed, feed to learning engine
    if (status === 'resolved' && oldStatus !== 'resolved') {
      this.learningEngine.processSession(session);
    }
    
    this.emit('sessionStatusChanged', sessionId, status);
    
    return true;
  }
  
  /**
   * Get session statistics
   */
  getStatistics() {
    const totalSessions = this.sessions.size;
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.status === 'active').length;
    const totalInsights = this.insights.size;
    const correlations = this.correlations.size;
    const learningMetrics = this.learningEngine.getMetrics();
    
    return {
      totalSessions,
      activeSessions,
      totalInsights,
      correlations,
      agentBreakdown: {
        botbie: Array.from(this.sessions.values()).filter(s => s.agentType === 'botbie').length,
        debugearth: Array.from(this.sessions.values()).filter(s => s.agentType === 'debugearth').length,
        unified: Array.from(this.sessions.values()).filter(s => s.agentType === 'unified').length
      },
      learning: learningMetrics
    };
  }
  
  /**
   * Get learning patterns
   */
  getLearningPatterns() {
    return this.learningEngine.getPatterns();
  }
  
  /**
   * Get learning patterns by type
   */
  getLearningPatternsByType(type: any) {
    return this.learningEngine.getPatternsByType(type);
  }
  
  /**
   * Get feedback loops
   */
  getFeedbackLoops() {
    return this.learningEngine.getFeedbackLoops();
  }
  
  /**
   * Update feedback loop effectiveness
   */
  updateFeedbackEffectiveness(feedbackId: string, effectiveness: number) {
    this.learningEngine.updateFeedbackEffectiveness(feedbackId, effectiveness);
  }
  
  /**
   * Clean up old learning data
   */
  cleanupLearningData(maxAgeDays: number = 90) {
    this.learningEngine.cleanup(maxAgeDays);
  }
  
  private createCorrelation(
    sessionId: string,
    parentSessionId: string,
    agentType: 'botbie' | 'debugearth'
  ): void {
    const parentSession = this.sessions.get(parentSessionId);
    if (!parentSession) return;
    
    // Update parent session
    if (!parentSession.relatedSessions) {
      parentSession.relatedSessions = [];
    }
    parentSession.relatedSessions.push(sessionId);
    
    // Update current session
    const currentSession = this.sessions.get(sessionId);
    if (currentSession) {
      currentSession.relatedSessions = [parentSessionId];
    }
    
    // Create correlation record
    const correlation: SessionCorrelation = {
      sessionId,
      agentType,
      correlatedSessions: [parentSessionId],
      sharedContext: {
        createdAt: new Date(),
        parentAgent: parentSession.agentType
      }
    };
    
    this.correlations.set(sessionId, correlation);
    logger.info(`Created correlation between ${sessionId} and ${parentSessionId}`);
  }
  
  private analyzeForCrossAgentPatterns(sessionId: string, evidence: Evidence): void {
    // Look for patterns that could generate insights for other agents
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    // Example: If DebugEarth finds a performance issue, create insight for Botbie
    if (session.agentType === 'debugearth' && evidence.type === 'performance') {
      const insight: Omit<CrossAgentInsight, 'id' | 'timestamp'> = {
        sourceAgent: 'debugearth',
        targetAgent: 'botbie',
        type: 'performance-issue',
        title: 'Performance Issue Pattern Detected',
        description: `Performance issue found that could be prevented by static analysis`,
        evidence: [evidence],
        recommendations: [
          'Add performance monitoring rules',
          'Implement complexity checks',
          'Review algorithmic efficiency patterns'
        ],
        confidence: 0.8,
        impact: evidence.impact || 'medium',
        metadata: {
          filePattern: evidence.context.filePath,
          errorPattern: evidence.data.error || evidence.data.message
        }
      };
      
      this.createInsight(insight);
    }
    
    // Example: If Botbie finds code smells, create insight for DebugEarth
    if (session.agentType === 'botbie' && evidence.type === 'code-quality') {
      const insight: Omit<CrossAgentInsight, 'id' | 'timestamp'> = {
        sourceAgent: 'botbie',
        targetAgent: 'debugearth',
        type: 'quality-rule',
        title: 'Code Quality Issue Pattern',
        description: `Code quality issue that may lead to runtime bugs`,
        evidence: [evidence],
        recommendations: [
          'Monitor for runtime errors in this pattern',
          'Add specific debugging strategies',
          'Watch for edge cases in similar code'
        ],
        confidence: 0.7,
        impact: evidence.impact || 'medium',
        metadata: {
          codePattern: evidence.data.pattern,
          affectedFiles: evidence.data.files
        }
      };
      
      this.createInsight(insight);
    }
  }
  
  private propagateInsight(insight: CrossAgentInsight): void {
    // Find active sessions that should receive this insight
    for (const [sessionId, session] of this.sessions) {
      if (session.status === 'active' &&
          (session.agentType === insight.targetAgent || insight.targetAgent === 'all')) {
        
        if (!session.crossAgentInsights) {
          session.crossAgentInsights = [];
        }
        
        session.crossAgentInsights.push(insight);
        this.emit('insightPropagated', sessionId, insight);
      }
    }
  }
  
  private calculateSessionSimilarity(session1: Session, session2: Session): number {
    // Simple similarity calculation based on evidence types and context
    const types1 = new Set(session1.evidence.map(e => e.type));
    const types2 = new Set(session2.evidence.map(e => e.type));
    
    const intersection = new Set([...types1].filter(x => types2.has(x)));
    const union = new Set([...types1, ...types2]);
    
    return intersection.size / union.size;
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateEvidenceId(): string {
    return `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateHypothesisId(): string {
    return `hypothesis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateInsightId(): string {
    return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateCrossAgentId(sessionId: string, evidenceType: string): string {
    return `cross_${sessionId}_${evidenceType}_${Math.random().toString(36).substr(2, 6)}`;
  }
}

export default SessionManager;