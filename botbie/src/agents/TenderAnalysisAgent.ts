import { BaseAgent } from './BaseAgent';
import * as fs from 'fs/promises';
import * as path from 'path';

interface TenderRequirement {
  category: string;
  description: string;
  quantity?: number;
  unit?: string;
  deadline?: Date;
  mandatory: boolean;
}

interface TenderAnalysisResult {
  tenderTitle: string;
  organization: string;
  submissionDeadline: Date | null;
  requirements: TenderRequirement[];
  budgetEstimate?: number;
  currency?: string;
  specialConditions: string[];
  contactInfo: {
    name?: string;
    email?: string;
    phone?: string;
  };
  confidence: number;
  warnings: string[];
}

export class TenderAnalysisAgent extends BaseAgent {
  constructor() {
    super(
      'TenderAnalysisAgent',
      'Analyzes tender documents to extract requirements, deadlines, and key information',
      [
        'pdf-parsing',
        'requirement-extraction',
        'deadline-tracking',
        'budget-analysis',
        'compliance-checking'
      ]
    );
  }

  async initialize(): Promise<void> {
    // Initialize PDF parsing capabilities
    console.log('TenderAnalysisAgent initialized');
  }

  async execute(task: any): Promise<TenderAnalysisResult> {
    const { documentPath, documentText, analysisType } = task.payload;

    switch (analysisType) {
      case 'full-analysis':
        return this.performFullAnalysis(documentText || await this.readDocument(documentPath));
      case 'requirements-only':
        return this.extractRequirements(documentText || await this.readDocument(documentPath));
      case 'deadline-check':
        return this.checkDeadlines(documentText || await this.readDocument(documentPath));
      case 'budget-estimation':
        return this.estimateBudget(documentText || await this.readDocument(documentPath));
      default:
        return this.performFullAnalysis(documentText || await this.readDocument(documentPath));
    }
  }

