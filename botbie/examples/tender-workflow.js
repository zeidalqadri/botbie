const axios = require('axios');
const fs = require('fs').promises;

/**
 * Tender Management Workflow Example
 * This demonstrates how Botbie automates the complete tender management process
 */

const BOTBIE_URL = 'http://localhost:3333';

class TenderWorkflowClient {
  constructor(baseUrl = BOTBIE_URL) {
    this.baseUrl = baseUrl;
  }

  async runCompleteWorkflow() {
    console.log('🚀 Starting Tender Management Workflow\n');
    
    try {
      // Sample tender document text (simulating Hibiscus Petroleum tender)
      const tenderDocument = `
        MARKET SURVEY FOR SERVER LEASING SERVICES
        
        Organization: Hibiscus Petroleum Berhad
        Submission Deadline: August 14, 2025, 12:00 PM
        
        Requirements:
        1. Server Leasing - 10 units of high-performance servers
        2. Managed Services - 24/7 monitoring and support
        3. Backup Solutions - Daily automated backups with 99.9% uptime
        4. Network Infrastructure - Gigabit connectivity with redundancy
        5. Security Services - Firewall, DDoS protection, and SSL certificates
        
        Budget Estimate: MYR 500,000
        
        Special Conditions:
        - ISO 27001 certification required
        - Data center must be located in Malaysia
        - Minimum 5 years of experience in server hosting
        
        Contact: procurement@hibiscuspetroleum.com
        Phone: +60 3-2234-5678
      `;

      // Step 1: Analyze the tender document
      console.log('📄 Step 1: Analyzing tender document...');
      const analysisResult = await this.analyzeTender(tenderDocument);
      console.log('✅ Tender analysis complete');
      console.log(`   - Title: ${analysisResult.tenderTitle || 'Server Leasing Services'}`);
      console.log(`   - Deadline: ${analysisResult.submissionDeadline || 'August 14, 2025'}`);
      console.log(`   - Requirements found: ${analysisResult.requirements?.length || 5}`);
      console.log(`   - Confidence: ${(analysisResult.confidence * 100).toFixed(0)}%`);
      
      if (analysisResult.warnings?.length > 0) {
        console.log('   ⚠️ Warnings:', analysisResult.warnings.join(', '));
      }
      console.log('');

      // Step 2: Discover potential vendors
      console.log('🔍 Step 2: Discovering vendors in Kuala Lumpur...');
      const vendors = await this.discoverVendors({
        location: 'Kuala Lumpur, Malaysia',
        keywords: ['server', 'hosting', 'data center', 'IT services'],
        radius: 20000,
        minRating: 4.0
      });
      console.log(`✅ Found ${vendors.length} potential vendors`);
      
      // Display top vendors
      const topVendors = vendors.slice(0, 3);
      topVendors.forEach((vendor, index) => {
        console.log(`   ${index + 1}. ${vendor.name}`);
        console.log(`      Rating: ${vendor.rating}⭐ | Match: ${(vendor.matchScore * 100).toFixed(0)}%`);
        console.log(`      ${vendor.address}`);
      });
      console.log('');

      // Step 3: Generate personalized emails
      console.log('✉️ Step 3: Generating personalized emails...');
      const emails = await this.generateEmails({
        vendors: topVendors,
        tenderInfo: {
          title: analysisResult.tenderTitle || 'Server Leasing Services',
          organization: 'Hibiscus Petroleum Berhad',
          deadline: analysisResult.submissionDeadline,
          requirements: analysisResult.requirements,
          budgetEstimate: analysisResult.budgetEstimate,
          specialConditions: analysisResult.specialConditions
        },
        senderInfo: {
          name: 'John Doe',
          company: 'Hibiscus Petroleum Berhad',
          email: 'john.doe@hibiscuspetroleum.com',
          phone: '+60 3-2234-5678'
        }
      });
      
      console.log(`✅ Generated ${emails.length} personalized emails`);
      emails.forEach((email, index) => {
        console.log(`   ${index + 1}. To: ${email.vendorName}`);
        console.log(`      Subject: ${email.subject}`);
        console.log(`      Personalization: ${(email.personalizationScore * 100).toFixed(0)}%`);
      });
      console.log('');

      // Step 4: Schedule and track
      console.log('📅 Step 4: Scheduling and tracking...');
      const workflow = await this.createWorkflow({
        analysisResult,
        vendors: topVendors,
        emails,
        schedule: {
          sendEmails: emails[0]?.suggestedSendTime,
          followUp: emails[0]?.followUpDate
        }
      });
      
      console.log('✅ Workflow created successfully');
      console.log(`   - Send emails: ${workflow.schedule?.sendEmails || 'Tuesday 10:00 AM'}`);
      console.log(`   - Follow up: ${workflow.schedule?.followUp || '3 business days later'}`);
      console.log('');

      // Summary
      console.log('📊 Workflow Summary');
      console.log('==================');
      console.log(`✅ Tender analyzed with ${(analysisResult.confidence * 100).toFixed(0)}% confidence`);
      console.log(`✅ ${vendors.length} vendors discovered`);
      console.log(`✅ ${emails.length} emails generated`);
      console.log(`✅ Workflow scheduled and ready for execution`);
      console.log('');
      
      console.log('💡 Next Steps:');
      console.log('   1. Review generated emails before sending');
      console.log('   2. Monitor vendor responses via WebSocket');
      console.log('   3. Track interactions and follow-ups');
      console.log('   4. Export responses for tender submission');

      return {
        analysis: analysisResult,
        vendors,
        emails,
        workflow
      };

    } catch (error) {
      console.error('❌ Workflow failed:', error.message);
      throw error;
    }
  }

  async analyzeTender(documentText) {
    const response = await axios.post(`${this.baseUrl}/tender/analyze`, {
      documentText,
      analysisType: 'full-analysis'
    });
    
    const taskId = response.data.taskId;
    return await this.waitForTask(taskId);
  }

  async discoverVendors(params) {
    const response = await axios.post(`${this.baseUrl}/vendor/discover`, params);
    const taskId = response.data.taskId;
    const result = await this.waitForTask(taskId);
    return result.vendors || [];
  }

  async generateEmails(params) {
    const response = await axios.post(`${this.baseUrl}/email/generate`, params);
    const taskId = response.data.taskId;
    const result = await this.waitForTask(taskId);
    return result.emails || [];
  }

  async createWorkflow(data) {
    // In production, this would create a persistent workflow
    return {
      id: Date.now().toString(),
      status: 'scheduled',
      ...data
    };
  }

  async waitForTask(taskId, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await axios.get(`${this.baseUrl}/task/${taskId}`);
      const task = response.data;
      
      if (task.status === 'completed') {
        return task.result;
      }
      if (task.status === 'failed') {
        throw new Error(task.error || 'Task failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Task timeout');
  }
}

// Run the workflow
async function main() {
  const client = new TenderWorkflowClient();
  
  console.log('====================================');
  console.log('  Botbie Tender Management System  ');
  console.log('====================================\n');
  
  try {
    const result = await client.runCompleteWorkflow();
    
    // Save results to file
    await fs.writeFile(
      'tender-workflow-results.json',
      JSON.stringify(result, null, 2)
    );
    console.log('\n✅ Results saved to tender-workflow-results.json');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { TenderWorkflowClient };