import { Evidence } from '@earth-agents/core';

export interface DesignInput {
  type: 'figma' | 'sketch' | 'image' | 'url' | 'description';
  source: string;
  metadata?: Record<string, any>;
}

export interface UIComponent {
  name: string;
  type: ComponentType;
  props: PropDefinition[];
  styles: StyleDefinition;
  children?: UIComponent[];
  accessibility?: AccessibilityInfo;
  typescript?: string;
  jsx?: string;
  css?: string;
}

export type ComponentType = 
  | 'button'
  | 'input'
  | 'form'
  | 'card'
  | 'list'
  | 'navigation'
  | 'layout'
  | 'text'
  | 'image'
  | 'custom';

export interface PropDefinition {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface StyleDefinition {
  layout?: LayoutStyle;
  typography?: TypographyStyle;
  colors?: ColorStyle;
  spacing?: SpacingStyle;
  effects?: EffectStyle;
  responsive?: ResponsiveStyle[];
}

export interface LayoutStyle {
  display?: string;
  position?: string;
  width?: string;
  height?: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  gap?: string;
  padding?: string;
  margin?: string;
}

export interface TypographyStyle {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: string;
  color?: string;
}

export interface ColorStyle {
  background?: string;
  text?: string;
  border?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
}

export interface SpacingStyle {
  small: string;
  medium: string;
  large: string;
  xlarge: string;
}

export interface EffectStyle {
  borderRadius?: string;
  boxShadow?: string;
  opacity?: number;
  transform?: string;
  transition?: string;
}

export interface ResponsiveStyle {
  breakpoint: string;
  styles: Partial<StyleDefinition>;
}

export interface AccessibilityInfo {
  role?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  tabIndex?: number;
  wcagLevel?: 'A' | 'AA' | 'AAA';
  issues?: AccessibilityIssue[];
}

export interface AccessibilityIssue {
  rule: string;
  severity: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  fix?: string;
}

export interface DesignToken {
  category: 'color' | 'typography' | 'spacing' | 'shadow' | 'radius';
  name: string;
  value: string | number;
  description?: string;
}

export interface DesignSystem {
  name: string;
  version: string;
  tokens: DesignToken[];
  components: ComponentLibrary[];
  guidelines?: DesignGuideline[];
}

export interface ComponentLibrary {
  name: string;
  components: UIComponent[];
  dependencies?: string[];
}

export interface DesignGuideline {
  category: string;
  title: string;
  description: string;
  examples?: string[];
}

export interface UIAnalysisResult {
  components: UIComponent[];
  patterns: UIPattern[];
  accessibility: AccessibilityReport;
  performance: PerformanceMetrics;
  suggestions: UISuggestion[];
}

export interface UIPattern {
  name: string;
  frequency: number;
  description: string;
  examples: string[];
  recommendation?: string;
}

export interface AccessibilityReport {
  score: number;
  wcagLevel: 'A' | 'AA' | 'AAA' | 'None';
  issues: AccessibilityIssue[];
  passes: string[];
}

export interface PerformanceMetrics {
  bundleSize: number;
  renderTime: number;
  reRenderCount: number;
  memoryUsage: number;
  suggestions: string[];
}

export interface UISuggestion {
  type: 'improvement' | 'warning' | 'error';
  component?: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  autoFixAvailable: boolean;
}

export interface ComponentGenerationOptions {
  framework: 'react' | 'vue' | 'angular' | 'webcomponents';
  typescript: boolean;
  styling: 'css' | 'scss' | 'styled-components' | 'emotion' | 'tailwind';
  testing: boolean;
  storybook: boolean;
  accessibility: boolean;
}

export interface SketchAnalysisResult {
  elements: SketchElement[];
  layout: LayoutAnalysis;
  confidence: number;
  suggestions: string[];
}

export interface SketchElement {
  type: ComponentType;
  bounds: { x: number; y: number; width: number; height: number };
  text?: string;
  confidence: number;
}

export interface LayoutAnalysis {
  type: 'grid' | 'flex' | 'absolute' | 'mixed';
  rows?: number;
  columns?: number;
  spacing?: number;
}

export interface UIEvidence extends Evidence {
  type: 'design-analysis' | 'component-generation' | 'accessibility-audit' | 'performance-profile';
  data: {
    design?: DesignInput;
    component?: UIComponent;
    analysis?: UIAnalysisResult;
    metrics?: PerformanceMetrics;
  };
}