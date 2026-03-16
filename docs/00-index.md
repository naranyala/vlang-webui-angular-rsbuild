# Documentation Index

**Project**: Vlang WebUI Angular Application  
**Last Updated**: 2026-03-16  
**Total Documents**: 15

---

## Quick Start

New to the project? Read these first:

1. [README.md](../README.md) - Project overview
2. [Getting Started](02-getting-started.md) - Installation and setup
3. [UI Layout](35-ui-layout.md) - Understand the interface
4. [Backend Services](50-backend-services.md) - API reference

---

## Documentation

### Getting Started (00-09)

| Document | Description |
|----------|-------------|
| [00-index.md](00-index.md) | Documentation index |
| [01-angular-build-config.md](01-angular-build-config.md) | Angular build configuration |
| [02-getting-started.md](02-getting-started.md) | Complete setup and running guide |
| [02-running-the-app.md](02-running-the-app.md) | Quick reference for running |

### Architecture (10-19)

| Document | Description |
|----------|-------------|
| [11-errors-as-values-pattern.md](11-errors-as-values-pattern.md) | Error handling with Result types |
| [12-angular-dependency-injection.md](12-angular-dependency-injection.md) | Angular DI patterns |
| [15-testing-guide.md](15-testing-guide.md) | Testing guide (backend + frontend) |
| [16-testing-analysis-and-improvement-plan.md](16-testing-analysis-and-improvement-plan.md) | Testing suite analysis |
| [17-testing-improvement-summary.md](17-testing-improvement-summary.md) | Testing improvements made |
| [21-frontend-error-handling.md](21-frontend-error-handling.md) | Frontend error handling |

### UI & Layout (30-39)

| Document | Description |
|----------|-------------|
| [35-ui-layout.md](35-ui-layout.md) | macOS Finder-inspired layout with WinBox.js |

### Services API (50-59)

| Document | Description |
|----------|-------------|
| [50-backend-services.md](50-backend-services.md) | Backend services API (8 services) |
| [54-frontend-services.md](54-frontend-services.md) | Frontend services API (6 services) |

### Communication (40-49)

| Document | Description |
|----------|-------------|
| [42-communication-patterns.md](42-communication-patterns.md) | Backend-frontend communication patterns |

### Build & Optimization (60-69, 90-99)

| Document | Description |
|----------|-------------|
| [60-build-pipeline.md](60-build-pipeline.md) | Build pipeline and commands |
| [91-optimization-status.md](91-optimization-status.md) | Performance optimizations |
| [98-documentation-consolidation.md](98-documentation-consolidation.md) | Documentation consolidation log |
| [99-simplification-summary.md](99-simplification-summary.md) | Simplification summary |

---

## Quick Reference

### Build Commands

```bash
# Build and run (default)
./run.sh

# Build only
./run.sh build

# Run existing binary
./run.sh run

# Run tests
cd frontend && bun test
```

### Backend Services

| Service | Purpose |
|---------|---------|
| LoggingService | Centralized logging |
| SystemInfoService | System monitoring |
| FileService | File operations |
| NetworkService | Network stats |
| ConfigService | Configuration |
| DatabaseService | SQLite persistence |
| UserService | User CRUD |
| DevToolsService | Development tools |

### Frontend Services

| Service | Purpose |
|---------|---------|
| WebUIService | Backend communication |
| ErrorService | Error handling |
| LoggerService | Logging |
| UserService | User operations |
| CacheService | Caching |
| StorageService | Local storage |

### Build Output

| File | Size | Location |
|------|------|----------|
| Binary | 768K | `build/desktopapp` |
| Frontend | 276K | `frontend/dist/browser` |

---

## External Resources

- [V Language Docs](https://docs.vlang.io/)
- [Angular Docs](https://angular.dev/)
- [WebUI Library](https://github.com/webui-dev/webui)
- [Rsbuild Docs](https://rsbuild.dev/)
- [Bun Docs](https://bun.sh/)

---

*Last updated: 2026-03-16*
