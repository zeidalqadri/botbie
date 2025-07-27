import pino from 'pino';
import chalk from 'chalk';

const transport = pino.transport({
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'HH:MM:ss',
    ignore: 'pid,hostname',
    messageFormat: (log: any, messageKey: string) => {
      const msg = log[messageKey];
      const debugEmoji = getDebugEmoji(log.level);
      
      if (log.session) {
        return `${debugEmoji} [${chalk.cyan(log.session)}] ${msg}`;
      }
      return `${debugEmoji} ${msg}`;
    }
  }
});

function getDebugEmoji(level: number): string {
  if (level === 10) return '🔍'; // trace
  if (level === 20) return '🐛'; // debug
  if (level === 30) return '💡'; // info
  if (level === 40) return '⚠️'; // warn
  if (level === 50) return '🔥'; // error
  if (level === 60) return '💀'; // fatal
  return '📝';
}

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: null,
}, transport);

export function createSessionLogger(sessionId: string) {
  return logger.child({ session: sessionId });
}