import { CommonModule } from '@angular/common';
import { Component, ErrorHandler, Input, Output, EventEmitter, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { GlobalErrorService } from '../../core/global-error.service';
import { ErrorRecoveryService, RecoverableError } from '../../core/error-recovery.service';
import { ErrorCode } from '../../types/error.types';
import { EventBusViewModel } from '../../viewmodels/event-bus.viewmodel';

interface ErrorDisplay extends RecoverableError {}

@Component({
  selector: 'app-error-boundary',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (hasErrors()) {
      <div class="error-boundary" [class.has-critical]="hasCriticalErrors()">
        <div class="error-boundary__header">
          <span class="error-boundary__icon">{{ hasCriticalErrors() ? '🚨' : '⚠️' }}</span>
          <h3 class="error-boundary__title">
            {{ hasCriticalErrors() ? 'Critical Errors Detected' : 'Errors Detected' }}
          </h3>
          <button class="error-boundary__dismiss" (click)="dismiss()" title="Dismiss">✕</button>
        </div>

        <div class="error-boundary__stats">
          <div class="stat">
            <span class="stat-value">{{ stats().totalErrors }}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="stat stat--critical">
            <span class="stat-value">{{ stats().criticalErrors }}</span>
            <span class="stat-label">Critical</span>
          </div>
          <div class="stat stat--warning">
            <span class="stat-value">{{ stats().warningErrors }}</span>
            <span class="stat-label">Warnings</span>
          </div>
        </div>

        @if (recoveryService.canRecover()) {
          <div class="error-boundary__recovery">
            <button
              class="btn btn--primary"
              (click)="retryAll()"
              [disabled]="isRetrying()">
              {{ isRetrying() ? 'Retrying...' : 'Retry All (' + recoveryService.recoveryProgress() + '%)' }}
            </button>
            <button class="btn btn--secondary" (click)="toggleAutoRecovery()">
              {{ recoveryService.autoRecoveryEnabled() ? 'Disable' : 'Enable' }} Auto-Recovery
            </button>
          </div>
        }

        <div class="error-boundary__list">
          @for (error of errors(); track error.id) {
            <div class="error-item" [class.recoverable]="error.canRetry">
              <div class="error-item__icon">
                {{ getErrorIcon(error.code) }}
              </div>
              <div class="error-item__content">
                <div class="error-item__header">
                  <span class="error-item__code">{{ error.code }}</span>
                  <span class="error-item__time">{{ formatTime(error.timestamp) }}</span>
                </div>
                <p class="error-item__message">{{ error.message }}</p>
                @if (error.canRetry) {
                  <div class="error-item__actions">
                    <button
                      class="btn btn--small"
                      (click)="retryError(error)"
                      [disabled]="error.retryCount >= error.maxRetries || error.isRecovering">
                      @if (error.isRecovering) {
                        <span class="spinner spinner--small"></span>
                        Retrying...
                      } @else {
                        {{ error.retryCount }}/{{ error.maxRetries }} Retries
                      }
                    </button>
                    <button class="btn btn--small btn--text" (click)="clearError(error.id)">
                      Dismiss
                    </button>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <div class="error-boundary__footer">
          <button class="btn btn--text" (click)="clearAllErrors()">Clear All</button>
          <span class="error-boundary__trend" [class.trend-up]="stats().errorTrend === 'increasing'">
            Trend: {{ stats().errorTrend }}
          </span>
        </div>
      </div>
    }
  `,
  styles: [
    `
    .error-boundary {
      position: fixed;
      bottom: 16px;
      right: 16px;
      width: 400px;
      max-height: 500px;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      overflow: hidden;
      border: 1px solid #e0e0e0;
      animation: slideIn 0.3s ease-out;
    }

    .error-boundary.has-critical {
      border-color: #ef4444;
      box-shadow: 0 8px 32px rgba(239, 68, 68, 0.3);
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .error-boundary__header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-bottom: 1px solid #e0e0e0;
    }

    .error-boundary.has-critical .error-boundary__header {
      background: linear-gradient(135deg, #fee2e2 0%, #ffffff 100%);
      border-bottom-color: #ef4444;
    }

    .error-boundary__icon {
      font-size: 24px;
    }

    .error-boundary__title {
      flex: 1;
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1a1a2e;
    }

    .error-boundary__dismiss {
      width: 28px;
      height: 28px;
      border: none;
      background: #f0f0f0;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      color: #666;
      transition: all 0.2s;
    }

    .error-boundary__dismiss:hover {
      background: #e0e0e0;
      color: #333;
    }

    .error-boundary__stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      padding: 12px 16px;
      background: #fafafa;
      border-bottom: 1px solid #e0e0e0;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px;
      background: #ffffff;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .stat--critical {
      border-color: #ef4444;
    }

    .stat--warning {
      border-color: #f59e0b;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .stat--critical .stat-value {
      color: #ef4444;
    }

    .stat--warning .stat-value {
      color: #f59e0b;
    }

    .stat-label {
      font-size: 11px;
      color: #666;
      margin-top: 4px;
    }

    .error-boundary__recovery {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      background: #f0f9ff;
      border-bottom: 1px solid #bae6fd;
    }

    .error-boundary__list {
      max-height: 300px;
      overflow-y: auto;
      padding: 8px;
    }

    .error-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 8px;
      transition: all 0.2s;
    }

    .error-item:hover {
      border-color: #667eea;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
    }

    .error-item.recoverable {
      border-left: 3px solid #667eea;
    }

    .error-item__icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .error-item__content {
      flex: 1;
      min-width: 0;
    }

    .error-item__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .error-item__code {
      font-size: 11px;
      font-weight: 600;
      color: #666;
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .error-item__time {
      font-size: 11px;
      color: #999;
    }

    .error-item__message {
      margin: 0 0 8px;
      font-size: 13px;
      color: #333;
      line-height: 1.4;
      word-break: break-word;
    }

    .error-item__actions {
      display: flex;
      gap: 8px;
    }

    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn--primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
    }

    .btn--primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn--secondary {
      background: #f0f0f0;
      color: #333;
    }

    .btn--secondary:hover:not(:disabled) {
      background: #e0e0e0;
    }

    .btn--small {
      padding: 4px 8px;
      font-size: 11px;
      background: #f0f0f0;
      color: #333;
    }

    .btn--small:hover:not(:disabled) {
      background: #e0e0e0;
    }

    .btn--text {
      background: transparent;
      color: #666;
      padding: 4px 8px;
    }

    .btn--text:hover:not(:disabled) {
      background: #f0f0f0;
      color: #333;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinner--small {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid #e0e0e0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 4px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-boundary__footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #fafafa;
      border-top: 1px solid #e0e0e0;
    }

    .error-boundary__trend {
      font-size: 11px;
      color: #666;
      padding: 4px 8px;
      background: #f0f0f0;
      border-radius: 4px;
    }

    .error-boundary__trend.trend-up {
      color: #ef4444;
      background: #fee2e2;
    }
  `,
  ],
})
export class ErrorBoundaryComponent implements OnInit, OnDestroy {
  @Input() visible = true;
  @Output() dismissed = new EventEmitter<void>();

  private readonly errorService = inject(GlobalErrorService);
  readonly recoveryService = inject(ErrorRecoveryService);
  private readonly eventBus = inject(EventBusViewModel<Record<string, unknown>>);
  private successUnsubscribe: (() => void) | null = null;
  private failedUnsubscribe: (() => void) | null = null;

  readonly hasErrors = computed(() => this.recoveryService.errors().length > 0);
  readonly hasCriticalErrors = computed(() => this.recoveryService.hasCriticalErrors());
  readonly stats = this.recoveryService.stats;
  readonly errors = this.recoveryService.errors;
  readonly isRetrying = signal(false);

  ngOnInit(): void {
    // Subscribe to recovery events
    this.successUnsubscribe = this.eventBus.subscribe('recovery:success', () => {
      this.isRetrying.set(false);
    });
    this.failedUnsubscribe = this.eventBus.subscribe('recovery:failed', () => {
      this.isRetrying.set(false);
    });
  }

  ngOnDestroy(): void {
    this.successUnsubscribe?.();
    this.failedUnsubscribe?.();
  }

  dismiss(): void {
    this.dismissed.emit();
  }

  retryAll(): void {
    this.isRetrying.set(true);
    this.recoveryService.retryAll().finally(() => {
      this.isRetrying.set(false);
    });
  }

  async retryError(error: ErrorDisplay): Promise<void> {
    const recoverableError = this.recoveryService
      .errors()
      .find((e) => e.id === error.id);

    if (recoverableError) {
      await this.recoveryService.attemptRecovery(recoverableError);
    }
  }

  clearError(errorId: string): void {
    this.recoveryService.clearError(errorId);
  }

  clearAllErrors(): void {
    this.recoveryService.clearAllErrors();
  }

  toggleAutoRecovery(): void {
    this.recoveryService.toggleAutoRecovery();
  }

  getErrorIcon(code: ErrorCode): string {
    const icons: Record<ErrorCode, string> = {
      [ErrorCode.DbConnectionFailed]: '🔌',
      [ErrorCode.DbQueryFailed]: '📊',
      [ErrorCode.DbConstraintViolation]: '⚠️',
      [ErrorCode.DbNotFound]: '🔍',
      [ErrorCode.DbAlreadyExists]: '📋',
      [ErrorCode.ConfigNotFound]: '⚙️',
      [ErrorCode.ConfigInvalid]: '⚙️',
      [ErrorCode.ConfigMissingField]: '⚙️',
      [ErrorCode.SerializationFailed]: '📦',
      [ErrorCode.DeserializationFailed]: '📦',
      [ErrorCode.InvalidFormat]: '📄',
      [ErrorCode.ValidationFailed]: '⚠️',
      [ErrorCode.MissingRequiredField]: '📝',
      [ErrorCode.InvalidFieldValue]: '📝',
      [ErrorCode.ResourceNotFound]: '🔍',
      [ErrorCode.UserNotFound]: '👤',
      [ErrorCode.EntityNotFound]: '📦',
      [ErrorCode.LockPoisoned]: '🔒',
      [ErrorCode.InternalError]: '🔧',
      [ErrorCode.Unknown]: '❓',
    };
    return icons[code] || '❗';
  }

  formatTime(timestamp: string): string {
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch {
      return timestamp;
    }
  }
}
