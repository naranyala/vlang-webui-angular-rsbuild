# Build Pipeline Documentation

## Overview

The build pipeline automates the build process for both frontend and backend components.

---

## Build Script

**File**: `run.sh`

**Features**:
- Prerequisites checking
- Frontend build (Angular)
- Backend build (V)
- Build caching
- Build reports
- Clean commands

---

## Commands

| Command | Description |
|---------|-------------|
| `./run.sh install` | Install frontend dependencies |
| `./run.sh build` | Build frontend and backend |
| `./run.sh run` | Run existing binary |
| `./run.sh dev` | Build and run in development mode |
| `./run.sh clean` | Remove build artifacts |
| `./run.sh clean-all` | Deep clean (including node_modules) |
| `./run.sh watch` | Start frontend dev server |
| `./run.sh stats` | Show build statistics |
| `./run.sh help` | Show help message |

---

## Build Process

### 1. Prerequisites Check

```bash
[STEP] Checking prerequisites...
[INFO] V compiler: V 0.5.1 0c3183c
[INFO] Bun: v1.3.10
[INFO] GCC: gcc (GCC) 14.3.0
[SUCCESS] Prerequisites check complete
```

### 2. Frontend Build

```bash
[STEP] Building frontend...
[ANGULAR] Starting Angular build (AOT)...
[SUCCESS] Frontend built: 6 files (304K) in 15s
```

**Output**:
```
frontend/dist/browser/
├── main-*.js     # 284KB
├── styles-*.css  # 12KB
├── polyfills-*.js# 34KB
└── scripts-*.js  # 11KB
```

### 3. Backend Build

```bash
[STEP] Building V application...
[VLANG] Compiling with GCC...
[SUCCESS] V app built: build/desktopapp (768K) in 5s
```

**Output**:
```
build/
└── desktopapp    # 768KB executable
```

---

## Build Caching

The build pipeline supports caching for faster rebuilds:

```bash
[INFO] Build cache enabled: ./.build-cache
[INFO] Frontend cache hit
[SUCCESS] Frontend build skipped (cached)
```

**Cache Keys**:
- Frontend: MD5 hash of source files
- Backend: MD5 hash of V source files

**Disable Cache**:

```bash
ENABLE_CACHE=false ./run.sh build
```

---

## Build Reports

Build reports are generated in JSON format:

**File**: `build-report.json`

**Format**:

```json
{
  "timestamp": "2026-03-16T08:23:00Z",
  "environment": "development",
  "profile": "standard",
  "duration": 20,
  "durationFormatted": "20s",
  "cache": {
    "enabled": true,
    "frontend": "83eac42875757823c10072056d0952f8",
    "backend": "dcb2c98fe344ef094401dd86585d7da6"
  },
  "frontend": {
    "outputDir": "frontend/dist/browser/browser",
    "exists": true
  },
  "backend": {
    "binary": "desktopapp",
    "path": "build/desktopapp",
    "exists": true,
    "size": 786432
  }
}
```

**View Statistics**:

```bash
./run.sh stats
```

---

## Environment Variables

| Variable | Description | Default | Values |
|----------|-------------|---------|--------|
| `ENV` | Environment | development | development, production |
| `PROFILE` | Build profile | standard | fast, standard, release |
| `ENABLE_CACHE` | Enable caching | true | true, false |
| `ENABLE_TESTS` | Run tests | false | true, false |
| `ENABLE_LINT` | Run linters | false | true, false |
| `ENABLE_PARALLEL` | Parallel builds | false | true, false |

**Usage**:

```bash
ENV=production ENABLE_TESTS=true ./run.sh build
```

---

## Troubleshooting

### Frontend Build Fails

**Error**: `Node modules not found`

**Solution**:

```bash
./run.sh install
```

**Error**: `TypeScript compilation errors`

**Solution**:

```bash
cd frontend
bun run build
# Check error messages
```

### Backend Build Fails

**Error**: `V compiler not found`

**Solution**:

```bash
# Install V
curl -O https://raw.githubusercontent.com/vlang/v/master/install.sh
sh install.sh
```

**Error**: `GCC not found`

**Solution**:

```bash
# Debian/Ubuntu
sudo apt-get install build-essential

# Fedora/RHEL
sudo dnf install gcc
```

### Binary Not Found

**Error**: `Binary not found at build/desktopapp`

**Solution**:

```bash
# Rebuild
./run.sh clean
./run.sh build
```

---

## Performance

### Build Times

| Component | First Build | Cached Build |
|-----------|-------------|--------------|
| Frontend | 15s | 0s |
| Backend | 5s | 0s |
| Total | 20s | 0s |

### Bundle Sizes

| Component | Size | Gzip |
|-----------|------|------|
| Frontend JS | 284KB | 63KB |
| Frontend CSS | 12KB | 2.5KB |
| Backend Binary | 768KB | N/A |
| Total | 1.06MB | 65.5KB |

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - uses: vlang/setup-v@v1
      
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: ./run.sh install
      
      - name: Build
        run: ./run.sh build
      
      - name: Upload binary
        uses: actions/upload-artifact@v3
        with:
          name: desktopapp
          path: build/desktopapp
```

### GitLab CI

```yaml
stages:
  - build
  - test

build:
  stage: build
  script:
    - ./run.sh install
    - ./run.sh build
  artifacts:
    paths:
      - build/desktopapp
```

---

## Best Practices

### 1. Use Cache for Development

```bash
# Development (with cache)
./run.sh build

# Production (clean build)
ENABLE_CACHE=false ./run.sh build
```

### 2. Clean Before Production Build

```bash
./run.sh clean-all
ENV=production ./run.sh build
```

### 3. Check Build Statistics

```bash
# After build
./run.sh stats

# Check report
cat build-report.json
```

### 4. Use Appropriate Profile

```bash
# Fast build for development
PROFILE=fast ./run.sh build

# Standard build (default)
./run.sh build

# Release build with optimizations
PROFILE=release ./run.sh build
```

---

*Last updated: 2026-03-16*
*Version: 1.0*
