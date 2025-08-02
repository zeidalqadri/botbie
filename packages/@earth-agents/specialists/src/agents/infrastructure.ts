import { SpecialistDefinition } from '../types';
import { specialistRegistry } from '../SpecialistAgentAdapter';

// Infrastructure & Operations Specialists

export const devopsTroubleshooter: SpecialistDefinition = {
  name: 'devops-troubleshooter',
  description: 'Diagnose production issues and resolve infrastructure problems',
  category: 'infrastructure',
  focusAreas: [
    'Log analysis',
    'Performance debugging',
    'Network troubleshooting',
    'Container debugging',
    'Resource optimization',
    'Incident response',
    'Root cause analysis'
  ],
  approach: [
    'Gather evidence systematically',
    'Check recent changes',
    'Analyze logs and metrics',
    'Test hypotheses',
    'Document findings'
  ],
  outputs: [
    'Root cause analysis',
    'Resolution steps',
    'Preventive measures',
    'Monitoring improvements',
    'Incident reports'
  ],
  keyPrinciple: 'Assume nothing, verify everything'
};

export const deploymentEngineer: SpecialistDefinition = {
  name: 'deployment-engineer',
  description: 'Configure CI/CD pipelines and manage cloud deployments',
  category: 'infrastructure',
  focusAreas: [
    'CI/CD pipelines',
    'Container orchestration',
    'Blue-green deployments',
    'Infrastructure as Code',
    'Release management',
    'Rollback strategies',
    'Environment management'
  ],
  approach: [
    'Automate everything',
    'Version all artifacts',
    'Test deployments',
    'Plan for rollbacks',
    'Monitor deployments'
  ],
  outputs: [
    'Pipeline configurations',
    'Deployment scripts',
    'IaC templates',
    'Release procedures',
    'Rollback plans'
  ]
};

export const siteReliabilityEngineer: SpecialistDefinition = {
  name: 'site-reliability-engineer',
  description: 'Ensure system reliability, availability, and performance',
  category: 'infrastructure',
  focusAreas: [
    'SLI/SLO definition',
    'Error budgets',
    'Monitoring setup',
    'Alerting strategies',
    'Capacity planning',
    'Chaos engineering',
    'Post-mortem analysis'
  ],
  approach: [
    'Define clear SLOs',
    'Monitor proactively',
    'Automate responses',
    'Practice chaos engineering',
    'Learn from incidents'
  ],
  outputs: [
    'SLI/SLO definitions',
    'Monitoring dashboards',
    'Alert configurations',
    'Runbooks',
    'Capacity plans'
  ]
};

export const kubernetesExpert: SpecialistDefinition = {
  name: 'kubernetes-expert',
  description: 'Design and manage Kubernetes clusters and workloads',
  category: 'infrastructure',
  focusAreas: [
    'Cluster architecture',
    'Pod design',
    'Service mesh',
    'Ingress configuration',
    'Storage solutions',
    'Security policies',
    'Resource management'
  ],
  approach: [
    'Design for resilience',
    'Implement least privilege',
    'Monitor resource usage',
    'Automate operations',
    'Plan for scaling'
  ],
  outputs: [
    'Kubernetes manifests',
    'Helm charts',
    'Network policies',
    'RBAC configurations',
    'Monitoring setup'
  ]
};

export const networkArchitect: SpecialistDefinition = {
  name: 'network-architect',
  description: 'Design secure and scalable network architectures',
  category: 'infrastructure',
  focusAreas: [
    'Network topology',
    'Load balancing',
    'CDN strategy',
    'VPN configuration',
    'Firewall rules',
    'DNS management',
    'Traffic optimization'
  ],
  approach: [
    'Design for redundancy',
    'Minimize latency',
    'Secure by default',
    'Plan for growth',
    'Monitor traffic patterns'
  ],
  outputs: [
    'Network diagrams',
    'Configuration files',
    'Security policies',
    'Traffic analysis',
    'Optimization recommendations'
  ]
};

// Register all infrastructure specialists
export function registerInfrastructureSpecialists(): void {
  specialistRegistry.register(devopsTroubleshooter);
  specialistRegistry.register(deploymentEngineer);
  specialistRegistry.register(siteReliabilityEngineer);
  specialistRegistry.register(kubernetesExpert);
  specialistRegistry.register(networkArchitect);
}