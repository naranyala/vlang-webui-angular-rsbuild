import { ErrorHandler, Injector, inject } from '@angular/core';
import { ErrorService } from '../services/core/error.service';

export class GlobalErrorHandler implements ErrorHandler {
  private readonly injector = inject(Injector);

  handleError(error: unknown): void {
    // Log to console immediately for debugging
    this.logToConsole('ERROR', error);

    const errorService = this.injector.get(ErrorService);

    // Convert unknown error to error report
    const errorData = this.extractErrorData(error);

    errorService.report({
      message: errorData.message,
      details: errorData.details,
      severity: 'error',
      context: errorData.context,
    });
  }

  /**
   * Extract structured error data from any error type
   */
  private extractErrorData(error: unknown): { message: string; details?: string; context?: Record<string, string> } {
    if (error instanceof Error) {
      return {
        message: error.message,
        details: error.stack,
      };
    }

    if (typeof error === 'string') {
      return { message: error };
    }

    if (error && typeof error === 'object') {
      const obj = error as Record<string, unknown>;
      if (typeof obj.message === 'string') {
        return {
          message: obj.message,
          details: (obj.stack as string) || JSON.stringify(error, null, 2),
        };
      }
    }

    return {
      message: 'An unknown error occurred',
      details: typeof error === 'object' ? JSON.stringify(error) : String(error),
    };
  }

  /**
   * Log error to console with full details
   */
  private logToConsole(level: string, error: unknown): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;

    if (error instanceof Error) {
      console.error(prefix, error.message, error.stack);
    } else if (typeof error === 'string') {
      console.error(prefix, error);
    } else {
      console.error(prefix, 'Unknown error:', error);
    }
  }
}
