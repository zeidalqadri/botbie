import { BotbieCore } from './core/BotbieCore';
import { config } from './config';

async function main() {
  console.log('🤖 Initializing Botbie...');
  
  try {
    const botbie = new BotbieCore(config);
    await botbie.initialize();
    
    console.log('✅ Botbie is ready!');
    console.log(`🌐 Server running on port ${config.server.port}`);
    
    process.on('SIGINT', async () => {
      console.log('\n📛 Shutting down Botbie...');
      await botbie.shutdown();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to initialize Botbie:', error);
    process.exit(1);
  }
}

main().catch(console.error);