# Angular Dependency Injection & Services

> **Category**: Frontend Architecture  
> **Updated**: 2026-03-14  
> **Related**: [Backend DI](../docs/10-backend-dependency-injection.md), [Error Handling](21-error-handling-patterns.md)

---

## Overview

The Angular 19 frontend implements a comprehensive service architecture using Angular's built-in Dependency Injection (DI) system. This document covers all available services, their usage patterns, and best practices.

---

## Current Project Structure

```
frontend/src/
├── core/                           # Core Angular Services
│   ├── error-recovery.service.ts   # Error recovery with retry
│   ├── global-error.service.ts     # Global error handling
│   ├── error.interceptor.ts        # HTTP error interceptor
│   └── winbox.service.ts           # WinBox window management
├── services/                       # Reusable Application Services
│   ├── index.ts                    # Barrel exports
│   ├── storage.service.ts          # localStorage/sessionStorage
│   ├── cache.service.ts            # In-memory caching
│   ├── timer.service.ts            # Timing utilities
│   ├── webui.service.ts            # Backend communication
│   ├── toast.service.ts            # Toast notifications
│   ├── loading.service.ts          # Loading states
│   ├── data-table.service.ts       # Table data management
│   ├── crud.service.ts             # Generic CRUD operations
│   └── auth.service.ts             # Authentication & authorization
├── viewmodels/                     # View Models
│   ├── event-bus.viewmodel.ts      # Event bus pattern
│   ├── logging.viewmodel.ts        # Logging view model
│   ├── connection-monitor.service.ts # Connection monitoring
│   └── viewport.service.ts         # Viewport management
├── models/                         # Data Models
├── types/                          # TypeScript Types
│   └── error.types.ts              # Error handling types
└── views/                          # Components
```

---

## Dependency Injection in Angular

Angular's DI system automatically provides services to components:

```typescript
import { Component, Injectable, signal, computed } from '@angular/core';
import { AuthService } from './services/auth.service';
import { ToastService } from './services/toast.service';

// Service is provided in root (singleton)
@Injectable({ providedIn: 'root' })
export class MyService {
  constructor(private auth: AuthService) {}
}

// Component injects services via constructor
@Component({
  selector: 'app-example',
  template: `...`,
})
export class ExampleComponent {
  constructor(
    private auth: AuthService,
    private toast: ToastService,
  ) {}
}
```

---

## Service Catalog

### Core Services

#### AuthService

Authentication and authorization with role-based access control.

```typescript
import { AuthService } from './services/auth.service';

constructor(private auth: AuthService) {}

// Login
const result = await this.auth.login({
  username: 'john',
  password: 'secret',
  rememberMe: true,
});

// Check authentication
if (this.auth.isAuthenticated()) {
  // User is logged in
}

// Get current user
const user = this.auth.currentUser();
const role = this.auth.currentRole();

// Role-based access
if (this.auth.hasRole('admin')) {
  // Admin only
}

// Permission-based access
if (this.auth.hasPermission('write')) {
  // Can write
}

// Combined check
if (this.auth.can('moderator', 'delete')) {
  // Moderator with delete permission
}

// Logout
await this.auth.logout();
```

**File**: `src/services/auth.service.ts`  
**Key Methods**: `login()`, `logout()`, `hasRole()`, `hasPermission()`, `can()`

---

#### WebUIService

Communication with V backend via WebUI bridge.

```typescript
import { WebUIService } from './services/webui.service';

constructor(private webui: WebUIService) {}

// Simple call
const result = await this.webui.call<User[]>('get_users');

// With options
const result = await this.webui.call<User[]>('get_users', [], {
  timeout: 30000,
  retryCount: 3,
  retryDelay: 1000,
});

// With automatic retry
const result = await this.webui.callWithRetry('get_data');

// Parallel calls
const [users, settings] = await this.webui.callAll({
  users: { name: 'get_users' },
  settings: { name: 'get_settings' },
});

// Sequential calls
const result = await this.webui.callSequential([
  { name: 'create_user', args: [userData] },
  { name: 'send_email', args: ['user@example.com'] },
]);

// Subscribe to events
const unsubscribe = this.webui.subscribe('user_created', (data) => {
  console.log('New user:', data);
});

// Cleanup
unsubscribe();
```

