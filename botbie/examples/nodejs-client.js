const axios = require('axios');

class BotbieClient {
  constructor(baseUrl = 'http://localhost:3333') {
    this.baseUrl = baseUrl;
  }

  // Check server health
  async health() {
    const response = await axios.get(`${this.baseUrl}/health`);
    return response.data;
  }

  // Submit a task
  async submitTask(type, payload) {
    const response = await axios.post(`${this.baseUrl}/task`, {
      type,
      payload
    });
    return response.data;
  }

  // Get task status
  async getTask(taskId) {
    const response = await axios.get(`${this.baseUrl}/task/${taskId}`);
    return response.data;
  }

  // Wait for task completion
  async waitForTask(taskId, maxAttempts = 30, delayMs = 1000) {
    for (let i = 0; i < maxAttempts; i++) {
      const task = await this.getTask(taskId);
      if (task.status === 'completed' || task.status === 'failed') {
        return task;
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    throw new Error('Task timeout');
  }

  // Submit and wait for task
  async executeTask(type, payload) {
    const { taskId } = await this.submitTask(type, payload);
    return await this.waitForTask(taskId);
  }
}

// Example usage
async function main() {
  const client = new BotbieClient();

  try {
    // Check health
    console.log('🏥 Health Check:');
    const health = await client.health();
    console.log(health);

    // Sentiment analysis
    console.log('\n😊 Sentiment Analysis:');
    const sentimentTask = await client.executeTask('text-analysis', {
      text: 'I absolutely love using Botbie! It makes automation so easy.',
      action: 'sentiment'
    });
    console.log('Result:', sentimentTask.result);

    // Text summarization
    console.log('\n📝 Text Summarization:');
    const summaryTask = await client.executeTask('text-analysis', {
      text: 'Botbie is an advanced automation platform that uses AI agents to process tasks. It provides a REST API for task submission, WebSocket support for real-time updates, and a flexible agent system that can be extended with custom functionality. The platform is built with TypeScript and Node.js, ensuring type safety and modern JavaScript features.',
      action: 'summarize'
    });
    console.log('Result:', summaryTask.result);

    // Keyword extraction
    console.log('\n🔑 Keyword Extraction:');
    const keywordTask = await client.executeTask('text-analysis', {
      text: 'Machine learning algorithms process data to identify patterns. Neural networks enable deep learning capabilities. Natural language processing helps computers understand human language.',
      action: 'keywords'
    });
    console.log('Result:', keywordTask.result);

    // Batch processing
    console.log('\n📦 Batch Processing:');
    const taskPromises = [];
    for (let i = 1; i <= 5; i++) {
      taskPromises.push(
        client.submitTask('batch-process', {
          batchId: `batch-${i}`,
          items: [`item-${i}-a`, `item-${i}-b`, `item-${i}-c`]
        })
      );
    }
    
    const batchResults = await Promise.all(taskPromises);
    console.log(`Submitted ${batchResults.length} batch tasks`);
    
    // Wait for all tasks
    const completedTasks = await Promise.all(
      batchResults.map(result => client.waitForTask(result.taskId))
    );
    console.log(`All ${completedTasks.length} tasks completed`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the examples
main().catch(console.error);