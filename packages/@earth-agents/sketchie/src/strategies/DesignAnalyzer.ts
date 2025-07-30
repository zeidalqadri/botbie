import { Strategy, StrategyResult, logger } from '@earth-agents/core';
import {
  DesignInput,
  UIComponent,
  SketchAnalysisResult,
  SketchElement,
  ComponentType,
  LayoutAnalysis,
  PropDefinition,
  StyleDefinition
} from '../types';
import { SketchieConfig } from '../Sketchie';
import * as Tesseract from 'tesseract.js';
import * as sharp from 'sharp';
import chalk from 'chalk';

export class DesignAnalyzer implements Strategy {
  name = 'Design Analyzer';
  description = 'Analyzes design inputs and extracts UI components';
  
  constructor(private config: SketchieConfig) {}
  
  canHandle(context: any): boolean {
    return !!context.design || context.command === 'analyze-design';
  }
  
  async execute(context: any): Promise<StrategyResult> {
    const { design, session } = context;
    
    if (!design) {
      return {
        success: false,
        data: { error: 'No design input provided' }
      };
    }
    
    try {
      console.log(chalk.cyan(`🔍 Analyzing ${design.type} design...`));
      
      let components: UIComponent[] = [];
      let analysisResult: SketchAnalysisResult | null = null;
      
      switch (design.type) {
        case 'image':
          analysisResult = await this.analyzeImage(design.source);
          components = await this.extractComponentsFromSketch(analysisResult);
          break;
          
        case 'figma':
          components = await this.analyzeFigmaDesign(design.source);
          break;
          
        case 'description':
          components = await this.analyzeTextDescription(design.source);
          break;
          
        case 'url':
          components = await this.analyzeWebPage(design.source);
          break;
          
        default:
          throw new Error(`Unsupported design type: ${design.type}`);
      }
      
      // Apply AI enhancement if enabled
      if (this.config.enableAIGeneration && components.length > 0) {
        components = await this.enhanceWithAI(components, design);
      }
      
      // Infer relationships and layout
      this.inferComponentRelationships(components);
      
      console.log(chalk.green(`✓ Extracted ${components.length} components`));
      
      return {
        success: true,
        data: {
          components,
          analysis: analysisResult,
          patterns: this.detectPatterns(components)
        }
      };
      
    } catch (error) {
      logger.error('Design analysis failed:', error);
      return {
        success: false,
        data: { error: error.message }
      };
    }
  }
  
  private async analyzeImage(imagePath: string): Promise<SketchAnalysisResult> {
    try {
      // Preprocess image for better OCR
      const processedImage = await this.preprocessImage(imagePath);
      
      // Use Tesseract for text extraction
      const { data: { text, blocks } } = await Tesseract.recognize(processedImage, 'eng');
      
      // Analyze image for UI elements
      const elements = await this.detectUIElements(processedImage, blocks);
      
      // Determine layout structure
      const layout = this.analyzeLayout(elements);
      
      return {
        elements,
        layout,
        confidence: this.calculateConfidence(elements),
        suggestions: this.generateSuggestions(elements, layout)
      };
      
    } catch (error) {
      logger.error('Image analysis failed:', error);
      throw error;
    }
  }
  
  private async preprocessImage(imagePath: string): Promise<Buffer> {
    // Enhance image for better element detection
    return sharp(imagePath)
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer();
  }
  
  private async detectUIElements(image: Buffer, textBlocks: any[]): Promise<SketchElement[]> {
    const elements: SketchElement[] = [];
    
    // Convert text blocks to UI elements
    textBlocks.forEach(block => {
      const elementType = this.inferElementType(block.text, block.bbox);
      
      elements.push({
        type: elementType,
        bounds: {
          x: block.bbox.x0,
          y: block.bbox.y0,
          width: block.bbox.x1 - block.bbox.x0,
          height: block.bbox.y1 - block.bbox.y0
        },
        text: block.text,
        confidence: block.confidence / 100
      });
    });
    
    // TODO: Add shape detection for buttons, inputs, etc.
    // This would use computer vision techniques
    
    return elements;
  }
  
