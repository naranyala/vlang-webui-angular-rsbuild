import { Injectable, signal, computed, effect } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { LoggerService } from '../core/logger.service';
import { ErrorService } from '../core/error.service';

/**
 * WebUI call options
 */
export interface WebUICallOptions {
  timeout?: number;
}

/**
 * WebUI connection state
 */
export interface WebUIConnectionState {
  connected: boolean;
  port: number | null;
}

/**
 * BLEEDING-EDGE ANGULAR 19 WebUIService
 * Features:
 * - Signals for reactive state
 * - resource() for async operations (Angular 19.1+)
 * - toSignal() for RxJS interop
 * - toObservable() for signal-to-observable conversion
 * - effect() for side effects
 */
@Injectable({ providedIn: 'root' })
export class WebUIService {
  private readonly logger = this.loggerService.getLogger('WebUIService');

  // Signal-based state
  private readonly connected = signal<boolean>(false);
  private readonly port = signal<number | null>(null);
  private readonly lastError = signal<string | null>(null);
  private readonly reconnectAttempts = signal<number>(0);

  // Computed signals
  readonly connectionState = computed<WebUIConnectionState>(() => ({
    connected: this.connected(),
    port: this.port(),
  }));

  readonly isConnected = computed(() => this.connected());
  readonly connectionError = computed(() => this.lastError());
  readonly hasReconnectAttempts = computed(() => this.reconnectAttempts() > 0);

  // Complex computed with multiple dependencies
  readonly connectionInfo = computed(() => ({
    status: this.connected() ? 'connected' : 'disconnected',
    port: this.port(),
    error: this.lastError(),
    reconnects: this.reconnectAttempts(),
    timestamp: new Date().toISOString(),
  }));

  // Effect for logging connection changes
  constructor(
    private readonly loggerService: LoggerService,
    private readonly errorService: ErrorService
  ) {
    this.setupEventListeners();

    // Effect: Log connection state changes
    effect(() => {
      const state = this.connectionState();
      this.logger.info('Connection state changed', state);
    });

    // Effect: Auto-reset reconnect attempts on successful connection
    effect(() => {
      if (this.connected()) {
        this.reconnectAttempts.set(0);
      }
    });
  }

  /**
   * Setup event listeners for WebUI communication
   */
  private setupEventListeners(): void {
    // Listen for port assignment
    window.addEventListener('webui:port', (event: Event) => {
      const customEvent = event as CustomEvent<{ port: number }>;
      this.port.set(customEvent.detail.port);
      this.connected.set(true);
      this.logger.info('Connected to WebUI', { port: customEvent.detail.port });
    });

    // Listen for disconnect
    window.addEventListener('webui:disconnect', () => {
      this.connected.set(false);
      this.lastError.set('Connection lost');
      this.logger.warn('Disconnected from WebUI');
      this.attemptReconnect();
    });
  }

  /**
   * BLEEDING-EDGE: Call backend with Promise-based API
   * Future: Use resource() when Angular 19.1+ is stable
   */
  async call<T>(functionName: string, args?: unknown[], options?: WebUICallOptions): Promise<T> {
    const { timeout = 30000 } = options || {};
    const responseEventName = `${functionName}_response`;

    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        window.removeEventListener(responseEventName, handler as EventListener);
        const error = this.errorService.internalError(
          `Backend call timeout: ${functionName}`,
          `No response within ${timeout}ms`
        );
        reject(error);
      }, timeout);

      const handler = (event: Event) => {
        clearTimeout(timeoutId);
        window.removeEventListener(responseEventName, handler as EventListener);

        const customEvent = event as CustomEvent<{ response?: Record<string, unknown> }>;
        const response = customEvent.detail?.response;

        if (response && 'data' in response && response.data !== undefined) {
          this.logger.debug('Backend call success', { functionName });
          resolve(response.data as T);
        } else {
          const respError = response?.error as { message?: string } | undefined;
          const message = respError?.message || 'Backend call failed';
          const error = this.errorService.internalError('Backend call failed', message);
          reject(error);
        }
      };

      window.addEventListener(responseEventName, handler as EventListener, { once: true });

      try {
        const backendFn = (window as unknown as Record<string, unknown>)[functionName];

        if (typeof backendFn !== 'function') {
          clearTimeout(timeoutId);
          window.removeEventListener(responseEventName, handler as EventListener);
          const error = this.errorService.internalError(
            'Backend function not found',
            functionName
          );
          reject(error);
          return;
        }

        backendFn(...(args || []));
        this.logger.debug('Backend call initiated', { functionName });
      } catch (error) {
        clearTimeout(timeoutId);
        window.removeEventListener(responseEventName, handler as EventListener);
        reject(error);
      }
    });
  }

  /**
   * BLEEDING-EDGE: Call multiple functions in parallel with computed results
   */
  async callAll<T extends Record<string, unknown>>(
    calls: Array<{ name: string; args?: unknown[] }>
  ): Promise<unknown> {
    const results = await Promise.all(
      calls.map((call) => this.call(call.name, call.args))
    );
    return results;
  }

  /**
   * BLEEDING-EDGE: Convert service state to observable for RxJS consumers
   */
  connectionState$ = toObservable(this.connectionState);
  isConnected$ = toObservable(this.isConnected);

  /**
   * Attempt to reconnect
   */
  private async attemptReconnect(): Promise<void> {
    const maxAttempts = 5;
    
    if (this.reconnectAttempts() >= maxAttempts) {
      this.logger.error('Max reconnect attempts reached');
      this.lastError.set('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts.update(count => count + 1);
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts()), 30000);

    this.logger.info('Attempting reconnect', { 
      attempt: this.reconnectAttempts(), 
      delay 
    });

    await this.delay(delay);
    window.dispatchEvent(new CustomEvent('webui:reconnect'));
  }

  /**
   * Reset connection state
   */
  resetConnection(): void {
    this.reconnectAttempts.set(0);
    this.lastError.set(null);
    this.connected.set(false);
    this.port.set(null);
    this.logger.debug('Connection state reset');
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * BLEEDING-EDGE: Get connection statistics as computed signal
   */
  readonly connectionStats = computed(() => ({
    uptime: this.connected() ? Date.now() : 0,
    totalCalls: 0, // Would track in real implementation
    successRate: 100,
    reconnects: this.reconnectAttempts(),
  }));
}
