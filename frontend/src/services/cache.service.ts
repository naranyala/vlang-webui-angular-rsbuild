import { Injectable, signal, computed } from '@angular/core';
import { getLogger } from '../viewmodels/logger';

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  expiresAt: number | null;
  hits: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  maxSize?: number;
  defaultTtl?: number; // Time to live in milliseconds
  evictionPolicy?: 'lru' | 'fifo' | 'lfu';
}

/**
 * Generic cache service with TTL support and eviction policies
 */
@Injectable({ providedIn: 'root' })
export class CacheService<T = unknown> {
  private readonly logger = getLogger('cache');
  private readonly cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private defaultTtl: number;
  private evictionPolicy: 'lru' | 'fifo' | 'lfu';

  private readonly hits = signal<number>(0);
  private readonly misses = signal<number>(0);
  private readonly evictions = signal<number>(0);

  readonly size = computed(() => this.cache.size);
  readonly stats = computed<CacheStats>(() => {
    const total = this.hits() + this.misses();
    const hitRate = total > 0 ? (this.hits() / total) * 100 : 0;

    let oldest: Date | null = null;
    let newest: Date | null = null;

    for (const entry of this.cache.values()) {
      const date = new Date(entry.timestamp);
      if (!oldest || date < oldest) oldest = date;
      if (!newest || date > newest) newest = date;
    }

    return {
      size: this.cache.size,
      hits: this.hits(),
      misses: this.misses(),
      hitRate,
      evictions: this.evictions(),
      oldestEntry: oldest,
      newestEntry: newest,
    };
  });

  private constructor() {
    this.maxSize = 100;
    this.defaultTtl = 5 * 60 * 1000;
    this.evictionPolicy = 'lru';
  }

  /**
   * Create a new CacheService instance
   */
  static create<T>(config?: { maxSize?: number; defaultTtl?: number; evictionPolicy?: 'lru' | 'fifo' | 'lfu' }): CacheService<T> {
    const instance = new CacheService<T>();
    if (config) {
      instance.maxSize = config.maxSize ?? 100;
      instance.defaultTtl = config.defaultTtl ?? 5 * 60 * 1000;
      instance.evictionPolicy = config.evictionPolicy ?? 'lru';
    }
    return instance;
  }

  /**
   * Get a value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses.update((m) => m + 1);
      this.logger.debug('Cache miss', { key });
      return undefined;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key);
      this.misses.update((m) => m + 1);
      this.logger.debug('Cache entry expired', { key });
      return undefined;
    }

    // Update hit count for LFU
    entry.hits++;
    this.hits.update((h) => h + 1);
    this.logger.debug('Cache hit', { key, hits: entry.hits });

    return entry.value;
  }

  /**
   * Set a value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    // Check if we need to evict
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evict();
    }

    const expiresAt = ttl !== null ? Date.now() + (ttl ?? this.defaultTtl) : null;

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      expiresAt,
      hits: 0,
    });

    this.logger.debug('Cache set', { key, ttl, expiresAt });
  }

  /**
   * Delete a value from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug('Cache delete', { key });
    }
    return deleted;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.logger.info('Cache cleared');
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all values
   */
  values(): T[] {
    return Array.from(this.cache.values()).map((e) => e.value);
  }

  /**
   * Get all entries
   */
  entries(): Array<[string, T]> {
    return Array.from(this.cache.entries()).map(([k, v]) => [k, v.value]);
  }

  /**
   * Get or set (with factory function)
   */
  getOrSet(key: string, factory: () => T, ttl?: number): T {
    const existing = this.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const value = factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Get or set (with async factory function)
   */
  async getOrSetAsync(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const existing = this.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Invalidate entries matching a pattern
   */
  invalidate(pattern: string | RegExp): number {
    let count = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        count++;
      }
    }

    if (count > 0) {
      this.logger.info('Cache invalidated', { pattern, count });
    }

    return count;
  }

  /**
   * Remove expired entries
   */
  cleanup(): number {
    let count = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      this.logger.debug('Cache cleanup', { count });
    }

    return count;
  }

  /**
   * Export cache to JSON
   */
  export(): string {
    const data: Record<string, CacheEntry<T>> = {};
    for (const [key, entry] of this.cache.entries()) {
      data[key] = entry;
    }
    return JSON.stringify(data);
  }

  /**
   * Import cache from JSON
   */
  import(json: string): void {
    try {
      const data = JSON.parse(json) as Record<string, CacheEntry<T>>;
      this.cache.clear();
      for (const [key, entry] of Object.entries(data)) {
        this.cache.set(key, entry);
      }
      this.logger.info('Cache imported', { count: this.cache.size });
    } catch (error) {
      this.logger.error('Failed to import cache', { error });
    }
  }

  /**
   * Evict entries based on policy
   */
  private evict(): void {
    if (this.cache.size === 0) return;

    let keyToDelete: string | null = null;

    switch (this.evictionPolicy) {
      case 'lru':
        // Least Recently Used - oldest timestamp
        keyToDelete = this.findOldestKey();
        break;
      case 'fifo':
        // First In First Out - first inserted
        keyToDelete = this.findFirstKey();
        break;
      case 'lfu':
        // Least Frequently Used - lowest hit count
        keyToDelete = this.findLeastFrequentKey();
        break;
    }

    if (keyToDelete) {
      this.cache.delete(keyToDelete);
      this.evictions.update((e) => e + 1);
      this.logger.debug('Cache eviction', { key: keyToDelete, policy: this.evictionPolicy });
    }
  }

  private findOldestKey(): string | null {
    let oldest: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldest = key;
      }
    }

    return oldest;
  }

  private findFirstKey(): string | null {
    // Map preserves insertion order, so first key is first inserted
    const iterator = this.cache.keys();
    const result = iterator.next();
    return result.done ? null : result.value;
  }

  private findLeastFrequentKey(): string | null {
    let leastFrequent: string | null = null;
    let leastHits = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < leastHits) {
        leastHits = entry.hits;
        leastFrequent = key;
      }
    }

    return leastFrequent;
  }
}
