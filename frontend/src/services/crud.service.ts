import { Injectable, signal, computed } from '@angular/core';
import { getLogger } from '../viewmodels/logger';
import { WebUIService } from './webui.service';
import { Result, isOk, isErr, ErrorValue, ErrorCode } from '../types/error.types';

/**
 * Base entity interface
 */
export interface BaseEntity {
  id: number | string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * CRUD operation options
 */
export interface CrudOptions {
  entityName: string;
  useWebUI?: boolean;
  getFunction?: string;
  getByIdFunction?: string;
  createFunction?: string;
  updateFunction?: string;
  deleteFunction?: string;
}

/**
 * Query parameters
 */
export interface QueryParams {
  page?: number;
  size?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  filter?: Record<string, unknown>;
}

/**
 * Generic CRUD service for entity management
 */
@Injectable({ providedIn: 'root' })
export class CrudService<T extends BaseEntity> {
  private readonly logger = getLogger('crud');
  private readonly webui: WebUIService;

  private entityName: string;
  private useWebUI: boolean;
  private functions: {
    get: string;
    getById: string;
    create: string;
    update: string;
    delete: string;
  };

  readonly entities = signal<T[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<ErrorValue | null>(null);
  readonly lastUpdated = signal<Date | null>(null);

  readonly count = computed(() => this.entities().length);
  readonly hasError = computed(() => this.error() !== null);

  constructor(webui: WebUIService) {
    this.webui = webui;
    this.entityName = 'entity';
    this.useWebUI = true;
    this.functions = {
      get: 'get_entities',
      getById: 'get_entity',
      create: 'create_entity',
      update: 'update_entity',
      delete: 'delete_entity',
    };
  }

  /**
   * Initialize with options (call after construction)
   */
  init(options: CrudOptions): void {
    this.entityName = options.entityName || 'entity';
    this.useWebUI = options.useWebUI ?? true;

    const name = this.entityName.toLowerCase();
    this.functions = {
      get: options.getFunction || `get_${name}s`,
      getById: options.getByIdFunction || `get_${name}`,
      create: options.createFunction || `create_${name}`,
      update: options.updateFunction || `update_${name}`,
      delete: options.deleteFunction || `delete_${name}`,
    };

    this.logger.debug('CrudService initialized', { entity: this.entityName, functions: this.functions });
  }

  /**
   * Get all entities
   */
  async getAll(params?: QueryParams): Promise<Result<T[]>> {
    this.loading.set(true);
    this.error.set(null);

    try {
      if (this.useWebUI) {
        const result = await this.webui.call<T[]>(this.functions.get, [JSON.stringify(params)]);

        if (isOk(result)) {
          this.entities.set(result.value);
          this.lastUpdated.set(new Date());
          this.logger.info('Entities fetched', { count: result.value.length });
        } else {
          this.error.set(result.error);
          this.logger.error('Failed to fetch entities', { error: result.error.message });
        }

        this.loading.set(false);
        return result;
      } else {
        // Fallback for non-WebUI usage
        this.loading.set(false);
        return { ok: true, value: this.entities() };
      }
    } catch (err) {
      const error: ErrorValue = {
        code: ErrorCode.InternalError,
        message: err instanceof Error ? err.message : String(err),
      };
      this.error.set(error);
      this.loading.set(false);
      return { ok: false, error };
    }
  }

  /**
   * Get entity by ID
   */
  async getById(id: number | string): Promise<Result<T>> {
    this.loading.set(true);
    this.error.set(null);

    try {
      if (this.useWebUI) {
        const result = await this.webui.call<T>(this.functions.getById, [String(id)]);

        if (isOk(result)) {
          this.logger.info('Entity fetched', { id });
          this.loading.set(false);
          return result;
        } else {
          this.error.set(result.error);
          this.logger.error('Failed to fetch entity', { id, error: result.error.message });
          this.loading.set(false);
          return result;
        }
      } else {
        const entity = this.entities().find((e) => e.id === id);
        this.loading.set(false);
        if (entity) {
          return { ok: true, value: entity };
        }
        return {
          ok: false,
          error: { code: ErrorCode.ResourceNotFound, message: `Entity not found: ${id}` },
        };
      }
    } catch (err) {
      const error: ErrorValue = {
        code: ErrorCode.InternalError,
        message: err instanceof Error ? err.message : String(err),
      };
      this.error.set(error);
      this.loading.set(false);
      return { ok: false, error };
    }
  }

  /**
   * Create a new entity
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<T>> {
    this.loading.set(true);
    this.error.set(null);

    try {
      if (this.useWebUI) {
        const result = await this.webui.call<T>(this.functions.create, [JSON.stringify(data)]);

        if (isOk(result)) {
          this.entities.update((entities) => [...entities, result.value]);
          this.lastUpdated.set(new Date());
          this.logger.info('Entity created', { id: result.value.id });
          this.loading.set(false);
          return result;
        } else {
          this.error.set(result.error);
          this.logger.error('Failed to create entity', { error: result.error.message });
          this.loading.set(false);
          return result;
        }
      } else {
        // Simulate creation for non-WebUI
        const newEntity = {
          ...data,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as T;
        this.entities.update((entities) => [...entities, newEntity]);
        this.loading.set(false);
        return { ok: true, value: newEntity };
      }
    } catch (err) {
      const error: ErrorValue = {
        code: ErrorCode.InternalError,
        message: err instanceof Error ? err.message : String(err),
      };
      this.error.set(error);
      this.loading.set(false);
      return { ok: false, error };
    }
  }

  /**
   * Update an entity
   */
  async update(id: number | string, data: Partial<T>): Promise<Result<T>> {
    this.loading.set(true);
    this.error.set(null);

    try {
      if (this.useWebUI) {
        const result = await this.webui.call<T>(this.functions.update, [String(id), JSON.stringify(data)]);

        if (isOk(result)) {
          this.entities.update((entities) =>
            entities.map((e) => (e.id === id ? { ...e, ...result.value, updatedAt: new Date().toISOString() } : e))
          );
          this.lastUpdated.set(new Date());
          this.logger.info('Entity updated', { id });
          this.loading.set(false);
          return result;
        } else {
          this.error.set(result.error);
          this.logger.error('Failed to update entity', { id, error: result.error.message });
          this.loading.set(false);
          return result;
        }
      } else {
        // Simulate update for non-WebUI
        let updated = false;
        this.entities.update((entities) =>
          entities.map((e) => {
            if (e.id === id) {
              updated = true;
              return { ...e, ...data, updatedAt: new Date().toISOString() };
            }
            return e;
          })
        );
        this.loading.set(false);
        if (updated) {
          const entity = this.entities().find((e) => e.id === id)!;
          return { ok: true, value: entity };
        }
        return {
          ok: false,
          error: { code: ErrorCode.ResourceNotFound, message: `Entity not found: ${id}` },
        };
      }
    } catch (err) {
      const error: ErrorValue = {
        code: ErrorCode.InternalError,
        message: err instanceof Error ? err.message : String(err),
      };
      this.error.set(error);
      this.loading.set(false);
      return { ok: false, error };
    }
  }

  /**
   * Delete an entity
   */
  async delete(id: number | string): Promise<Result<boolean>> {
    this.loading.set(true);
    this.error.set(null);

    try {
      if (this.useWebUI) {
        const result = await this.webui.call<boolean>(this.functions.delete, [String(id)]);

        if (isOk(result)) {
          this.entities.update((entities) => entities.filter((e) => e.id !== id));
          this.lastUpdated.set(new Date());
          this.logger.info('Entity deleted', { id });
          this.loading.set(false);
          return result;
        } else {
          this.error.set(result.error);
          this.logger.error('Failed to delete entity', { id, error: result.error.message });
          this.loading.set(false);
          return result;
        }
      } else {
        // Simulate delete for non-WebUI
        const existed = this.entities().some((e) => e.id === id);
        if (existed) {
          this.entities.update((entities) => entities.filter((e) => e.id !== id));
          this.loading.set(false);
          return { ok: true, value: true };
        }
        this.loading.set(false);
        return {
          ok: false,
          error: { code: ErrorCode.ResourceNotFound, message: `Entity not found: ${id}` },
        };
      }
    } catch (err) {
      const error: ErrorValue = {
        code: ErrorCode.InternalError,
        message: err instanceof Error ? err.message : String(err),
      };
      this.error.set(error);
      this.loading.set(false);
      return { ok: false, error };
    }
  }

  /**
   * Refresh data
   */
  async refresh(params?: QueryParams): Promise<Result<T[]>> {
    return this.getAll(params);
  }

  /**
   * Find entity by predicate
   */
  find(predicate: (entity: T) => boolean): T | undefined {
    return this.entities().find(predicate);
  }

  /**
   * Find all entities matching predicate
   */
  findAll(predicate: (entity: T) => boolean): T[] {
    return this.entities().filter(predicate);
  }

  /**
   * Check if entity exists
   */
  exists(id: number | string): boolean {
    return this.entities().some((e) => e.id === id);
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.error.set(null);
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.entities.set([]);
    this.error.set(null);
    this.lastUpdated.set(null);
    this.logger.debug('Data cleared');
  }
}
