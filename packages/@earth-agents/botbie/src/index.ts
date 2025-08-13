export * from './Botbie';
export * from './parsers/CodeParser';
export * from './analyzers/QualityAnalyzer';
export * from './reports/ReportGenerator';
export { BaseStrategy } from './strategies/BaseStrategy';

// Main export for easy usage
import { Botbie, BotbieConfig } from './Botbie';

export function createBotbie(config?: BotbieConfig): Botbie {
  return new Botbie(config);
}

export default Botbie;