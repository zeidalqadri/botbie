import { 
  WorkflowTemplate, 
  WorkflowCustomization, 
  WorkflowNode,
  WorkflowConfig,
  WorkflowTrigger 
} from './types';

export class WorkflowCustomizer {
  /**
   * Apply customizations to a workflow template
   */
  static customize(
    template: WorkflowTemplate,
    customization: WorkflowCustomization
  ): WorkflowTemplate {
    // Deep clone the template to avoid mutations
    const customized = JSON.parse(JSON.stringify(template)) as WorkflowTemplate;
    
    // Apply variable substitutions
    if (customization.variables) {
      this.applyVariables(customized, customization.variables);
    }
    
    // Apply node overrides
    if (customization.overrides.nodes) {
      this.applyNodeOverrides(customized, customization.overrides.nodes);
    }
    
    // Apply config overrides
    if (customization.overrides.config) {
      this.applyConfigOverrides(customized, customization.overrides.config);
    }
    
    // Apply trigger overrides
    if (customization.overrides.triggers) {
      customized.triggers = customization.overrides.triggers;
    }
    
    // Update metadata
    customized.id = `${template.id}-custom-${Date.now()}`;
    customized.name = `${template.name} (Customized)`;
    
    return customized;
  }

  /**
   * Create a customization preset for common scenarios
   */
  static createPreset(
    scenario: 'quick-validation' | 'strict-compliance' | 'performance-focused' | 'minimal'
  ): Partial<WorkflowCustomization> {
    switch (scenario) {
      case 'quick-validation':
        return {
          overrides: {
            config: {
              parallelExecution: true,
              maxRetries: 1,
              timeoutMinutes: 60
            },
            nodes: [
              { 
                id: '*',
                timeout: 300000 // 5 minutes per node
              }
            ]
          },
          variables: {
            skipOptionalSteps: true,
            quickMode: true
          }
        };
      
      case 'strict-compliance':
        return {
          overrides: {
            config: {
              parallelExecution: false,
              maxRetries: 3,
              notificationChannels: [
                {
                  type: 'email',
                  config: { recipients: '${COMPLIANCE_TEAM}' },
                  events: ['start', 'success', 'failure', 'warning']
                }
              ]
            }
          },
          variables: {
            wcagLevel: 'AAA',
            autoFix: false,
            requireApproval: true,
            generateEvidence: true
          }
        };
      
      case 'performance-focused':
        return {
          overrides: {
            nodes: [
              {
                id: 'optimize-performance',
                inputs: {
                  aggressive: true,
                  targetSize: 25000,
                  techniques: ['tree-shaking', 'code-splitting', 'minification', 'compression']
                }
              }
            ]
          },
          variables: {
            performanceThreshold: {
              bundleSize: 30000,
              renderTime: 10,
              lighthouse: 95
            }
          }
        };
      
      case 'minimal':
        return {
          overrides: {
            nodes: [
              {
                id: 'generate-docs',
                skip: true
              },
              {
                id: 'generate-tests',
                skip: true
              }
            ]
          },
          variables: {
            minimalOutput: true,
            skipOptional: true
          }
        };
      
      default:
        return {};
    }
  }

