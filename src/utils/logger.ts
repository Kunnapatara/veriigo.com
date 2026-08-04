/**
 * VERIIGO - Structured Production Logger Utility
 * Outputs formatted JSON logs in production and human-readable logs in development.
 */

import { config } from '../config/env';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  meta?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private contextName: string;

  constructor(contextName: string = 'VERIIGO Core') {
    this.contextName = contextName;
  }

  public setContext(contextName: string): Logger {
    return new Logger(contextName);
  }

  private formatEntry(level: LogLevel, message: string, meta?: Record<string, any>, err?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.contextName,
    };

    if (meta && Object.keys(meta).length > 0) {
      entry.meta = meta;
    }

    if (err) {
      entry.error = {
        name: err.name,
        message: err.message,
        stack: err.stack,
      };
    }

    return entry;
  }

  private print(entry: LogEntry) {
    if (config.isProd) {
      // Structured JSON format for Cloud Logging
      const output = JSON.stringify(entry);
      if (entry.level === 'error') {
        console.error(output);
      } else if (entry.level === 'warn') {
        console.warn(output);
      } else {
        console.log(output);
      }
    } else {
      // Human readable format for local development
      const colorMap: Record<LogLevel, string> = {
        debug: '\x1b[36m[DEBUG]\x1b[0m',
        info: '\x1b[32m[INFO]\x1b[0m',
        warn: '\x1b[33m[WARN]\x1b[0m',
        error: '\x1b[31m[ERROR]\x1b[0m',
      };
      const prefix = `${colorMap[entry.level]} [${entry.context}] ${entry.message}`;
      if (entry.level === 'error') {
        console.error(prefix, entry.meta || '', entry.error || '');
      } else if (entry.level === 'warn') {
        console.warn(prefix, entry.meta || '');
      } else {
        console.log(prefix, entry.meta || '');
      }
    }
  }

  public debug(first: string | Record<string, any>, second?: any) {
    if (!config.isDev) return;
    if (typeof first === 'object') {
      this.print(this.formatEntry('debug', String(second || ''), first));
    } else {
      this.print(this.formatEntry('debug', first, second));
    }
  }

  public info(first: string | Record<string, any>, second?: any) {
    if (typeof first === 'object') {
      this.print(this.formatEntry('info', String(second || ''), first));
    } else {
      this.print(this.formatEntry('info', first, second));
    }
  }

  public warn(first: string | Record<string, any>, second?: any) {
    if (typeof first === 'object') {
      this.print(this.formatEntry('warn', String(second || ''), first));
    } else {
      this.print(this.formatEntry('warn', first, second));
    }
  }

  public error(first: string | Record<string, any>, second?: any, third?: any) {
    if (typeof first === 'object') {
      this.print(this.formatEntry('error', String(second || ''), first, third));
    } else if (second instanceof Error) {
      this.print(this.formatEntry('error', first, third, second));
    } else {
      this.print(this.formatEntry('error', first, second));
    }
  }
}

export const logger = new Logger('App');
export { Logger };
