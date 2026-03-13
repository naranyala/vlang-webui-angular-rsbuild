# Desktop App - V WebUI with Angular Frontend

A desktop application built with V language, WebUI, and Angular 19 frontend using Rsbuild.

## Overview

This project provides a desktop application framework with real-time system monitoring capabilities. It combines a V language backend with WebUI for native window management and an Angular 19 frontend for the user interface.

## Features

- Real-time system information monitoring
- Memory statistics tracking
- Process list management
- File browser functionality
- Modern Angular 19 frontend with Rsbuild
- Fast incremental builds
- Enhanced terminal logging
- Development mode with auto-rebuild
- Comprehensive error handling and recovery

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

## Project Structure

```
.
├── src/
│   ├── main.v                    # V backend entry point
│   └── errors.v                  # Error handling system
├── v.mod                         # V module config
├── run.sh                        # Enhanced build/run script
├── .vproject.json                # V project configuration
├── frontend/
│   ├── src/                      # Angular source code
│   │   ├── core/                 # Core services (error handling, interceptors)
│   │   ├── viewmodels/           # View models and services
│   │   ├── views/                # Angular components
│   │   └── types/                # TypeScript type definitions
│   ├── rsbuild.config.ts         # Rsbuild configuration
│   ├── package.json              # Node.js dependencies
│   └── dist/browser/             # Build output (served by V)
├── thirdparty/
│   └── v-webui/                  # WebUI bindings
└── desktopapp                    # Compiled binary (after build)
```

## Commands

| Command | Description |
|---------|-------------|
| `./run.sh dev` | Build frontend + V app and run (default) |
| `./run.sh build` | Build frontend + V app (no run) |
| `./run.sh run` | Run existing binary (no build) |
| `./run.sh clean` | Remove build artifacts |
| `./run.sh clean-all` | Deep clean (including node_modules) |
| `./run.sh install` | Install frontend dependencies |
| `./run.sh watch` | Start frontend dev server (watch mode) |
| `./run.sh help` | Show help message |

## Development Mode

The `dev` command provides a complete development experience:

1. **Prerequisites Check** - Verifies V, Bun/npm, GCC installations
2. **Frontend Build** - Builds Angular app with Rsbuild
3. **V App Build** - Compiles V backend with GCC
4. **Run Application** - Launches the desktop app

All output is logged to the terminal in real-time with color-coded messages:
- `[INFO]` - General information
- `[SUCCESS]` - Successful operations
- `[WARN]` - Warnings
- `[ERROR]` - Errors
- `[STEP]` - Build steps
- `[VLANG]` - V compiler output
- `[ANGULAR]` - Frontend build output

## Build Pipeline

```
./run.sh dev
    |
    v
1. Check Prerequisites
   - V compiler version
   - Bun/npm availability
   - GCC version
    |
    v
2. Build Frontend (Rsbuild)
   - Install dependencies (if needed)
   - Run Rsbuild build
   - Output: frontend/dist/browser/
   - Full terminal logging
    |
    v
3. Build V Application
   - Compile with GCC
   - Output: ./desktopapp
   - Verbose compiler output
    |
    v
4. Run Application
   - Launch desktopapp executable
   - Stream all logs to terminal
   - Real-time event logging
```

## Logging System

All logs are output to the terminal (not log files):

### Application Logs (V)
```
[APP] [2026-03-12 10:30:45] [INFO] Starting Desktop App application...
[APP] [2026-03-12 10:30:45] [DEBUG] Version: 1.0.0
[APP] [2026-03-12 10:30:45] [SUCCESS] Window created successfully
[APP] [2026-03-12 10:30:45] [INFO] Binding JavaScript handlers...
```

### Build Logs (run.sh)
```
[INFO] V compiler: V 0.5.1
[INFO] Bun: v1.0.0
[STEP] Building frontend...
[ANGULAR] Starting Rsbuild build...
[SUCCESS] Frontend built: 6 files (245K)
[STEP] Building V application...
[VLANG] v build output...
[SUCCESS] V app built: desktopapp (8.5M)
```

## Frontend Development

### Using Bun (Recommended)
```bash
cd frontend

# Install dependencies
bun install

# Development server (watch mode)
bun run dev

# Production build
bun run build:rsbuild
```

