import dotenv from 'dotenv';

dotenv.config();

export const config = {
  bot: {
    name: process.env.BOT_NAME || 'Botbie',
    version: process.env.BOT_VERSION || '1.0.0',
    maxConcurrentTasks: parseInt(process.env.MAX_CONCURRENT_TASKS || '5'),
    taskTimeoutMs: parseInt(process.env.TASK_TIMEOUT_MS || '300000'),
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
    environment: process.env.NODE_ENV || 'development',
  },
  api: {
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    openaiKey: process.env.OPENAI_API_KEY,
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'botbie.log',
  },
  webhook: {
    secret: process.env.WEBHOOK_SECRET,
    timeoutMs: parseInt(process.env.WEBHOOK_TIMEOUT_MS || '10000'),
  },
  rateLimit: {
    requests: parseInt(process.env.RATE_LIMIT_REQUESTS || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  },
};