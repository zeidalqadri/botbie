const { execSync } = require('child_process');
const path = require('path');

console.log('🔨 Building Botbie...');

try {
  // Change to the botbie directory
  process.chdir(__dirname);
  
  // Run TypeScript compiler
  console.log('Compiling TypeScript...');
  execSync('npx tsc', { stdio: 'inherit' });
  
  console.log('✅ Build complete!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}