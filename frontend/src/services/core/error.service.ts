import { Injectable, signal, computed } from '@angular/core';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Application error interface
 */
export interface AppError {
  code: string;
  message: string;
  details?: string;
  severity: ErrorSeverity;
  timestamp: Date;
  context?: Record<string, unknown>;
}

/**
 * Error state for tracking
 */
export interface ErrorState {
  hasError: boolean;
  error: AppError | null;
  errorCount: number;
  lastErrorAt: Date | null;
}

/**
 * Consolidated error service - handles all error management
 * Replaces: GlobalErrorService + ErrorRecoveryService + error.types.ts
 */
@Injectable({ providedIn: 'root' })
export class ErrorService {
  private readonly errors = signal<AppError[]>([]);
  private readonly activeError = signal<AppError | null>(null);

  readonly hasError = computed(() => this.activeError() !== null);
  readonly errorCount = computed(() => this.errors().length);
  readonly lastError = computed(() => this.errors()[this.errors().length - 1] || null);

  /**
   * Report an error
   */
  report(error: Partial<AppError>): void {
    const appError: AppError = {
      code: error.code || 'UNKNOWN',
      message: error.message || 'An error occurred',
      details: error.details,
      severity: error.severity || 'error',
      timestamp: new Date(),
      context: error.context,
    };

    // Add to error history
    this.errors.update(errors => [...errors, appError]);

    // Set as active error
    this.activeError.set(appError);

    // Log to console
    this.logError(appError);
  }

  /**
   * Clear the active error
   */
  clear(): void {
    this.activeError.set(null);
  }

  /**
   * Clear all errors
   */
  clearAll(): void {
    this.errors.set([]);
    this.activeError.set(null);
  }

  /**
   * Get error history
   */
  getHistory(): AppError[] {
    return this.errors();
  }

  /**
   * Create a validation error
   */
  validationError(message: string, field?: string): AppError {
    return {
      code: 'VALIDATION_ERROR',
      message,
      severity: 'warning',
      timestamp: new Date(),
      context: field ? { field } : undefined,
    };
  }

  /**
   * Create a network error
   */
  networkError(message: string, url?: string): AppError {
    return {
      code: 'NETWORK_ERROR',
      message,
      severity: 'error',
      timestamp: new Date(),
      context: url ? { url } : undefined,
    };
  }

  /**
   * Create an internal error
   */
  internalError(message: string, details?: string): AppError {
    return {
      code: 'INTERNAL_ERROR',
      message,
      details,
      severity: 'critical',
      timestamp: new Date(),
    };
  }

  /**
   * Log error to console (with formatting)
   */
  private logError(error: AppError): void {
    const prefix = `[${error.severity.toUpperCase()}]`;
    const color = this.getSeverityColor(error.severity);

    console.log(`%c${prefix} ${error.code}: ${error.message}`, color);

    if (error.details) {
      console.log('Details:', error.details);
    }

    if (error.context) {
      console.log('Context:', error.context);
    }

    // For critical errors, print stack trace if available
    if (error.severity === 'critical') {
      console.error('Critical error:', error);
    }
  }

  /**
   * Get console color for severity
   */
  private getSeverityColor(severity: ErrorSeverity): string {
    const colors = {
      info: 'color: #3b82f6; font-weight: bold;',
      warning: 'color: #f59e0b; font-weight: bold;',
      error: 'color: #ef4444; font-weight: bold;',
      critical: 'color: #dc2626; font-weight: bold; background: #fee2e2; padding: 2px 4px;',
    };
    return colors[severity];
  }

  /**
   * Convert from old Result type to this service
   * Usage: errorService.fromResult(result, 'Operation failed')
   */
  fromResult<T>(result: { ok: boolean; value?: T; error?: { message: string } }, defaultMessage: string): T | null {
    if (result.ok && result.value !== undefined) {
      return result.value;
    }

    this.report({
      message: result.error?.message || defaultMessage,
      severity: 'error',
    });

    return null;
  }
}
