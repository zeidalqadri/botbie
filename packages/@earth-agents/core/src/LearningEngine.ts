import { EventEmitter } from 'events';
import { Evidence, CrossAgentInsight, Session } from './types';
import { logger } from './utils/logger';

export interface LearningPattern {
  id: string;
  type: 'bug-quality-correlation' | 'performance-complexity' | 'recurring-issues' | 'fix-effectiveness';
  description: string;
  pattern: Record<string, any>;
  confidence: number;
  occurrences: number;
  lastSeen: Date;
  impact: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface FeedbackLoop {
  id: string;
  sourcePattern: string;
  targetAgent: 'botbie' | 'debugearth' | 'system';
  actionType: 'rule-creation' | 'threshold-adjustment' | 'strategy-modification';
  description: string;
  parameters: Record<string, any>;
  effectiveness: number; // 0-1 score
  timestamp: Date;
}

export interface LearningMetrics {
  totalPatterns: number;
  activePatterns: number;
  feedbackLoopsCreated: number;
  improvementScore: number; // Overall improvement based on patterns
  patternsByType: Record<string, number>;
  averageConfidence: number;
}

export class LearningEngine extends EventEmitter {
  private patterns: Map<string, LearningPattern> = new Map();
  private feedbackLoops: Map<string, FeedbackLoop> = new Map();
  private evidenceHistory: Evidence[] = [];
  private insightHistory: CrossAgentInsight[] = [];
  private sessionHistory: Session[] = [];

  constructor() {
    super();
    logger.info('LearningEngine initialized');
  }

  /**
   * Process new evidence and look for learning opportunities
   */
  processEvidence(evidence: Evidence): void {
    this.evidenceHistory.push(evidence);
    
    // Trigger pattern analysis if we have enough data
    if (this.evidenceHistory.length % 10 === 0) {
      this.analyzePatterns();
    }
    
    this.emit('evidenceProcessed', evidence);
  }

  /**
   * Process new cross-agent insight
   */
  processInsight(insight: CrossAgentInsight): void {
    this.insightHistory.push(insight);
    
    // Look for insight patterns
    this.analyzeInsightPatterns(insight);
    
    this.emit('insightProcessed', insight);
  }

  /**
   * Process completed session
   */
  processSession(session: Session): void {
    this.sessionHistory.push(session);
    
    // Analyze session effectiveness
    this.analyzeSessionEffectiveness(session);
    
    this.emit('sessionProcessed', session);
  }

  /**
   * Analyze patterns in the collected data
   */
  private analyzePatterns(): void {
    logger.debug('Analyzing patterns from evidence history');
    
    // Pattern 1: Bug-Quality Correlation
    this.analyzeBugQualityCorrelation();
    
    // Pattern 2: Performance-Complexity Correlation
    this.analyzePerformanceComplexityCorrelation();
    
    // Pattern 3: Recurring Issues
    this.analyzeRecurringIssues();
    
    // Pattern 4: Fix Effectiveness
    this.analyzeFixEffectiveness();
    
    this.emit('patternsAnalyzed', Array.from(this.patterns.values()));
  }

  private analyzeBugQualityCorrelation(): void {
    const qualityEvidence = this.evidenceHistory.filter(e => e.type === 'code-quality');
    const bugEvidence = this.evidenceHistory.filter(e => 
      e.type === 'console' || e.type === 'stack-trace' || e.type === 'user-report'
    );

    if (qualityEvidence.length < 5 || bugEvidence.length < 3) return;

    // Simple correlation analysis
    const correlations = this.findQualityBugCorrelations(qualityEvidence, bugEvidence);
    
    if (correlations.length > 0) {
      const pattern: LearningPattern = {
        id: 'bug-quality-correlation-001',
        type: 'bug-quality-correlation',
        description: 'Files with low quality scores tend to have more runtime bugs',
        pattern: {
          correlations,
          threshold: 60, // Quality threshold below which bugs are more likely
          riskMultiplier: correlations.length > 3 ? 2.5 : 1.8
        },
        confidence: Math.min(0.9, correlations.length * 0.2),
        occurrences: correlations.length,
        lastSeen: new Date(),
        impact: correlations.length > 5 ? 'high' : 'medium',
        recommendations: [
          'Add quality gates for files scoring below 60',
          'Increase testing focus on low-quality code',
          'Implement automated refactoring suggestions'
        ]
      };

      this.patterns.set(pattern.id, pattern);
      this.createFeedbackLoop(pattern);
    }
  }

