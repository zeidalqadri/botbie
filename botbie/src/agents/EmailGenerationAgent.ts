import { BaseAgent } from './BaseAgent';

interface EmailTemplate {
  subject: string;
  body: string;
  attachments?: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
}

interface EmailGenerationResult {
  emails: GeneratedEmail[];
  totalGenerated: number;
  templateUsed: string;
  executionTime: number;
}

interface GeneratedEmail {
  vendorName: string;
  vendorEmail?: string;
  subject: string;
  body: string;
  personalizationScore: number;
  suggestedSendTime?: Date;
  followUpDate?: Date;
}

export class EmailGenerationAgent extends BaseAgent {
  private templates: Map<string, EmailTemplate>;

  constructor() {
    super(
      'EmailGenerationAgent',
      'Generates personalized email outreach campaigns for vendor communication',
      [
        'email-generation',
        'template-management',
        'personalization',
        'bulk-generation',
        'follow-up-scheduling'
      ]
    );
    this.templates = new Map();
  }

  async initialize(): Promise<void> {
    // Load default templates
    this.loadDefaultTemplates();
    console.log('EmailGenerationAgent initialized with', this.templates.size, 'templates');
  }

  async execute(task: any): Promise<EmailGenerationResult> {
    const startTime = Date.now();
    const {
      vendors = [],
      tenderInfo = {},
      templateType = 'quotation-request',
      senderInfo = {},
      customTemplate = null
    } = task.payload;

    // Use custom template if provided, otherwise use default
    const template = customTemplate || this.templates.get(templateType) || this.templates.get('quotation-request')!;

    const emails: GeneratedEmail[] = [];

    for (const vendor of vendors) {
      const email = this.generateEmail(vendor, tenderInfo, template, senderInfo);
      emails.push(email);
    }

    const executionTime = Date.now() - startTime;

    return {
      emails,
      totalGenerated: emails.length,
      templateUsed: templateType,
      executionTime
    };
  }

  private generateEmail(
    vendor: any,
    tenderInfo: any,
    template: EmailTemplate,
    senderInfo: any
  ): GeneratedEmail {
    // Personalize subject
    const subject = this.personalizeText(template.subject, {
      vendorName: vendor.name,
      tenderTitle: tenderInfo.title || 'Server Leasing Services',
      organization: tenderInfo.organization || senderInfo.company,
      deadline: tenderInfo.deadline ? new Date(tenderInfo.deadline).toLocaleDateString() : 'soon'
    });

    // Personalize body
    const body = this.personalizeText(template.body, {
      vendorName: vendor.name,
      vendorAddress: vendor.address || 'your location',
      vendorRating: vendor.rating ? `${vendor.rating} stars` : 'excellent rating',
      senderName: senderInfo.name || 'Procurement Team',
      senderCompany: senderInfo.company || tenderInfo.organization,
      senderEmail: senderInfo.email || 'procurement@company.com',
      senderPhone: senderInfo.phone || '',
      tenderTitle: tenderInfo.title || 'Server Leasing Services',
      requirements: this.formatRequirements(tenderInfo.requirements),
      deadline: tenderInfo.deadline ? new Date(tenderInfo.deadline).toLocaleDateString() : 'at your earliest convenience',
      budgetRange: tenderInfo.budgetEstimate ? `MYR ${tenderInfo.budgetEstimate}` : 'competitive budget',
      specialConditions: this.formatSpecialConditions(tenderInfo.specialConditions)
    });

    // Calculate personalization score
    const personalizationScore = this.calculatePersonalizationScore(body, vendor);

    // Suggest optimal send time (Tuesday-Thursday, 10 AM)
    const suggestedSendTime = this.calculateOptimalSendTime();

    // Set follow-up date (3 business days later)
    const followUpDate = this.calculateFollowUpDate(suggestedSendTime);

    return {
      vendorName: vendor.name,
      vendorEmail: vendor.email,
      subject,
      body,
      personalizationScore,
      suggestedSendTime,
      followUpDate
    };
  }

  private personalizeText(template: string, variables: Record<string, any>): string {
    let text = template;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      text = text.replace(new RegExp(placeholder, 'g'), value || '');
    }

