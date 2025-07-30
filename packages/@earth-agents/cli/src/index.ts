#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { createBotbie } from '@earth-agents/botbie';
import { SessionManager } from '@earth-agents/core';
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

// Intelligent workflow commands
program
  .command('workflow <type>')
  .description('Run intelligent cross-agent workflows')
  .option('-p, --path <path>', 'Target path', '.')
  .option('--severity <level>', 'Minimum severity level (low, medium, high, critical)', 'medium')
  .action(async (workflowType, options) => {
    const sessionManager = SessionManager.getInstance();
    
    switch (workflowType) {
      case 'preventive':
        await runPreventiveWorkflow(options, sessionManager);
        break;
      case 'detective':
        await runDetectiveWorkflow(options, sessionManager);
        break;
      case 'comprehensive':
        await runComprehensiveWorkflow(options, sessionManager);
        break;
      default:
        console.log(chalk.red(`Unknown workflow type: ${workflowType}`));
        console.log(chalk.yellow('Available workflows: preventive, detective, comprehensive'));
    }
  });

// Cross-agent insight commands
program
  .command('insights')
  .description('View and manage cross-agent insights')
  .option('--agent <type>', 'Filter by agent type (botbie, debugearth)')
  .action(async (options) => {
    const sessionManager = SessionManager.getInstance();
    
    if (options.agent) {
      const insights = sessionManager.getInsightsForAgent(options.agent as 'botbie' | 'debugearth');
      displayInsights(insights, options.agent);
    } else {
      const allInsights = [...sessionManager.getInsightsForAgent('botbie'), ...sessionManager.getInsightsForAgent('debugearth')];
      displayInsights(allInsights, 'all');
    }
  });

// Session management commands  
program
  .command('sessions')
  .description('View active sessions and correlations')
  .option('--status <status>', 'Filter by status (active, resolved, exploring)')
  .action(async (options) => {
    const sessionManager = SessionManager.getInstance();
    const stats = sessionManager.getStatistics();
    
    console.log(chalk.blue('\n📊 Session Statistics\n'));
    console.log(`${chalk.bold('Total Sessions:')} ${stats.totalSessions}`);
    console.log(`${chalk.bold('Active Sessions:')} ${stats.activeSessions}`);
    console.log(`${chalk.bold('Cross-Agent Insights:')} ${stats.totalInsights}`);
    console.log(`${chalk.bold('Session Correlations:')} ${stats.correlations}`);
    
    console.log(chalk.cyan('\n🤖 Agent Breakdown:'));
    console.log(`  Botbie: ${stats.agentBreakdown.botbie}`);
    console.log(`  DebugEarth: ${stats.agentBreakdown.debugearth}`);
    console.log(`  Unified: ${stats.agentBreakdown.unified}`);
    
    // Learning statistics
    if (stats.learning) {
      console.log(chalk.magenta('\n🧠 Learning System:'));
      console.log(`  Patterns Learned: ${stats.learning.totalPatterns}`);
      console.log(`  Active Patterns: ${stats.learning.activePatterns}`);
      console.log(`  Feedback Loops: ${stats.learning.feedbackLoopsCreated}`);
      console.log(`  Improvement Score: ${stats.learning.improvementScore.toFixed(1)}/100`);
      console.log(`  Pattern Confidence: ${(stats.learning.averageConfidence * 100).toFixed(1)}%`);
    }
  });

// Learning system commands
program
  .command('learning <action>')
  .description('Interact with the learning system')
  .option('--type <type>', 'Pattern type filter')
  .option('--format <format>', 'Output format (table, json)', 'table')
  .action(async (action, options) => {
    const sessionManager = SessionManager.getInstance();
    
    switch (action) {
      case 'patterns':
        const patterns = options.type 
          ? sessionManager.getLearningPatternsByType(options.type)
          : sessionManager.getLearningPatterns();
        displayLearningPatterns(patterns, options.format);
        break;
        
      case 'feedback':
        const feedback = sessionManager.getFeedbackLoops();
        displayFeedbackLoops(feedback, options.format);
        break;
        
      case 'metrics':
        const metrics = sessionManager.getStatistics().learning;
        if (metrics) {
          displayLearningMetrics(metrics, options.format);
        } else {
          console.log(chalk.yellow('No learning metrics available yet.'));
        }
        break;
        
      case 'cleanup':
        sessionManager.cleanupLearningData();
        console.log(chalk.green('✅ Learning data cleanup completed'));
        break;
        
      default:
        console.log(chalk.red(`Unknown learning action: ${action}`));
        console.log(chalk.yellow('Available actions: patterns, feedback, metrics, cleanup'));
    }
  });