  private async readDocument(documentPath: string): Promise<string> {
    try {
      const content = await fs.readFile(documentPath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Failed to read document: ${error}`);
    }
  }

  private performFullAnalysis(text: string): TenderAnalysisResult {
    const result: TenderAnalysisResult = {
      tenderTitle: this.extractTitle(text),
      organization: this.extractOrganization(text),
      submissionDeadline: this.extractDeadline(text),
      requirements: this.parseRequirements(text),
      budgetEstimate: this.calculateBudgetEstimate(text),
      currency: this.extractCurrency(text),
      specialConditions: this.extractSpecialConditions(text),
      contactInfo: this.extractContactInfo(text),
      confidence: 0,
      warnings: []
    };

    // Calculate confidence score
    result.confidence = this.calculateConfidence(result);

    // Generate warnings
    result.warnings = this.generateWarnings(result);

    return result;
  }

  private extractRequirements(text: string): TenderAnalysisResult {
    return {
      tenderTitle: this.extractTitle(text),
      organization: '',
      submissionDeadline: null,
      requirements: this.parseRequirements(text),
      specialConditions: [],
      contactInfo: {},
      confidence: 0.75,
      warnings: []
    };
  }

  private checkDeadlines(text: string): TenderAnalysisResult {
    const deadline = this.extractDeadline(text);
    const warnings = [];
    
    if (deadline) {
      const daysUntilDeadline = Math.floor((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilDeadline < 7) {
        warnings.push(`URGENT: Only ${daysUntilDeadline} days until submission deadline!`);
      }
    } else {
      warnings.push('No deadline found in document');
    }

    return {
      tenderTitle: this.extractTitle(text),
      organization: '',
      submissionDeadline: deadline,
      requirements: [],
      specialConditions: [],
      contactInfo: {},
      confidence: deadline ? 0.9 : 0.3,
      warnings
    };
  }

  private estimateBudget(text: string): TenderAnalysisResult {
    const requirements = this.parseRequirements(text);
    const budgetEstimate = this.calculateBudgetEstimate(text);
    
    return {
      tenderTitle: this.extractTitle(text),
      organization: '',
      submissionDeadline: null,
      requirements,
      budgetEstimate,
      currency: this.extractCurrency(text),
      specialConditions: [],
      contactInfo: {},
      confidence: budgetEstimate ? 0.7 : 0.4,
      warnings: budgetEstimate ? [] : ['Unable to estimate budget from document']
    };
  }

  private extractTitle(text: string): string {
    // Look for common title patterns
    const titlePatterns = [
      /(?:tender|rfp|rfq|quotation)(?:\s+for)?:?\s*([^\n]+)/i,
      /(?:title|subject|re):\s*([^\n]+)/i,
      /market\s+survey.*?for\s+([^\n]+)/i
    ];

    for (const pattern of titlePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // Fallback: use first non-empty line
    const lines = text.split('\n').filter(line => line.trim());
    return lines[0] || 'Untitled Tender';
  }

  private extractOrganization(text: string): string {
    const orgPatterns = [
      /(?:from|by|organization|company):\s*([^\n]+)/i,
      /hibiscus\s+petroleum/i,
      /(?:client|customer):\s*([^\n]+)/i
    ];

    for (const pattern of orgPatterns) {
      const match = text.match(pattern);
      if (match) {
        return typeof match === 'string' ? match : match[1]?.trim() || match[0];
      }
    }

    return 'Unknown Organization';
  }

  private extractDeadline(text: string): Date | null {
    const datePatterns = [
      /deadline:?\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
      /(?:submit|submission).*?(?:by|before|on)\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
      /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i,
      /august\s+14,?\s+2025/i // Specific to Hibiscus Petroleum tender
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          const dateStr = match[0] || match[1];
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date;
          }
        } catch (error) {
          continue;
        }
      }
    }

    return null;
  }

  private parseRequirements(text: string): TenderRequirement[] {
    const requirements: TenderRequirement[] = [];
    
    // Common requirement categories
    const categories = {
      'hpe': 'Hardware',
      'simplivity': 'Hardware',
      'veeam': 'Software',
      'vmware': 'Software',
      'server': 'Hardware',
      'storage': 'Hardware',
      'ram': 'Hardware',
      'ssd': 'Hardware',
      'sas': 'Hardware',
      'nic': 'Hardware',
      'transceiver': 'Hardware',
      'installation': 'Services',
      'manday': 'Services',
      'maintenance': 'Support',
      'support': 'Support',
      'license': 'Software',
      'warranty': 'Warranty',
      'spare': 'Hardware',
      'additional': 'General'
    };

    // First, try to extract from "Budgetary Items" section
    const budgetarySection = text.match(/Budgetary Items[\s\S]*?(?=\n\nNote:|$)/i);
    const textToparse = budgetarySection ? budgetarySection[0] : text;
    
    // Split into lines for easier processing
    const lines = textToparse.split('\n');
    
    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this is a numbered item (e.g., "1. ", "2. ", etc.)
      const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);
      
      if (numberedMatch) {
        const content = numberedMatch[2];
        
        // Skip sub-items (they start with dash or bullet)
        if (content.startsWith('-') || content.startsWith('•')) {
          continue;
        }
        
        // Extract description, quantity and unit
        let description = content;
        let quantity: number | undefined;
        let unit: string | undefined;
        
        // Try to extract quantity and unit patterns
        const qtyPatterns = [
          /^(.+?)\s*-\s*(\d+)\s*(MTH|UNI|UNIT|EA|PCS)$/i,  // "Item - 180 MTH"
          /^(.+?)\s+(\d+)\s+(MTH|UNI|UNIT|EA|PCS)$/i,      // "Item 180 MTH"
        ];
        
        for (const pattern of qtyPatterns) {
          const match = content.match(pattern);
          if (match) {
            description = match[1].trim();
            quantity = parseInt(match[2]);
            unit = match[3];
            break;
          }
        }
        
        // Clean up description - remove trailing dashes or colons
        description = description.replace(/[\-:]+$/, '').trim();
        
        // Skip if it's just whitespace or too short
        if (!description || description.length < 3) continue;
        
        // Determine category based on keywords
        let category = 'General';
        const descLower = description.toLowerCase();
        for (const [keyword, cat] of Object.entries(categories)) {
          if (descLower.includes(keyword)) {
            category = cat;
            break;
          }
        }
        
        // Check for special cases
        if (descLower.includes('manday')) {
          // Extract junior/senior level
          if (descLower.includes('junior')) {
            description = 'Manday Rate - Junior';
          } else if (descLower.includes('senior')) {
            description = 'Manday Rate - Senior';
          }
        }
        
        requirements.push({
          category,
          description: description,
          quantity,
          unit: unit?.toUpperCase(),
          mandatory: false
        });
      }
    }

    // If we got very few requirements, there might be a parsing issue
    // Try a simpler approach
    if (requirements.length < 5) {
      // Clear and try simple number matching
      requirements.length = 0;
      
      // Look for lines starting with numbers
      for (const line of lines) {
        const simpleMatch = line.match(/^(\d{1,2})\.\s+(.+)/);
        if (simpleMatch) {
          const content = simpleMatch[2].trim();
          
          // Skip sub-items
          if (content.startsWith('-') || content.startsWith('•')) continue;
          
          // Extract quantity if present
          let description = content;
          let quantity: number | undefined;
          let unit: string | undefined;
          
          const qtyMatch = content.match(/(.+?)\s*[-–]\s*(\d+)\s*(MTH|UNI|UNIT|EA|PCS)/i);
          if (qtyMatch) {
            description = qtyMatch[1].trim();
            quantity = parseInt(qtyMatch[2]);
            unit = qtyMatch[3];
          }
          
          // Determine category
          let category = 'General';
          const descLower = description.toLowerCase();
          for (const [keyword, cat] of Object.entries(categories)) {
            if (descLower.includes(keyword)) {
              category = cat;
              break;
            }
          }
          
          requirements.push({
            category,
            description: description,
            quantity,
            unit: unit?.toUpperCase(),
            mandatory: false
          });
        }
      }
    }

    return requirements;
  }

  private calculateBudgetEstimate(text: string): number | undefined {
    // Look for budget or cost indicators
    const budgetPatterns = [
      /(?:budget|cost|price).*?(?:myr|rm|usd|\$)\s*([\d,]+)/i,
      /(?:myr|rm|usd|\$)\s*([\d,]+)/i
    ];

    for (const pattern of budgetPatterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(amount)) {
          return amount;
        }
      }
    }

    return undefined;
  }

  private extractCurrency(text: string): string {
    if (text.match(/\bmyr\b/i) || text.match(/\brm\b/i)) {
      return 'MYR';
    }
    if (text.match(/\busd\b/i) || text.includes('$')) {
      return 'USD';
    }
    if (text.match(/\beur\b/i) || text.includes('€')) {
      return 'EUR';
    }
    return 'MYR'; // Default for Malaysian tenders
  }

  private extractSpecialConditions(text: string): string[] {
    const conditions: string[] = [];
    
    const conditionPatterns = [
      /(?:special|additional)\s+(?:condition|requirement|term)s?:?\s*([^\n]+)/gi,
      /note:?\s*([^\n]+)/gi,
      /important:?\s*([^\n]+)/gi
    ];

    for (const pattern of conditionPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        conditions.push(match[1].trim());
      }
    }

    return conditions;
  }

  private extractContactInfo(text: string): any {
    const contact: any = {};

    // Email pattern
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
      contact.email = emailMatch[0];
    }

    // Phone pattern
    const phoneMatch = text.match(/(?:\+60|0)[\d\s-]{8,}/);
    if (phoneMatch) {
      contact.phone = phoneMatch[0].replace(/\s/g, '');
    }

    // Contact name
    const nameMatch = text.match(/(?:contact|person|officer):\s*([^\n,]+)/i);
    if (nameMatch) {
      contact.name = nameMatch[1].trim();
    }

    return contact;
  }

  private calculateConfidence(result: TenderAnalysisResult): number {
    let score = 0;
    let factors = 0;

    // Check completeness of extraction
    if (result.tenderTitle && result.tenderTitle !== 'Untitled Tender') {
      score += 1;
      factors++;
    }
    if (result.organization && result.organization !== 'Unknown Organization') {
      score += 1;
      factors++;
    }
    if (result.submissionDeadline) {
      score += 1;
      factors++;
    }
    if (result.requirements.length > 0) {
      score += 1;
      factors++;
    }
    if (result.budgetEstimate) {
      score += 0.5;
      factors++;
    }
    if (result.contactInfo.email || result.contactInfo.phone) {
      score += 0.5;
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  }

  private generateWarnings(result: TenderAnalysisResult): string[] {
    const warnings: string[] = [];

    if (!result.submissionDeadline) {
      warnings.push('No submission deadline found - verify manually');
    } else {
      const daysUntilDeadline = Math.floor((result.submissionDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilDeadline < 3) {
        warnings.push(`CRITICAL: Deadline in ${daysUntilDeadline} days!`);
      } else if (daysUntilDeadline < 7) {
        warnings.push(`URGENT: Deadline in ${daysUntilDeadline} days`);
      }
    }

    if (result.requirements.length === 0) {
      warnings.push('No requirements extracted - manual review needed');
    }

    if (!result.contactInfo.email && !result.contactInfo.phone) {
      warnings.push('No contact information found');
    }

    if (result.confidence < 0.5) {
      warnings.push('Low confidence extraction - manual verification recommended');
    }

    return warnings;
  }

  async shutdown(): Promise<void> {
    console.log('TenderAnalysisAgent shutting down');
  }
}