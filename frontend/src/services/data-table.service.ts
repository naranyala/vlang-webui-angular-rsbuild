import { Injectable, signal, computed } from '@angular/core';
import { getLogger } from '../viewmodels/logger';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc' | null;

/**
 * Sort configuration
 */
export interface SortConfig<T> {
  field: keyof T;
  direction: SortDirection;
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  totalItems: number;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationConfig;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

/**
 * Data table configuration
 */
export interface DataTableConfig<T> {
  data: T[];
  sort?: SortConfig<T>;
  pagination?: Partial<PaginationConfig>;
  filter?: (item: T) => boolean;
}

/**
 * Service for managing data table operations (sorting, pagination, filtering)
 */
@Injectable({ providedIn: 'root' })
export class DataTableService<T extends Record<string, unknown>> {
  private readonly logger = getLogger('data-table');

  private readonly rawData = signal<T[]>([]);
  private readonly sortConfig = signal<SortConfig<T> | null>(null);
  private readonly currentPage = signal<number>(1);
  private readonly pageSize = signal<number>(10);
  private readonly filterFn = signal<((item: T) => boolean) | null>(null);

  readonly filteredData = computed(() => {
    const data = this.rawData();
    const filter = this.filterFn();
    if (!filter) return data;
    return data.filter(filter);
  });

