import { BaseStrategy } from '@earth-agents/debugearth';
import { SpecialistAgentAdapter } from '../../SpecialistAgentAdapter';
import { DebugContext, DebugResult } from '@earth-agents/types';

/**
 * DevOps Troubleshooting Strategy using DevOps Troubleshooter specialist
 */
export class DevOpsTroubleshootingStrategy extends BaseStrategy {
  private devopsTroubleshooter: SpecialistAgentAdapter;
  private siteReliabilityEngineer: SpecialistAgentAdapter;

  constructor() {
    super();
    this.devopsTroubleshooter = new SpecialistAgentAdapter('devops-troubleshooter');
    this.siteReliabilityEngineer = new SpecialistAgentAdapter('site-reliability-engineer');
  }

  async analyze(context: DebugContext): Promise<DebugResult> {
    const { logs, metrics, errorMessage, environment } = context;

    // First, analyze with DevOps troubleshooter
    const troubleshootPrompt = `
Analyze this production issue:

Error: ${errorMessage}
Environment: ${environment || 'production'}

Logs:
\`\`\`
${logs?.slice(0, 5000) || 'No logs available'}
\`\`\`

${metrics ? `Metrics:
${JSON.stringify(metrics, null, 2)}` : ''}

Perform root cause analysis focusing on:
- Recent changes or deployments
- Infrastructure issues
- Resource constraints
- Network problems
- Service dependencies
- Configuration errors

Provide specific troubleshooting steps and remediation actions.
`;

    // Then check with SRE for reliability implications
    const srePrompt = `
Evaluate the reliability impact of this issue:

Error: ${errorMessage}

Analyze:
- SLO impact
- Error budget consumption
- Blast radius
- Customer impact
- Required monitoring improvements
- Preventive measures
`;

    try {
      const [troubleshootResult, sreResult] = await Promise.all([
        this.devopsTroubleshooter.invoke(troubleshootPrompt, context),
        this.siteReliabilityEngineer.invoke(srePrompt, context)
      ]);

      const rootCause = this.extractRootCause(troubleshootResult.output);
      const steps = this.extractTroubleshootingSteps(troubleshootResult.output);
      const preventiveMeasures = this.extractPreventiveMeasures(sreResult.output);

      return {
        success: true,
        rootCause,
        troubleshootingSteps: steps,
        findings: [
          {
            type: 'production-issue',
            severity: 'high',
            description: rootCause,
            evidence: context.logs?.slice(0, 1000)
          }
        ],
        suggestions: [
          ...steps,
          ...preventiveMeasures
        ],
        metadata: {
          sloImpact: sreResult.metadata?.sloImpact,
          errorBudgetImpact: sreResult.metadata?.errorBudgetImpact,
          recommendedActions: troubleshootResult.suggestions
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `DevOps troubleshooting failed: ${error.message}`,
        findings: [],
        suggestions: []
      };
    }
  }

  private extractRootCause(output: string): string {
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes('Root cause:') || line.includes('ROOT CAUSE:')) {
        return line.replace(/^.*?:\s*/, '').trim();
      }
    }
    return 'Root cause analysis in progress';
  }

  private extractTroubleshootingSteps(output: string): string[] {
    const steps = [];
    const lines = output.split('\n');
    
    let inSteps = false;
    for (const line of lines) {
      if (line.includes('Steps:') || line.includes('Troubleshooting:')) {
        inSteps = true;
        continue;
      }
      if (inSteps && line.trim().match(/^\d+\.|^-|^\*/)) {
        steps.push(line.trim().replace(/^[\d+\.\-\*]\s*/, ''));
      } else if (inSteps && line.trim() === '') {
        break;
      }
    }
    
    return steps;
  }

  private extractPreventiveMeasures(output: string): string[] {
    const measures = [];
    const lines = output.split('\n');
    
    let inMeasures = false;
    for (const line of lines) {
      if (line.includes('Preventive') || line.includes('Prevention:')) {
        inMeasures = true;
        continue;
      }
      if (inMeasures && line.trim().match(/^\d+\.|^-|^\*/)) {
        measures.push(`Preventive: ${line.trim().replace(/^[\d+\.\-\*]\s*/, '')}`);
      } else if (inMeasures && line.trim() === '') {
        break;
      }
    }
    
    return measures;
  }
}