  private analyzePerformanceComplexityCorrelation(): void {
    const performanceEvidence = this.evidenceHistory.filter(e => e.type === 'performance');
    const qualityEvidence = this.evidenceHistory.filter(e => e.type === 'code-quality');

    if (performanceEvidence.length < 3 || qualityEvidence.length < 5) return;

    const complexityIssues = qualityEvidence.filter(e => 
      e.data.issues && e.data.issues.some((issue: any) => 
        issue.type?.includes('complexity') || issue.description?.includes('complex')
      )
    ).length;

    if (complexityIssues > 2 && performanceEvidence.length > 0) {
      const pattern: LearningPattern = {
        id: 'performance-complexity-001',
        type: 'performance-complexity',
        description: 'High complexity code correlates with performance issues',
        pattern: {
          complexityThreshold: 10,
          performanceImpact: 'moderate',
          affectedFiles: complexityIssues
        },
        confidence: 0.75,
        occurrences: complexityIssues,
        lastSeen: new Date(),
        impact: 'medium',
        recommendations: [
          'Set complexity limits in CI/CD',
          'Profile high-complexity functions',
          'Consider architectural refactoring'
        ]
      };

      this.patterns.set(pattern.id, pattern);
      this.createFeedbackLoop(pattern);
    }
  }