**File**: `src/services/webui.service.ts`  
**Key Methods**: `call()`, `callWithRetry()`, `callAll()`, `callSequential()`, `subscribe()`

---

### Utility Services

#### StorageService

Type-safe localStorage and sessionStorage wrapper.

```typescript
import { StorageService } from './services/storage.service';

constructor(private storage: StorageService) {}

// Set value
this.storage.set<User>('user', userData);

// Get value with default
const user = this.storage.get<User>('user', defaultValue);

// Remove value
this.storage.remove('user');

// Check existence
if (this.storage.has('user')) { ... }

// Session storage
const session = new StorageService({ 
  type: 'session', 
  prefix: 'app_' 
});

// Export/import
const json = this.storage.export();
this.storage.import(json);

// Get usage
const usage = this.storage.getUsage();
console.log(`Storage: ${usage.percent.toFixed(2)}% used`);
```

**File**: `src/services/storage.service.ts`  
**Key Methods**: `get()`, `set()`, `remove()`, `has()`, `export()`, `import()`

---

#### CacheService

In-memory cache with TTL and eviction policies.

```typescript
import { CacheService } from './services/cache.service';

constructor(private cache: CacheService<Data[]>) {}

// Set with TTL (default 5 minutes)
this.cache.set('users', users);

// Set with custom TTL
this.cache.set('users', users, 10 * 60 * 1000); // 10 minutes

// Get value
const users = this.cache.get('users');

// Get or set with factory
const users = this.cache.getOrSet('users', () => fetchUsers());

// Async factory
const users = await this.cache.getOrSetAsync('users', async () => {
  return await fetchUsersFromApi();
});

// Check stats
const stats = this.cache.stats();
console.log(`Hit rate: ${stats.hitRate}%`);
console.log(`Size: ${stats.size}`);

// Invalidate by pattern
this.cache.invalidate(/^user_.*/);

// Cleanup expired entries
this.cache.cleanup();
```

**File**: `src/services/cache.service.ts`  
**Key Methods**: `get()`, `set()`, `getOrSet()`, `getOrSetAsync()`, `invalidate()`, `stats()`

---

#### TimerService

Timing operations and utilities.

```typescript
import { TimerService } from './services/timer.service';

constructor(private timer: TimerService) {}

// Stopwatch
this.timer.start();
this.timer.pause();
this.timer.resume();
this.timer.stop();
this.timer.reset();

// Get formatted time
const formatted = this.timer.getFormattedTime(); // "00:01:23:456"

// Record laps
this.timer.lap();
const laps = this.timer.getLaps();

// Measure function execution
const { result, duration } = this.timer.measure(() => expensiveOperation());

// Async measurement
const { result, duration } = await this.timer.measureAsync(async () => {
  return await api.call();
});

// Debounce
const debouncedSearch = this.timer.debounce(search, 300);

// Throttle
const throttledScroll = this.timer.throttle(handleScroll, 100);

// Sleep
await this.timer.sleep(1000);

// Wait for condition
await this.timer.waitFor(() => element.isReady(), 5000);
```

**File**: `src/services/timer.service.ts`  
**Key Methods**: `start()`, `stop()`, `lap()`, `measure()`, `debounce()`, `throttle()`, `sleep()`

---

### UI/UX Services

#### ToastService

Toast notification system.

```typescript
import { ToastService } from './services/toast.service';

constructor(private toast: ToastService) {}

// Basic toasts
this.toast.info('Processing...');
this.toast.success('Operation completed!');
this.toast.warning('Please review your input');
this.toast.error('Something went wrong');

// With title and custom duration
this.toast.success('File uploaded', 'Success', 5000);

// Loading toast (no auto-dismiss)
const loadingId = this.toast.loading('Uploading file...');

// Update loading toast
this.toast.loadingToSuccess(loadingId, 'Upload complete!');
this.toast.loadingToError(loadingId, 'Upload failed');

// With action
this.toast.show({
  type: 'info',
  message: 'New version available',
  action: {
    label: 'Update',
    onClick: () => this.updateApp(),
  },
});

// Dismiss
this.toast.dismiss(toastId);
this.toast.dismissLatest();
this.toast.dismissAll();
```