    // Remove any remaining placeholders
    text = text.replace(/\{\{[^}]+\}\}/g, '');

    return text;
  }

  private formatRequirements(requirements: any[]): string {
    if (!requirements || requirements.length === 0) {
      return 'Details to be discussed';
    }

    return requirements
      .slice(0, 5) // Limit to first 5 requirements
      .map((req, index) => `${index + 1}. ${req.description || req}`)
      .join('\n');
  }

  private formatSpecialConditions(conditions: any[]): string {
    if (!conditions || conditions.length === 0) {
      return '';
    }

    return '\n\nSpecial Conditions:\n' + conditions
      .map((condition, index) => `• ${condition}`)
      .join('\n');
  }

  private calculatePersonalizationScore(body: string, vendor: any): number {
    let score = 0.5; // Base score

    // Check if vendor name is mentioned
    if (body.includes(vendor.name)) score += 0.2;

    // Check if vendor's specialties are referenced
    if (vendor.categories) {
      const categoriesReferenced = vendor.categories.some((cat: string) =>
        body.toLowerCase().includes(cat.toLowerCase())
      );
      if (categoriesReferenced) score += 0.15;
    }

    // Check if location is mentioned
    if (vendor.address && body.includes(vendor.address.split(',')[0])) {
      score += 0.1;
    }

    // Check if rating is mentioned
    if (vendor.rating && body.includes(vendor.rating.toString())) {
      score += 0.05;
    }

    return Math.min(1, score);
  }

  private calculateOptimalSendTime(): Date {
    const now = new Date();
    const sendTime = new Date(now);

    // Find next Tuesday-Thursday
    const dayOfWeek = sendTime.getDay();
    let daysToAdd = 0;

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend: schedule for Tuesday
      daysToAdd = dayOfWeek === 0 ? 2 : 3;
    } else if (dayOfWeek === 5) {
      // Friday: schedule for next Tuesday
      daysToAdd = 4;
    } else if (dayOfWeek === 1) {
      // Monday: schedule for Tuesday
      daysToAdd = 1;
    }

    sendTime.setDate(sendTime.getDate() + daysToAdd);
    sendTime.setHours(10, 0, 0, 0); // 10 AM

    return sendTime;
  }

  private calculateFollowUpDate(sendTime: Date): Date {
    const followUp = new Date(sendTime);
    let daysAdded = 0;
    let businessDays = 0;

    while (businessDays < 3) {
      followUp.setDate(followUp.getDate() + 1);
      daysAdded++;

      const dayOfWeek = followUp.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++;
      }
    }

    followUp.setHours(14, 0, 0, 0); // 2 PM

    return followUp;
  }

  private loadDefaultTemplates(): void {
    // Quotation Request Template
    this.templates.set('quotation-request', {
      subject: 'Request for Quotation: {{tenderTitle}} - {{organization}}',
      body: `Dear {{vendorName}} Team,

I hope this email finds you well. We are {{senderCompany}}, and we are currently seeking quotations for {{tenderTitle}}.

Based on your excellent reputation and {{vendorRating}} in the industry, we believe you would be an ideal partner for this project.

**Project Requirements:**
{{requirements}}

**Key Details:**
• Organization: {{organization}}
• Submission Deadline: {{deadline}}
• Budget Range: {{budgetRange}}
{{specialConditions}}

We would appreciate if you could provide us with:
1. Detailed quotation with itemized pricing
2. Delivery timeline
3. Warranty and support terms
4. Any relevant certifications or case studies

Please submit your quotation by {{deadline}}. If you need any clarification or additional information, please don't hesitate to contact us.

Looking forward to your response.

Best regards,
{{senderName}}
{{senderCompany}}
{{senderEmail}}
{{senderPhone}}`
    });

    // Follow-up Template
    this.templates.set('follow-up', {
      subject: 'Re: Request for Quotation - {{tenderTitle}}',
      body: `Dear {{vendorName}} Team,

I wanted to follow up on our previous email regarding the quotation request for {{tenderTitle}}.

We understand you may be busy, but we wanted to remind you that the submission deadline is {{deadline}}.

If you have any questions or need additional information to prepare your quotation, please let us know.

We look forward to hearing from you soon.

Best regards,
{{senderName}}
{{senderCompany}}`
    });

    // Thank You Template
    this.templates.set('thank-you', {
      subject: 'Thank You - Quotation Received for {{tenderTitle}}',
      body: `Dear {{vendorName}} Team,

Thank you for submitting your quotation for {{tenderTitle}}.

We have received your proposal and it is currently under review. We will evaluate all submissions and contact shortlisted vendors by {{deadline}}.

If we need any clarification or additional information, we will reach out to you.

Thank you for your interest in working with {{senderCompany}}.

Best regards,
{{senderName}}
{{senderCompany}}`
    });

    // Information Request Template
    this.templates.set('info-request', {
      subject: 'Information Request: {{tenderTitle}}',
      body: `Dear {{vendorName}} Team,

We came across your company while researching potential vendors for {{tenderTitle}}.

Could you please provide us with information about:
• Your experience with similar projects
• Available service packages
• Pricing structure
• Current capacity and availability

{{requirements}}

We would appreciate a response by {{deadline}} as we are in the evaluation phase of our vendor selection process.

Thank you for your time.

Best regards,
{{senderName}}
{{senderCompany}}
{{senderEmail}}`
    });
  }

  // Method to save generated emails as drafts
  async saveEmailDrafts(emails: GeneratedEmail[]): Promise<{ saved: number; failed: number }> {
    // This would integrate with email service in production
    // For now, just log
    console.log(`Saving ${emails.length} email drafts...`);
    return { saved: emails.length, failed: 0 };
  }

  // Method to schedule emails for sending
  async scheduleEmails(emails: GeneratedEmail[]): Promise<{ scheduled: number; failed: number }> {
    // This would integrate with email scheduling service
    console.log(`Scheduling ${emails.length} emails...`);
    return { scheduled: emails.length, failed: 0 };
  }

  async shutdown(): Promise<void> {
    this.templates.clear();
    console.log('EmailGenerationAgent shutting down');
  }
}