import { Injectable, signal, computed, NgZone } from '@angular/core';
import { getLogger } from '../viewmodels/logger';
import { EventBusViewModel } from '../viewmodels/event-bus.viewmodel';
import { ErrorCode, ErrorValue, Result, isOk, isErr } from '../types/error.types';

/**
 * WebUI call options
 */
export interface WebUICallOptions {
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  responseEvent?: string;
}

/**
 * WebUI connection state
 */
export interface WebUIConnectionState {
  connected: boolean;
  port: number | null;
  latency: number;
  lastError: string | null;
  reconnectAttempts: number;
}

/**
 * WebUI service for communicating with the V backend
 * Provides a clean API for calling backend functions and handling responses
 */
@Injectable({ providedIn: 'root' })
export class WebUIService {
  private readonly logger = getLogger('webui');
  private readonly ngZone: NgZone;
  private readonly eventBus: EventBusViewModel<Record<string, unknown>>;

  private responseListeners = new Map<string, Set<(response: unknown) => void>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  readonly connected = signal<boolean>(false);
  readonly port = signal<number | null>(null);
  readonly latency = signal<number>(0);
  readonly lastError = signal<string | null>(null);

  readonly connectionState = computed<WebUIConnectionState>(() => ({
    connected: this.connected(),
    port: this.port(),
    latency: this.latency(),
    lastError: this.lastError(),
    reconnectAttempts: this.reconnectAttempts,
  }));

  constructor(ngZone: NgZone, eventBus: EventBusViewModel<Record<string, unknown>>) {
    this.ngZone = ngZone;
    this.eventBus = eventBus;
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for WebUI communication
   */
  private setupEventListeners(): void {
    // Listen for port assignment
    window.addEventListener('webui:port', (event: Event) => {
      const customEvent = event as CustomEvent<{ port: number }>;
      this.ngZone.run(() => {
        this.port.set(customEvent.detail.port);
        this.connected.set(true);
        this.logger.info('Connected to WebUI', { port: customEvent.detail.port });
        this.eventBus.publish('connection:state', {
          state: 'connected',
          connected: true,
          port: customEvent.detail.port,
        });
      });
    });

    // Listen for disconnect
    window.addEventListener('webui:disconnect', () => {
      this.ngZone.run(() => {
        this.connected.set(false);
        this.lastError.set('Connection lost');
        this.logger.warn('Disconnected from WebUI');
        this.eventBus.publish('connection:state', { state: 'disconnected', connected: false });
        this.attemptReconnect();
      });
    });

    // Listen for reconnection success
    window.addEventListener('webui:reconnected', (event: Event) => {
      const customEvent = event as CustomEvent<{ connected: boolean }>;
      this.ngZone.run(() => {
        if (customEvent.detail.connected) {
          this.reconnectAttempts = 0;
          this.lastError.set(null);
          this.logger.info('Reconnected to WebUI');
        }
      });
    });
  }

  /**
   * Call a backend function and get a typed response
   */
  async call<T>(functionName: string, args?: unknown[], options?: WebUICallOptions): Promise<Result<T>> {
    const { timeout = 30000, retryCount = 0, retryDelay = 1000, responseEvent } = options || {};

    // Check connection
    if (!this.connected()) {
      this.logger.warn('Not connected, attempting call anyway', { functionName });
    }

    // Build response event name
    const responseEventName = responseEvent || `${functionName}_response`;

    return new Promise<Result<T>>((resolve) => {
      const handler = (event: Event) => {
        const customEvent = event as CustomEvent<{ response?: Record<string, unknown> }>;
        const response = customEvent.detail?.response;

        this.ngZone.run(() => {
          // Remove listener
          window.removeEventListener(responseEventName, handler as EventListener);

          if (response && 'data' in response && response.data !== undefined) {
            this.logger.debug('Backend call success', { functionName });
            resolve({ ok: true, value: response.data as T });
          } else {
            const respError = response?.error as { code?: string; message?: string; details?: string } | undefined;
            const errorValue: ErrorValue = {
              code: (respError?.code as ErrorCode) || ErrorCode.InternalError,
              message: respError?.message || `Backend call failed: ${functionName}`,
              details: respError?.details,
            };
            this.logger.error('Backend call failed', { functionName, error: errorValue.message });
            resolve({ ok: false, error: errorValue });
          }
        });
      };

      // Setup timeout
      const timeoutId = setTimeout(() => {
        window.removeEventListener(responseEventName, handler as EventListener);
        this.ngZone.run(() => {
          this.logger.error('Backend call timeout', { functionName, timeout });
          resolve({
            ok: false,
            error: {
              code: ErrorCode.InternalError,
              message: `Backend call timeout: ${functionName}`,
              details: `No response within ${timeout}ms`,
            },
          });
        });
      }, timeout);

      // Add listener
      window.addEventListener(responseEventName, handler as EventListener, { once: true });

      // Call backend function
      try {
        const backendFn = (window as unknown as Record<string, unknown>)[functionName];

        if (typeof backendFn !== 'function') {
          clearTimeout(timeoutId);
          window.removeEventListener(responseEventName, handler as EventListener);
          this.logger.error('Backend function not found', { functionName });
          resolve({
            ok: false,
            error: {
              code: ErrorCode.InternalError,
              message: `Backend function not found: ${functionName}`,
            },
          });
          return;
        }

        backendFn(...(args || []));
        this.logger.debug('Backend call initiated', { functionName });
      } catch (error) {
        clearTimeout(timeoutId);
        window.removeEventListener(responseEventName, handler as EventListener);
        this.logger.error('Backend call failed', { functionName, error });
        resolve({
          ok: false,
          error: {
            code: ErrorCode.InternalError,
            message: `Failed to call backend: ${functionName}`,
            cause: error instanceof Error ? error.message : String(error),
          },
        });
      }
    });
  }

  /**
   * Call with automatic retry
   */
  async callWithRetry<T>(
    functionName: string,
    args?: unknown[],
    options?: WebUICallOptions
  ): Promise<Result<T>> {
    const { retryCount = 3, retryDelay = 1000, ...callOptions } = options || {};

    let lastError: ErrorValue | null = null;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      if (attempt > 0) {
        this.logger.info('Retry attempt', { functionName, attempt, maxRetries: retryCount });
        await this.delay(retryDelay * attempt); // Exponential backoff
      }

      const result = await this.call<T>(functionName, args, callOptions);

      if (isOk(result)) {
        return result;
      }

      lastError = result.error;

      // Don't retry on certain errors
      if (this.isNonRetryableError(result.error)) {
        return result;
      }
    }

    return { ok: false, error: lastError! };
  }

