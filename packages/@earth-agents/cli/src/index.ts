#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { createBotbie } from '@earth-agents/botbie';
import path from 'path';
import { existsSync } from 'fs';

const program = new Command();

// Print banner
console.log(chalk.cyan(figlet.textSync('Earth Agents', { horizontalLayout: 'default' })));
console.log(chalk.yellow('Your comprehensive code health platform\n'));

program
  .name('earth')
  .description('Unified CLI for Earth Agents ecosystem')
  .version('1.0.0');

// Botbie commands
program
  .command('analyze [path]')
  .alias('botbie')
  .description('Analyze code quality with Botbie')
  .option('-o, --output <path>', 'Output directory for reports')
  .option('-f, --fix', 'Automatically fix issues where possible')
  .option('-s, --strict', 'Enable strict mode')
  .option('--json', 'Output results as JSON')
  .action(async (targetPath = '.', options) => {
    console.log(chalk.blue('\n🤖 Launching Botbie...\n'));
    
    try {
      const botbie = createBotbie({
        enableAutoFix: options.fix,
        strictMode: options.strict,
        verbose: !options.json
      });
      
      await botbie.initialize();
      
      const report = await botbie.execute({
        path: path.resolve(targetPath),
        options: {
          outputPath: options.output
        }
      });
      
      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
      }
      
      if (report.summary.criticalIssues > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('Analysis failed:'), error);
      process.exit(1);
    }
  });

// DebugEarth commands
program
  .command('debug [description]')
  .alias('debugearth')
  .description('Start a debugging session with DebugEarth')
  .option('-v, --verbose', 'Enable verbose output')
  .action(async (description, options) => {
    console.log(chalk.green('\n🌍 Launching DebugEarth...\n'));
    
    try {
      // Check if DebugEarth is available
      const debugEarthPath = path.join(__dirname, '../../..', 'debugearth');
      if (existsSync(debugEarthPath)) {
        const { createDebugEarth } = await import(path.join(debugEarthPath, 'dist', 'index.js'));
        const debugEarth = createDebugEarth({ verbose: options.verbose });
        
        const session = await debugEarth.startDebugging(description || 'Interactive debugging session');
        console.log(chalk.yellow(`\nSession ID: ${session.id}`));
        console.log(chalk.cyan('DebugEarth is now monitoring for issues...\n'));
      } else {
        console.log(chalk.yellow('DebugEarth module not found. Please ensure it is built.'));
      }
    } catch (error) {
      console.error(chalk.red('Failed to start DebugEarth:'), error);
      process.exit(1);
    }
  });

// Combined workflow
program
  .command('monitor [path]')
  .description('Monitor code health and debug issues in real-time')
  .option('-i, --interval <minutes>', 'Check interval in minutes', '30')
  .action(async (targetPath = '.', options) => {
    console.log(chalk.magenta('\n🔍 Starting Earth Agents monitoring...\n'));
    
    console.log(chalk.blue('Running initial Botbie analysis...'));
    
    try {
      const botbie = createBotbie({ verbose: false });
      await botbie.initialize();
      
      const runAnalysis = async () => {
        const report = await botbie.execute({
          path: path.resolve(targetPath),
          options: {}
        });
        
        if (report.summary.criticalIssues > 0) {
          console.log(chalk.red(`\n⚠️  Found ${report.summary.criticalIssues} critical issues!`));
          console.log(chalk.yellow('Consider running: earth debug "Fix critical issues"'));
        } else {
          console.log(chalk.green(`\n✅ Code health is good (Score: ${report.summary.qualityScore}/100)`));
        }
        
        return report;
      };
      
      // Initial analysis
      await runAnalysis();
      
      // Set up monitoring
      const intervalMs = parseInt(options.interval) * 60 * 1000;
      console.log(chalk.cyan(`\n👁️  Monitoring every ${options.interval} minutes...`));
      console.log(chalk.gray('Press Ctrl+C to stop'));
      
      setInterval(runAnalysis, intervalMs);
      
    } catch (error) {
      console.error(chalk.red('Monitoring failed:'), error);
      process.exit(1);
    }
  });

// Auto-fix workflow
program
  .command('fix [path]')
  .description('Automatically fix code issues found by Botbie')
  .option('--dry-run', 'Preview changes without applying them')
  .option('--type <types...>', 'Fix only specific issue types')
  .action(async (targetPath = '.', options) => {
    console.log(chalk.yellow('\n🔧 Auto-fix feature coming soon!\n'));
    console.log('This will:');
    console.log('1. Run Botbie analysis');
    console.log('2. Identify auto-fixable issues');
    console.log('3. Apply fixes safely');
    console.log('4. Re-run analysis to confirm improvements');
  });

// Configuration management
program
  .command('init')
  .description('Initialize Earth Agents configuration')
  .action(async () => {
    console.log(chalk.green('\n📝 Initializing Earth Agents configuration...\n'));
    
    const config = {
      version: '1.0.0',
      botbie: {
        enableAutoFix: false,
        strictMode: false,
        ignorePatterns: ['node_modules', 'dist', 'build'],
        customRules: []
      },
      debugearth: {
        verbose: true,
        maxAttempts: 10,
        persistence: false
      }
    };
    
    const configPath = path.join(process.cwd(), '.earthagents.json');
    const { writeFileSync } = await import('fs');
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    console.log(chalk.green(`✅ Created ${configPath}`));
    console.log(chalk.cyan('\nYou can now customize your Earth Agents settings!'));
  });

// Info command
program
  .command('info')
  .description('Display information about Earth Agents')
  .action(() => {
    console.log(chalk.blue('\n📚 Earth Agents Ecosystem\n'));
    console.log(chalk.green('🤖 Botbie') + ' - Proactive code quality guardian');
    console.log('   • Analyzes code structure and quality');
    console.log('   • Detects code smells and anti-patterns');
    console.log('   • Suggests improvements and fixes');
    console.log('   • Generates comprehensive reports\n');
    
    console.log(chalk.green('🌍 DebugEarth') + ' - Methodical debugging assistant');
    console.log('   • Root cause analysis with 5 Whys');
    console.log('   • Evidence-based debugging');
    console.log('   • Multiple debugging strategies');
    console.log('   • Mathematical proof generation\n');
    
    console.log(chalk.yellow('Together, they provide complete code health management!'));
  });

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}