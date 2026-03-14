# Documentation Index

> **Project**: Vlang WebUI Angular Application
> **Last Updated**: 2026-03-14
> **Total Documents**: 17

Welcome to the comprehensive documentation for the Vlang WebUI Angular application. This documentation covers both the V backend with Dependency Injection and the Angular 19 frontend with reusable services.

---

## 📚 Documentation by Category

### Getting Started (01-09)
Essential guides for setting up and running the application.

| # | Document | Description |
|---|----------|-------------|
| [01](01-angular-build-config.md) | Angular Build Config | Angular 19 build output path configuration |
| [02](02-running-the-app.md) | Running the App | Troubleshooting guide for running the application |
| [03](03-webui-civetweb-summary.md) | WebUI CivetWeb Summary | WebUI and civetweb integration overview |
| [04](04-webui-evaluation-2026.md) | WebUI Evaluation 2026 | WebUI library evaluation and analysis |
| [05](05-webui-integration-evaluation.md) | WebUI Integration | Detailed WebUI integration assessment |

### Architecture & Patterns (10-19)
Core architecture documentation for both backend and frontend.

| # | Document | Description | Stack |
|---|----------|-------------|-------|
| [10](10-backend-dependency-injection.md) | Backend Dependency Injection | Complete guide to V backend DI system | V |
| [11](11-errors-as-values-pattern.md) | Errors as Values Pattern | Rust-like error handling with Result types | V |
| [12](12-angular-dependency-injection.md) | Angular Dependency Injection | Angular services and DI patterns | Angular |
| [13](13-bun-testing-guide.md) | Bun Testing Guide | Testing frontend with Bun test runner | Angular |
| [14](14-bun-test-reference.md) | Bun Test Reference | Bun test API reference | Angular |
| [15](15-testing-guide.md) | Testing Guide | Comprehensive testing for backend & frontend | Both |

### Migration Guides (20-29)
Migration and upgrade guides.

| # | Document | Description | Stack |
|---|----------|-------------|-------|
| [20](20-rsbuild-migration-guide.md) | Rsbuild Migration | Migration from webpack to Rsbuild | Angular |
| [21](21-frontend-error-handling.md) | Frontend Error Handling | Error handling patterns in Angular | Angular |

### Advanced Topics (30-39)
Experimental and cutting-edge features.

| # | Document | Description | Stack |
|---|----------|-------------|-------|
| [30](30-bleeding-edge-angular.md) | Bleeding Edge Angular | Latest Angular features and practices | Angular |
| [31](31-bleeding-edge-migration.md) | Bleeding Edge Migration | Migration to latest Angular version | Angular |

### Communication & Integration (40-49)
Backend-frontend communication patterns and protocols.

| # | Document | Description | Stack |
|---|----------|-------------|-------|
| [40](40-backend-frontend-communication.md) | Backend-Frontend Communication | Complete guide to communication approaches, protocols, and data formats | Both |

---

## 🗺️ Documentation by Audience

### For New Developers
Start here to get up to speed quickly:

1. [Running the App](02-running-the-app.md) - Get the application running
2. [Angular Build Config](01-angular-build-config.md) - Understand the build process
3. [WebUI CivetWeb Summary](03-webui-civetweb-summary.md) - Learn the architecture
4. [Testing Guide](15-testing-guide.md) - Run tests to verify setup

### For Backend Developers (V)
Deep dive into V backend development:

| Document | Description |
|----------|-------------|
| [Backend Dependency Injection](10-backend-dependency-injection.md) | DI container, services, lifecycle |
| [Errors as Values Pattern](11-errors-as-values-pattern.md) | Result types, error handling |
| [Testing Guide](15-testing-guide.md) | Backend testing strategies |

### For Frontend Developers (Angular)
Angular frontend development resources:

| Document | Description |
|----------|-------------|
| [Angular Dependency Injection](12-angular-dependency-injection.md) | Services, DI patterns |
| [Bun Testing Guide](13-bun-testing-guide.md) | Frontend testing with Bun |
| [Frontend Error Handling](21-frontend-error-handling.md) | Error patterns |
| [Rsbuild Migration](20-rsbuild-migration-guide.md) | Build system migration |

### For Full-Stack Developers
Understanding the complete architecture:

| Document | Description |
|----------|-------------|
| [Backend DI](10-backend-dependency-injection.md) + [Angular DI](12-angular-dependency-injection.md) | Compare DI patterns |
| [Errors as Values](11-errors-as-values-pattern.md) + [Frontend Error Handling](21-frontend-error-handling.md) | Error handling on both sides |
| [WebUI Integration Evaluation](05-webui-integration-evaluation.md) | Backend-frontend communication |

### For Architects
Architecture and design decisions:

| Document | Description |
|----------|-------------|
| [Backend DI](10-backend-dependency-injection.md) | Backend architecture |
| [Angular DI](12-angular-dependency-injection.md) | Frontend architecture |
| [WebUI Integration Evaluation](05-webui-integration-evaluation.md) | Integration patterns |
| [Errors as Values](11-errors-as-values-pattern.md) | Error architecture |

---

## 📖 Quick Reference

### Backend Services (V)

