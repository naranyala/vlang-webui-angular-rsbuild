import { Injectable } from '@angular/core';
import { ErrorService } from './error.service';

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logger options
 */
export interface LoggerOptions {
  showTimestamp?: boolean;
  showLevel?: boolean;
  minLevel?: LogLevel;
}

/**
 * Simplified logger service
 * Replaces: logging.viewmodel.ts + logger.ts
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly defaultOptions: LoggerOptions = {
    showTimestamp: true,
    showLevel: true,
    minLevel: 'debug',
  };

  private readonly options = new Map<string, LoggerOptions>();
  private readonly logHistory: Array<{ level: LogLevel; message: string; timestamp: Date }> = [];

  constructor(private readonly errorService: ErrorService) {}

  /**
   * Create a logger instance for a specific context
   */
  getLogger(context: string, options?: LoggerOptions): Logger {
    if (options) {
      this.options.set(context, { ...this.defaultOptions, ...options });
    }

    return new Logger(context, this);
  }

  /**
   * Log a message
   */
  log(context: string, level: LogLevel, message: string, data?: unknown): void {
    const options = this.options.get(context) || this.defaultOptions;

    // Check min level
    if (!this.shouldLog(level, options.minLevel || 'debug')) {
      return;
    }

    const timestamp = options.showTimestamp ? new Date().toISOString() : '';
    const levelStr = options.showLevel ? `[${level.toUpperCase()}]` : '';
    const prefix = timestamp ? `${timestamp} ${levelStr}` : levelStr;

    // Format message
    const formattedMessage = `${prefix} [${context}] ${message}`;

    // Store in history
    this.logHistory.push({
      level,
      message: formattedMessage,
      timestamp: new Date(),
    });

    // Keep history limited
    if (this.logHistory.length > 1000) {
      this.logHistory.shift();
    }

    // Output to console
    this.outputToConsole(level, formattedMessage, data);
  }

  /**
   * Check if level should be logged
   */
  private shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(minLevel);
  }

  /**
   * Output to console with appropriate method
   */
  private outputToConsole(level: LogLevel, message: string, data?: unknown): void {
    switch (level) {
      case 'debug':
        console.debug(message, data || '');
        break;
      case 'info':
        console.info(message, data || '');
        break;
      case 'warn':
        console.warn(message, data || '');
        break;
      case 'error':
        console.error(message, data || '');
        // Also report to error service
        this.errorService.report({
          message,
          severity: 'error',
          context: data as Record<string, unknown>,
        });
        break;
    }
  }

  /**
   * Get log history
   */
  getHistory(): typeof this.logHistory {
    return [...this.logHistory];
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.logHistory.length = 0;
  }
}

/**
 * Logger instance for a specific context
 */
export class Logger {
  constructor(
    private readonly context: string,
    private readonly service: LoggerService
  ) {}

  debug(message: string, data?: unknown): void {
    this.service.log(this.context, 'debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.service.log(this.context, 'info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.service.log(this.context, 'warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.service.log(this.context, 'error', message, data);
  }
}
