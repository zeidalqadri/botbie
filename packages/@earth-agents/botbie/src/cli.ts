#!/usr/bin/env node

import { Command } from 'commander';
import { createBotbie } from './index';
import chalk from 'chalk';
import path from 'path';

const program = new Command();

program
  .name('botbie')
  .description('Botbie - Your proactive code quality guardian')
  .version('1.0.0');

program
  .command('analyze [path]')
  .description('Analyze code quality in the specified directory')
  .option('-o, --output <path>', 'Output directory for reports')
  .option('-f, --fix', 'Automatically fix issues where possible')
  .option('-s, --strict', 'Enable strict mode')
  .option('--json', 'Output results as JSON')
  .action(async (targetPath = '.', options) => {
    const resolvedPath = path.resolve(targetPath);
    
    console.log(chalk.cyan(`\n🤖 Botbie is analyzing ${resolvedPath}...\n`));
    
    try {
      const botbie = createBotbie({
        enableAutoFix: options.fix,
        strictMode: options.strict,
        verbose: !options.json
      });
      
      await botbie.initialize();
      
      const report = await botbie.execute({
        path: resolvedPath,
        options: {
          outputPath: options.output
        }
      });
      
      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
      }
      
      // Exit with error code if critical issues found
      if (report.summary.criticalIssues > 0) {
        process.exit(1);
      }
      
    } catch (error) {
      console.error(chalk.red('\n❌ Analysis failed:'), error);
      process.exit(1);
    }
  });

program
  .command('fix [path]')
  .description('Automatically fix issues in the codebase')
  .option('--dry-run', 'Show what would be fixed without making changes')
  .action(async (targetPath = '.', options) => {
    console.log(chalk.yellow('\n🔧 Auto-fix feature coming soon!\n'));
    // TODO: Implement auto-fix functionality
  });

program
  .command('watch [path]')
  .description('Watch for changes and analyze in real-time')
  .action(async (targetPath = '.') => {
    console.log(chalk.yellow('\n👁️  Watch mode coming soon!\n'));
    // TODO: Implement watch functionality
  });

program
  .command('validate [config]')
  .description('Validate a Botbie configuration file')
  .action(async (configPath = '.botbie.json') => {
    console.log(chalk.cyan(`\n🔍 Validating ${configPath}...\n`));
    
    try {
      const fs = await import('fs');
      const path = await import('path');
      const { ConfigManager } = await import('./config/ConfigManager');
      
      const fullPath = path.resolve(configPath);
      
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Configuration file not found: ${fullPath}`);
      }
      
      const content = fs.readFileSync(fullPath, 'utf-8');
      const config = JSON.parse(content);
      
      const configManager = new ConfigManager();
      const validatedConfig = configManager.validateConfig(config);
      
      console.log(chalk.green('✅ Configuration is valid!\n'));
      console.log(chalk.gray('Configuration summary:'));
      console.log(chalk.gray(`- Version: ${validatedConfig.version}`));
      console.log(chalk.gray(`- Languages: ${validatedConfig.analysis.languages.join(', ')}`));
      console.log(chalk.gray(`- Rules enabled: ${Object.entries(validatedConfig.rules).filter(([_, r]) => r.enabled).length}`));
      console.log(chalk.gray(`- Auto-fix: ${validatedConfig.autoFix.enabled ? 'enabled' : 'disabled'}`));
      console.log(chalk.gray(`- Output formats: ${validatedConfig.output.format.join(', ')}`));
      
    } catch (error: any) {
      console.error(chalk.red('❌ Configuration validation failed:\n'));
      
      if (error.name === 'ZodError') {
        error.errors.forEach((err: any) => {
          console.error(chalk.red(`  - ${err.path.join('.')}: ${err.message}`));
        });
      } else {
        console.error(chalk.red(`  ${error.message}`));
      }
      
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize Botbie configuration in the current project')
  .option('-p, --preset <preset>', 'Configuration preset (recommended, strict, minimal)', 'recommended')
  .option('-f, --file <path>', 'Configuration file path', '.botbie.json')
  .action(async (options) => {
    console.log(chalk.cyan('\n🚀 Initializing Botbie configuration...\n'));
    
    try {
      const { ConfigManager } = await import('./config/ConfigManager');
      const configManager = new ConfigManager();
      
      await configManager.createDefaultConfig(options.file, options.preset);
      
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.gray('1. Review and customize your .botbie.json file'));
      console.log(chalk.gray('2. Run `botbie analyze` to analyze your codebase'));
      console.log(chalk.gray('3. Run `botbie analyze --fix` to auto-fix issues\n'));
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.error(chalk.yellow('⚠️  Configuration file already exists'));
        console.error(chalk.gray('Use --file flag to specify a different path'));
      } else {
        console.error(chalk.red('❌ Failed to create configuration:'), error.message);
      }
      process.exit(1);
    }
  });

program.parse(process.argv);