**File**: `src/services/toast.service.ts`  
**Key Methods**: `info()`, `success()`, `warning()`, `error()`, `loading()`, `dismiss()`

---

#### LoadingService

Manage loading states across the application.

```typescript
import { LoadingService } from './services/loading.service';

constructor(private loading: LoadingService) {}

// Start loading
const loadingId = this.loading.start({
  label: 'Loading data...',
  showProgress: true,
});

// Stop loading
this.loading.stop(loadingId);
this.loading.stop(); // Stop most recent
this.loading.stopAll(); // Stop all

// Update progress
this.loading.updateProgress(50);
this.loading.updateLabel('Processing...');

// Wrap promise
const result = await this.loading.wrap(
  this.api.getData(),
  { label: 'Fetching data...' }
);

// Wrap multiple promises
const results = await this.loading.wrapAll(
  [this.api.getUsers(), this.api.getSettings()],
  { label: 'Loading...' }
);

// Check state
if (this.loading.isLoading()) { ... }
if (this.loading.isActive(loadingId)) { ... }
```

**File**: `src/services/loading.service.ts`  
**Key Methods**: `start()`, `stop()`, `updateProgress()`, `wrap()`, `wrapAll()`

---

### Data Management Services

#### DataTableService

Manage table data with sorting, pagination, and filtering.

```typescript
import { DataTableService } from './services/data-table.service';

constructor() {
  this.table = new DataTableService<User>();
}

// Set data
this.table.setData(users);

// Sorting
this.table.sort('name'); // Ascending
this.table.sort('name', 'desc'); // Descending
this.table.clearSort();

// Pagination
this.table.setPageSize(25);
this.table.goToPage(3);
this.table.nextPage();
this.table.previousPage();
this.table.firstPage();
this.table.lastPage();

// Filtering
this.table.setFilter(user => user.active);
this.table.search('john', ['name', 'email']);
this.table.clearFilter();

// Get data
const page = this.table.getPage();
const all = this.table.getAll();
const item = this.table.getAt(0);

// Get stats
const stats = this.table.stats();
console.log(`Showing ${stats.showingFrom}-${stats.showingTo} of ${stats.total}`);

// Export
const csv = this.table.exportToCSV();
this.table.downloadCSV('users.csv');

// CRUD operations
this.table.add(newUser);
this.table.update(user => user.id === 1, { name: 'New Name' });
this.table.remove(user => user.id === 1);
```

**File**: `src/services/data-table.service.ts`  
**Key Methods**: `setData()`, `sort()`, `setPageSize()`, `search()`, `getPage()`, `downloadCSV()`

---

#### CrudService

Generic CRUD operations with WebUI integration.

```typescript
import { CrudService } from './services/crud.service';
import { WebUIService } from './services/webui.service';

constructor(webui: WebUIService) {
  this.userService = new CrudService<User>(webui, {
    entityName: 'User',
    getFunction: 'get_users',
    getByIdFunction: 'get_user',
    createFunction: 'create_user',
    updateFunction: 'update_user',
    deleteFunction: 'delete_user',
  });
}

// Get all
const result = await this.userService.getAll({
  page: 1,
  size: 25,
  sort: 'name',
  order: 'asc',
});

// Get by ID
const result = await this.userService.getById(1);

// Create
const result = await this.userService.create({
  name: 'John',
  email: 'john@example.com',
});

// Update
const result = await this.userService.update(1, { name: 'Jane' });

// Delete
const result = await this.userService.delete(1);

// Find
const user = this.userService.find(u => u.email === 'john@example.com');
const activeUsers = this.userService.findAll(u => u.active);

// Refresh
await this.userService.refresh();
```

**File**: `src/services/crud.service.ts`  
**Key Methods**: `getAll()`, `getById()`, `create()`, `update()`, `delete()`, `find()`

---

## Usage Examples

### Combining Multiple Services

