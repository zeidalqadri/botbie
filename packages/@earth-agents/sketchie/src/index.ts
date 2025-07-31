export * from './Sketchie';
export * from './strategies';
export * from './generators';
export * from './analyzers';
export * from './types';

// Main export for easy usage
import { Sketchie, SketchieConfig } from './Sketchie';

export function createSketchie(config?: SketchieConfig): Sketchie {
  return new Sketchie(config);
}

export default Sketchie;