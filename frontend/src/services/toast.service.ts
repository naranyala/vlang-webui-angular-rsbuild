import { Injectable, signal, computed } from '@angular/core';
import { getLogger } from '../viewmodels/logger';

/**
 * Toast notification types
 */
export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'loading';

/**
 * Toast notification position
 */
export type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';

/**
 * Toast notification configuration
 */
export interface ToastConfig {
  id?: string;
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
  position?: ToastPosition;
  dismissible?: boolean;
  icon?: string;
  progress?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Toast notification instance
 */
export interface Toast extends ToastConfig {
  id: string;
  createdAt: number;
  progress: number;
}

/**
 * Toast service for displaying notifications
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly logger = getLogger('toast');
  private toastCounter = 0;

  readonly toasts = signal<Toast[]>([]);
  readonly isVisible = computed(() => this.toasts().length > 0);
  readonly count = computed(() => this.toasts().length);

  private readonly defaultDuration: Record<ToastType, number> = {
    info: 4000,
    success: 3000,
    warning: 5000,
    error: 6000,
    loading: 0, // No auto-dismiss for loading
  };

  private readonly defaultIcons: Record<ToastType, string> = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    loading: '⏳',
  };

  /**
   * Show a toast notification
   */
  show(config: ToastConfig): string {
    const id = config.id || `toast-${++this.toastCounter}`;
    const type = config.type || 'info';
    const duration = config.duration ?? this.defaultDuration[type];

    const toast: Toast = {
      id,
      type,
      title: config.title,
      message: config.message,
      duration,
      position: config.position || 'top-right',
      dismissible: config.dismissible ?? true,
      icon: config.icon || this.defaultIcons[type],
      action: config.action,
      createdAt: Date.now(),
      progress: 100,
    };

    this.toasts.update((toasts) => [...toasts, toast]);
    this.logger.debug('Toast shown', { id, type, message: config.message });

    // Auto-dismiss if duration is set
    if (duration > 0) {
      this.scheduleDismiss(id, duration);
    }

    // Update progress
    if (duration > 0) {
      this.updateProgress(id, duration);
    }

    return id;
  }

  /**
   * Show an info toast
   */
  info(message: string, title?: string, duration?: number): string {
    return this.show({ type: 'info', message, title, duration });
  }

  /**
   * Show a success toast
   */
  success(message: string, title?: string, duration?: number): string {
    return this.show({ type: 'success', message, title, duration });
  }

  /**
   * Show a warning toast
   */
  warning(message: string, title?: string, duration?: number): string {
    return this.show({ type: 'warning', message, title, duration });
  }

  /**
   * Show an error toast
   */
  error(message: string, title?: string, duration?: number): string {
    return this.show({ type: 'error', message, title, duration });
  }

  /**
   * Show a loading toast
   */
  loading(message: string, title?: string): string {
    return this.show({ type: 'loading', message, title, duration: 0, dismissible: false });
  }

  /**
   * Dismiss a toast by ID
   */
  dismiss(id: string): boolean {
    const toast = this.toasts().find((t) => t.id === id);
    if (toast) {
      this.toasts.update((toasts) => toasts.filter((t) => t.id !== id));
      this.logger.debug('Toast dismissed', { id });
      return true;
    }
    return false;
  }

  /**
   * Dismiss the most recent toast
   */
  dismissLatest(): boolean {
    const toasts = this.toasts();
    if (toasts.length > 0) {
      const latest = toasts[toasts.length - 1];
      if (latest?.id) {
        return this.dismiss(latest.id);
      }
    }
    return false;
  }

  /**
   * Dismiss all toasts
   */
  dismissAll(): void {
    this.toasts.set([]);
    this.logger.debug('All toasts dismissed');
  }

  /**
   * Dismiss all toasts of a specific type
   */
  dismissByType(type: ToastType): number {
    const toastsToRemove = this.toasts().filter((t) => t.type === type);
    toastsToRemove.forEach((toast) => this.dismiss(toast.id));
    return toastsToRemove.length;
  }

  /**
   * Update a toast's message
   */
  update(id: string, updates: Partial<ToastConfig>): boolean {
    let updated = false;
    this.toasts.update((toasts) =>
      toasts.map((toast) => {
        if (toast.id === id) {
          updated = true;
          return { ...toast, ...updates };
        }
        return toast;
      })
    );
    return updated;
  }

  /**
   * Convert loading toast to success
   */
  loadingToSuccess(id: string, message?: string): boolean {
    return this.update(id, {
      type: 'success',
      message: message || 'Completed',
      duration: 3000,
      dismissible: true,
    });
  }

  /**
   * Convert loading toast to error
   */
  loadingToError(id: string, message?: string): boolean {
    return this.update(id, {
      type: 'error',
      message: message || 'Failed',
      duration: 6000,
      dismissible: true,
    });
  }

  /**
   * Schedule toast dismissal
   */
  private scheduleDismiss(id: string, duration: number): void {
    setTimeout(() => {
      this.dismiss(id);
    }, duration);
  }

  /**
   * Update toast progress
   */
  private updateProgress(id: string, duration: number): void {
    const startTime = Date.now();
    const interval = 100;

    const updateInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.max(0, 100 - (elapsed / duration) * 100);

      const toast = this.toasts().find((t) => t.id === id);
      if (!toast || progress <= 0) {
        clearInterval(updateInterval);
        return;
      }

      this.update(id, { progress });
    }, interval);
  }

  /**
   * Get toast by ID
   */
  get(id: string): Toast | undefined {
    return this.toasts().find((t) => t.id === id);
  }

  /**
   * Check if a toast exists
   */
  has(id: string): boolean {
    return this.toasts().some((t) => t.id === id);
  }
}