  private inferElementType(text: string, bbox: any): ComponentType {
    const lowercaseText = text.toLowerCase();
    
    // Button detection
    if (this.looksLikeButton(text, bbox)) {
      return 'button';
    }
    
    // Input detection
    if (this.looksLikeInput(text, bbox)) {
      return 'input';
    }
    
    // Navigation detection
    if (this.looksLikeNavigation(text, bbox)) {
      return 'navigation';
    }
    
    // Default to text
    return 'text';
  }
  
  private looksLikeButton(text: string, bbox: any): boolean {
    const buttonKeywords = ['submit', 'cancel', 'ok', 'save', 'delete', 'add', 'create', 'update'];
    const aspectRatio = (bbox.x1 - bbox.x0) / (bbox.y1 - bbox.y0);
    
    return (
      buttonKeywords.some(keyword => text.toLowerCase().includes(keyword)) ||
      (text.length < 20 && aspectRatio > 2 && aspectRatio < 6)
    );
  }
  
  private looksLikeInput(text: string, bbox: any): boolean {
    const inputKeywords = ['name', 'email', 'password', 'search', 'enter', 'type'];
    const aspectRatio = (bbox.x1 - bbox.x0) / (bbox.y1 - bbox.y0);
    
    return (
      inputKeywords.some(keyword => text.toLowerCase().includes(keyword)) ||
      (aspectRatio > 5)
    );
  }
  
  private looksLikeNavigation(text: string, bbox: any): boolean {
    const navKeywords = ['home', 'about', 'contact', 'menu', 'nav'];
    return navKeywords.some(keyword => text.toLowerCase().includes(keyword));
  }
  
  private analyzeLayout(elements: SketchElement[]): LayoutAnalysis {
    if (elements.length === 0) {
      return { type: 'flex' };
    }
    
    // Sort elements by position
    const sortedByY = [...elements].sort((a, b) => a.bounds.y - b.bounds.y);
    const sortedByX = [...elements].sort((a, b) => a.bounds.x - b.bounds.x);
    
    // Check for grid pattern
    const rows = this.detectRows(sortedByY);
    const columns = this.detectColumns(sortedByX);
    
    if (rows > 1 && columns > 1) {
      return {
        type: 'grid',
        rows,
        columns,
        spacing: this.calculateSpacing(elements)
      };
    }
    
    // Check for flex pattern
    const isVertical = this.isVerticalLayout(elements);
    const isHorizontal = this.isHorizontalLayout(elements);
    
    if (isVertical || isHorizontal) {
      return {
        type: 'flex',
        spacing: this.calculateSpacing(elements)
      };
    }
    
    return { type: 'absolute' };
  }
  
  private detectRows(elements: SketchElement[]): number {
    const yPositions = elements.map(e => e.bounds.y);
    const uniqueYPositions = new Set(yPositions);
    return uniqueYPositions.size;
  }
  
  private detectColumns(elements: SketchElement[]): number {
    const xPositions = elements.map(e => e.bounds.x);
    const uniqueXPositions = new Set(xPositions);
    return uniqueXPositions.size;
  }
  
  private isVerticalLayout(elements: SketchElement[]): boolean {
    const xPositions = elements.map(e => e.bounds.x);
    const xVariance = this.calculateVariance(xPositions);
    return xVariance < 50; // Threshold for alignment
  }
  
