# CLAUDE.md - UIX Crawler Development Guide

## Project Overview
UIX Crawler is an intelligent UI/UX crawler for discovering and cataloging exceptional UI designs.

## Build and Test Commands
```bash
# Install dependencies
npm install

# Run tests
npm test

# Build TypeScript
npm run build

# Run linting
npm run lint

# Development mode
npm run dev

# Start API server
npm run start:api

# Run crawler
npm run crawl
```

## ESLint Configuration Issue - RESOLVED
### Problem
ESLint was throwing: `TypeError: Cannot read properties of undefined (reading 'ConfigOps')`

### Root Cause
- Missing TypeScript ESLint parser and plugin dependencies
- Incorrect ESLint configuration for TypeScript files
- Monorepo dependency hoisting conflicts

### Solution Applied
1. Updated `.eslintrc.js` with proper TypeScript configuration
2. Added required dependencies to package.json:
   - `@typescript-eslint/eslint-plugin`
   - `@typescript-eslint/parser`
   - `eslint`
3. Configured proper parser options and rules for TypeScript

### Verification
Run `npm run lint` - ESLint now works correctly and reports actual code issues.

## Known Issues
- ESLint reports 15 errors and 66 warnings (mostly unused variables and any types)
- TypeScript compilation is slow but functional
- Some test files may need updates for full coverage

## Development Workflow
1. Make changes to TypeScript files in `src/`
2. Run `npm test` to verify tests pass
3. Run `npm run lint` to check code quality
4. Run `npm run build` to compile TypeScript
5. Commit changes with descriptive messages

## Important Files
- `src/cli.ts` - Main CLI entry point
- `src/api/CrawlerAPI.ts` - REST API for crawler operations
- `src/crawler/UICrawler.ts` - Core crawling logic
- `src/analyzers/` - Design pattern analysis modules
- `src/storage/` - Database and image storage management