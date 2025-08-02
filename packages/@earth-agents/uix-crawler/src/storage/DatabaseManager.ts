import { Logger } from '@earth-agents/core';
import { Website, UIComponent, UIPattern, DesignTokens } from '../types';

export interface DatabaseTransaction {
  saveWebsite(website: Website): Promise<void>;
  saveComponent(component: UIComponent): Promise<void>;
  savePattern(pattern: UIPattern): Promise<void>;
  saveDesignTokens(websiteId: string, tokens: DesignTokens): Promise<void>;
}

export class DatabaseManager {
  private logger: Logger;
  private connectionString: string;
  private db: any; // Will be replaced with actual database client

  constructor(connectionString: string) {
    this.logger = new Logger('DatabaseManager');
    this.connectionString = connectionString;
  }

  async connect(): Promise<void> {
    this.logger.info('Connecting to database...');
    
    // For now, we'll use an in-memory store
    // In production, this would connect to PostgreSQL or similar
    this.db = {
      websites: new Map<string, Website>(),
      components: new Map<string, UIComponent>(),
      patterns: new Map<string, UIPattern>(),
      designTokens: new Map<string, DesignTokens>()
    };
    
    this.logger.info('Database connected successfully');
  }

  async disconnect(): Promise<void> {
    this.logger.info('Disconnecting from database...');
    // Clean up connection
    this.db = null;
    this.logger.info('Database disconnected');
  }

  async transaction<T>(
    callback: (tx: DatabaseTransaction) => Promise<T>
  ): Promise<T> {
    // Simple transaction implementation
    const tx: DatabaseTransaction = {
      saveWebsite: async (website: Website) => {
        this.db.websites.set(website.id, website);
      },
      saveComponent: async (component: UIComponent) => {
        this.db.components.set(component.id, component);
      },
      savePattern: async (pattern: UIPattern) => {
        this.db.patterns.set(pattern.id, pattern);
      },
      saveDesignTokens: async (websiteId: string, tokens: DesignTokens) => {
        this.db.designTokens.set(websiteId, tokens);
      }
    };

    try {
      return await callback(tx);
    } catch (error) {
      this.logger.error('Transaction failed', { error });
      throw error;
    }
  }

  async saveWebsite(website: Website): Promise<void> {
    this.db.websites.set(website.id, website);
    this.logger.debug('Website saved', { id: website.id, url: website.url });
  }

  async getWebsite(id: string): Promise<Website | null> {
    return this.db.websites.get(id) || null;
  }

  async getWebsiteByUrl(url: string): Promise<Website | null> {
    for (const website of this.db.websites.values()) {
      if (website.url === url) {
        return website;
      }
    }
    return null;
  }

  async saveComponent(component: UIComponent): Promise<void> {
    this.db.components.set(component.id, component);
    this.logger.debug('Component saved', { 
      id: component.id, 
      type: component.type,
      websiteId: component.websiteId 
    });
  }

  async getComponent(id: string): Promise<UIComponent | null> {
    return this.db.components.get(id) || null;
  }

  async getComponentsByWebsite(websiteId: string): Promise<UIComponent[]> {
    const components: UIComponent[] = [];
    for (const component of this.db.components.values()) {
      if (component.websiteId === websiteId) {
        components.push(component);
      }
    }
    return components;
  }

  async getComponentsByType(type: string): Promise<UIComponent[]> {
    const components: UIComponent[] = [];
    for (const component of this.db.components.values()) {
      if (component.type === type) {
        components.push(component);
      }
    }
    return components;
  }

  async searchComponents(query: {
    type?: string;
    tags?: string[];
    websiteId?: string;
    minAccessibilityScore?: number;
  }): Promise<UIComponent[]> {
    let components = Array.from(this.db.components.values());
    
    if (query.type) {
      components = components.filter(c => c.type === query.type);
    }
    
    if (query.websiteId) {
      components = components.filter(c => c.websiteId === query.websiteId);
    }
    
    if (query.tags && query.tags.length > 0) {
      components = components.filter(c => 
        query.tags!.some(tag => c.metadata.tags.includes(tag))
      );
    }
    
    if (query.minAccessibilityScore) {
      components = components.filter(c => 
        (c.accessibilityScore || 0) >= query.minAccessibilityScore!
      );
    }
    
    return components;
  }

  async savePattern(pattern: UIPattern): Promise<void> {
    this.db.patterns.set(pattern.id, pattern);
    this.logger.debug('Pattern saved', { 
      id: pattern.id, 
      name: pattern.name,
      type: pattern.type 
    });
  }

  async getPattern(id: string): Promise<UIPattern | null> {
    return this.db.patterns.get(id) || null;
  }

  async getPatternsByType(type: string): Promise<UIPattern[]> {
    const patterns: UIPattern[] = [];
    for (const pattern of this.db.patterns.values()) {
      if (pattern.type === type) {
        patterns.push(pattern);
      }
    }
    return patterns;
  }

  async saveDesignTokens(websiteId: string, tokens: DesignTokens): Promise<void> {
    this.db.designTokens.set(websiteId, tokens);
    this.logger.debug('Design tokens saved', { websiteId });
  }

  async getDesignTokens(websiteId: string): Promise<DesignTokens | null> {
    return this.db.designTokens.get(websiteId) || null;
  }

  async getTrendingComponents(
    period: 'day' | 'week' | 'month',
    limit: number = 10
  ): Promise<UIComponent[]> {
    // In a real implementation, this would query based on view counts,
    // crawl dates, and other engagement metrics
    const components = Array.from(this.db.components.values());
    
    // For now, return the most recent components
    return components
      .sort((a, b) => {
        const dateA = new Date(a.metadata.tags.find(t => t.startsWith('date:'))?.split(':')[1] || 0);
        const dateB = new Date(b.metadata.tags.find(t => t.startsWith('date:'))?.split(':')[1] || 0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limit);
  }

  async getStats(): Promise<{
    totalWebsites: number;
    totalComponents: number;
    totalPatterns: number;
    componentsByType: Record<string, number>;
  }> {
    const componentsByType: Record<string, number> = {};
    
    for (const component of this.db.components.values()) {
      componentsByType[component.type] = (componentsByType[component.type] || 0) + 1;
    }
    
    return {
      totalWebsites: this.db.websites.size,
      totalComponents: this.db.components.size,
      totalPatterns: this.db.patterns.size,
      componentsByType
    };
  }

  // Migration and setup methods
  async createTables(): Promise<void> {
    // In a real implementation, this would create the necessary database tables
    // For now, it's a no-op since we're using in-memory storage
    this.logger.info('Database tables ready');
  }

  async runMigrations(): Promise<void> {
    // In a real implementation, this would run database migrations
    this.logger.info('Database migrations complete');
  }
}