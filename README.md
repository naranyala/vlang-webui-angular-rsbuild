# Desktop App - V WebUI with Angular Frontend

A full-stack desktop application built with **V language backend** (Dependency Injection pattern) and **Angular 19 frontend** (comprehensive service architecture), connected via WebUI.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Dependency Injection Systems](#dependency-injection-systems)
  - [Backend DI (V)](#backend-di-v)
  - [Frontend DI (Angular)](#frontend-di-angular)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Backend Services](#backend-services)
- [Frontend Services](#frontend-services)
- [Backend-Frontend Communication](#backend-frontend-communication)
- [Commands](#commands)
- [Development](#development)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [API Reference](#api-reference)
- [Requirements](#requirements)
- [Documentation](#documentation)

---

## Overview

This project provides a comprehensive desktop application framework with:

- **Backend**: V language with Dependency Injection container, service registry, and "Errors as Values" pattern
- **Frontend**: Angular 19 with 10+ reusable services following DI best practices
- **Communication**: WebUI bridge for seamless backend-frontend interaction (4 communication approaches)
- **Features**: Real-time system monitoring, file operations, network management, authentication, SQLite CRUD demo, and more

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Angular Frontend                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ Components  │  │ ViewModels  │  │    Service Layer        │ │
│  │             │  │             │  │  • AuthService          │ │
│  │             │  │             │  │  • WebUIService         │ │
│  │             │  │             │  │  • StorageService       │ │
│  │             │  │             │  │  • CacheService         │ │
│  │             │  │             │  │  • ToastService         │ │
│  │             │  │             │  │  • LoadingService       │ │
│  │             │  │             │  │  • DataTableService     │ │
│  │             │  │             │  │  • CrudService          │ │
│  │             │  │             │  │  • TimerService         │ │
│  │             │  │             │  │  • RealtimeService      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                              │                                  │
│         ┌────────────────────┼────────────────────┐            │
│         │  WebUI Binding     │   Custom Events    │            │
│         └────────────────────┴────────────────────┘            │
│                              │                                  │
│                    WebUI Bridge (CivetWeb)                      │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   WebUI (CivetWeb)  │
                    └──────────┬──────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────┐
│                        V Backend                                │
│  ┌─────────────┐  ┌─────────────────────────────────────────┐  │
│  │   main.v    │  │          Service Layer (DI)             │  │
│  │   app.v     │  │  ┌─────────────────────────────────┐   │  │
│  │             │  │  │  ServiceContainer (DI Core)     │   │  │
│  │             │  │  │  • Register services            │   │  │
│  │             │  │  │  • Resolve dependencies         │   │  │
│  │             │  │  │  • Manage lifetimes             │   │  │
│  │             │  │  └─────────────────────────────────┘   │  │
│  │             │  │  ┌─────────────────────────────────┐   │  │
│  │             │  │  │  Business Services              │   │  │
│  │             │  │  │  • LoggingService               │   │  │
│  │             │  │  │  • SystemInfoService            │   │  │
│  │             │  │  │  • FileService                  │   │  │
│  │             │  │  │  • NetworkService               │   │  │
│  │             │  │  │  • ConfigService                │   │  │
│  │             │  │  │  • DatabaseService (SQLite)     │   │  │
│  │             │  │  │  • UserService                  │   │  │
│  │             │  │  └─────────────────────────────────┘   │  │
│  └─────────────┘  └─────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Errors as Values Pattern                   │   │
│  │  • Result<T> type (Rust-like)                          │   │
│  │  • AppError with rich context                          │   │
│  │  • ErrorBuilder for fluent construction                │   │
│  │  • Retry logic with exponential backoff                │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Features

### Core Features

- ✅ **Dependency Injection** - Backend (V) and Frontend (Angular) DI systems
- ✅ **WebUI Integration** - Seamless backend-frontend communication via WebUI/CivetWeb
- ✅ **System Monitoring** - CPU, memory, disk, network, battery stats
- ✅ **File Operations** - Read, write, create directories, browse files
- ✅ **Network Management** - Network interfaces, stats, IP addresses
- ✅ **Configuration** - App configuration with defaults
- ✅ **Error Handling** - "Errors as Values" pattern with Result types
- ✅ **Real-time Updates** - Custom events for live data
- ✅ **Toast Notifications** - Success, error, warning, loading states
- ✅ **Data Tables** - Sorting, pagination, search, export
- ✅ **CRUD Operations** - Generic CRUD service with caching
- ✅ **Authentication** - Role-based access control
- ✅ **Persistent Storage** - SQLite database with JSON fallback

### Demo Applications

| Demo | Description | Location |
|------|-------------|----------|
| **Login/Register** | Authentication UI with form validation | Frontend card #1 |
| **SQLite CRUD** | Complete user management with persistent storage | Frontend card #2 |
| **System Monitor** | Real-time system statistics | Backend services |
| **File Browser** | Directory navigation and file operations | Backend + Frontend |

---

### Backend DI (V)

The V backend uses a custom Dependency Injection container for managing services:

#### Core Concepts

```v
// Create container
mut container := core.new_service_container()

// Register services
service_provider.register_services_in_container(mut container)

// Initialize all services
service_provider.initialize_services(mut container)

// Resolve services
logging_ptr := container.get_required_service('logging')
logging := unsafe { logging_ptr as &LoggingService }
```

#### Service Lifetimes

| Lifetime | Description | Use Case |
|----------|-------------|----------|
| **Singleton** | Single instance for app lifetime | Logging, Config, State |
| **Scoped** | One instance per scope | Request-specific data |
| **Transient** | New instance each resolution | Stateless operations |

#### Available Backend Services

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| `LoggingService` | Centralized logging | `info()`, `error()`, `debug()`, `export_logs()` |
| `SystemInfoService` | System monitoring | `get_system_info()`, `get_cpu_usage()`, `get_memory_stats()` |
| `FileService` | File operations | `read_file()`, `list_directory()`, `create_directory()` |
| `NetworkService` | Network management | `get_network_interfaces()`, `get_network_stats()` |
| `ConfigService` | Configuration | `get()`, `set()`, `get_app_config()` |
| `DatabaseService` | SQLite/JSON persistence | `get_all_users()`, `create_user()`, `update_user()`, `delete_user()` |
| `UserService` | User management wrapper | `get_users_json()`, `save_user_json()`, `delete_user_json()` |

#### Errors as Values Pattern

```v
// All operations return Result<T>
fn read_file(path string) errors.Result<string> {
    content := os.read_file(path) or {
        return errors.err<string>(
            errors.io_error('read_file', 'Failed: ${path}')
                .context('path', path)
                .build()
        )
    }
    return errors.ok(content)
}

// Handle errors explicitly
result := file.read_file('config.json')
if result.is_err() {
    println('Error: ${result.error.message}')
    return
}
content := result.value

// Or use functional style
content := file.read_file('config.json')
    .map(fn (data string) string { return data.trim() })
    .unwrap_or('default')
```

📖 **Full Documentation**: [`docs/ERRORS_AS_VALUES.md`](docs/ERRORS_AS_VALUES.md), [`docs/DEPENDENCY_INJECTION_SYSTEM.md`](docs/DEPENDENCY_INJECTION_SYSTEM.md)

---

### Frontend DI (Angular)

The Angular frontend uses Angular's built-in DI with `providedIn: 'root'` pattern:

#### Core Concepts

```typescript
// Services are automatically injected
constructor(
  private auth: AuthService,
  private webui: WebUIService,
  private toast: ToastService,
  private cache: CacheService,
) {}

// Use signals for reactive state
readonly isAuthenticated = computed(() => this.auth.isAuthenticated());
```

#### Available Frontend Services

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| `AuthService` | Authentication & authorization | `login()`, `logout()`, `hasRole()`, `hasPermission()` |
| `WebUIService` | Backend communication | `call()`, `callWithRetry()`, `callAll()` |
| `StorageService` | localStorage/sessionStorage | `get()`, `set()`, `remove()`, `export()` |
| `CacheService` | In-memory caching | `get()`, `set()`, `getOrSet()`, `invalidate()` |
| `TimerService` | Timing utilities | `start()`, `stop()`, `lap()`, `debounce()`, `measure()` |
| `ToastService` | Notifications | `info()`, `success()`, `error()`, `loading()` |
| `LoadingService` | Loading states | `start()`, `stop()`, `wrap()` |
| `DataTableService` | Table data management | `sort()`, `setPageSize()`, `search()`, `exportCSV()` |
| `CrudService` | Generic CRUD | `getAll()`, `getById()`, `create()`, `update()`, `delete()` |

#### Usage Examples

```typescript
// Storage with type safety
constructor(private storage: StorageService) {}

this.storage.set<User>('user', userData);
const user = this.storage.get<User>('user', defaultValue);

// Cache with TTL
constructor(private cache: CacheService<Data[]>) {}

const data = await this.cache.getOrSetAsync(
  'api_data',
  async () => await this.fetchData(),
  5 * 60 * 1000 // 5 minutes
);

// Toast notifications
constructor(private toast: ToastService) {}

this.toast.success('Operation completed!');
const loadingId = this.toast.loading('Processing...');
this.toast.loadingToSuccess(loadingId, 'Done!');

// WebUI backend calls
constructor(private webui: WebUIService) {}

const result = await this.webui.call<User[]>('get_users', [], {
  timeout: 30000,
  retryCount: 3,
});

// DataTable with sorting/pagination
constructor() {
  this.table = new DataTableService<User>();
}

this.table.setData(users);
this.table.sort('name', 'desc');
this.table.setPageSize(25);
this.table.search('john', ['name', 'email']);

// Authentication
constructor(private auth: AuthService) {}

await this.auth.login({ username, password, rememberMe: true });

if (this.auth.hasRole('admin') && this.auth.hasPermission('write')) {
  // Admin write access
}
```

📖 **Full Documentation**: [`frontend/docs/ANGULAR_DI_SERVICES.md`](frontend/docs/ANGULAR_DI_SERVICES.md)

---

## Backend-Frontend Communication

This application supports **4 communication approaches** between backend and frontend:

### Approach 1: WebUI Function Binding (Primary)

**RPC-style calls** - Backend functions bound to JavaScript-callable names.

```typescript
// Frontend: Call backend function
const result = await this.webui.call<User[]>('getUsers');

if (isOk(result)) {
  this.users.set(result.value);
} else {
  this.toast.error(result.error.message);
}
```

```v
// Backend: Bind function
w.bind('getUsers', fn (e &ui.Event) string {
    users := get_all_users()
    return json.encode(users) or { '[]' }
})
```

**Best for**: 95% of backend-frontend calls (RPC pattern)

### Approach 2: Custom Events (Supplementary)

**Broadcast notifications** - Backend pushes events to frontend.

```typescript
// Frontend: Listen for events
window.addEventListener('webui:status', (event: CustomEvent) => {
  console.log('Status update:', event.detail);
});
```

```v
// Backend: Dispatch event
ui.eval(w, 'window.dispatchEvent(new CustomEvent("webui:status", {
    detail: { state: "connected", port: 8080 }
}))')
```

**Best for**: Real-time notifications, status updates, broadcast messages

### Approach 3: HTTP REST API (Optional)

**Standard REST** - Embedded HTTP server for external integrations.

```typescript
// Frontend: HTTP calls
this.http.get<User[]>('/api/users').subscribe(users => {
  this.users.set(users);
});
```

**Best for**: External integrations, file uploads, standard REST APIs

### Approach 4: WebSocket Real-time (Optional)

**Bidirectional streaming** - Real-time data push.

```typescript
// Frontend: Subscribe to real-time data
this.realtime.subscribe<SystemStats>('app:update', (data) => {
  this.stats.set(data);
});
```

**Best for**: Live data streaming, frequent updates, chat applications

### Communication Comparison

| Feature | WebUI Binding | Custom Events | HTTP REST | WebSocket |
|---------|---------------|---------------|-----------|-----------|
| **Setup** | Low | Low | Medium | Medium |
| **Performance** | Fast | Fast | Medium | Fast |
| **Bidirectional** | ✅ | ❌ | ✅ | ✅ |
| **Return Values** | ✅ | ❌ | ✅ | ✅ |
| **Real-time** | ❌ | ✅ | ❌ | ✅ |
| **Best For** | RPC calls | Notifications | REST API | Streaming |

📖 **Full Documentation**: [`docs/40-backend-frontend-communication.md`](docs/40-backend-frontend-communication.md)

---

## Quick Start

```bash
# Development mode (builds frontend + V app, then runs)
./run.sh dev

# Build only (frontend + V app)
./run.sh build

# Run existing binary (no build)
./run.sh run

# Clean build artifacts
./run.sh clean

# Deep clean (including node_modules)
./run.sh clean-all
```

---

## Project Structure

```
.
├── src/                              # V Backend
│   ├── core/                         # DI Core Infrastructure
│   │   ├── di_container.v            # Service container & registry
│   │   └── base_service.v            # Base service types
│   ├── services/                     # Business Services
│   │   ├── logging_service.v         # Centralized logging
│   │   ├── system_info_service.v     # System monitoring
│   │   ├── file_service.v            # File operations
│   │   ├── network_service.v         # Network management
│   │   ├── config_service.v          # Configuration
│   │   └── service_provider.v        # Service registration
│   ├── errors/                       # Errors as Values
│   │   ├── errors_core.v             # Result/Option types
│   │   ├── errors.v                  # Module index
│   │   └── errors_test.v             # Integration tests
│   ├── app.v                         # Application wrapper with DI
│   ├── main.v                        # Entry point
│   └── errors.v                      # Legacy error handling
├── frontend/                         # Angular Frontend
│   ├── src/
│   │   ├── core/                     # Core Angular Services
│   │   │   ├── error-recovery.service.ts
│   │   │   ├── global-error.service.ts
│   │   │   ├── error.interceptor.ts
│   │   │   └── winbox.service.ts
│   │   ├── services/                 # Reusable Services
│   │   │   ├── storage.service.ts
│   │   │   ├── cache.service.ts
│   │   │   ├── timer.service.ts
│   │   │   ├── webui.service.ts
│   │   │   ├── toast.service.ts
│   │   │   ├── loading.service.ts
│   │   │   ├── data-table.service.ts
│   │   │   ├── crud.service.ts
│   │   │   └── auth.service.ts
│   │   ├── viewmodels/               # View Models
│   │   │   ├── event-bus.viewmodel.ts
│   │   │   ├── logging.viewmodel.ts
│   │   │   └── connection-monitor.service.ts
│   │   ├── models/                   # Data Models
│   │   ├── types/                    # TypeScript Types
│   │   └── views/                    # Components
│   ├── docs/                         # Frontend Documentation
│   │   └── ANGULAR_DI_SERVICES.md
│   └── dist/browser/                 # Build output
├── docs/                             # Backend Documentation
│   ├── ERRORS_AS_VALUES.md           # Error handling guide
│   ├── DEPENDENCY_INJECTION_SYSTEM.md # Backend DI guide
│   └── ...
├── run.sh                            # Build/run script
├── v.mod                             # V module config
└── package.json                      # Node.js dependencies
```

---

## Backend Services

### LoggingService

```v
mut logging := LoggingService{}
logging.initialize()

// Log at different levels
logging.info('Application started')
logging.debug('Debug info')
logging.warning('Warning message')
logging.error('Error occurred')
logging.critical('Critical issue')

// Export logs
logging.export_logs('/path/to/logs.txt') or {
    println('Failed to export logs')
}
```

### SystemInfoService

```v
mut sys := SystemInfoService{}
sys.initialize()

// Get comprehensive system info
info := sys.get_system_info()
cpu_usage := sys.get_cpu_usage()
memory := sys.get_memory_stats()
disk := sys.get_disk_usage()
network := sys.get_network_interfaces()
battery := sys.get_battery_info()

// All methods also have JSON variants
json := sys.get_system_info_json()
```

### FileService

```v
mut file := FileService{}
file.initialize()

// Read file (returns Result<string>)
result := file.read_file('/path/to/file')
if result.is_ok() {
    content := result.value
}

// List directory
dir_result := file.list_directory('/path')
files := dir_result.files

// Create/delete
file.create_directory('/path/new_dir')
file.delete_file_or_directory('/path/to/delete')
```

### NetworkService

```v
mut network := NetworkService{}
network.initialize()

// Get network info
interfaces := network.get_network_interfaces()
stats := network.get_network_stats()
ips := network.get_ip_addresses()

// Check connectivity
is_available := network.is_network_available()
```

### ConfigService

```v
mut config := ConfigService{}
config.initialize()

// Get/set values
config.set_default_string('app.name', 'My App')
config.set_default_int('app.max_retries', 3)

name := config.get_string('app.name')
max_retries := config.get_int('app.max_retries')

// Get app config
app_config := config.get_app_config()
```

### DatabaseService (SQLite/JSON Persistence)

```v
mut db := DatabaseService{}
db.initialize()

// Get all users
users := db.get_all_users()

// Get user by ID
user := db.get_user_by_id(1) or {
    println('User not found')
    return
}

// Create user
new_user := User{
    name: 'John Doe'
    email: 'john@example.com'
    role: 'user'
    status: 'active'
}
created := db.create_user(new_user) or {
    println('Failed: ${err}')
}

// Update user
user.email = 'new@example.com'
updated := db.update_user(user.id, user) or {
    println('Failed: ${err}')
}

// Delete user
db.delete_user(user.id) or {
    println('Failed: ${err}')
}

// Search users
results := db.search_users('john')

// Get statistics
stats := db.get_stats()
println('Total: ${stats['total']}, Active: ${stats['active']}')
```

### UserService

```v
mut user_service := UserService{}
user_service.initialize()

// Get users as JSON (for WebUI)
json_data := user_service.get_users_json()

// Save user (create or update)
user_json := '{"name":"Jane","email":"jane@example.com"}'
result := user_service.save_user_json(user_json)

// Delete user
result := user_service.delete_user_json(1)

// Search users
results := user_service.search_users_json('jane')

// Get statistics
stats := user_service.get_stats_json()
```

---

## Frontend Services

### AuthService

```typescript
constructor(private auth: AuthService) {}

// Login
await this.auth.login({ username, password, rememberMe: true });

// Check permissions
if (this.auth.hasRole('admin')) { ... }
if (this.auth.hasPermission('write')) { ... }
if (this.auth.can('moderator', 'delete')) { ... }

// Get current user
const user = this.auth.currentUser();
const role = this.auth.currentRole();
```

### WebUIService

```typescript
constructor(private webui: WebUIService) {}

// Call backend
const result = await this.webui.call<User[]>('get_users');

// With retry
const result = await this.webui.callWithRetry('get_data', [], {
  retryCount: 3,
  retryDelay: 1000,
});

// Parallel calls
const [users, settings] = await this.webui.callAll({
  users: { name: 'get_users' },
  settings: { name: 'get_settings' },
});
```

### StorageService

```typescript
constructor(private storage: StorageService) {}

// Type-safe storage
this.storage.set<User>('user', userData);
const user = this.storage.get<User>('user', defaultValue);

// Namespaced storage
const session = new StorageService({ type: 'session', prefix: 'app_' });

// Export/import
const json = this.storage.export();
this.storage.import(json);
```

### CacheService

```typescript
constructor(private cache: CacheService<Data[]>) {}

// Get or fetch
const data = await this.cache.getOrSetAsync(
  'api_data',
  async () => await this.fetchData(),
  5 * 60 * 1000 // 5 min TTL
);

// Check stats
const stats = this.cache.stats();
console.log(`Hit rate: ${stats.hitRate}%`);
```

### ToastService

```typescript
constructor(private toast: ToastService) {}

this.toast.info('Processing...');
this.toast.success('Completed!');
this.toast.warning('Review needed');
this.toast.error('Failed!');

// Loading state
const id = this.toast.loading('Uploading...');
this.toast.loadingToSuccess(id, 'Upload complete!');
```

### DataTableService

```typescript
constructor() {
  this.table = new DataTableService<User>();
}

// Set data and operations
this.table.setData(users);
this.table.sort('name', 'desc');
this.table.setPageSize(25);
this.table.search('john', ['name', 'email']);

// Get paginated data
const page = this.table.getPage();
const stats = this.table.stats();

// Export
this.table.downloadCSV('users.csv');
```

---

## Commands

| Command | Description |
|---------|-------------|
| `./run.sh dev` | Build frontend + V app and run |
| `./run.sh build` | Build frontend + V app (no run) |
| `./run.sh run` | Run existing binary |
| `./run.sh clean` | Remove build artifacts |
| `./run.sh clean-all` | Deep clean |
| `./run.sh install` | Install frontend dependencies |
| `./run.sh watch` | Frontend dev server |
| `./run.sh help` | Show help |

---

## Development

### Backend Development

```bash
# Build with verbose output
v -cc gcc -o desktopapp ./src

# Run
./desktopapp

# Run tests
v test ./src/errors
```

### Frontend Development

```bash
cd frontend

# Install dependencies
bun install

# Development server
bun run dev

# Production build
bun run build:rsbuild

# Run tests
bun test
```

---

## Error Handling

### Backend: Errors as Values

```v
// All operations return Result<T>
result := operation()

// Explicit handling
if result.is_err() {
    err := result.error
    println('Error: ${err.message}')
    return
}

// Functional style
value := result
    .map(fn (v T) U { return transform(v) })
    .unwrap_or(default)

// Retry logic
config := default_retry_config()
config.max_attempts = 3
result := with_retry(fn () Result<T> {
    return operation()
}, config)
```

### Frontend: Result Pattern

```typescript
// Result type from error.types.ts
const result = await this.webui.call<User[]>('get_users');

// Type guards
if (isOk(result)) {
    const users = result.value;
} else {
    const error = result.error;
    this.toast.error(error.message);
}

// Error recovery service handles automatic retry
```

---

## Testing

### Backend Tests

```bash
# Run error handling tests
v test ./src/errors

# Run all tests
v test ./src
```

### Frontend Tests

```bash
cd frontend

# Run tests
bun test

# With coverage
bun test:ci

# Watch mode
bun test:watch
```

---

## API Reference

### JavaScript → V Functions

```javascript
// System information
const info = await webui.call('getSystemInfo');

// Memory statistics
const memory = await webui.call('getMemoryStats');

// CPU information
const cpu = await webui.call('getCpuInfo');
const cpuUsage = await webui.call('getCpuUsage');

// Disk information
const disk = await webui.call('getDiskUsage');
const partitions = await webui.call('getDiskPartitions');

// Network information
const network = await webui.call('getNetworkInterfaces');
const networkStats = await webui.call('getNetworkStats');

// File operations
const files = await webui.call('browseDirectory', '/path');
const content = await webui.call('readFile', '/path/to/file');
```

---

## Requirements

### System
- **OS**: Linux (Ubuntu/Debian tested)
- **Kernel**: 4.4+

### Build Tools
- **V**: 0.5.1+ (https://vlang.io)
- **GCC**: 9.0+
- **Bun**: 1.0+ (recommended) or **npm**: 8.0+

### Runtime
- **Browser**: Chrome, Firefox, Edge (for WebUI)

---

## Documentation

All documentation is unified in the `docs/` directory:

| Category | Documents |
|----------|-----------|
| **Getting Started** | [01-angular-build-config.md](docs/01-angular-build-config.md), [02-running-the-app.md](docs/02-running-the-app.md), [03-webui-civetweb-summary.md](docs/03-webui-civetweb-summary.md) |
| **Architecture** | [10-backend-dependency-injection.md](docs/10-backend-dependency-injection.md), [11-errors-as-values-pattern.md](docs/11-errors-as-values-pattern.md), [12-angular-dependency-injection.md](docs/12-angular-dependency-injection.md) |
| **Testing** | [13-bun-testing-guide.md](docs/13-bun-testing-guide.md), [15-testing-guide.md](docs/15-testing-guide.md) |
| **Migration** | [20-rsbuild-migration-guide.md](docs/20-rsbuild-migration-guide.md), [21-frontend-error-handling.md](docs/21-frontend-error-handling.md) |
| **Advanced** | [30-bleeding-edge-angular.md](docs/30-bleeding-edge-angular.md), [31-bleeding-edge-migration.md](docs/31-bleeding-edge-migration.md) |
| **Communication** | [40-backend-frontend-communication.md](docs/40-backend-frontend-communication.md) - **NEW** |

📖 **Start Here**: [Documentation Index](docs/00-index.md) - Complete documentation catalog (17 documents)

---

## License

MIT

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes (follow existing DI patterns)
4. Run `./run.sh build` to verify
5. Add tests for new functionality
6. Submit a pull request

---

## Version History

- **1.0.0** - Initial release with:
  - V backend with Dependency Injection container
  - 5 backend services (Logging, SystemInfo, File, Network, Config)
  - "Errors as Values" pattern throughout backend
  - Angular 19 frontend with 10+ reusable services
  - Comprehensive documentation