```typescript
@Component({
  selector: 'app-user-list',
  template: `
    <div *ngIf="loading.isLoading()">Loading...</div>
    <table *ngIf="!loading.isLoading()">
      <thead>
        <tr>
          <th (click)="table.sort('name')">Name</th>
          <th>Email</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        @for (user of table.getPage(); track user.id) {
          <tr>
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>
              <button (click)="editUser(user)" 
                      [disabled]="!auth.hasPermission('write')">
                Edit
              </button>
              <button (click)="deleteUser(user)"
                      [disabled]="!auth.hasPermission('delete')">
                Delete
              </button>
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class UserListComponent implements OnInit {
  private table: DataTableService<User>;
  private userService: CrudService<User>;

  constructor(
    private auth: AuthService,
    private webui: WebUIService,
    private loading: LoadingService,
    private toast: ToastService,
    private cache: CacheService<User[]>,
  ) {
    this.table = new DataTableService<User>();
    this.userService = new CrudService<User>(webui, {
      entityName: 'User',
      getFunction: 'get_users',
    });
  }

  async ngOnInit() {
    await this.loadUsers();
  }

  private async loadUsers() {
    // Try cache first
    const cached = this.cache.get('users');
    if (cached) {
      this.table.setData(cached);
      return;
    }

    // Fetch from backend
    const result = await this.loading.wrap(
      this.userService.getAll(),
      { label: 'Loading users...' }
    );

    if (result.ok) {
      this.table.setData(result.value);
      this.cache.set('users', result.value);
    } else {
      this.toast.error(result.error.message);
    }
  }

  async deleteUser(user: User) {
    if (!this.auth.hasPermission('delete')) {
      this.toast.error('Permission denied');
      return;
    }

    const result = await this.userService.delete(user.id);
    
    if (result.ok) {
      this.toast.success('User deleted');
      this.cache.remove('users');
      await this.loadUsers();
    } else {
      this.toast.error(result.error.message);
    }
  }
}
```

---

## Best Practices

### 1. Inject Services via Constructor

```typescript
// GOOD
constructor(
  private auth: AuthService,
  private toast: ToastService,
) {}

// BAD: Don't create services manually
private auth = new AuthService(); // Never do this
```

### 2. Use Signals for State

```typescript
// GOOD: Reactive state
readonly users = signal<User[]>([]);
readonly isLoading = signal<boolean>(false);

// Update
this.users.set(newUsers);
this.isLoading.set(false);
```

### 3. Handle Errors with Result Pattern

```typescript
// GOOD: Explicit error handling
const result = await this.webui.call('get_users');
if (isErr(result)) {
  this.toast.error(result.error.message);
  return;
}
this.users.set(result.value);
```

### 4. Clean Up Subscriptions

```typescript
@Component({ ... })
export class MyComponent implements OnDestroy {
  private unsubscribe: () => void;

  constructor(private webui: WebUIService) {
    this.unsubscribe = this.webui.subscribe('event', handler);
  }

  ngOnDestroy() {
    this.unsubscribe?.();
  }
}
```

### 5. Use LoadingService for Async Operations

```typescript
// GOOD: Automatic loading state
const result = await this.loading.wrap(
  this.api.getData(),
  { label: 'Loading...' }
);

// BAD: Manual loading state
this.loading = true;
try {
  const result = await this.api.getData();
} finally {
  this.loading = false;
}
```

---

## Testing

```typescript
import { TestBed } from '@angular/core/testing';
import { StorageService, ToastService } from './services';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
  });

  it('should store and retrieve values', () => {
    service.set('test', 'value');
    expect(service.get('test')).toBe('value');
  });

  it('should return default for missing keys', () => {
    expect(service.get('missing', 'default')).toBe('default');
  });
});

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should create toasts', () => {
    const id = service.success('Test');
    expect(service.count()).toBe(1);
    expect(service.has(id)).toBe(true);
  });
});
```

---

## Related Documentation

- [Backend Dependency Injection](../docs/10-backend-dependency-injection.md) - V backend DI
- [Error Handling Patterns](21-error-handling-patterns.md) - Frontend error handling
- [Bun Testing Guide](11-bun-testing-guide.md) - Testing with Bun
- [Backend Errors as Values](../docs/11-errors-as-values-pattern.md) - Backend error patterns

---

*Last updated: 2026-03-14*
