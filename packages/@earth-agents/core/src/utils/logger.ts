import pino from 'pino';
import pretty from 'pino-pretty';

// Create a shared logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

// Create session-specific loggers
export function createSessionLogger(sessionId: string) {
  return logger.child({ sessionId });
}