// MCP server command
program
  .command('mcp')
  .description('Start the unified MCP server for Claude Desktop integration')
  .action(async () => {
    console.log(chalk.blue('\n🔗 Starting Unified Earth Agents MCP Server...\n'));
    console.log(chalk.yellow('Add this to your Claude Desktop configuration:'));
    console.log(chalk.gray(''));
    console.log(chalk.cyan(JSON.stringify({
      "mcpServers": {
        "earth-agents": {
          "command": "earth-mcp",
          "args": []
        }
      }
    }, null, 2)));
    console.log(chalk.gray(''));
    
    // Import and start the MCP server
    try {
      const mcpServerPath = path.join(__dirname, 'unified-mcp-server.js');
      if (existsSync(mcpServerPath)) {
        require(mcpServerPath);
      } else {
        console.log(chalk.red('MCP server not found. Please run: npm run build'));
      }
    } catch (error) {
      console.error(chalk.red('Failed to start MCP server:'), error);
    }
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
    
    console.log(chalk.cyan('🔗 Intelligent Workflows:'));
    console.log('   • earth workflow preventive - Proactive quality checks');
    console.log('   • earth workflow detective - Reactive bug investigation');
    console.log('   • earth workflow comprehensive - Full spectrum analysis\n');
    
    console.log(chalk.yellow('Together, they provide complete code health management!'));
  });

// Workflow helper functions
async function runPreventiveWorkflow(options: any, sessionManager: SessionManager) {
  console.log(chalk.blue('\n🛡️ Running Preventive Workflow\n'));
  
  // Create unified session
  const session = sessionManager.createSession(
    `Preventive analysis of ${options.path}`,
    'unified'
  );
  
  console.log(chalk.cyan('Step 1: Proactive Quality Analysis (Botbie)'));
  
  try {
    const botbie = createBotbie({ strictMode: true, verbose: false });
    await botbie.initialize();
    
    const report = await botbie.execute({
      path: path.resolve(options.path),
      options: {}
    });
    
    // Add findings as evidence
    sessionManager.addEvidence(session.id, {
      type: 'code-quality',
      data: {
        qualityScore: report.summary.qualityScore,
        criticalIssues: report.summary.criticalIssues,
        issues: report.issues.filter(i => i.severity === 'critical' || i.severity === 'high')
      },
      context: { agent: 'botbie', workflow: 'preventive' },
      confidence: 0.9,
      impact: report.summary.criticalIssues > 0 ? 'high' : 'medium'
    });
    
    console.log(chalk.green(`✅ Quality score: ${report.summary.qualityScore}/100`));
    console.log(chalk.yellow(`⚠️  Found ${report.summary.criticalIssues} critical issues`));
    
    // If critical issues found, suggest detective workflow
    if (report.summary.criticalIssues > 0) {
      console.log(chalk.red('\n🚨 Critical issues detected!'));
      console.log(chalk.yellow('Recommendation: Run detective workflow to investigate'));
      console.log(chalk.gray('  earth workflow detective --path ' + options.path));
    }
    
  } catch (error) {
    console.error(chalk.red('Preventive workflow failed:'), error);
  }
  
  sessionManager.updateSessionStatus(session.id, 'resolved');
}