  private analyzeRecurringIssues(): void {
    const issueTypes = new Map<string, number>();
    
    this.evidenceHistory.forEach(evidence => {
      if (evidence.data.issues) {
        evidence.data.issues.forEach((issue: any) => {
          const type = issue.type || 'unknown';
          issueTypes.set(type, (issueTypes.get(type) || 0) + 1);
        });
      }
    });

    // Find frequently recurring issues
    const recurringIssues = Array.from(issueTypes.entries())
      .filter(([type, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1]);

    if (recurringIssues.length > 0) {
      const [topIssueType, count] = recurringIssues[0];
      
      const pattern: LearningPattern = {
        id: `recurring-issues-${topIssueType}`,
        type: 'recurring-issues',
        description: `${topIssueType} issues are recurring frequently`,
        pattern: {
          issueType: topIssueType,
          frequency: count,
          allRecurring: recurringIssues
        },
        confidence: Math.min(0.95, count * 0.15),
        occurrences: count,
        lastSeen: new Date(),
        impact: count > 10 ? 'high' : count > 5 ? 'medium' : 'low',
        recommendations: [
          `Create specific rules to catch ${topIssueType} issues early`,
          'Add automated tests for this issue pattern',
          'Consider architectural changes to prevent this pattern'
        ]
      };

      this.patterns.set(pattern.id, pattern);
      this.createFeedbackLoop(pattern);
    }
  }

  private analyzeFixEffectiveness(): void {
    // This would analyze how effective different fixes have been
    // For now, we'll create a simple pattern based on session outcomes
    
    const resolvedSessions = this.sessionHistory.filter(s => s.status === 'resolved');
    const totalSessions = this.sessionHistory.length;
    
    if (totalSessions < 5) return;
    
    const effectiveness = resolvedSessions.length / totalSessions;
    
    if (effectiveness < 0.7) {
      const pattern: LearningPattern = {
        id: 'fix-effectiveness-001',
        type: 'fix-effectiveness',
        description: 'Current debugging approaches have low success rate',
        pattern: {
          successRate: effectiveness,
          totalSessions,
          resolvedSessions: resolvedSessions.length
        },
        confidence: 0.8,
        occurrences: totalSessions,
        lastSeen: new Date(),
        impact: 'medium',
        recommendations: [
          'Review and improve debugging strategies',
          'Add more automated detection rules',
          'Implement better evidence collection'
        ]
      };

      this.patterns.set(pattern.id, pattern);
      this.createFeedbackLoop(pattern);
    }
  }

  private analyzeInsightPatterns(insight: CrossAgentInsight): void {
    // Track insight types and their effectiveness
    const similarInsights = this.insightHistory.filter(i => 
      i.type === insight.type && i.sourceAgent === insight.sourceAgent
    );

    if (similarInsights.length >= 3) {
      // This insight pattern is recurring
      const avgConfidence = similarInsights.reduce((sum, i) => sum + i.confidence, 0) / similarInsights.length;
      
      if (avgConfidence > 0.7) {
        logger.info(`High-confidence insight pattern detected: ${insight.type} from ${insight.sourceAgent}`);
        this.emit('insightPatternDetected', {
          type: insight.type,
          sourceAgent: insight.sourceAgent,
          count: similarInsights.length,
          avgConfidence
        });
      }
    }
  }

  private analyzeSessionEffectiveness(session: Session): void {
    if (session.status === 'resolved' && session.evidence.length > 0) {
      // Successful session - learn from it
      const evidenceTypes = session.evidence.map(e => e.type);
      const uniqueTypes = new Set(evidenceTypes).size;
      
      // More diverse evidence usually leads to better outcomes
      if (uniqueTypes >= 3) {
        logger.info(`High-quality session detected: ${session.id} with ${uniqueTypes} evidence types`);
        this.emit('effectiveSessionPattern', {
          sessionId: session.id,
          evidenceTypes: Array.from(new Set(evidenceTypes)),
          evidenceCount: session.evidence.length
        });
      }
    }
  }

  private findQualityBugCorrelations(qualityEvidence: Evidence[], bugEvidence: Evidence[]): any[] {
    const correlations: any[] = [];
    
    // Simple correlation: match by file path or timing
    qualityEvidence.forEach(qEvidence => {
      const relatedBugs = bugEvidence.filter(bEvidence => {
        // Check if they're from the same file or close in time
        const timeDiff = Math.abs(qEvidence.timestamp.getTime() - bEvidence.timestamp.getTime());
        const sameFile = qEvidence.context.filePath === bEvidence.context.filePath;
        const closeInTime = timeDiff < 60 * 60 * 1000; // 1 hour
        
        return sameFile || closeInTime;
      });

      if (relatedBugs.length > 0) {
        correlations.push({
          qualityEvidence: qEvidence.id,
          relatedBugs: relatedBugs.map(b => b.id),
          qualityScore: qEvidence.data.qualityScore,
          bugCount: relatedBugs.length
        });
      }
    });

    return correlations;
  }

  private createFeedbackLoop(pattern: LearningPattern): void {
    const feedbackLoop: FeedbackLoop = {
      id: `feedback-${pattern.id}-${Date.now()}`,
      sourcePattern: pattern.id,
      targetAgent: this.determineTargetAgent(pattern),
      actionType: this.determineActionType(pattern),
      description: `Auto-generated feedback from pattern: ${pattern.description}`,
      parameters: this.generateActionParameters(pattern),
      effectiveness: 0, // Will be measured over time
      timestamp: new Date()
    };

    this.feedbackLoops.set(feedbackLoop.id, feedbackLoop);
    
    // Emit event for systems to act on this feedback
    this.emit('feedbackLoopCreated', feedbackLoop);
    
    logger.info(`Created feedback loop: ${feedbackLoop.description}`);
  }

  private determineTargetAgent(pattern: LearningPattern): 'botbie' | 'debugearth' | 'system' {
    switch (pattern.type) {
      case 'bug-quality-correlation':
      case 'performance-complexity':
      case 'recurring-issues':
        return 'botbie'; // Proactive agent should handle these
      case 'fix-effectiveness':
        return 'debugearth'; // Reactive agent should improve debugging
      default:
        return 'system';
    }
  }

  private determineActionType(pattern: LearningPattern): 'rule-creation' | 'threshold-adjustment' | 'strategy-modification' {
    switch (pattern.type) {
      case 'bug-quality-correlation':
      case 'recurring-issues':
        return 'rule-creation';
      case 'performance-complexity':
        return 'threshold-adjustment';
      case 'fix-effectiveness':
        return 'strategy-modification';
      default:
        return 'rule-creation';
    }
  }

  private generateActionParameters(pattern: LearningPattern): Record<string, any> {
    switch (pattern.type) {
      case 'bug-quality-correlation':
        return {
          qualityThreshold: pattern.pattern.threshold,
          riskMultiplier: pattern.pattern.riskMultiplier,
          newRules: ['quality-bug-correlation-check']
        };
      case 'recurring-issues':
        return {
          issueType: pattern.pattern.issueType,
          frequency: pattern.pattern.frequency,
          newRules: [`prevent-${pattern.pattern.issueType}`]
        };
      case 'performance-complexity':
        return {
          complexityThreshold: pattern.pattern.complexityThreshold,
          newThresholds: { complexity: 8 } // Lower threshold
        };
      default:
        return {};
    }
  }

  /**
   * Get all learned patterns
   */
  getPatterns(): LearningPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get patterns by type
   */
  getPatternsByType(type: LearningPattern['type']): LearningPattern[] {
    return Array.from(this.patterns.values()).filter(p => p.type === type);
  }

  /**
   * Get all feedback loops
   */
  getFeedbackLoops(): FeedbackLoop[] {
    return Array.from(this.feedbackLoops.values());
  }

  /**
   * Get learning metrics
   */
  getMetrics(): LearningMetrics {
    const patterns = Array.from(this.patterns.values());
    const activePatterns = patterns.filter(p => {
      const daysSinceLastSeen = (Date.now() - p.lastSeen.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceLastSeen <= 30; // Active if seen in last 30 days
    });

    const patternsByType = patterns.reduce((acc, pattern) => {
      acc[pattern.type] = (acc[pattern.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageConfidence = patterns.length > 0 
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length 
      : 0;

    // Calculate improvement score based on pattern quality and feedback loop effectiveness
    const improvementScore = this.calculateImprovementScore(patterns);

    return {
      totalPatterns: patterns.length,
      activePatterns: activePatterns.length,
      feedbackLoopsCreated: this.feedbackLoops.size,
      improvementScore,
      patternsByType,
      averageConfidence
    };
  }

  private calculateImprovementScore(patterns: LearningPattern[]): number {
    if (patterns.length === 0) return 0;

    // Base score on pattern quality and impact
    const weightedScore = patterns.reduce((score, pattern) => {
      const impactWeight = {
        'low': 1,
        'medium': 2,
        'high': 3,
        'critical': 4
      }[pattern.impact];

      return score + (pattern.confidence * impactWeight * 10);
    }, 0);

    return Math.min(100, weightedScore / patterns.length);
  }

  /**
   * Update feedback loop effectiveness based on observed results
   */
  updateFeedbackEffectiveness(feedbackId: string, effectiveness: number): void {
    const feedback = this.feedbackLoops.get(feedbackId);
    if (feedback) {
      feedback.effectiveness = effectiveness;
      this.emit('feedbackEffectivenessUpdated', feedback);
      logger.debug(`Updated feedback loop effectiveness: ${feedbackId} -> ${effectiveness}`);
    }
  }

  /**
   * Clear old patterns and feedback loops
   */
  cleanup(maxAge: number = 90): void {
    const cutoffDate = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000);
    
    // Clean up old patterns
    for (const [id, pattern] of this.patterns) {
      if (pattern.lastSeen < cutoffDate) {
        this.patterns.delete(id);
      }
    }

    // Clean up old feedback loops
    for (const [id, feedback] of this.feedbackLoops) {
      if (feedback.timestamp < cutoffDate) {
        this.feedbackLoops.delete(id);
      }
    }

    // Clean up old history
    this.evidenceHistory = this.evidenceHistory.filter(e => e.timestamp > cutoffDate);
    this.insightHistory = this.insightHistory.filter(i => i.timestamp > cutoffDate);
    this.sessionHistory = this.sessionHistory.filter(s => s.startTime > cutoffDate);

    logger.info(`Cleaned up patterns and history older than ${maxAge} days`);
  }
}

export default LearningEngine;