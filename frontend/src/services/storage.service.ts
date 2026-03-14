import { Injectable, signal, computed } from '@angular/core';
import { getLogger } from '../viewmodels/logger';

/**
 * Storage type enumeration
 */
export type StorageType = 'local' | 'session';

/**
 * Storage service options
 */
export interface StorageOptions {
  type?: StorageType;
  prefix?: string;
  encrypt?: boolean;
}

/**
 * Storage service for managing localStorage and sessionStorage
 * Provides a clean API with type safety and error handling
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly logger = getLogger('storage');
  private storage: Storage;
  private prefix: string;
  private encrypt: boolean;

  private readonly keys = signal<string[]>([]);
  private readonly lastModified = signal<Date | null>(null);

  readonly count = computed(() => this.keys().length);
  readonly isLocalStorage = computed(() => this.storage === localStorage);

  private constructor() {
    this.storage = localStorage;
    this.prefix = '';
    this.encrypt = false;
    this.loadKeys();
  }

  /**
   * Create a new StorageService instance
   */
  static create(options?: { type?: 'local' | 'session'; prefix?: string; encrypt?: boolean }): StorageService {
    const instance = new StorageService();
    if (options) {
      instance.storage = options.type === 'session' ? sessionStorage : localStorage;
      instance.prefix = options.prefix ?? '';
      instance.encrypt = options.encrypt ?? false;
    }
    return instance;
  }

  /**
   * Get the default local storage instance
   */
  static local(prefix = ''): StorageService {
    const instance = new StorageService();
    instance.prefix = prefix;
    return instance;
  }

  /**
   * Get the default session storage instance
   */
  static session(prefix = ''): StorageService {
    const instance = new StorageService();
    instance.storage = sessionStorage;
    instance.prefix = prefix;
    return instance;
  }

  /**
   * Load all keys from storage
   */
  private loadKeys(): void {
    const allKeys: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && (!this.prefix || key.startsWith(this.prefix))) {
        allKeys.push(key);
      }
    }
    this.keys.set(allKeys);
  }

  /**
   * Get the full key with prefix
   */
  private getFullKey(key: string): string {
    return this.prefix ? `${this.prefix}${key}` : key;
  }

  /**
   * Set a value in storage
   */
  set<T>(key: string, value: T): boolean {
    try {
      const fullKey = this.getFullKey(key);
      const serialized = JSON.stringify(value);
      const toStore = this.encrypt ? this.simpleEncrypt(serialized) : serialized;
      this.storage.setItem(fullKey, toStore);
      this.loadKeys();
      this.lastModified.set(new Date());
      this.logger.debug('Value set', { key, fullKey, type: typeof value });
      return true;
    } catch (error) {
      this.logger.error('Failed to set value', { key, error });
      return false;
    }
  }

  /**
   * Get a value from storage
   */
  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const fullKey = this.getFullKey(key);
      const stored = this.storage.getItem(fullKey);
      if (stored === null) {
        return defaultValue;
      }
      const deserialized = this.encrypt ? this.simpleDecrypt(stored) : stored;
      return JSON.parse(deserialized) as T;
    } catch (error) {
      this.logger.error('Failed to get value', { key, error });
      return defaultValue;
    }
  }

  /**
   * Remove a value from storage
   */
  remove(key: string): boolean {
    try {
      const fullKey = this.getFullKey(key);
      this.storage.removeItem(fullKey);
      this.loadKeys();
      this.lastModified.set(new Date());
      this.logger.debug('Value removed', { key, fullKey });
      return true;
    } catch (error) {
      this.logger.error('Failed to remove value', { key, error });
      return false;
    }
  }

  /**
   * Clear all values (optionally filtered by prefix)
   */
  clear(): boolean {
    try {
      if (this.prefix) {
        // Only clear keys with our prefix
        const keysToRemove = [...this.keys()];
        for (const key of keysToRemove) {
          this.storage.removeItem(key);
        }
      } else {
        this.storage.clear();
      }
      this.loadKeys();
      this.lastModified.set(new Date());
      this.logger.info('Storage cleared', { prefix: this.prefix });
      return true;
    } catch (error) {
      this.logger.error('Failed to clear storage', { error });
      return false;
    }
  }

  /**
   * Check if a key exists
   */
  has(key: string): boolean {
    const fullKey = this.getFullKey(key);
    return this.storage.getItem(fullKey) !== null;
  }

  /**
   * Get all keys
   */
  getAllKeys(): string[] {
    return this.prefix ? this.keys().map((k) => k.replace(this.prefix, '')) : this.keys();
  }

  /**
   * Get all values as a map
   */
  getAll<T>(): Map<string, T> {
    const map = new Map<string, T>();
    for (const key of this.keys()) {
      const value = this.get<T>(this.prefix ? key.replace(this.prefix, '') : key);
      if (value !== undefined) {
        map.set(key, value);
      }
    }
    return map;
  }

  /**
   * Get storage usage information
   */
  getUsage(): { used: number; percent: number } {
    let used = 0;
    for (const key in this.storage) {
      if (this.storage.hasOwnProperty(key)) {
        used += this.storage[key].length + key.length;
      }
    }
    // Approximate: 5MB for localStorage/sessionStorage
    const limit = 5 * 1024 * 1024;
    return {
      used,
      percent: (used / limit) * 100,
    };
  }

  /**
   * Simple encryption (NOT secure, just obfuscation)
   * For real encryption, use a proper crypto library
   */
  private simpleEncrypt(text: string): string {
    return btoa(text);
  }

  /**
   * Simple decryption
   */
  private simpleDecrypt(text: string): string {
    return atob(text);
  }

  /**
   * Export all data as JSON
   */
  export(): string {
    const data: Record<string, unknown> = {};
    for (const key of this.keys()) {
      const value = this.storage.getItem(key);
      if (value) {
        data[key] = this.encrypt ? this.simpleDecrypt(value) : value;
      }
    }
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from JSON
   */
  import(json: string): boolean {
    try {
      const data = JSON.parse(json) as Record<string, unknown>;
      for (const [key, value] of Object.entries(data)) {
        this.set(key, value);
      }
      this.logger.info('Data imported', { count: Object.keys(data).length });
      return true;
    } catch (error) {
      this.logger.error('Failed to import data', { error });
      return false;
    }
  }
}