async function runDetectiveWorkflow(options: any, sessionManager: SessionManager) {
  console.log(chalk.blue('\n🔍 Running Detective Workflow\n'));
  
  const session = sessionManager.createSession(
    `Detective investigation of ${options.path}`,
    'unified'
  );
  
  console.log(chalk.cyan('Step 1: Quality Pre-analysis (Botbie)'));
  
  try {
    const botbie = createBotbie({ verbose: false });
    await botbie.initialize();
    
    const report = await botbie.execute({
      path: path.resolve(options.path),
      options: {}
    });
    
    // Add quality evidence
    sessionManager.addEvidence(session.id, {
      type: 'code-quality',
      data: report,
      context: { agent: 'botbie', workflow: 'detective', phase: 'pre-analysis' },
      confidence: 0.8,
      impact: 'medium'
    });
    
    console.log(chalk.green('✅ Pre-analysis complete'));
    
    console.log(chalk.cyan('\nStep 2: Root Cause Investigation (DebugEarth)'));
    
    // Check if DebugEarth is available
    const debugEarthPath = path.join(__dirname, '../../..', 'debugearth');
    if (existsSync(debugEarthPath)) {
      console.log(chalk.yellow('🌍 Starting DebugEarth investigation...'));
      console.log(chalk.gray('Note: This would integrate with DebugEarth for deep investigation'));
      
      // Simulate DebugEarth integration
      sessionManager.addEvidence(session.id, {
        type: 'user-report',
        data: {
          description: 'Simulated debugging session',
          patterns: report.issues.map(i => i.type)
        },
        context: { agent: 'debugearth', workflow: 'detective' },
        confidence: 0.7,
        impact: 'high'
      });
    } else {
      console.log(chalk.yellow('⚠️  DebugEarth not found - using Botbie insights only'));
    }
    
    // Show cross-agent insights
    const insights = sessionManager.getInsightsForAgent('botbie');
    if (insights.length > 0) {
      console.log(chalk.blue('\n💡 Cross-Agent Insights:'));
      insights.slice(0, 3).forEach(insight => {
        console.log(`  • ${insight.title}`);
        console.log(`    ${chalk.gray(insight.description)}`);
      });
    }
    
  } catch (error) {
    console.error(chalk.red('Detective workflow failed:'), error);
  }
  
  sessionManager.updateSessionStatus(session.id, 'resolved');
}

async function runComprehensiveWorkflow(options: any, sessionManager: SessionManager) {
  console.log(chalk.blue('\n🎯 Running Comprehensive Workflow\n'));
  
  const session = sessionManager.createSession(
    `Comprehensive analysis of ${options.path}`,
    'unified'
  );
  
  console.log(chalk.cyan('Running both preventive and detective workflows...\n'));
  
  // Run preventive first
  await runPreventiveWorkflow(options, sessionManager);
  
  console.log(chalk.cyan('\n' + '─'.repeat(50) + '\n'));
  
  // Then run detective
  await runDetectiveWorkflow(options, sessionManager);
  
  // Final summary
  const stats = sessionManager.getStatistics();
  console.log(chalk.blue('\n📊 Comprehensive Analysis Complete\n'));
  console.log(`${chalk.bold('Total Sessions:')} ${stats.totalSessions}`);
  console.log(`${chalk.bold('Insights Generated:')} ${stats.totalInsights}`);
  
  sessionManager.updateSessionStatus(session.id, 'resolved');
}

function displayInsights(insights: any[], agentFilter: string) {
  console.log(chalk.blue(`\n💡 Cross-Agent Insights (${agentFilter})\n`));
  
  if (insights.length === 0) {
    console.log(chalk.gray('No insights available yet.'));
    console.log(chalk.yellow('Run some workflows to generate insights!'));
    return;
  }
  
  insights.forEach((insight, index) => {
    const impactColor = insight.impact === 'critical' ? chalk.red :
                       insight.impact === 'high' ? chalk.yellow :
                       chalk.green;
    
    console.log(`${index + 1}. ${chalk.bold(insight.title)}`);
    console.log(`   ${chalk.gray(insight.description)}`);
    console.log(`   ${chalk.blue('Source:')} ${insight.sourceAgent} → ${insight.targetAgent}`);
    console.log(`   ${chalk.cyan('Impact:')} ${impactColor(insight.impact)} | ${chalk.magenta('Confidence:')} ${Math.round(insight.confidence * 100)}%`);
    console.log(`   ${chalk.gray('Generated:')} ${insight.timestamp.toLocaleString()}\n`);
  });
}

