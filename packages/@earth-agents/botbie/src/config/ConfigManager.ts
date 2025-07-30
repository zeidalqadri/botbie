import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';
import { 
  BotbieConfig, 
  BotbieConfigSchema, 
  validateConfig, 
  mergeConfigs,
  PRESET_CONFIGS 
} from './ConfigSchema';
import { logger } from '@earth-agents/core';
import chalk from 'chalk';

export class ConfigManager {
  private config: BotbieConfig | null = null;
  private configPaths: string[] = [];
  
  constructor(private workingDirectory: string = process.cwd()) {}

  /**
   * Load configuration from multiple sources with priority:
   * 1. CLI arguments (highest)
   * 2. Project config (.botbie.json or .botbie/config.json)
   * 3. User config (~/.botbie/config.json)
   * 4. Environment variables
   * 5. Preset/extended configs
   * 6. Default config (lowest)
   */
  async loadConfig(cliConfig?: Partial<BotbieConfig>): Promise<BotbieConfig> {
    const configs: Partial<BotbieConfig>[] = [];
    
    // 1. Load default config
    configs.push({});
    
    // 2. Load preset configs if specified
    const presetName = process.env.BOTBIE_PRESET;
    if (presetName && PRESET_CONFIGS[presetName]) {
      logger.info(`Loading preset configuration: ${presetName}`);
      configs.push(PRESET_CONFIGS[presetName]);
    }
    
    // 3. Load user config
    const userConfig = this.loadUserConfig();
    if (userConfig) {
      configs.push(userConfig);
    }
    
    // 4. Load project config
    const projectConfig = this.loadProjectConfig();
    if (projectConfig) {
      configs.push(projectConfig);
      
      // Handle extends
      if (projectConfig.extends) {
        const extendedConfigs = await this.loadExtendedConfigs(projectConfig.extends);
        configs.push(...extendedConfigs);
      }
    }
    
    // 5. Apply environment variables
    const envConfig = this.loadEnvConfig();
    if (envConfig) {
      configs.push(envConfig);
    }
    
    // 6. Apply CLI config (highest priority)
    if (cliConfig) {
      configs.push(cliConfig);
    }
    
    // Merge all configs
    this.config = mergeConfigs(...configs);
    
    logger.info(`Configuration loaded from ${this.configPaths.length} sources`);
    return this.config;
  }

  /**
   * Load project configuration file
   */
  private loadProjectConfig(): Partial<BotbieConfig> | null {
    const configFiles = [
      '.botbie.json',
      '.botbie.js',
      '.botbie/config.json',
      'botbie.config.json',
      'botbie.config.js'
    ];
    
    for (const file of configFiles) {
      const configPath = join(this.workingDirectory, file);
      if (existsSync(configPath)) {
        try {
          logger.debug(`Loading project config from ${configPath}`);
          const content = readFileSync(configPath, 'utf-8');
          
          let config: any;
          if (file.endsWith('.js')) {
            // Clear require cache for dynamic loading
            delete require.cache[require.resolve(configPath)];
            config = require(configPath);
          } else {
            config = JSON.parse(content);
          }
          
          this.configPaths.push(configPath);
          return config;
        } catch (error) {
          logger.error(`Failed to load config from ${configPath}:`, error);
        }
      }
    }
    
    return null;
  }

  /**
   * Load user configuration from home directory
   */
  private loadUserConfig(): Partial<BotbieConfig> | null {
    const userConfigPath = join(homedir(), '.botbie', 'config.json');
    
    if (existsSync(userConfigPath)) {
      try {
        logger.debug(`Loading user config from ${userConfigPath}`);
        const content = readFileSync(userConfigPath, 'utf-8');
        this.configPaths.push(userConfigPath);
        return JSON.parse(content);
      } catch (error) {
        logger.error(`Failed to load user config from ${userConfigPath}:`, error);
      }
    }
    
    return null;
  }