  private isHorizontalLayout(elements: SketchElement[]): boolean {
    const yPositions = elements.map(e => e.bounds.y);
    const yVariance = this.calculateVariance(yPositions);
    return yVariance < 50; // Threshold for alignment
  }
  
  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length);
  }
  
  private calculateSpacing(elements: SketchElement[]): number {
    if (elements.length < 2) return 0;
    
    const gaps: number[] = [];
    
    for (let i = 1; i < elements.length; i++) {
      const prev = elements[i - 1];
      const curr = elements[i];
      
      const verticalGap = curr.bounds.y - (prev.bounds.y + prev.bounds.height);
      const horizontalGap = curr.bounds.x - (prev.bounds.x + prev.bounds.width);
      
      if (verticalGap > 0) gaps.push(verticalGap);
      if (horizontalGap > 0) gaps.push(horizontalGap);
    }
    
    return gaps.length > 0 ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : 0;
  }
  
  private calculateConfidence(elements: SketchElement[]): number {
    if (elements.length === 0) return 0;
    
    const confidences = elements.map(e => e.confidence);
    return confidences.reduce((a, b) => a + b, 0) / confidences.length;
  }
  
  private generateSuggestions(elements: SketchElement[], layout: LayoutAnalysis): string[] {
    const suggestions: string[] = [];
    
    if (elements.length === 0) {
      suggestions.push('No UI elements detected. Try a clearer image or hand-drawn sketch.');
    }
    
    if (layout.type === 'absolute') {
      suggestions.push('Consider using a grid or flexbox layout for better responsiveness.');
    }
    
    const buttons = elements.filter(e => e.type === 'button');
    if (buttons.length > 3) {
      suggestions.push('Consider grouping related actions to reduce button clutter.');
    }
    
    return suggestions;
  }
  
  private async extractComponentsFromSketch(analysis: SketchAnalysisResult): Promise<UIComponent[]> {
    return analysis.elements.map((element, index) => ({
      name: `${element.type}_${index}`,
      type: element.type,
      props: this.generateDefaultProps(element.type),
      styles: this.generateStylesFromBounds(element.bounds, analysis.layout),
      accessibility: {
        role: this.getDefaultRole(element.type),
        ariaLabel: element.text
      }
    }));
  }
  
  private generateDefaultProps(type: ComponentType): PropDefinition[] {
    const commonProps: PropDefinition[] = [
      { name: 'className', type: 'string', required: false },
      { name: 'style', type: 'CSSProperties', required: false }
    ];
    
    switch (type) {
      case 'button':
        return [
          ...commonProps,
          { name: 'onClick', type: '() => void', required: false },
          { name: 'disabled', type: 'boolean', required: false, defaultValue: false },
          { name: 'children', type: 'ReactNode', required: true }
        ];
        
      case 'input':
        return [
          ...commonProps,
          { name: 'value', type: 'string', required: true },
          { name: 'onChange', type: '(value: string) => void', required: true },
          { name: 'placeholder', type: 'string', required: false },
          { name: 'type', type: 'string', required: false, defaultValue: 'text' }
        ];
        
      default:
        return commonProps;
    }
  }
  
  private generateStylesFromBounds(bounds: any, layout: LayoutAnalysis): StyleDefinition {
    return {
      layout: {
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
        position: layout.type === 'absolute' ? 'absolute' : 'relative'
      },
      spacing: {
        small: '8px',
        medium: '16px',
        large: '24px',
        xlarge: '32px'
      }
    };
  }
  
  private getDefaultRole(type: ComponentType): string {
    const roleMap: Record<ComponentType, string> = {
      button: 'button',
      input: 'textbox',
      form: 'form',
      navigation: 'navigation',
      list: 'list',
      card: 'article',
      layout: 'region',
      text: 'text',
      image: 'img',
      custom: 'region'
    };
    
    return roleMap[type] || 'region';
  }
  
  private async analyzeFigmaDesign(figmaUrl: string): Promise<UIComponent[]> {
    // TODO: Implement Figma API integration
    logger.info('Figma analysis not yet implemented');
    return [];
  }
  
  private async analyzeTextDescription(description: string): Promise<UIComponent[]> {
    // TODO: Implement NLP-based component generation
    logger.info('Text description analysis not yet implemented');
    return [];
  }
  
  private async analyzeWebPage(url: string): Promise<UIComponent[]> {
    // TODO: Implement web scraping and component extraction
    logger.info('Web page analysis not yet implemented');
    return [];
  }
  
  private async enhanceWithAI(components: UIComponent[], design: DesignInput): Promise<UIComponent[]> {
    // TODO: Implement OpenAI integration for component enhancement
    return components;
  }
  
  private inferComponentRelationships(components: UIComponent[]): void {
    // Group components by proximity and type
    // This helps in creating proper component hierarchy
  }
  
  private detectPatterns(components: UIComponent[]): any[] {
    const patterns = [];
    
    // Detect repeated component types
    const typeFrequency = new Map<ComponentType, number>();
    components.forEach(comp => {
      typeFrequency.set(comp.type, (typeFrequency.get(comp.type) || 0) + 1);
    });
    
    typeFrequency.forEach((count, type) => {
      if (count > 2) {
        patterns.push({
          name: `Repeated ${type} components`,
          frequency: count,
          description: `Found ${count} ${type} components that could be unified`,
          examples: components.filter(c => c.type === type).map(c => c.name),
          recommendation: `Create a reusable ${type} component`
        });
      }
    });
    
    return patterns;
  }
}