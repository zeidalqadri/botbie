import { z } from 'zod';

// Rule severity levels
const SeverityLevel = z.enum(['error', 'warning', 'info', 'off']);

// Base rule configuration
const BaseRuleConfig = z.object({
  enabled: z.boolean().default(true),
  severity: SeverityLevel.default('warning')
});

// Complexity rule configuration
const ComplexityRuleConfig = BaseRuleConfig.extend({
  threshold: z.number().min(1).max(50).default(10),
  skipComments: z.boolean().default(true)
});

// Documentation rule configuration  
const DocumentationRuleConfig = BaseRuleConfig.extend({
  requireJSDoc: z.boolean().default(true),
  minCoverage: z.number().min(0).max(100).default(80),
  requireReturn: z.boolean().default(true),
  requireParam: z.boolean().default(true),
  requireExample: z.boolean().default(false),
  publicOnly: z.boolean().default(true)
});

// Naming rule configuration
const NamingRuleConfig = BaseRuleConfig.extend({
  conventions: z.object({
    classes: z.enum(['PascalCase', 'camelCase']).default('PascalCase'),
    functions: z.enum(['camelCase', 'snake_case']).default('camelCase'),
    variables: z.enum(['camelCase', 'snake_case', 'UPPER_CASE']).default('camelCase'),
    constants: z.enum(['UPPER_CASE', 'camelCase']).default('UPPER_CASE'),
    interfaces: z.enum(['PascalCase', 'IPascalCase']).default('PascalCase')
  }).default({})
});

// Security rule configuration
const SecurityRuleConfig = BaseRuleConfig.extend({
  detectHardcodedSecrets: z.boolean().default(true),
  detectSQLInjection: z.boolean().default(true),
  detectXSS: z.boolean().default(true),
  customPatterns: z.array(z.string()).default([])
});

// Performance rule configuration
const PerformanceRuleConfig = BaseRuleConfig.extend({
  maxBundleSize: z.number().optional(),
  detectMemoryLeaks: z.boolean().default(true),
  detectBlockingOperations: z.boolean().default(true),
  detectIneffcientLoops: z.boolean().default(true)
});

// Rules configuration
const RulesConfig = z.object({
  complexity: ComplexityRuleConfig.default({}),
  documentation: DocumentationRuleConfig.default({}),
  naming: NamingRuleConfig.default({}),
  security: SecurityRuleConfig.default({}),
  performance: PerformanceRuleConfig.default({}),
  functionLength: BaseRuleConfig.extend({
    maxLines: z.number().min(1).max(500).default(50)
  }).default({}),
  fileLength: BaseRuleConfig.extend({
    maxLines: z.number().min(1).max(5000).default(500)
  }).default({}),
  duplicateCode: BaseRuleConfig.extend({
    minTokens: z.number().min(10).max(200).default(50),
    skipComments: z.boolean().default(true)
  }).default({})
});

