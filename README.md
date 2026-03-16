# Vlang WebUI Angular Application

A desktop application framework with V language backend and Angular 19 frontend.

## Quick Start

```bash
# Install dependencies
./run.sh install

# Build and run (default)
./run.sh

# Build only
./run.sh build

# Run tests
cd frontend && bun test
```

## Overview

**Backend**: V language with 8 service modules  
**Frontend**: Angular 19 with standalone components and signals  
**UI**: macOS Finder-inspired layout with WinBox.js windows  
**Communication**: WebUI function binding (RPC-style)

## Project Structure

```
vlang-webui-angular-rsbuild/
├── src/                      # V Backend
│   ├── main.v               # Entry point (197 lines)
│   ├── app.v                # Application logic (337 lines)
│   └── services/            # 8 service modules
│
├── frontend/src/            # Angular Frontend
│   ├── app/                 # Main component
│   ├── components/layout/   # Finder layout, split panes
│   ├── core/                # WinBox, error handling
│   ├── services/            # 6 Angular services
│   └── models/              # Data models
│
├── build/                   # Compiled binary (768K)
├── docs/                    # Documentation
└── audit/                   # Audit reports
```

## Features

### Backend Services

- **LoggingService** - Centralized logging with levels
- **SystemInfoService** - CPU, memory, disk monitoring
- **FileService** - Secure file operations with path validation
- **NetworkService** - Network interfaces and statistics
- **ConfigService** - Configuration management
- **DatabaseService** - SQLite/JSON persistence
- **UserService** - User CRUD operations
- **DevToolsService** - Development tools and diagnostics

### Frontend

- **WebUIService** - Backend communication via WebUI
- **ErrorService** - Centralized error handling
- **LoggerService** - Client-side logging
- **FinderLayoutComponent** - macOS-inspired two-column layout
- **SplitPaneComponent** - Resizable panes with drag support

## Requirements

- **OS**: Linux
- **V**: 0.5.1+
- **GCC**: 9.0+
- **Bun**: 1.0+ (or npm 8.0+)

## Build Commands

| Command | Description |
|---------|-------------|
| `./run.sh` | Build and run |
| `./run.sh build` | Build only |
| `./run.sh run` | Run existing binary |
| `./run.sh test` | Run tests |
| `./run.sh clean` | Clean build artifacts |

## Documentation

- [Documentation Index](docs/00-index.md) - All documentation
- [UI Layout](docs/35-ui-layout.md) - Finder-inspired layout
- [Backend Services](docs/50-backend-services.md) - Service API reference
- [Frontend Services](docs/54-frontend-services.md) - Service API reference
- [Build Pipeline](docs/60-build-pipeline.md) - Build commands and process
- [Testing Guide](docs/15-testing-guide.md) - How to run and write tests

## Audit Status

**Latest**: 2026-03-16  
**Status**: Production Ready  
**Grade**: A-

See [audit/README.md](audit/README.md) for details.

## License

MIT

---

*Last updated: 2026-03-16*  
*Version: 3.0*