### Using npm
```bash
cd frontend

# Install dependencies
npm install

# Development server (watch mode)
npm run dev

# Production build
npm run build:rsbuild
```

## Backend Development

```bash
# Debug build with verbose output
v -cc gcc -o desktopapp ./src

# Run with logging
./desktopapp

# Clean rebuild
rm -f desktopapp && v -cc gcc -o desktopapp ./src
```

## Requirements

### System
- **OS**: Linux (tested on Ubuntu/Debian)
- **Kernel**: 4.4+ (for /sys/class/power_supply/)

### Build Tools
- **V**: 0.5.1+ (https://vlang.io)
- **GCC**: 9.0+
- **Bun**: 1.0+ (optional, recommended) or **npm**: 8.0+

### Runtime
- **WebUI**: Included in thirdparty/v-webui
- **Browser**: Any modern browser (Chrome, Firefox, Edge)

## Error Handling

The application includes comprehensive error handling:

### Backend Error Handling
- Structured error codes (ErrorCode enum)
- Error types: AppError, ErrorRegistry, StringResult, IntResult
- Safe operation helpers: safe_read_file, safe_list_dir, safe_json_parse
- Retry logic for window creation (3 attempts)
- Graceful error recovery with troubleshooting hints

### Frontend Error Handling
- Error recovery service with automatic retry
- HTTP error interceptor with exponential backoff
- Visual error boundary with recovery options
- Error statistics tracking (total, critical, warnings)
- Connection monitoring and reconnection attempts

## Testing

### Frontend Tests
```bash
cd frontend

# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:ci
```

### Backend Tests
```bash
# Run V tests
v test ./src
```

## Troubleshooting

### Frontend build fails
```bash
# Clean and reinstall
./run.sh clean-all
./run.sh install
./run.sh build
```

### V compiler errors
```bash
# Check V installation
v version

# Update V
v up

# Verbose build
v -cc gcc -showcc -o desktopapp ./src
```

### System info not showing
```bash
# Check system paths
ls /sys/class/power_supply/

# Test manually
cat /sys/class/power_supply/BAT0/capacity
cat /sys/class/power_supply/BAT0/status
```

### Port already in use
The application uses a dynamic port. Check the terminal output for the assigned port.

## API Reference

### JavaScript to V Functions

```javascript
// Get system information
const systemInfo = webui.call('getSystemInfo');
// Returns: { hostname: 'localhost', os: 'linux', total_memory_mb: '16384', ... }

// Get memory statistics
const memoryStats = webui.call('getMemoryStats');
// Returns: { total_mb: '16384', free_mb: '8192', percent_used: '50.0', ... }

// List processes
const processes = webui.call('listProcesses');
// Returns: [{ pid: '1', name: 'systemd' }, ...]

// Browse directory
const files = webui.call('browseDirectory', '/home/user');
// Returns: { path: '/home/user', files: [...], count: '10', status: 'ok' }
```

### V Event Logging

All V events are logged with timestamps:
- Window creation/close
- JavaScript function calls
- System data fetches
- Status changes

## Architecture

### Backend Architecture
```
V Application (main.v)
    |
    | V FFI
    v
v-webui Module (lib.c.v)
    |
    | C Linkage
    v
webui.c (WebUI Library)
    |
    | Includes
    v
civetweb.c (Embedded HTTP/WebSocket Server)
```

### Frontend Architecture
```
Angular Components
    |
    | Services
    v
Error Recovery Service
    |
    | HTTP Interceptor
    v
WebUI JavaScript Bridge
    |
    | WebSocket
    v
V Backend Handlers
```

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `./run.sh build` to verify
5. Submit a pull request

## Documentation

Additional documentation is available in the `docs/` directory:

- `ANGULAR_19_BUILD_PATH_FIX.md` - Angular 19 build output path configuration
- `RUNNING_THE_APP.md` - Troubleshooting guide for running the application
- `WEBUI_CIVETWEB_SUMMARY.md` - WebUI and civetweb integration summary
- `WEBUI_INTEGRATION_EVALUATION.md` - Detailed WebUI integration evaluation

## Version History

- **1.0.0** - Initial release with Angular 19 frontend, comprehensive error handling, and src/ directory structure
