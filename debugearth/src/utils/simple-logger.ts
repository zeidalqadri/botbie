// Simple logger for MCP context without pino dependencies
export const logger = {
  level: 'info',
  
  trace: (msg: string) => {
    if (['trace', 'debug', 'info', 'warn', 'error'].includes(logger.level)) {
      console.error(`[TRACE] ${msg}`);
    }
  },
  
  debug: (msg: string) => {
    if (['debug', 'info', 'warn', 'error'].includes(logger.level)) {
      console.error(`[DEBUG] ${msg}`);
    }
  },
  
  info: (msg: string) => {
    if (['info', 'warn', 'error'].includes(logger.level)) {
      console.error(`[INFO] ${msg}`);
    }
  },
  
  warn: (msg: string) => {
    if (['warn', 'error'].includes(logger.level)) {
      console.error(`[WARN] ${msg}`);
    }
  },
  
  error: (msg: string) => {
    console.error(`[ERROR] ${msg}`);
  },
  
  child: (context: any) => {
    return {
      ...logger,
      info: (msg: string) => logger.info(`[${context.session || 'unknown'}] ${msg}`),
      debug: (msg: string) => logger.debug(`[${context.session || 'unknown'}] ${msg}`),
      warn: (msg: string) => logger.warn(`[${context.session || 'unknown'}] ${msg}`),
      error: (msg: string) => logger.error(`[${context.session || 'unknown'}] ${msg}`)
    };
  }
};

export function createSessionLogger(sessionId: string) {
  return logger.child({ session: sessionId });
}