  /**
   * Call multiple functions in parallel
   */
  async callAll<T extends Record<string, unknown>>(
    calls: Array<{ name: string; args?: unknown[]; options?: WebUICallOptions }>
  ): Promise<{ [K in keyof T]: Result<T[K]> }> {
    const results = await Promise.all(
      calls.map((call) => this.call(call.name, call.args, call.options))
    );

    return results as { [K in keyof T]: Result<T[K]> };
  }

  /**
   * Call multiple functions sequentially
   */
  async callSequential<T extends unknown[]>(
    calls: Array<{ name: string; args?: unknown[]; options?: WebUICallOptions }>
  ): Promise<Result<T>> {
    const results: unknown[] = [];

    for (const call of calls) {
      const result = await this.call(call.name, call.args, call.options);

      if (isErr(result)) {
        return { ok: false, error: result.error };
      }

      results.push(result.value);
    }

    return { ok: true, value: results as T };
  }

  /**
   * Subscribe to a response event
   */
  subscribe(responseEvent: string, callback: (response: unknown) => void): () => void {
    if (!this.responseListeners.has(responseEvent)) {
      this.responseListeners.set(responseEvent, new Set());
    }

    const listeners = this.responseListeners.get(responseEvent)!;
    listeners.add(callback);

    // Return unsubscribe function
    return () => {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.responseListeners.delete(responseEvent);
      }
    };
  }

  /**
   * Attempt to reconnect
   */
  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Max reconnect attempts reached');
      this.lastError.set('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    this.logger.info('Attempting reconnect', { attempt: this.reconnectAttempts, delay });

    await this.delay(delay);

    // Dispatch custom event to trigger reconnection
    window.dispatchEvent(new CustomEvent('webui:reconnect'));
  }

  /**
   * Check if error is non-retryable
   */
  private isNonRetryableError(error: ErrorValue): boolean {
    const nonRetryableCodes: ErrorCode[] = [
      ErrorCode.ValidationFailed,
      ErrorCode.MissingRequiredField,
      ErrorCode.InvalidFieldValue,
      ErrorCode.ResourceNotFound,
      ErrorCode.UserNotFound,
      ErrorCode.EntityNotFound,
    ];
    return nonRetryableCodes.includes(error.code);
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Reset connection state
   */
  resetConnection(): void {
    this.reconnectAttempts = 0;
    this.lastError.set(null);
    this.connected.set(false);
    this.port.set(null);
    this.logger.debug('Connection state reset');
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    uptime: number;
    totalCalls: number;
    successRate: number;
  } {
    // This would be enhanced with actual tracking
    return {
      uptime: 0,
      totalCalls: 0,
      successRate: 100,
    };
  }
}