function displayLearningPatterns(patterns: any[], format: string) {
  if (format === 'json') {
    console.log(JSON.stringify(patterns, null, 2));
    return;
  }
  
  console.log(chalk.blue('\n🧠 Learning Patterns\n'));
  
  if (patterns.length === 0) {
    console.log(chalk.gray('No learning patterns discovered yet.'));
    console.log(chalk.yellow('Run some analyses to start learning!'));
    return;
  }
  
  patterns.forEach((pattern, index) => {
    const impactColor = pattern.impact === 'critical' ? chalk.red :
                       pattern.impact === 'high' ? chalk.yellow :
                       pattern.impact === 'medium' ? chalk.cyan :
                       chalk.green;
    
    console.log(`${index + 1}. ${chalk.bold(pattern.description)}`);
    console.log(`   ${chalk.blue('Type:')} ${pattern.type}`);
    console.log(`   ${chalk.cyan('Impact:')} ${impactColor(pattern.impact)} | ${chalk.magenta('Confidence:')} ${Math.round(pattern.confidence * 100)}%`);
    console.log(`   ${chalk.green('Occurrences:')} ${pattern.occurrences} | ${chalk.gray('Last Seen:')} ${pattern.lastSeen.toLocaleDateString()}`);
    
    if (pattern.recommendations.length > 0) {
      console.log(`   ${chalk.yellow('Recommendations:')}`);
      pattern.recommendations.slice(0, 2).forEach((rec: string) => {
        console.log(`     • ${rec}`);
      });
    }
    console.log('');
  });
}

function displayFeedbackLoops(feedbackLoops: any[], format: string) {
  if (format === 'json') {
    console.log(JSON.stringify(feedbackLoops, null, 2));
    return;
  }
  
  console.log(chalk.blue('\n🔄 Feedback Loops\n'));
  
  if (feedbackLoops.length === 0) {
    console.log(chalk.gray('No feedback loops created yet.'));
    console.log(chalk.yellow('Learning patterns will create feedback loops automatically!'));
    return;
  }
  
  feedbackLoops.forEach((feedback, index) => {
    const effectivenessColor = feedback.effectiveness > 0.7 ? chalk.green :
                              feedback.effectiveness > 0.4 ? chalk.yellow :
                              chalk.red;
    
    console.log(`${index + 1}. ${chalk.bold(feedback.description)}`);
    console.log(`   ${chalk.blue('Target:')} ${feedback.targetAgent} | ${chalk.cyan('Action:')} ${feedback.actionType}`);
    console.log(`   ${chalk.green('Effectiveness:')} ${effectivenessColor(Math.round(feedback.effectiveness * 100) + '%')}`);
    console.log(`   ${chalk.gray('Created:')} ${feedback.timestamp.toLocaleDateString()}\n`);
  });
}

function displayLearningMetrics(metrics: any, format: string) {
  if (format === 'json') {
    console.log(JSON.stringify(metrics, null, 2));
    return;
  }
  
  console.log(chalk.blue('\n📊 Learning System Metrics\n'));
  
  console.log(`${chalk.bold('Overall Health:')}`);
  const scoreColor = metrics.improvementScore >= 70 ? chalk.green :
                    metrics.improvementScore >= 40 ? chalk.yellow :
                    chalk.red;
  console.log(`  Improvement Score: ${scoreColor(metrics.improvementScore.toFixed(1) + '/100')}`);
  console.log(`  Pattern Confidence: ${chalk.cyan((metrics.averageConfidence * 100).toFixed(1) + '%')}`);
  
  console.log(`\n${chalk.bold('Pattern Breakdown:')}`);
  console.log(`  Total Patterns: ${metrics.totalPatterns}`);
  console.log(`  Active Patterns: ${chalk.green(metrics.activePatterns)} (last 30 days)`);
  console.log(`  Feedback Loops: ${metrics.feedbackLoopsCreated}`);
  
  if (Object.keys(metrics.patternsByType).length > 0) {
    console.log(`\n${chalk.bold('Pattern Types:')}`);
    Object.entries(metrics.patternsByType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  }
}

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}