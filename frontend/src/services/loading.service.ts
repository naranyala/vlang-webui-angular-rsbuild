import { Injectable, signal, computed } from '@angular/core';
import { getLogger } from '../viewmodels/logger';

/**
 * Loading state
 */
export interface LoadingState {
  id: string;
  label: string;
  progress?: number;
  showProgress?: boolean;
  createdAt: number;
}

/**
 * Loading service configuration
 */
export interface LoadingConfig {
  id?: string;
  label?: string;
  progress?: number;
  showProgress?: boolean;
  minDuration?: number;
}

/**
 * Loading service for managing loading states
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly logger = getLogger('loading');
  private loadingCounter = 0;
  private minDurationTimers = new Map<string, ReturnType<typeof setTimeout>>();

  readonly loadingStates = signal<LoadingState[]>([]);
  readonly isLoading = computed(() => this.loadingStates().length > 0);
  readonly count = computed(() => this.loadingStates().length);
  readonly currentLoading = computed(() => {
    const states = this.loadingStates();
    return states.length > 0 ? states[states.length - 1] : null;
  });

  /**
   * Start a loading state
   */
  start(config?: LoadingConfig): string {
    const id = config?.id || `loading-${++this.loadingCounter}`;
    const label = config?.label || 'Loading...';

    // Check if already loading with this ID
    if (this.loadingStates().some((s) => s.id === id)) {
      this.logger.warn('Loading state already exists', { id });
      return id;
    }

    const state: LoadingState = {
      id,
      label,
      progress: config?.progress,
      showProgress: config?.showProgress ?? false,
      createdAt: Date.now(),
    };

    this.loadingStates.update((states) => [...states, state]);
    this.logger.debug('Loading started', { id, label });

    // Handle minimum duration if specified
    if (config?.minDuration) {
      this.minDurationTimers.set(
        id,
        setTimeout(() => {
          this.minDurationTimers.delete(id);
        }, config.minDuration)
      );
    }

    return id;
  }

  /**
   * Stop a loading state
   */
  stop(id?: string): boolean {
    const states = this.loadingStates();

    // If no ID provided, stop the most recent
    const lastState = states.length > 0 ? states[states.length - 1] : undefined;
    const targetId = id || lastState?.id || null;

    if (!targetId) {
      this.logger.warn('No loading state to stop');
      return false;
    }

    // Check minimum duration
    if (this.minDurationTimers.has(targetId)) {
      this.logger.debug('Waiting for minimum duration', { id: targetId });
      return false;
    }

    this.loadingStates.update((states) => states.filter((s) => s.id !== targetId));
    this.logger.debug('Loading stopped', { id: targetId });

    return true;
  }

  /**
   * Stop all loading states
   */
  stopAll(): void {
    this.minDurationTimers.forEach((timer) => clearTimeout(timer));
    this.minDurationTimers.clear();
    this.loadingStates.set([]);
    this.logger.debug('All loading states stopped');
  }

  /**
   * Update loading progress
   */
  updateProgress(progress: number, id?: string): boolean {
    const states = this.loadingStates();
    const lastState = states.length > 0 ? states[states.length - 1] : undefined;
    const targetId = id || lastState?.id || null;

    if (!targetId) {
      return false;
    }

    let updated = false;
    this.loadingStates.update((state) =>
      state.map((s) => {
        if (s.id === targetId) {
          updated = true;
          return { ...s, progress: Math.min(100, Math.max(0, progress)) };
        }
        return s;
      })
    );

    return updated;
  }

  /**
   * Update loading label
   */
  updateLabel(label: string, id?: string): boolean {
    const states = this.loadingStates();
    const lastState = states.length > 0 ? states[states.length - 1] : undefined;
    const targetId = id || lastState?.id || null;

    if (!targetId) {
      return false;
    }

    let updated = false;
    this.loadingStates.update((state) =>
      state.map((s) => {
        if (s.id === targetId) {
          updated = true;
          return { ...s, label };
        }
        return s;
      })
    );

    return updated;
  }

  /**
   * Wrap a promise with loading state
   */
  async wrap<T>(
    promise: Promise<T>,
    config?: LoadingConfig
  ): Promise<T> {
    const id = this.start(config);

    try {
      const result = await promise;
      this.stop(id);
      return result;
    } catch (error) {
      this.stop(id);
      throw error;
    }
  }

  /**
   * Wrap multiple promises with loading state
   */
  async wrapAll<T>(
    promises: Promise<T>[],
    config?: LoadingConfig
  ): Promise<T[]> {
    const id = this.start({ ...config, showProgress: true });

    try {
      const total = promises.length;
      let completed = 0;

      const results = await Promise.all(
        promises.map(async (promise) => {
          const result = await promise;
          completed++;
          this.updateProgress((completed / total) * 100, id);
          return result;
        })
      );

      this.stop(id);
      return results;
    } catch (error) {
      this.stop(id);
      throw error;
    }
  }

  /**
   * Wrap a function with loading state
   */
  async wrapFn<T>(
    fn: () => Promise<T>,
    config?: LoadingConfig
  ): Promise<T> {
    return this.wrap(fn(), config);
  }

  /**
   * Check if a specific loading state is active
   */
  isActive(id?: string): boolean {
    if (!id) {
      return this.isLoading();
    }
    return this.loadingStates().some((s) => s.id === id);
  }

  /**
   * Get loading state by ID
   */
  getState(id: string): LoadingState | undefined {
    return this.loadingStates().find((s) => s.id === id);
  }

  /**
   * Get all loading states
   */
  getAllStates(): LoadingState[] {
    return [...this.loadingStates()];
  }

  /**
   * Get loading duration for a state
   */
  getDuration(id?: string): number | null {
    const states = this.loadingStates();
    const lastState = states.length > 0 ? states[states.length - 1] : undefined;
    const targetId = id || lastState?.id || null;

    if (!targetId) {
      return null;
    }

    const state = this.loadingStates().find((s) => s.id === targetId);
    if (!state) {
      return null;
    }

    return Date.now() - state.createdAt;
  }
}
