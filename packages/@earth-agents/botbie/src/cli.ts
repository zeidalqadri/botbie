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
  .command('init')
  .description('Initialize Botbie configuration in the current project')
  .action(async () => {
    console.log(chalk.green('\n📝 Creating .botbie.json configuration...\n'));
    // TODO: Create default configuration file
  });

program.parse(process.argv);