  /**
   * Validate customization against template
   */
  static validate(
    template: WorkflowTemplate,
    customization: WorkflowCustomization
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate template ID match
    if (customization.templateId !== template.id) {
      errors.push(`Template ID mismatch: ${customization.templateId} !== ${template.id}`);
    }
    
    // Validate node overrides
    if (customization.overrides.nodes) {
      customization.overrides.nodes.forEach(override => {
        if (override.id && override.id !== '*') {
          const nodeExists = template.nodes.some(n => n.id === override.id);
          if (!nodeExists) {
            errors.push(`Node ${override.id} does not exist in template`);
          }
        }
      });
    }
    
    // Validate required variables
    const requiredVars = this.extractRequiredVariables(template);
    requiredVars.forEach(varName => {
      if (!customization.variables[varName]) {
        errors.push(`Required variable ${varName} is missing`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Merge multiple customizations
   */
  static merge(...customizations: Partial<WorkflowCustomization>[]): WorkflowCustomization {
    const merged: WorkflowCustomization = {
      templateId: '',
      overrides: {
        nodes: [],
        config: {},
        triggers: []
      },
      variables: {}
    };
    
    customizations.forEach(custom => {
      if (custom.templateId) merged.templateId = custom.templateId;
      
      if (custom.overrides) {
        if (custom.overrides.nodes) {
          merged.overrides.nodes!.push(...custom.overrides.nodes);
        }
        if (custom.overrides.config) {
          merged.overrides.config = { ...merged.overrides.config, ...custom.overrides.config };
        }
        if (custom.overrides.triggers) {
          merged.overrides.triggers!.push(...custom.overrides.triggers);
        }
      }
      
      if (custom.variables) {
        merged.variables = { ...merged.variables, ...custom.variables };
      }
    });
    
    return merged;
  }

  /**
   * Generate customization UI schema
   */
  static generateUISchema(template: WorkflowTemplate): any {
    const schema = {
      type: 'object',
      properties: {
        general: {
          type: 'object',
          title: 'General Settings',
          properties: {
            name: { type: 'string', default: template.name },
            description: { type: 'string', default: template.description },
            timeoutMinutes: { type: 'number', default: template.config.timeoutMinutes }
          }
        },
        nodes: {
          type: 'array',
          title: 'Workflow Steps',
          items: {
            type: 'object',
            properties: {}
          }
        },
        variables: {
          type: 'object',
          title: 'Variables',
          properties: {}
        }
      }
    };
    
    // Add node-specific customization options
    template.nodes.forEach(node => {
      schema.properties.nodes.items.properties[node.id] = {
        type: 'object',
        title: node.name,
        properties: {
          enabled: { type: 'boolean', default: true },
          timeout: { type: 'number', default: node.timeout },
          retries: { type: 'number', default: 3 }
        }
      };
    });
    
    // Extract and add variable options
    const variables = this.extractRequiredVariables(template);
    variables.forEach(varName => {
      schema.properties.variables.properties[varName] = {
        type: 'string',
        title: this.humanizeVariableName(varName)
      };
    });
    
    return schema;
  }

  // Private helper methods
  
  private static applyVariables(template: WorkflowTemplate, variables: Record<string, any>): void {
    const templateStr = JSON.stringify(template);
    let processedStr = templateStr;
    
    // Replace ${variable} patterns
    Object.entries(variables).forEach(([key, value]) => {
      const pattern = new RegExp(`\\$\\{${key}\\}`, 'g');
      processedStr = processedStr.replace(pattern, JSON.stringify(value));
    });
    
    // Update template with processed values
    const processed = JSON.parse(processedStr);
    Object.assign(template, processed);
  }
  
  private static applyNodeOverrides(
    template: WorkflowTemplate, 
    overrides: Partial<WorkflowNode>[]
  ): void {
    overrides.forEach(override => {
      if (override.id === '*') {
        // Apply to all nodes
        template.nodes.forEach(node => {
          Object.assign(node, override, { id: node.id }); // Preserve ID
        });
      } else if (override.id) {
        // Apply to specific node
        const node = template.nodes.find(n => n.id === override.id);
        if (node) {
          Object.assign(node, override);
        }
      }
    });
  }
  
  private static applyConfigOverrides(
    template: WorkflowTemplate,
    configOverride: Partial<WorkflowConfig>
  ): void {
    Object.assign(template.config, configOverride);
  }
  
  private static extractRequiredVariables(template: WorkflowTemplate): string[] {
    const templateStr = JSON.stringify(template);
    const variablePattern = /\$\{([^}]+)\}/g;
    const variables = new Set<string>();
    
    let match;
    while ((match = variablePattern.exec(templateStr)) !== null) {
      // Exclude environment variables
      if (!match[1].startsWith('env.')) {
        variables.add(match[1]);
      }
    }
    
    return Array.from(variables);
  }
  
  private static humanizeVariableName(varName: string): string {
    return varName
      .split(/[._-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}