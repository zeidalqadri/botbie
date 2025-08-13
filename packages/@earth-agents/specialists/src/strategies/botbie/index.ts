/**
 * Botbie Specialist Strategies
 * 
 * Enhanced code quality analysis strategies powered by specialist agents
 */

export * from './SecurityAuditStrategy';
export * from './DatabaseOptimizationStrategy';
export * from './APIDesignStrategy';
export * from './CodeRefactoringStrategy';
export * from './TestCoverageStrategy';

// Import all strategies for easy registration
import { SecurityAuditStrategy } from './SecurityAuditStrategy';
import { DatabaseOptimizationStrategy } from './DatabaseOptimizationStrategy';
import { APIDesignStrategy } from './APIDesignStrategy';
import { CodeRefactoringStrategy } from './CodeRefactoringStrategy';
import { TestCoverageStrategy } from './TestCoverageStrategy';

/**
 * Register all specialist strategies with Botbie
 */
export function registerBotbieSpecialistStrategies(botbie: any): void {
  // Register security-focused strategies
  botbie.registerStrategy('security-audit', new SecurityAuditStrategy());
  
  // Register optimization strategies
  botbie.registerStrategy('database-optimization', new DatabaseOptimizationStrategy());
  
  // Register design strategies
  botbie.registerStrategy('api-design', new APIDesignStrategy());
  
  // Register quality strategies
  botbie.registerStrategy('code-refactoring', new CodeRefactoringStrategy());
  botbie.registerStrategy('test-coverage', new TestCoverageStrategy());
}

/**
 * Get all specialist strategy instances
 */
export function getBotbieSpecialistStrategies() {
  return {
    'security-audit': new SecurityAuditStrategy(),
    'database-optimization': new DatabaseOptimizationStrategy(),
    'api-design': new APIDesignStrategy(),
    'code-refactoring': new CodeRefactoringStrategy(),
    'test-coverage': new TestCoverageStrategy()
  };
}