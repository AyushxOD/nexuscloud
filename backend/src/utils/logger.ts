import type { LoggerContext } from '../types/index.js';

export type LogContext = Partial<LoggerContext> & Record<string, unknown>;

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

class Logger {
  private logLevel: LogLevel;
  private requestId: string;
  private static instance: Logger;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
    this.requestId = this.generateRequestId();
  }

  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.logLevel];
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const defaultCtx = { requestId: this.requestId, timestamp: new Date().toISOString() };
    return JSON.stringify({
      level,
      message,
      ...defaultCtx,
      ...context,
    });
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage(LogLevel.INFO, message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorDetails = error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : { error: String(error) };
      console.error(this.formatMessage(LogLevel.ERROR, message, context), errorDetails);
    }
  }

  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  getRequestId(): string {
    return this.requestId;
  }

  createContext(additionalContext?: Record<string, unknown>): LogContext {
    return {
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      ...additionalContext,
    };
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
}

export const logger = Logger.getInstance();

export const createLogger = (): Logger => Logger.getInstance();