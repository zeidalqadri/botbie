#!/usr/bin/env node

// Start script that runs TypeScript directly without build step
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    target: 'es2022',
    esModuleInterop: true,
    skipLibCheck: true
  }
});

require('./src/index.ts');