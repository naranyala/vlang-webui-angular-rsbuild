import { Injectable, signal, computed, NgZone } from '@angular/core';
import { getLogger } from '../viewmodels/logger';

/**
 * Timer state
 */
export type TimerState = 'idle' | 'running' | 'paused' | 'stopped';

/**
 * Timer options
 */
export interface TimerOptions {
  name?: string;
  interval?: number;
  autoStart?: boolean;
  onComplete?: () => void;
}

/**
 * Timer statistics
 */
export interface TimerStats {
  state: TimerState;
  elapsed: number;
  laps: number;
  averageLap: number;
  bestLap: number;
  worstLap: number;
}

/**
 * Timer service for precise timing operations
 */
@Injectable({ providedIn: 'root' })
export class TimerService {
  private readonly logger = getLogger('timer');
  private readonly ngZone: NgZone;

  private startTime: number = 0;
  private pauseTime: number = 0;
  private accumulatedTime: number = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private laps: number[] = [];
  private onCompleteCallback: (() => void) | null = null;

  readonly state = signal<TimerState>('idle');
  readonly elapsed = signal<number>(0);
  readonly interval = signal<number>(1000);

  readonly stats = computed<TimerStats>(() => ({
    state: this.state(),
    elapsed: this.elapsed(),
    laps: this.laps.length,
    averageLap: this.laps.length > 0 ? this.laps.reduce((a, b) => a + b, 0) / this.laps.length : 0,
    bestLap: this.laps.length > 0 ? Math.min(...this.laps) : 0,
    worstLap: this.laps.length > 0 ? Math.max(...this.laps) : 0,
  }));

  constructor(ngZone: NgZone) {
    this.ngZone = ngZone;
  }

  /**
   * Start the timer
   */
  start(options?: TimerOptions): void {
    if (this.state() === 'running') {
      this.logger.warn('Timer already running');
      return;
    }

    const { name = 'default', interval = 1000, autoStart = true, onComplete } = options || {};

    this.ngZone.runOutsideAngular(() => {
      this.interval.set(interval);
      this.onCompleteCallback = onComplete || null;

      if (this.state() === 'paused') {
        // Resume from pause
        this.startTime = Date.now() - this.pauseTime;
      } else {
        // Fresh start
        this.startTime = Date.now();
        this.accumulatedTime = 0;
        this.laps = [];
      }

      this.state.set('running');

      this.intervalId = setInterval(() => {
        const now = Date.now();
        const elapsed = this.accumulatedTime + (now - this.startTime);
        this.elapsed.set(elapsed);

        // Check if we have a completion callback and time is reached
        // (for countdown timers, you'd track remaining time)
      }, interval);

      this.logger.debug('Timer started', { name, interval });
    });
  }

  /**
   * Pause the timer
   */
  pause(): void {
    if (this.state() !== 'running') {
      this.logger.warn('Timer not running');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.pauseTime = Date.now() - this.startTime;
    this.accumulatedTime += this.pauseTime;
    this.state.set('paused');

    this.logger.debug('Timer paused', { elapsed: this.elapsed() });
  }

  /**
   * Resume the timer
   */
  resume(): void {
    if (this.state() !== 'paused') {
      this.logger.warn('Timer not paused');
      return;
    }

    this.start({ interval: this.interval(), autoStart: true });
    this.logger.debug('Timer resumed');
  }

  /**
   * Stop the timer
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.state.set('stopped');
    this.logger.debug('Timer stopped', { elapsed: this.elapsed() });
  }

  /**
   * Reset the timer
   */
  reset(): void {
    this.stop();
    this.startTime = 0;
    this.pauseTime = 0;
    this.accumulatedTime = 0;
    this.elapsed.set(0);
    this.laps = [];
    this.state.set('idle');
    this.logger.debug('Timer reset');
  }

  /**
   * Record a lap time
   */
  lap(): number | null {
    if (this.state() !== 'running') {
      this.logger.warn('Cannot record lap - timer not running');
      return null;
    }

    const lapTime = this.elapsed();
    this.laps.push(lapTime);
    this.logger.debug('Lap recorded', { lapTime, lapNumber: this.laps.length });
    return lapTime;
  }

  /**
   * Get lap times
   */
  getLaps(): number[] {
    return [...this.laps];
  }

  /**
   * Clear lap times
   */
  clearLaps(): void {
    this.laps = [];
    this.logger.debug('Laps cleared');
  }

  /**
   * Get formatted time string (HH:MM:SS.ms)
   */
  getFormattedTime(): string {
    const totalMs = this.elapsed();
    const hours = Math.floor(totalMs / 3600000);
    const minutes = Math.floor((totalMs % 3600000) / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const milliseconds = totalMs % 1000;

    const parts: string[] = [];
    if (hours > 0) parts.push(String(hours).padStart(2, '0'));
    parts.push(String(minutes).padStart(2, '0'));
    parts.push(String(seconds).padStart(2, '0'));
    parts.push(String(milliseconds).padStart(3, '0'));

    return parts.join(':');
  }

  /**
   * Get elapsed time in various units
   */
  getElapsed(): {
    milliseconds: number;
    seconds: number;
    minutes: number;
    hours: number;
    days: number;
  } {
    const ms = this.elapsed();
    return {
      milliseconds: ms,
      seconds: ms / 1000,
      minutes: ms / 60000,
      hours: ms / 3600000,
      days: ms / 86400000,
    };
  }

  /**
   * Measure execution time of a function
   */
  measure<T>(fn: () => T, name?: string): { result: T; duration: number } {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    this.logger.debug('Measurement', { name: name || 'anonymous', duration });
    return { result, duration };
  }

  /**
   * Measure execution time of an async function
   */
  async measureAsync<T>(fn: () => Promise<T>, name?: string): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    this.logger.debug('Async measurement', { name: name || 'anonymous', duration });
    return { result, duration };
  }

  /**
   * Create a debounced function
   */
  debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        fn(...args);
        timeoutId = null;
      }, delay);
    };
  }

  /**
   * Create a throttled function
   */
  throttle<T extends (...args: unknown[]) => unknown>(
    fn: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }

  /**
   * Sleep/delay utility
   */
  sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.ngZone.runOutsideAngular(() => {
        setTimeout(resolve, ms);
      });
    });
  }

  /**
   * Wait for a condition to be true
   */
  async waitFor(condition: () => boolean, timeout = 5000, interval = 100): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const check = () => {
        if (condition()) {
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Wait timeout'));
        } else {
          setTimeout(check, interval);
        }
      };

      check();
    });
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
