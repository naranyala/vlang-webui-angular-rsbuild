import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { EventBusViewModel } from '../viewmodels/event-bus.viewmodel';
import { getLogger } from '../viewmodels/logger';
import { ErrorCode, ErrorValue, logError } from '../types/error.types';

export interface ErrorStats {
  totalErrors: number;
  criticalErrors: number;
  warningErrors: number;
  errorsToday: number;
  lastErrorTime: string | null;
  errorTrend: 'increasing' | 'stable' | 'decreasing';
}

export interface RecoverableError {
  id: string;
  code: ErrorCode;
  message: string;
  recoveryAction: () => Promise<boolean>;
  recoveryLabel: string;
  canRetry: boolean;
  retryCount: number;
  maxRetries: number;
  timestamp: string;
  isRecovering?: boolean;
}

export type RecoveryStatus = 'pending' | 'recovering' | 'recovered' | 'failed';

@Injectable({ providedIn: 'root' })
export class ErrorRecoveryService implements OnDestroy {
  private readonly logger = getLogger('error-recovery');
  private readonly eventBus: EventBusViewModel<Record<string, unknown>>;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  readonly errors = signal<RecoverableError[]>([]);
  readonly recoveryStatus = signal<RecoveryStatus>('pending');
  readonly autoRecoveryEnabled = signal<boolean>(true);
  readonly lastRecoveryTime = signal<string | null>(null);

  readonly stats = computed<ErrorStats>(() => {
    const errorList = this.errors();
    const criticalCodes: ErrorCode[] = [
      ErrorCode.InternalError,
      ErrorCode.DbConnectionFailed,
      ErrorCode.LockPoisoned,
    ];

    return {
      totalErrors: errorList.length,
      criticalErrors: errorList.filter((e) => criticalCodes.includes(e.code)).length,
      warningErrors: errorList.filter((e) => !criticalCodes.includes(e.code)).length,
      errorsToday: errorList.length,
      lastErrorTime: errorList.length > 0 ? new Date().toISOString() : null,
      errorTrend: this.calculateErrorTrend(),
    };
  });

  readonly canRecover = computed(() => {
    return this.errors().some((e) => e.canRetry && e.retryCount < e.maxRetries);
  });

  readonly recoveryProgress = computed(() => {
    const errors = this.errors();
    if (errors.length === 0) return 100;
    const totalAttempts = errors.reduce((sum, e) => sum + e.maxRetries, 0);
    const usedAttempts = errors.reduce((sum, e) => sum + e.retryCount, 0);
    return Math.round(((totalAttempts - usedAttempts) / totalAttempts) * 100);
  });

  constructor(eventBus: EventBusViewModel<Record<string, unknown>>) {
    this.eventBus = eventBus;
    this.setupErrorListeners();
  }

  private setupErrorListeners(): void {
    this.eventBus.subscribe('error:captured', (payload: unknown) => {
      const data = payload as { code?: string; message?: string; source?: string };
      this.handleNewError(data);
    });

    this.eventBus.subscribe('connection:state', (payload: unknown) => {
      const data = payload as { state: string; connected: boolean };
      if (!data.connected) {
        this.registerConnectionError();
      }
    });
  }

  private handleNewError(data: { code?: string; message?: string; source?: string }): void {
    const code = (data.code as ErrorCode) || ErrorCode.Unknown;
    const message = data.message || 'An error occurred';
    if (this.isRecoverable(code)) {
      this.registerRecoverableError(code, message);
    }
  }

  private isRecoverable(code: ErrorCode): boolean {
    const recoverableCodes: ErrorCode[] = [
      ErrorCode.DbConnectionFailed,
      ErrorCode.DbQueryFailed,
      ErrorCode.InternalError,
      ErrorCode.SerializationFailed,
      ErrorCode.DeserializationFailed,
      ErrorCode.Unknown,
    ];
    return recoverableCodes.includes(code);
  }

