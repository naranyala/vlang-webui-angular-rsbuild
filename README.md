# Vlang WebUI Angular Application

A full-stack desktop application built with V language backend and Angular 19 frontend, connected via WebUI.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Documentation](#documentation)
- [Requirements](#requirements)
- [Build Commands](#build-commands)
- [License](#license)

---

## Overview

This project provides a desktop application framework with:

- **Backend**: V language with service-based architecture and dependency injection patterns
- **Frontend**: Angular 19 with bleeding-edge features including signals and standalone components
- **Communication**: WebUI bridge supporting multiple communication patterns (WebUI binding, custom events, RPC, message bus)
- **Features**: System monitoring, file operations, network management, SQLite CRUD operations, and comprehensive DevTools

---

## Quick Start

```bash
# Install dependencies
./run.sh install

# Build application
./run.sh build

# Run application
./run.sh run
```

For development mode with hot reload:

```bash
./run.sh dev
```

---

## Project Structure

```
vlang-webui-angular-rsbuild/
├── src/                          # V Backend
│   ├── app.v                     # Application struct and handlers
│   ├── main.v                    # Entry point and WebUI bindings
│   ├── services/                 # Business services
│   │   ├── logging_service.v
│   │   ├── system_info_service.v
│   │   ├── file_service.v
│   │   ├── network_service.v
│   │   ├── config_service.v
│   │   ├── database.v
│   │   ├── user_service.v
│   │   └── devtools_service.v
│   ├── di/                       # Dependency injection module
│   ├── communication/            # Communication patterns
│   └── errors/                   # Error handling
│
├── frontend/                     # Angular Frontend
│   ├── src/
│   │   ├── app/                  # Main app component
│   │   ├── services/             # Angular services
│   │   ├── models/               # Data models
│   │   ├── communication/        # Communication patterns
│   │   └── utils/                # Utilities
│   └── dist/browser/             # Build output
│
├── docs/                         # Documentation
│   ├── README.md                 # This file
│   ├── BACKEND_SERVICES.md       # Backend services documentation
│   ├── FRONTEND_SERVICES.md      # Frontend services documentation
│   ├── COMMUNICATION_PATTERNS.md # Communication patterns guide
│   ├── DEPENDENCY_INJECTION.md   # DI system documentation
│   ├── BUILD_PIPELINE.md         # Build pipeline documentation
│   └── OPTIMIZATION_STATUS.md    # Optimization status
│
├── run.sh                        # Build script
├── v.mod                         # V module config
└── package.json                  # Node.js dependencies
```

---

## Key Features

### Backend Services

- **LoggingService**: Centralized logging with levels and export
- **SystemInfoService**: System monitoring (CPU, memory, disk, network)
- **FileService**: Secure file operations with path validation
- **NetworkService**: Network interface and statistics
- **ConfigService**: Configuration management
- **DatabaseService**: SQLite/JSON persistence
- **UserService**: User CRUD operations
- **DevToolsService**: Development tools and diagnostics

### Frontend Services

- **WebUIService**: Backend communication via WebUI
- **CommunicationService**: Alternative communication patterns (pub/sub, event store, command bus, RPC)
- **ErrorService**: Centralized error handling
- **LoggerService**: Logging with levels
- **UserService**: User management with validation

### Communication Patterns

1. **WebUI Function Binding**: Primary RPC-style communication
2. **Message Bus**: Pub/sub pattern for events
3. **Event Store**: Event sourcing for audit trails
4. **Command Bus**: CQRS command pattern
5. **RPC Server**: Direct function invocation
6. **Channels**: Typed message passing

---

## Documentation

Detailed documentation is available in the `docs/` directory:

| Document | Description |
|----------|-------------|
| [50-backend-services.md](docs/50-backend-services.md) | Backend services API and usage |
| [54-frontend-services.md](docs/54-frontend-services.md) | Frontend services API and usage |
| [42-communication-patterns.md](docs/42-communication-patterns.md) | Communication patterns guide |
| [51-dependency-injection.md](docs/51-dependency-injection.md) | DI system documentation |
| [60-build-pipeline.md](docs/60-build-pipeline.md) | Build pipeline documentation |
| [91-optimization-status.md](docs/91-optimization-status.md) | Optimization and refactoring status |

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

## Build Commands

| Command | Description |
|---------|-------------|
| `./run.sh install` | Install frontend dependencies |
| `./run.sh build` | Build frontend and backend |
| `./run.sh run` | Run existing binary |
| `./run.sh dev` | Build and run in development mode |
| `./run.sh clean` | Remove build artifacts |
| `./run.sh clean-all` | Deep clean (including node_modules) |

---

## License

MIT

---

*Last updated: 2026-03-16*
*Version: 2.0.0*
