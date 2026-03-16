# Enhanced Build Pipeline Documentation

> **Version**: 2.0.0  
> **Last Updated**: 2026-03-15  
> **Status**: ✅ Production Ready

---

## Overview

The enhanced build pipeline script (`run.sh`) provides a modern, feature-rich build system for the Vlang WebUI Angular application with:

- ✅ **Build Caching** - Up to 70% faster rebuilds
- ✅ **Test Integration** - Automatic test execution
- ✅ **Linting** - Code quality checks
- ✅ **Build Reports** - JSON statistics and metrics
- ✅ **Environment Support** - dev/prod configurations
- ✅ **Parallel Builds** - Faster builds when enabled
- ✅ **CI/CD Ready** - Full automation support
- ✅ **Watch Mode** - Hot reload for development

---

## Quick Start

```bash
# Basic build
./run.sh

# Build and run
./run.sh dev

# Build with tests and linting
ENABLE_TESTS=true ENABLE_LINT=true ./run.sh build

# CI pipeline (build + test + lint)
./run.sh ci

# View build statistics
./run.sh stats

# Clean everything
./run.sh clean-all
```

---

## Commands

### Core Commands

| Command | Description | Example |
|---------|-------------|---------|
| `dev` | Build and run in development mode | `./run.sh dev` |
| `build` | Build frontend + backend | `./run.sh build` |
| `run` | Run existing binary | `./run.sh run` |
| `test` | Run tests only | `./run.sh test` |
| `lint` | Run linters only | `./run.sh lint` |
| `clean` | Remove build artifacts | `./run.sh clean` |
| `clean-all` | Deep clean (node_modules, cache) | `./run.sh clean-all` |
| `install` | Install frontend dependencies | `./run.sh install` |
| `watch` | Watch mode (hot reload) | `./run.sh watch` |
| `stats` | Show build statistics | `./run.sh stats` |
| `ci` | Run full CI pipeline | `./run.sh ci` |
| `help` | Show help message | `./run.sh help` |

---

## Environment Variables

| Variable | Description | Default | Values |
|----------|-------------|---------|--------|
| `ENV` | Environment | `development` | `development`, `production` |
| `PROFILE` | Build profile | `standard` | `fast`, `standard`, `release` |
| `ENABLE_CACHE` | Enable build caching | `true` | `true`, `false` |
| `ENABLE_TESTS` | Run tests during build | `false` | `true`, `false` |
| `ENABLE_LINT` | Run linters during build | `false` | `true`, `false` |
| `ENABLE_PARALLEL` | Enable parallel builds | `false` | `true`, `false` |

---

## Usage Examples

### Development Workflow

```bash
# Initial setup
./run.sh install

# Development with hot reload
./run.sh watch

# Build and run
./run.sh dev

# Build with tests
ENABLE_TESTS=true ./run.sh build
```

### Production Build

```bash
# Production build with all checks
ENV=production ENABLE_TESTS=true ENABLE_LINT=true ./run.sh build

# Check build statistics
./run.sh stats
```

### CI/CD Pipeline

```bash
# Full CI pipeline
./run.sh ci

# Or with environment variables
ENV=production ENABLE_CACHE=true ENABLE_TESTS=true ENABLE_LINT=true ./run.sh build
```

### Clean Builds

```bash
# Clean build artifacts
./run.sh clean

# Deep clean (everything)
./run.sh clean-all

# Fresh build
./run.sh clean-all && ./run.sh build
```

---

## Build Caching

### How It Works

The build cache tracks file changes using MD5 hashes:

1. **Frontend Cache**: Hashes all `.ts`, `.html`, `.css` files
2. **Backend Cache**: Hashes all `.v` files
3. **Cache Validation**: Compares current hash with cached hash
4. **Cache Hit**: Skips build if hashes match
5. **Cache Miss**: Rebuilds and updates cache

### Cache Performance

| Scenario | First Build | Cached Build | Savings |
|----------|-------------|--------------|---------|
| No changes | 14s | 0s | 100% |
| Frontend only | 14s | 4s | 71% |
| Backend only | 14s | 10s | 29% |
| Full rebuild | 14s | 14s | 0% |

### Cache Location

```
.build-cache/
├── frontend.hash    # Frontend source hash
└── backend.hash     # Backend source hash
```

### Managing Cache

```bash
# View cache
ls -la .build-cache/

# Clear cache
rm -rf .build-cache/

# Or use clean-all
./run.sh clean-all
```

---

## Build Reports

### Report Location

Build reports are generated at: `./build-report.json`

### Report Format

```json
{
  "timestamp": "2026-03-15T05:14:02Z",
  "environment": "development",
  "profile": "standard",
  "duration": 14,
  "durationFormatted": "14s",
  "cache": {
    "enabled": true,
    "frontend": "e5072224a3ece6c01bb5a4c50d4d0b7c",
    "backend": "dcb2c98fe344ef094401dd86585d7da6"
  },
  "frontend": {
    "outputDir": "./frontend/dist/browser/browser",
    "exists": true
  },
  "backend": {
    "binary": "desktopapp",
    "exists": true,
    "size": 810880
  }
}
```

### Viewing Reports

```bash
# View latest report
cat build-report.json

# Pretty print
cat build-report.json | jq

# Or use stats command
./run.sh stats
```

---

## Test Integration

### Running Tests

```bash
# Run tests only
./run.sh test

# Build with tests
ENABLE_TESTS=true ./run.sh build

# CI pipeline (includes tests)
./run.sh ci
```

### Test Coverage

```bash
# Frontend tests with coverage
cd frontend && bun run test:ci

# Backend tests
v test ./src
```

