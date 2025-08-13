/**
 * DebugEarth Specialist Strategies
 * 
 * Enhanced debugging strategies powered by specialist agents
 */

export * from './DevOpsTroubleshootingStrategy';
export * from './PerformanceDebuggingStrategy';
export * from './SecurityDebuggingStrategy';

// Import all strategies for easy registration
import { DevOpsTroubleshootingStrategy } from './DevOpsTroubleshootingStrategy';
import { PerformanceDebuggingStrategy } from './PerformanceDebuggingStrategy';
import { SecurityDebuggingStrategy } from './SecurityDebuggingStrategy';

/**
 * Register all specialist strategies with DebugEarth
 */
export function registerDebugEarthSpecialistStrategies(debugEarth: any): void {
  // Register infrastructure debugging strategies
  debugEarth.registerStrategy('devops-troubleshooting', new DevOpsTroubleshootingStrategy());
  
  // Register performance debugging strategies
  debugEarth.registerStrategy('performance-debugging', new PerformanceDebuggingStrategy());
  
  // Register security debugging strategies
  debugEarth.registerStrategy('security-debugging', new SecurityDebuggingStrategy());
}

/**
 * Get all specialist strategy instances
 */
export function getDebugEarthSpecialistStrategies() {
  return {
    'devops-troubleshooting': new DevOpsTroubleshootingStrategy(),
    'performance-debugging': new PerformanceDebuggingStrategy(),
    'security-debugging': new SecurityDebuggingStrategy()
  };
}