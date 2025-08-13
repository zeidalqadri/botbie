#!/usr/bin/env node

/**
 * Earth Agents - Claude Code Activation Script
 * 
 * Run this script to activate all Earth Agents specialists as slash commands in Claude Code
 */

const { registerWithClaudeCode, EarthAgentsPlugin } = require('./dist/claude-cli-integration');
const { registerAllSpecialists } = require('./dist/agents');

console.log('🚀 Activating Earth Agents for Claude Code...\n');

// Register all specialists
registerAllSpecialists();

// Create the plugin instance
const plugin = new EarthAgentsPlugin();

console.log('\n✅ Earth Agents Successfully Activated!\n');
console.log('📋 Available Commands:\n');

// Display available commands grouped by category
const categories = {
  'language': '🔤 Language Specialists',
  'architecture': '🏗️ Architecture & Backend',
  'development': '💻 Development & Frontend',
  'quality': '✅ Quality & Security',
  'infrastructure': '☁️ Infrastructure & DevOps',
  'ai-ml': '🤖 AI & Machine Learning',
  'data': '📊 Data & Analytics',
  'platform': '🌐 Platform Specialists',
  'system': '⚙️ System Commands'
};

const commandsByCategory = {};

plugin.commands.forEach(cmd => {
  const category = cmd.category || 'general';
  if (!commandsByCategory[category]) {
    commandsByCategory[category] = [];
  }
  commandsByCategory[category].push(cmd);
});

Object.entries(commandsByCategory).forEach(([category, commands]) => {
  if (categories[category]) {
    console.log(`\n${categories[category]}`);
    commands.forEach(cmd => {
      console.log(`  /${cmd.name.padEnd(25)} - ${cmd.description}`);
    });
  }
});

console.log('\n🎯 Usage Examples:\n');
console.log('  /python-pro "optimize this async function"');
console.log('  /security-auditor "review this authentication code"');
console.log('  /backend-architect "design microservices for e-commerce"');
console.log('  /help              Show all available commands');
console.log('  /agents            List all specialists with details');
console.log('  /search react      Find React-related specialists');

console.log('\n💡 Tips:');
console.log('  • Be specific with your requests');
console.log('  • Include code context when applicable');
console.log('  • Use /help [keyword] to filter commands');
console.log('  • Many commands have aliases (e.g., /py for /python-pro)');

console.log('\n🎉 All 33 Earth Agents specialists are now ready to use in Claude Code!');
console.log('');

// Export for programmatic use
module.exports = {
  plugin,
  activate: registerWithClaudeCode
};