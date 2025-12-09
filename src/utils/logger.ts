/**
 * Enhanced logger with levels and formatting
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  args: any[];
}

const isDev = import.meta.env.DEV;
const LOG_HISTORY: LogEntry[] = [];
const MAX_LOG_HISTORY = 1000;

function formatTimestamp(): string {
  const now = new Date();
  return now.toISOString();
}

function createLogEntry(level: LogLevel, message: string, args: any[]): LogEntry {
  return {
    timestamp: formatTimestamp(),
    level,
    message,
    args,
  };
}

function addToHistory(entry: LogEntry): void {
  LOG_HISTORY.push(entry);
  if (LOG_HISTORY.length > MAX_LOG_HISTORY) {
    LOG_HISTORY.shift();
  }
}

function formatLogMessage(entry: LogEntry): string {
  const argsStr = entry.args.length > 0 ? ` ${JSON.stringify(entry.args)}` : '';
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${argsStr}`;
}

export const logger = {
  log: (...args: any[]) => {
    const message = typeof args[0] === 'string' ? args[0] : JSON.stringify(args[0]);
    const rest = args.slice(1);
    const entry = createLogEntry('info', message, rest);
    addToHistory(entry);
    
    if (isDev) {
      console.log(`[${entry.timestamp}]`, ...args);
    }
  },
  
  warn: (...args: any[]) => {
    const message = typeof args[0] === 'string' ? args[0] : JSON.stringify(args[0]);
    const rest = args.slice(1);
    const entry = createLogEntry('warn', message, rest);
    addToHistory(entry);
    
    if (isDev) {
      console.warn(`[${entry.timestamp}]`, ...args);
    }
  },
  
  error: (...args: any[]) => {
    const message = typeof args[0] === 'string' ? args[0] : JSON.stringify(args[0]);
    const rest = args.slice(1);
    const entry = createLogEntry('error', message, rest);
    addToHistory(entry);
    
    // Always log errors with timestamp
    console.error(`[${entry.timestamp}]`, ...args);
  },
  
  debug: (...args: any[]) => {
    const message = typeof args[0] === 'string' ? args[0] : JSON.stringify(args[0]);
    const rest = args.slice(1);
    const entry = createLogEntry('debug', message, rest);
    addToHistory(entry);
    
    if (isDev) {
      console.debug(`[${entry.timestamp}]`, ...args);
    }
  },

  getHistory: (): LogEntry[] => {
    return [...LOG_HISTORY];
  },

  clearHistory: (): void => {
    LOG_HISTORY.length = 0;
  },

  exportLogs: (): string => {
    return LOG_HISTORY.map(formatLogMessage).join('\n');
  },

  filterByLevel: (level: LogLevel): LogEntry[] => {
    return LOG_HISTORY.filter(entry => entry.level === level);
  },
};