| Service | File | Key Methods |
|---------|------|-------------|
| `LoggingService` | `src/logging_service.v` | `info()`, `error()`, `debug()`, `export_logs()` |
| `SystemInfoService` | `src/system_info_service.v` | `get_system_info()`, `get_cpu_usage()`, `get_memory_stats()` |
| `FileService` | `src/file_service.v` | `read_file()`, `list_directory()`, `create_directory()` |
| `NetworkService` | `src/network_service.v` | `get_network_interfaces()`, `get_network_stats()` |
| `ConfigService` | `src/config_service.v` | `get()`, `set()`, `get_app_config()` |

### Frontend Services (Angular)

| Service | File | Key Methods |
|---------|------|-------------|
| `AuthService` | `frontend/src/services/auth.service.ts` | `login()`, `logout()`, `hasRole()`, `hasPermission()` |
| `WebUIService` | `frontend/src/services/webui.service.ts` | `call()`, `callWithRetry()`, `callAll()` |
| `StorageService` | `frontend/src/services/storage.service.ts` | `get()`, `set()`, `remove()`, `export()` |
| `CacheService` | `frontend/src/services/cache.service.ts` | `get()`, `set()`, `getOrSet()`, `invalidate()` |
| `TimerService` | `frontend/src/services/timer.service.ts` | `start()`, `stop()`, `lap()`, `debounce()`, `measure()` |
| `ToastService` | `frontend/src/services/toast.service.ts` | `info()`, `success()`, `error()`, `loading()` |
| `LoadingService` | `frontend/src/services/loading.service.ts` | `start()`, `stop()`, `wrap()` |
| `DataTableService` | `frontend/src/services/data-table.service.ts` | `sort()`, `setPageSize()`, `search()`, `exportCSV()` |
| `CrudService` | `frontend/src/services/crud.service.ts` | `getAll()`, `getById()`, `create()`, `update()`, `delete()` |

### Core Services (Angular)

| Service | File | Purpose |
|---------|------|---------|
| `ErrorRecoveryService` | `frontend/src/core/error-recovery.service.ts` | Error recovery with retry |
| `GlobalErrorService` | `frontend/src/core/global-error.service.ts` | Global error handling |
| `ErrorInterceptor` | `frontend/src/core/error.interceptor.ts` | HTTP error interception |
| `WinBoxService` | `frontend/src/core/winbox.service.ts` | Window management |
| `ConnectionMonitorService` | `frontend/src/viewmodels/connection-monitor.service.ts` | Connection monitoring |

---

## 📁 Project Structure

```
vlang-webui-angular-rsbuild/
├── docs/                           # All documentation (unified)
│   ├── 00-index.md                 # This file
│   ├── 01-05/                      # Getting started guides
│   ├── 10-15/                      # Architecture & patterns
│   ├── 20-21/                      # Migration guides
│   └── 30-31/                      # Advanced topics
│
├── src/                            # V Backend
│   ├── core/                       # DI Infrastructure
│   │   ├── di_container.v          # Service container
│   │   └── base_service.v          # Base service types
│   ├── errors/                     # Errors as Values
│   │   ├── errors_core.v           # Result/Option types
│   │   ├── errors.v                # Module index
│   │   └── errors_test.v           # Integration tests
│   ├── logging_service.v           # Logging service
│   ├── system_info_service.v       # System monitoring
│   ├── file_service.v              # File operations
│   ├── network_service.v           # Network management
│   ├── config_service.v            # Configuration
│   ├── service_provider.v          # Service registration
│   ├── app.v                       # Application wrapper
│   └── main.v                      # Entry point
│
├── frontend/                       # Angular Frontend
│   ├── src/
│   │   ├── core/                   # Core Angular services
│   │   ├── services/               # Reusable services
│   │   ├── viewmodels/             # View models
│   │   ├── models/                 # Data models
│   │   ├── types/                  # TypeScript types
│   │   └── views/                  # Components
│   └── dist/browser/               # Build output
│
├── run.sh                          # Build/run script
├── v.mod                           # V module config
└── package.json                    # Node.js dependencies
```

---

## 🔗 External Resources

- [V Language Documentation](https://docs.vlang.io/)
- [Angular Documentation](https://angular.dev/)
- [WebUI Library](https://github.com/webui-dev/webui)
- [Rsbuild Documentation](https://rsbuild.dev/)
- [Bun Documentation](https://bun.sh/)

---

## 📝 Document Numbering System

Documents are numbered with a prefix system for easy categorization:

| Range | Category | Description |
|-------|----------|-------------|
| 00 | Index | Documentation indexes |
| 01-09 | Getting Started | Setup, configuration, running the app |
| 10-19 | Architecture | DI systems, patterns, testing |
| 20-29 | Migration | Upgrade and migration guides |
| 30-39 | Advanced | Experimental and cutting-edge topics |

---

## 🔍 Search Tips

To find specific documentation:

1. **By Stack**: Look for "V" or "Angular" in the table headers
2. **By Topic**: Use the category tables above
3. **By Number**: Documents are numbered logically (10-11 = Backend, 12-14 = Frontend)
4. **By Audience**: Use the "Documentation by Audience" section

---

## 🤝 Contributing to Documentation

When adding new documentation:

1. Choose the appropriate category number
2. Use lowercase hyphenated filenames (e.g., `22-custom-service-creation.md`)
3. Include a title, description, and table of contents
4. Add entry to this index
5. Link to related documents
6. Add "Last updated" date at the bottom

---

*Last updated: 2026-03-14*
