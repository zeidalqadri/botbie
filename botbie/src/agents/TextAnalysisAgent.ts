import { BaseAgent } from './BaseAgent';
import Anthropic from '@anthropic-ai/sdk';

export class TextAnalysisAgent extends BaseAgent {
  private anthropic: Anthropic | null = null;

  constructor() {
    super(
      'TextAnalysisAgent',
      'Analyzes text using AI for sentiment, summary, and insights',
      ['sentiment-analysis', 'summarization', 'keyword-extraction', 'translation']
    );
  }

  async initialize(): Promise<void> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
    }
  }

  async execute(task: any): Promise<any> {
    const { text, action } = task.payload;

    switch (action) {
      case 'sentiment':
        return this.analyzeSentiment(text);
      case 'summarize':
        return this.summarizeText(text);
      case 'keywords':
        return this.extractKeywords(text);
      case 'translate':
        return this.translateText(text, task.payload.targetLanguage);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async analyzeSentiment(text: string): Promise<any> {
    if (!this.anthropic) {
      // Fallback to simple sentiment analysis
      const positive = ['good', 'great', 'excellent', 'happy', 'wonderful'];
      const negative = ['bad', 'terrible', 'awful', 'sad', 'horrible'];
      
      const words = text.toLowerCase().split(' ');
      const positiveCount = words.filter(w => positive.includes(w)).length;
      const negativeCount = words.filter(w => negative.includes(w)).length;
      
      let sentiment = 'neutral';
      if (positiveCount > negativeCount) sentiment = 'positive';
      if (negativeCount > positiveCount) sentiment = 'negative';
      
      return {
        sentiment,
        confidence: 0.75,
        scores: {
          positive: positiveCount / words.length,
          negative: negativeCount / words.length,
          neutral: 1 - (positiveCount + negativeCount) / words.length
        }
      };
    }

    // Use Claude for advanced sentiment analysis
    const response = await this.anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `Analyze the sentiment of this text and respond with JSON only: "${text}"`
      }]
    });

    return JSON.parse(response.content[0].text);
  }

  private async summarizeText(text: string): Promise<any> {
    // Simple extractive summary
    const sentences = text.split('.').filter(s => s.trim().length > 0);
    const summary = sentences.slice(0, 2).join('. ') + '.';
    
    return {
      summary,
      originalLength: text.length,
      summaryLength: summary.length,
      compressionRatio: summary.length / text.length
    };
  }

  private async extractKeywords(text: string): Promise<any> {
    // Simple keyword extraction
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 4);
    
    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    const keywords = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word, count]) => ({ word, count }));
    
    return { keywords };
  }

  private async translateText(text: string, targetLanguage: string): Promise<any> {
    if (!this.anthropic) {
      return {
        error: 'Translation requires Anthropic API key',
        originalText: text,
        targetLanguage
      };
    }

    const response = await this.anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Translate this text to ${targetLanguage}: "${text}"`
      }]
    });

    return {
      originalText: text,
      translatedText: response.content[0].text,
      targetLanguage
    };
  }

  async shutdown(): Promise<void> {
    this.anthropic = null;
  }
}