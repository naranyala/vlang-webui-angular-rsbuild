# Getting Started Guide

**Project**: Vlang WebUI Angular Application  
**Last Updated**: 2026-03-16

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Building the Application](#building-the-application)
4. [Running the Application](#running-the-application)
5. [Development Workflow](#development-workflow)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Operating System**: Linux (Ubuntu/Debian tested)
- **Kernel**: 4.4 or later
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 500MB for dependencies

### Required Tools

| Tool | Version | Purpose | Installation |
|------|---------|---------|--------------|
| V Language | 0.5.1+ | Backend development | [vlang.io](https://vlang.io) |
| GCC | 9.0+ | C compiler for V | `sudo apt install gcc` |
| Bun | 1.0+ | Frontend package manager | [bun.sh](https://bun.sh) |

### Optional Tools

| Tool | Purpose |
|------|---------|
| npm 8.0+ | Alternative to Bun |
| Chrome/Firefox | For WebUI browser rendering |

---

## Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd vlang-webui-angular-rsbuild
```

### Step 2: Install Frontend Dependencies

```bash
./run.sh install
```

This command:
- Navigates to the `frontend/` directory
- Runs `bun install` (or `npm install` if Bun is not available)
- Installs all Angular and Rsbuild dependencies

**Expected Output**:
```
[INFO] Using Bun...
[SUCCESS] Dependencies installed
```

### Step 3: Verify Installation

```bash
# Check V compiler
v version

# Check Bun
bun --version

# Check GCC
gcc --version
```

---

## Building the Application

### Quick Build (Recommended)

```bash
./run.sh
```

This is the default command that:
1. Checks prerequisites
2. Builds the frontend (Angular)
3. Builds the backend (V)
4. Runs the application

### Build Only

```bash
./run.sh build
```

This command:
1. Checks prerequisites
2. Builds frontend and backend
3. Does NOT run the application

**Expected Output**:
```
[STEP] Starting full build...
[STEP] Checking prerequisites...
[INFO] V compiler: V 0.5.1
[INFO] Bun: v1.3.10
[SUCCESS] Prerequisites check complete
[STEP] Building frontend...
[ANGULAR] Starting Angular build (AOT)...
Application bundle generation complete. [14.151 seconds]
[SUCCESS] Frontend built: 6 files (276K) in 18s
[STEP] Building V application...
[VLANG] Compiling with GCC...
[SUCCESS] V app built: ./build/desktopapp (768K) in 5s
[SUCCESS] Full build complete in 18s
```

### Build Output

After a successful build:

| File | Location | Size |
|------|----------|------|
| Binary | `build/desktopapp` | 768K |
| Frontend | `frontend/dist/browser` | 276K |

---

## Running the Application

### Run with Build (Default)

```bash
./run.sh
```

Builds the application and then runs it.

### Run Existing Binary

```bash
./run.sh run
```

Runs the previously built binary without rebuilding.

**Note**: If no binary exists, you will see:
```
[ERROR] Binary not found at ./build/desktopapp. Run './run.sh build' first.
```

### Application Window

When the application starts:
- A window opens at 80% screen width and height
- The window is centered on screen
- The Angular UI loads inside the WinBox window

---

## Development Workflow

### Development Mode

```bash
./run.sh dev
```

This command:
- Disables build cache (always rebuilds)
- Builds frontend and backend
- Runs the application

### Watch Mode (Hot Reload)

```bash
./run.sh watch
```

Starts watch mode for both frontend and backend:
- Frontend: Rsbuild dev server with hot reload
- Backend: V compiler watch mode

**Note**: Watch mode runs in the foreground. Press `Ctrl+C` to stop.

### Clean Build

```bash
# Remove build artifacts
./run.sh clean

# Deep clean (including node_modules)
./run.sh clean-all
```

### Run Tests

```bash
# Frontend tests
cd frontend && bun test

# Backend tests
v run src/services/*_test.v
```

---

## Troubleshooting

### Build Fails: "V compiler not found"

**Problem**: V language is not installed or not in PATH.

**Solution**:
```bash
# Install V
cd /opt
git clone https://github.com/vlang/v
cd v
make

# Add to PATH
export V_HOME=/opt/v
export PATH=$V_HOME:$PATH

# Add to ~/.bashrc for persistence
echo 'export V_HOME=/opt/v' >> ~/.bashrc
echo 'export PATH=$V_HOME:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Build Fails: "GCC not found"

**Problem**: GCC compiler is not installed.

**Solution** (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install gcc build-essential
```

### Build Fails: "Could not find @angular-devkit/build-angular"

**Problem**: Frontend dependencies are not installed.

**Solution**:
```bash
cd frontend
bun install
# or
npm install
```

### Build Fails: "include file 'string.h' not found"

**Problem**: System headers are missing.

**Solution** (Ubuntu/Debian):
```bash
sudo apt install libc6-dev
```

### Application Window Does Not Open

**Problem**: WebUI library or browser issue.

**Solution**:
1. Check that `winbox.min.js` exists:
   ```bash
   ls frontend/dist/browser/browser/static/js/winbox.min.js
   ```
2. Rebuild if missing:
   ```bash
   ./run.sh clean
   ./run.sh build
   ```

### Tests Fail: "Need to call TestBed.initTestEnvironment()"

**Problem**: Angular testing environment not properly configured for Bun test.

**Solution**: Use Jest for Angular tests instead:
```bash
cd frontend
npm test
```

---

## Build Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ENV` | development | Environment (development/production) |
| `PROFILE` | standard | Build profile (fast/standard/release) |
| `ENABLE_CACHE` | true | Enable build caching |
| `ENABLE_TESTS` | false | Run tests during build |
| `ENABLE_LINT` | false | Run linters during build |
| `ENABLE_PARALLEL` | false | Enable parallel builds |

### Examples

```bash
# Production build
ENV=production ./run.sh build

# Build with tests
ENABLE_TESTS=true ./run.sh build

# Build with linting
ENABLE_LINT=true ./run.sh build

# Fast build (no cache)
ENABLE_CACHE=false ./run.sh build

# Parallel build (faster on multi-core)
ENABLE_PARALLEL=true ./run.sh build
```

---

## Build Performance

### Typical Build Times

| Stage | Time |
|-------|------|
| Frontend | 14s |
| Backend | 5s |
| **Total** | **19s** |

### Optimization Tips

1. **Enable caching** (default):
   ```bash
   ENABLE_CACHE=true ./run.sh build
   ```

2. **Use parallel builds**:
   ```bash
   ENABLE_PARALLEL=true ./run.sh build
   ```

3. **Clean only when necessary**:
   - Use `./run.sh clean` instead of `./run.sh clean-all`
   - Keeps node_modules intact

---

## Next Steps

After successfully building and running the application:

1. [UI Layout Guide](35-ui-layout.md) - Understand the interface
2. [Backend Services](50-backend-services.md) - Learn the API
3. [Frontend Services](54-frontend-services.md) - Frontend API reference
4. [Testing Guide](15-testing-guide.md) - How to run and write tests

---

*Last updated: 2026-03-16*