  /**
   * Load configuration from environment variables
   */
  private loadEnvConfig(): Partial<BotbieConfig> | null {
    const envConfig: any = {};
    
    // Analysis settings
    if (process.env.BOTBIE_STRICT_MODE) {
      envConfig.analysis = { strictMode: process.env.BOTBIE_STRICT_MODE === 'true' };
    }
    
    // Auto-fix settings
    if (process.env.BOTBIE_AUTO_FIX) {
      envConfig.autoFix = { enabled: process.env.BOTBIE_AUTO_FIX === 'true' };
    }
    
    // Output settings
    if (process.env.BOTBIE_OUTPUT_FORMAT) {
      envConfig.output = { format: process.env.BOTBIE_OUTPUT_FORMAT.split(',') };
    }
    
    if (process.env.BOTBIE_QUIET) {
      envConfig.output = { ...envConfig.output, quiet: process.env.BOTBIE_QUIET === 'true' };
    }
    
    return Object.keys(envConfig).length > 0 ? envConfig : null;
  }

  /**
   * Load extended configurations
   */
  private async loadExtendedConfigs(
    extends_: string | string[]
  ): Promise<Partial<BotbieConfig>[]> {
    const configs: Partial<BotbieConfig>[] = [];
    const extendsList = Array.isArray(extends_) ? extends_ : [extends_];
    
    for (const extendPath of extendsList) {
      try {
        let config: Partial<BotbieConfig>;
        
        // Check if it's a preset
        if (PRESET_CONFIGS[extendPath]) {
          config = PRESET_CONFIGS[extendPath];
        } else {
          // Load from file
          const resolvedPath = resolve(this.workingDirectory, extendPath);
          const content = readFileSync(resolvedPath, 'utf-8');
          config = JSON.parse(content);
        }
        
        configs.push(config);
        logger.debug(`Extended configuration from ${extendPath}`);
      } catch (error) {
        logger.error(`Failed to load extended config from ${extendPath}:`, error);
      }
    }
    
    return configs;
  }

  /**
   * Get the current configuration
   */
  getConfig(): BotbieConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  /**
   * Validate a configuration object
   */
  validateConfig(config: unknown): BotbieConfig {
    return validateConfig(config);
  }

  /**
   * Create a default configuration file
   */
  async createDefaultConfig(
    path: string = '.botbie.json',
    preset: keyof typeof PRESET_CONFIGS = 'recommended'
  ): Promise<void> {
    const configPath = join(this.workingDirectory, path);
    
    if (existsSync(configPath)) {
      throw new Error(`Configuration file already exists at ${configPath}`);
    }
    
    const config = {
      $schema: 'https://botbie.dev/schemas/config.json',
      extends: preset,
      ...PRESET_CONFIGS[preset]
    };
    
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(chalk.green(`✅ Created configuration file at ${configPath}`));
  }

  /**
   * Get configuration file paths that were loaded
   */
  getConfigPaths(): string[] {
    return this.configPaths;
  }

  /**
   * Reload configuration
   */
  async reloadConfig(): Promise<BotbieConfig> {
    this.config = null;
    this.configPaths = [];
    return this.loadConfig();
  }

  /**
   * Get effective configuration for a specific file
   */
  getFileConfig(filePath: string): BotbieConfig {
    const config = this.getConfig();
    
    // Check if file matches exclude patterns
    const relativePath = filePath.replace(this.workingDirectory, '').replace(/^\//, '');
    
    for (const pattern of config.analysis.excludePatterns) {
      if (this.matchesPattern(relativePath, pattern)) {
        // Return config with all rules disabled for excluded files
        return {
          ...config,
          rules: Object.fromEntries(
            Object.entries(config.rules).map(([key, value]) => [
              key,
              { ...value, enabled: false }
            ])
          ) as any
        };
      }
    }
    
    return config;
  }

  /**
   * Simple pattern matching (supports * and ** wildcards)
   */
  private matchesPattern(path: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');
      
    return new RegExp(`^${regexPattern}$`).test(path);
  }

  /**
   * Export configuration to JSON schema
   */
  static exportSchema(): any {
    return BotbieConfigSchema;
  }
}