/**
 * Sketchie Specialist Strategies
 * 
 * Enhanced UI/UX design strategies powered by specialist agents
 */

export * from './UIDesignStrategy';
export * from './ResponsiveDesignStrategy';
export * from './AccessibilityStrategy';

// Import all strategies for easy registration
import { UIDesignStrategy } from './UIDesignStrategy';
import { ResponsiveDesignStrategy } from './ResponsiveDesignStrategy';
import { AccessibilityStrategy } from './AccessibilityStrategy';

/**
 * Register all specialist strategies with Sketchie
 */
export function registerSketchieSpecialistStrategies(sketchie: any): void {
  // Register UI design strategies
  sketchie.registerStrategy('ui-design', new UIDesignStrategy());
  
  // Register responsive design strategies
  sketchie.registerStrategy('responsive-design', new ResponsiveDesignStrategy());
  
  // Register accessibility strategies
  sketchie.registerStrategy('accessibility', new AccessibilityStrategy());
}

/**
 * Get all specialist strategy instances
 */
export function getSketchieSpecialistStrategies() {
  return {
    'ui-design': new UIDesignStrategy(),
    'responsive-design': new ResponsiveDesignStrategy(),
    'accessibility': new AccessibilityStrategy()
  };
}