// Analysis configuration
const AnalysisConfig = z.object({
  includePatterns: z.array(z.string()).default(['src/**/*']),
  excludePatterns: z.array(z.string()).default([
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/*.d.ts'
  ]),
  languages: z.array(z.enum(['typescript', 'javascript', 'python', 'go', 'java'])).default(['typescript', 'javascript']),
  followSymlinks: z.boolean().default(false),
  ignoreHiddenFiles: z.boolean().default(true),
  strictMode: z.boolean().default(false),
  maxFileSize: z.number().min(1).default(1048576) // 1MB default
});

// Auto-fix configuration
const AutoFixConfig = z.object({
  enabled: z.boolean().default(false),
  dryRun: z.boolean().default(true),
  categories: z.array(z.enum([
    'documentation',
    'formatting',
    'imports',
    'naming',
    'simple-refactoring'
  ])).default(['documentation', 'formatting']),
  createBackup: z.boolean().default(true),
  interactive: z.boolean().default(false)
});

// Output configuration
const OutputConfig = z.object({
  format: z.array(z.enum(['console', 'html', 'markdown', 'json', 'junit'])).default(['console']),
  directory: z.string().default('.botbie/reports'),
  filename: z.string().optional(),
  quiet: z.boolean().default(false),
  verbose: z.boolean().default(false),
  groupBy: z.enum(['file', 'severity', 'type', 'none']).default('severity'),
  showStats: z.boolean().default(true),
  theme: z.enum(['default', 'dark', 'light']).default('default')
});

// Integration configuration
const IntegrationConfig = z.object({
  git: z.object({
    blame: z.boolean().default(false),
    commitCheck: z.boolean().default(false),
    preCommitHook: z.boolean().default(false)
  }).default({}),
  ci: z.object({
    failOnError: z.boolean().default(true),
    failOnWarning: z.boolean().default(false),
    annotations: z.boolean().default(true)
  }).default({}),
  ide: z.object({
    realtime: z.boolean().default(false),
    showInlineHints: z.boolean().default(true)
  }).default({})
});

// Cache configuration
const CacheConfig = z.object({
  enabled: z.boolean().default(true),
  directory: z.string().default('.botbie/cache'),
  ttl: z.number().min(0).default(3600), // 1 hour default
  maxSize: z.number().min(0).default(104857600) // 100MB default
});

// Complete Botbie configuration schema
export const BotbieConfigSchema = z.object({
  $schema: z.string().optional(),
  version: z.string().default('1.0.0'),
  analysis: AnalysisConfig.default({}),
  rules: RulesConfig.default({}),
  autoFix: AutoFixConfig.default({}),
  output: OutputConfig.default({}),
  integration: IntegrationConfig.default({}),
  cache: CacheConfig.default({}),
  extends: z.union([z.string(), z.array(z.string())]).optional(),
  plugins: z.array(z.string()).default([]),
  customRules: z.record(z.string(), z.any()).default({})
});

// Export types
export type BotbieConfig = z.infer<typeof BotbieConfigSchema>;
export type SeverityLevel = z.infer<typeof SeverityLevel>;
export type RulesConfig = z.infer<typeof RulesConfig>;
export type AnalysisConfig = z.infer<typeof AnalysisConfig>;
export type AutoFixConfig = z.infer<typeof AutoFixConfig>;
export type OutputConfig = z.infer<typeof OutputConfig>;

// Preset configurations
export const PRESET_CONFIGS: Record<string, Partial<BotbieConfig>> = {
  recommended: {
    rules: {
      complexity: { enabled: true, threshold: 10, severity: 'warning', skipComments: true },
      documentation: { 
        enabled: true, 
        minCoverage: 80, 
        severity: 'warning',
        requireJSDoc: true,
        requireReturn: true,
        requireParam: true,
        requireExample: false,
        publicOnly: true
      },
      naming: {
        enabled: true,
        severity: 'warning',
        conventions: {
          classes: 'PascalCase',
          functions: 'camelCase',
          variables: 'camelCase',
          constants: 'UPPER_CASE',
          interfaces: 'PascalCase'
        }
      },
      security: { 
        enabled: true, 
        severity: 'error',
        detectHardcodedSecrets: true,
        detectSQLInjection: true,
        detectXSS: true,
        customPatterns: []
      },
      performance: { 
        enabled: true,
        severity: 'warning',
        detectMemoryLeaks: true,
        detectBlockingOperations: true,
        detectIneffcientLoops: true
      },
      functionLength: { enabled: true, severity: 'warning', maxLines: 50 },
      fileLength: { enabled: true, severity: 'info', maxLines: 500 },
      duplicateCode: { enabled: true, severity: 'warning', minTokens: 50, skipComments: true }
    }
  },
  strict: {
    analysis: { 
      strictMode: true,
      includePatterns: ['src/**/*'],
      excludePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**'],
      languages: ['typescript', 'javascript'],
      followSymlinks: false,
      ignoreHiddenFiles: true,
      maxFileSize: 1048576
    },
    rules: {
      complexity: { enabled: true, threshold: 5, severity: 'error', skipComments: true },
      documentation: { 
        enabled: true, 
        minCoverage: 95, 
        severity: 'error',
        requireJSDoc: true,
        requireReturn: true,
        requireParam: true,
        requireExample: true,
        publicOnly: false
      },
      naming: {
        enabled: true,
        severity: 'error',
        conventions: {
          classes: 'PascalCase',
          functions: 'camelCase',
          variables: 'camelCase',
          constants: 'UPPER_CASE',
          interfaces: 'PascalCase'
        }
      },
      security: { 
        enabled: true, 
        severity: 'error',
        detectHardcodedSecrets: true,
        detectSQLInjection: true,
        detectXSS: true,
        customPatterns: []
      },
      performance: { 
        enabled: true, 
        severity: 'error',
        detectMemoryLeaks: true,
        detectBlockingOperations: true,
        detectIneffcientLoops: true
      },
      functionLength: { enabled: true, maxLines: 30, severity: 'error' },
      fileLength: { enabled: true, severity: 'warning', maxLines: 300 },
      duplicateCode: { enabled: true, severity: 'error', minTokens: 30, skipComments: true }
    }
  },
  minimal: {
    rules: {
      complexity: { enabled: true, threshold: 20, severity: 'warning', skipComments: true },
      documentation: { 
        enabled: false, 
        severity: 'off',
        minCoverage: 0,
        requireJSDoc: false,
        requireReturn: false,
        requireParam: false,
        requireExample: false,
        publicOnly: true
      },
      naming: {
        enabled: false,
        severity: 'off',
        conventions: {
          classes: 'PascalCase',
          functions: 'camelCase',
          variables: 'camelCase',
          constants: 'UPPER_CASE',
          interfaces: 'PascalCase'
        }
      },
      security: { 
        enabled: true,
        severity: 'error',
        detectHardcodedSecrets: true,
        detectSQLInjection: true,
        detectXSS: true,
        customPatterns: []
      },
      performance: { 
        enabled: false,
        severity: 'off',
        detectMemoryLeaks: false,
        detectBlockingOperations: false,
        detectIneffcientLoops: false
      },
      functionLength: { enabled: false, severity: 'off', maxLines: 100 },
      fileLength: { enabled: false, severity: 'off', maxLines: 1000 },
      duplicateCode: { enabled: false, severity: 'off', minTokens: 100, skipComments: true }
    }
  }
};

// Validation helper
export function validateConfig(config: unknown): BotbieConfig {
  return BotbieConfigSchema.parse(config);
}

// Deep merge helper
function deepMerge(target: any, source: any): any {
  if (!source) return target;
  
  const output = { ...target };
  
  Object.keys(source).forEach(key => {
    if (source[key] !== undefined) {
      if (typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
        output[key] = deepMerge(output[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    }
  });
  
  return output;
}

// Merge configs helper
export function mergeConfigs(...configs: Partial<BotbieConfig>[]): BotbieConfig {
  const merged = configs.reduce((acc, config) => deepMerge(acc, config), {});
  return validateConfig(merged);
}