  readonly sortedData = computed(() => {
    const data = this.filteredData();
    const sort = this.sortConfig();

    if (!sort || !sort.field || !sort.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aVal = a[sort.field!];
      const bVal = b[sort.field!];

      if (aVal === bVal) return 0;

      const comparison = aVal < bVal ? -1 : 1;
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  });

  readonly paginatedData = computed<PaginatedResult<T>>(() => {
    const data = this.sortedData();
    const page = this.currentPage();
    const size = this.pageSize();
    const total = data.length;
    const totalPages = Math.ceil(total / size);

    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;
    const pageData = data.slice(startIndex, endIndex);

    return {
      data: pageData,
      pagination: {
        currentPage: page,
        pageSize: size,
        totalItems: total,
      },
      totalPages,
      hasPrevious: page > 1,
      hasNext: page < totalPages,
    };
  });

  readonly stats = computed(() => {
    const data = this.rawData();
    const filtered = this.filteredData();
    const page = this.paginatedData();

    return {
      total: data.length,
      filtered: filtered.length,
      currentPage: page.pagination.currentPage,
      pageSize: page.pagination.pageSize,
      totalPages: page.totalPages,
      showingFrom: filtered.length > 0 ? (page.pagination.currentPage - 1) * page.pagination.pageSize + 1 : 0,
      showingTo: Math.min(page.pagination.currentPage * page.pagination.pageSize, filtered.length),
    };
  });

  /**
   * Set the data
   */
  setData(data: T[]): void {
    this.rawData.set(data);
    this.currentPage.set(1); // Reset to first page
    this.logger.debug('Data set', { count: data.length });
  }

  /**
   * Add an item
   */
  add(item: T): void {
    this.rawData.update((data) => [...data, item]);
    this.logger.debug('Item added');
  }

  /**
   * Add multiple items
   */
  addMany(items: T[]): void {
    this.rawData.update((data) => [...data, ...items]);
    this.logger.debug('Items added', { count: items.length });
  }

  /**
   * Update an item by predicate
   */
  update(predicate: (item: T) => boolean, updates: Partial<T>): boolean {
    let updated = false;
    this.rawData.update((data) =>
      data.map((item) => {
        if (predicate(item)) {
          updated = true;
          return { ...item, ...updates };
        }
        return item;
      })
    );
    return updated;
  }

  /**
   * Remove an item by predicate
   */
  remove(predicate: (item: T) => boolean): number {
    let removed = 0;
    this.rawData.update((data) => {
      const filtered = data.filter((item) => {
        if (predicate(item)) {
          removed++;
          return false;
        }
        return true;
      });
      return filtered;
    });
    return removed;
  }

  /**
   * Remove an item by index
   */
  removeAt(index: number): boolean {
    const data = this.rawData();
    if (index < 0 || index >= data.length) {
      return false;
    }
    this.rawData.update((d) => d.filter((_, i) => i !== index));
    return true;
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.rawData.set([]);
    this.logger.debug('Data cleared');
  }

  /**
   * Sort by field
   */
  sort(field: keyof T, direction?: SortDirection): void {
    const current = this.sortConfig();

    // Toggle direction if same field
    if (current?.field === field) {
      if (direction) {
        this.sortConfig.set({ field, direction });
      } else if (current.direction === 'asc') {
        this.sortConfig.set({ field, direction: 'desc' });
      } else if (current.direction === 'desc') {
        this.sortConfig.set({ field, direction: null });
      } else {
        this.sortConfig.set({ field, direction: 'asc' });
      }
    } else {
      this.sortConfig.set({ field, direction: direction ?? 'asc' });
    }

    this.logger.debug('Sort applied', { field, direction });
  }

  /**
   * Clear sorting
   */
  clearSort(): void {
    this.sortConfig.set(null);
    this.logger.debug('Sort cleared');
  }

  /**
   * Go to page
   */
  goToPage(page: number): void {
    const totalPages = this.paginatedData().totalPages;
    const targetPage = Math.max(1, Math.min(page, totalPages));
    this.currentPage.set(targetPage);
    this.logger.debug('Page changed', { page: targetPage });
  }

  /**
   * Go to first page
   */
  firstPage(): void {
    this.goToPage(1);
  }

  /**
   * Go to last page
   */
  lastPage(): void {
    this.goToPage(this.paginatedData().totalPages);
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.paginatedData().hasNext) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  /**
   * Go to previous page
   */
  previousPage(): void {
    if (this.paginatedData().hasPrevious) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  /**
   * Set page size
   */
  setPageSize(size: number): void {
    this.pageSize.set(Math.max(1, size));
    this.currentPage.set(1); // Reset to first page
    this.logger.debug('Page size changed', { size });
  }

  /**
   * Set filter function
   */
  setFilter(filter: ((item: T) => boolean) | null): void {
    this.filterFn.set(filter);
    this.currentPage.set(1); // Reset to first page
    this.logger.debug('Filter set');
  }

  /**
   * Clear filter
   */
  clearFilter(): void {
    this.filterFn.set(null);
    this.logger.debug('Filter cleared');
  }

  /**
   * Search by text (simple implementation)
   */
  search(text: string, fields?: (keyof T)[]): void {
    if (!text.trim()) {
      this.clearFilter();
      return;
    }

    const searchText = text.toLowerCase();
    const data = this.rawData();
    const sampleData = data.length > 0 ? data[0] : null;
    const searchFields = fields || (sampleData ? Object.keys(sampleData) as (keyof T)[] : []);

    this.setFilter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchText);
      })
    );
  }

  /**
   * Get item by index (in current sorted/filtered data)
   */
  getAt(index: number): T | undefined {
    return this.sortedData()[index];
  }

  /**
   * Get all sorted/filtered data
   */
  getAll(): T[] {
    return this.sortedData();
  }

  /**
   * Get current page data
   */
  getPage(): T[] {
    return this.paginatedData().data;
  }

  /**
   * Export data to CSV
   */
  exportToCSV(fields?: (keyof T)[]): string {
    const data = this.sortedData();
    if (data.length === 0) return '';

    const firstItem = data[0];
    const fieldList = fields || (firstItem ? Object.keys(firstItem) as (keyof T)[] : []);
    if (fieldList.length === 0) return '';
    
    const headers = fieldList.map(String).join(',');
    const rows = data.map((item) =>
      fieldList.map((field) => {
        const value = item[field];
        const escaped = String(value ?? '').replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    );

    return [headers, ...rows].join('\n');
  }

  /**
   * Download as CSV file
   */
  downloadCSV(filename: string, fields?: (keyof T)[]): void {
    const csv = this.exportToCSV(fields);
    if (!csv) return;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    this.logger.info('CSV downloaded', { filename, rows: this.sortedData().length });
  }
}