  private registerRecoverableError(code: ErrorCode, message: string): void {
    const error: RecoverableError = {
      id: `${code}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      code,
      message,
      recoveryAction: () => this.getRecoveryAction(code),
      recoveryLabel: this.getRecoveryLabel(code),
      canRetry: true,
      retryCount: 0,
      maxRetries: 3,
      timestamp: new Date().toISOString(),
    };
    this.errors.update((errors) => [...errors, error]);
    this.logger.warn('Recoverable error registered', { code, message, id: error.id });
    if (this.autoRecoveryEnabled()) {
      this.attemptRecovery(error);
    }
  }

  private registerConnectionError(): void {
    this.registerRecoverableError(ErrorCode.DbConnectionFailed, 'Connection to backend lost');
  }

  private async getRecoveryAction(code: ErrorCode): Promise<boolean> {
    this.logger.info('Executing recovery action for', { code });
    switch (code) {
      case ErrorCode.DbConnectionFailed:
        return this.attemptReconnect();
      case ErrorCode.DbQueryFailed:
        return this.retryLastQuery();
      case ErrorCode.SerializationFailed:
      case ErrorCode.DeserializationFailed:
        return this.clearAndRetry();
      case ErrorCode.InternalError:
        return this.softReset();
      default:
        return this.genericRetry();
    }
  }

  private getRecoveryLabel(code: ErrorCode): string {
    switch (code) {
      case ErrorCode.DbConnectionFailed: return 'Reconnect';
      case ErrorCode.DbQueryFailed: return 'Retry Query';
      case ErrorCode.SerializationFailed: return 'Clear Cache';
      case ErrorCode.DeserializationFailed: return 'Reload Data';
      case ErrorCode.InternalError: return 'Reset';
      case ErrorCode.Unknown: return 'Retry';
      case ErrorCode.DbConstraintViolation: return 'Fix Data';
      case ErrorCode.DbNotFound: return 'Refresh';
      case ErrorCode.DbAlreadyExists: return 'Skip';
      case ErrorCode.ConfigNotFound: return 'Load Defaults';
      case ErrorCode.ConfigInvalid: return 'Reset Config';
      case ErrorCode.ConfigMissingField: return 'Fix Config';
      case ErrorCode.InvalidFormat: return 'Reformat';
      case ErrorCode.ValidationFailed: return 'Fix Input';
      case ErrorCode.MissingRequiredField: return 'Add Field';
      case ErrorCode.InvalidFieldValue: return 'Fix Value';
      case ErrorCode.ResourceNotFound: return 'Refresh List';
      case ErrorCode.UserNotFound: return 'Refresh Users';
      case ErrorCode.EntityNotFound: return 'Refresh Entities';
      case ErrorCode.LockPoisoned: return 'Release Lock';
      default: return 'Retry';
    }
  }

  private async attemptReconnect(): Promise<boolean> {
    this.logger.info('Attempting to reconnect to backend...');
    return new Promise((resolve) => {
      window.dispatchEvent(new CustomEvent('webui:reconnect'));
      const timeout = setTimeout(() => {
        this.logger.warn('Reconnection timeout');
        resolve(false);
      }, 5000);
      const handler = (event: CustomEvent) => {
        clearTimeout(timeout);
        if (event.detail?.connected) {
          this.logger.info('Reconnection successful');
          this.eventBus.publish('recovery:success', { type: 'reconnect' });
          resolve(true);
        } else {
          resolve(false);
        }
        window.removeEventListener('webui:reconnected', handler as EventListener);
      };
      window.addEventListener('webui:reconnected', handler as EventListener);
    });
  }

  private async retryLastQuery(): Promise<boolean> {
    this.logger.info('Retrying last query...');
    this.eventBus.publish('recovery:retry', { type: 'query' });
    await this.delay(1000);
    return true;
  }

  private async clearAndRetry(): Promise<boolean> {
    this.logger.info('Clearing cache and retrying...');
    try {
      localStorage.removeItem('app_cache');
      sessionStorage.clear();
      this.eventBus.publish('recovery:clear', { type: 'cache' });
      await this.delay(500);
      return true;
    } catch (error) {
      logError({ code: ErrorCode.InternalError, message: 'Failed to clear cache' });
      return false;
    }
  }

  private async softReset(): Promise<boolean> {
    this.logger.info('Performing soft reset...');
    try {
      this.eventBus.publish('recovery:reset', { type: 'soft' });
      await this.delay(1000);
      return true;
    } catch (error) {
      logError({ code: ErrorCode.InternalError, message: 'Soft reset failed' });
      return false;
    }
  }

  private async genericRetry(): Promise<boolean> {
    this.logger.info('Attempting generic retry...');
    await this.delay(1000);
    return true;
  }

  async attemptRecovery(error: RecoverableError): Promise<boolean> {
    if (!error.canRetry || error.retryCount >= error.maxRetries) {
      this.logger.warn('Cannot recover error', { id: error.id, reason: 'Max retries exceeded' });
      return false;
    }
    this.recoveryStatus.set('recovering');
    error.isRecovering = true;
    error.retryCount++;
    this.logger.info('Attempting recovery', {
      id: error.id,
      attempt: error.retryCount,
      maxRetries: error.maxRetries,
    });
    try {
      const success = await error.recoveryAction();
      if (success) {
        this.recoveryStatus.set('recovered');
        this.lastRecoveryTime.set(new Date().toISOString());
        this.errors.update((errors) => errors.filter((e) => e.id !== error.id));
        this.eventBus.publish('recovery:success', { errorId: error.id, code: error.code });
        this.logger.info('Recovery successful', { id: error.id });
        setTimeout(() => this.recoveryStatus.set('pending'), 2000);
        return true;
      } else {
        this.recoveryStatus.set('failed');
        this.eventBus.publish('recovery:failed', { errorId: error.id, code: error.code });
        this.logger.error('Recovery failed', { id: error.id });
        setTimeout(() => this.recoveryStatus.set('pending'), 2000);
        return false;
      }
    } catch (recoveryError) {
      this.recoveryStatus.set('failed');
      logError({
        code: ErrorCode.InternalError,
        message: 'Recovery action threw exception',
        details: recoveryError instanceof Error ? recoveryError.stack : String(recoveryError),
      });
      return false;
    }
  }

  async retryAll(): Promise<void> {
    this.logger.info('Retrying all recoverable errors...');
    const errors = this.errors().filter((e) => e.canRetry && e.retryCount < e.maxRetries);
    for (const error of errors) {
      await this.attemptRecovery(error);
      await this.delay(500);
    }
  }

  clearError(errorId: string): void {
    this.errors.update((errors) => errors.filter((e) => e.id !== errorId));
    this.logger.info('Error cleared', { id: errorId });
  }

  clearAllErrors(): void {
    this.errors.set([]);
    this.recoveryStatus.set('pending');
    this.logger.info('All errors cleared');
    this.eventBus.publish('recovery:cleared', { timestamp: Date.now() });
  }

  toggleAutoRecovery(): void {
    this.autoRecoveryEnabled.update((enabled) => !enabled);
    this.logger.info('Auto recovery toggled', { enabled: this.autoRecoveryEnabled() });
  }

  private calculateErrorTrend(): 'increasing' | 'stable' | 'decreasing' {
    const errors = this.errors();
    if (errors.length < 2) return 'stable';
    const recentCount = errors.slice(-5).length;
    const olderCount = errors.slice(0, -5).length || 1;
    const ratio = recentCount / olderCount;
    if (ratio > 1.5) return 'increasing';
    if (ratio < 0.5) return 'decreasing';
    return 'stable';
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getErrorSummary(): string {
    const stats = this.stats();
    return `${stats.totalErrors} errors (${stats.criticalErrors} critical, ${stats.warningErrors} warnings)`;
  }

  hasCriticalErrors(): boolean {
    return this.stats().criticalErrors > 0;
  }

  ngOnDestroy(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
  }
}
