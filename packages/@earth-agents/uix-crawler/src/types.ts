export interface CrawlOptions {
  depth?: number;
  patterns?: ComponentType[];
  captureInteractions?: boolean;
  viewports?: Viewport[];
  extractTokens?: boolean;
  checkAccessibility?: boolean;
  performanceMetrics?: boolean;
}

export interface CrawlResult {
  website: Website;
  components: UIComponent[];
  designTokens: DesignTokens;
  patterns: UIPattern[];
  metadata: CrawlMetadata;
}

export interface Website {
  id: string;
  url: string;
  name: string;
  designer?: string;
  awards?: string[];
  technologyStack?: string[];
  crawledAt: Date;
}

export interface UIComponent {
  id: string;
  websiteId: string;
  type: ComponentType;
  selector: string;
  screenshotUrl: string;
  html: string;
  css: string;
  interactions?: InteractionState[];
  designTokens?: ComponentTokens;
  accessibilityScore?: number;
  performanceMetrics?: PerformanceData;
  metadata: ComponentMetadata;
}

export type ComponentType = 
  | 'navigation'
  | 'hero'
  | 'card'
  | 'form'
  | 'button'
  | 'modal'
  | 'footer'
  | 'sidebar'
  | 'table'
  | 'list'
  | 'carousel'
  | 'tabs'
  | 'accordion'
  | 'dropdown'
  | 'custom';

export interface InteractionState {
  type: 'default' | 'hover' | 'active' | 'focus' | 'disabled';
  screenshotUrl: string;
  css?: string;
}

export interface DesignTokens {
  colors: ColorPalette;
  typography: TypographySystem;
  spacing: SpacingScale;
  shadows: ShadowScale;
  borders: BorderTokens;
  animations: AnimationTokens;
}

export interface ColorPalette {
  primary: Color;
  secondary: Color[];
  accent: Color;
  neutrals: Color[];
  semantic: {
    success: Color;
    warning: Color;
    error: Color;
    info: Color;
  };
}

export interface Color {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  name?: string;
  wcagContrast?: {
    white: number;
    black: number;
  };
}

export interface TypographySystem {
  fontFamilies: Font[];
  scale: number[];
  lineHeights: Record<string, number>;
  fontWeights: Record<string, number>;
  letterSpacing?: Record<string, number>;
}

export interface Font {
  family: string;
  fallback: string[];
  category: 'serif' | 'sans-serif' | 'monospace' | 'display';
  source: 'system' | 'google' | 'custom';
  weights: number[];
}

export interface UIPattern {
  id: string;
  name: string;
  type: ComponentType;
  description: string;
  components: UIComponent[];
  commonTraits: string[];
  bestPractices: string[];
}

export interface CrawlMetadata {
  duration: number;
  pagesVisited: number;
  componentsFound: number;
  errors: CrawlError[];
  timestamp: Date;
}

export interface CrawlError {
  url: string;
  error: string;
  timestamp: Date;
}

export interface ComponentMetadata {
  name?: string;
  description?: string;
  tags: string[];
  usage: string[];
  relatedPatterns: string[];
}

export interface PerformanceData {
  loadTime: number;
  renderTime: number;
  bundleSize?: number;
  criticalCSS?: string;
  lighthouse?: LighthouseMetrics;
}

export interface LighthouseMetrics {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

export interface SpacingScale {
  base: number;
  scale: number[];
  units: 'px' | 'rem' | 'em';
}

export interface ShadowScale {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  custom?: Record<string, string>;
}

export interface BorderTokens {
  radii: Record<string, string>;
  widths: Record<string, string>;
  styles: string[];
}

export interface AnimationTokens {
  durations: Record<string, string>;
  easings: Record<string, string>;
  keyframes?: Record<string, string>;
}

export interface ComponentTokens {
  colors: Partial<ColorPalette>;
  typography: Partial<TypographySystem>;
  spacing: Partial<SpacingScale>;
  specific: Record<string, any>;
}

export type Viewport = 'mobile' | 'tablet' | 'desktop' | 'wide';

export interface ViewportConfig {
  width: number;
  height: number;
  deviceScaleFactor?: number;
  userAgent?: string;
}

export interface CrawlerConfig {
  storage: {
    database: string;
    images: string;
  };
  analysis: {
    extractPatterns: boolean;
    extractColors: boolean;
    extractTypography: boolean;
    checkAccessibility: boolean;
  };
  limits?: {
    maxPages?: number;
    maxComponents?: number;
    timeout?: number;
  };
}