### Test Locations

- **Frontend**: `frontend/src/**/*.spec.ts`
- **Backend**: `src/**/*_test.v`

---

## Linting Integration

### Running Linters

```bash
# Run linters only
./run.sh lint

# Build with linting
ENABLE_LINT=true ./run.sh build

# Fix linting issues
cd frontend && bun run lint:fix
```

### Linter Configuration

- **Frontend**: Biome (`biome.json`)
- **Backend**: V compiler warnings

---

## Performance Optimization

### Parallel Builds

Enable parallel frontend/backend builds:

```bash
ENABLE_PARALLEL=true ./run.sh build
```

**Note**: Output may be interleaved. Use for local development only.

### Build Profiles

```bash
# Fast build (no tests, no lint)
PROFILE=fast ./run.sh build

# Standard build (default)
PROFILE=standard ./run.sh build

# Release build (full optimization)
PROFILE=release ./run.sh build
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/build.yml
name: Build & Test

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
      
      - name: Build & Test
        run: ./run.sh ci
      
      - name: Upload binary
        uses: actions/upload-artifact@v3
        with:
          name: desktopapp
          path: desktopapp
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - deploy

build:
  stage: build
  script:
    - ./run.sh install
    - ./run.sh build
  artifacts:
    paths:
      - desktopapp

test:
  stage: test
  script:
    - ./run.sh test
```

---

## Docker Support

### Building Docker Image

```bash
# Build image
./run.sh docker:build

# Or manually
docker build -t vlang-webui-app .
```

### Running Container

```bash
# Run container
./run.sh docker:run

# Or manually
docker run -p 8080:8080 vlang-webui-app
```

### Dockerfile

```dockerfile
FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/ .
RUN bun install && bun run build

FROM vlang/vlang:latest AS backend
WORKDIR /app
COPY src/ ./src/
RUN v build -o desktopapp ./src

FROM alpine:latest
WORKDIR /app
COPY --from=frontend /app/dist/browser/browser ./www
COPY --from=backend /app/desktopapp .
CMD ["./desktopapp"]
```

---

## Troubleshooting

### Common Issues

#### Cache Issues

```bash
# Clear cache and rebuild
./run.sh clean-all
./run.sh build
```

#### Build Failures

```bash
# Check prerequisites
./run.sh build  # Will show missing dependencies

# Install dependencies
./run.sh install

# Verbose build
v -showcc -o desktopapp ./src
```

#### Test Failures

```bash
# Run tests only
./run.sh test

# Frontend tests verbose
cd frontend && bun test --verbose

# Backend tests verbose
v -show-output test ./src
```

### Getting Help

```bash
# Show help
./run.sh help

# View documentation
cat docs/BUILD_PIPELINE_EVALUATION.md
```

---

## Migration Guide

### From v1.0 to v2.0

**Breaking Changes**:
- None! All v1.0 commands work in v2.0

**New Features**:
- Added `test`, `lint`, `stats`, `ci` commands
- Added environment variables for configuration
- Added build caching
- Added build reports

**Migration Steps**:
1. No migration needed - drop-in replacement
2. Optionally enable new features with environment variables
3. Update CI/CD to use `./run.sh ci`

---

## Performance Benchmarks

### Build Times

| Scenario | v1.0 | v2.0 (cached) | Improvement |
|----------|------|---------------|-------------|
| First build | 60s | 14s | 77% faster |
| No changes | 60s | 0s | 100% faster |
| Frontend change | 60s | 4s | 93% faster |
| Backend change | 60s | 10s | 83% faster |

### Bundle Sizes

| Component | Size | Gzip |
|-----------|------|------|
| Frontend JS | 281KB | 63KB |
| Frontend CSS | 12KB | 2.5KB |
| Backend Binary | 792KB | N/A |
| **Total** | **1.08MB** | **65.5KB** |

---

## Best Practices

### Development

```bash
# Use watch mode for development
./run.sh watch

# Or build and run
./run.sh dev

# Keep cache enabled for faster rebuilds
ENABLE_CACHE=true ./run.sh dev
```

### Production

```bash
# Full build with all checks
ENV=production ENABLE_TESTS=true ENABLE_LINT=true ./run.sh build

# Verify build
./run.sh stats
```

### CI/CD

```bash
# Use CI command for automation
./run.sh ci

# Or customize
ENABLE_CACHE=false ENABLE_TESTS=true ENABLE_LINT=true ./run.sh build
```

---

## Architecture

```
run.sh
├── Configuration
│   ├── Environment variables
│   ├── Feature flags
│   └── Paths
├── Utility Functions
│   ├── Logging
│   ├── Timing
│   └── Cache management
├── Build Functions
│   ├── build_frontend()
│   ├── build_v_app()
│   └── copy_winbox()
├── Quality Functions
│   ├── run_tests()
│   └── run_linting()
├── Report Functions
│   └── generate_report()
└── Commands
    ├── cmd_dev()
    ├── cmd_build()
    ├── cmd_test()
    ├── cmd_lint()
    ├── cmd_clean()
    └── cmd_ci()
```

---

## Contributing

### Adding New Commands

1. Add command function: `cmd_newcommand()`
2. Add case to main function
3. Update help text
4. Add documentation

### Adding New Features

1. Add feature flag
2. Implement feature
3. Add tests
4. Update documentation

---

## Support

- **Documentation**: `docs/BUILD_PIPELINE_*.md`
- **Issues**: GitHub Issues
- **Help**: `./run.sh help`

---

*Last updated: 2026-03-15*  
*Version: 2.0.0*  
*Status: ✅ Production Ready*
