# Build Pipeline Script Evaluation & Enhancement Plan

> **Project**: Vlang WebUI Angular Application
> **Script**: `run.sh`
> **Date**: 2026-03-15
> **Status**: Current Assessment & Enhancement Plan

---

## Current State Analysis

### ✅ Strengths

| Feature | Status | Notes |
|---------|--------|-------|
| **Color Output** | ✅ Good | Clear visual feedback |
| **Error Handling** | ✅ Good | Proper exit codes |
| **Prerequisites Check** | ✅ Good | Checks V, Bun/npm, GCC |
| **Build Steps** | ✅ Good | Frontend → Backend order |
| **Clean Commands** | ✅ Good | Basic and deep clean |
| **Help System** | ✅ Good | Usage documentation |

### ❌ Weaknesses

| Issue | Severity | Impact |
|-------|----------|--------|
| **No Parallel Builds** | 🔴 High | Slow build times |
| **No Build Caching** | 🔴 High | Rebuilds everything |
| **No Build Statistics** | 🟡 Medium | No metrics tracking |
| **No Incremental Builds** | 🔴 High | Full rebuild always |
| **No Environment Support** | 🟡 Medium | No dev/prod/config |
| **No Build Reports** | 🟡 Medium | No artifact info |
| **No Watch Mode (Backend)** | 🟡 Medium | Manual rebuild needed |
| **No Test Integration** | 🔴 High | Tests not in pipeline |
| **No Linting** | 🟡 Medium | No code quality checks |
| **No Docker Support** | 🟢 Low | No containerization |
| **No CI/CD Config** | 🔴 High | No automation ready |
| **Hardcoded Paths** | 🟡 Medium | Inflexible configuration |

---

## Enhancement Plan

### Phase 1: Critical Improvements (Week 1)

#### 1.1 Parallel Builds
**Current**: Sequential (Frontend → Backend)
**Proposed**: Parallel where possible

```bash
# Before: ~60 seconds
build_frontend  # 45s
build_v_app     # 15s

# After: ~45 seconds (30% faster)
build_frontend & build_v_app &
wait
```

#### 1.2 Build Caching
**Current**: No caching
**Proposed**: Cache unchanged artifacts

```bash
# Check if frontend changed
if [ frontend/src -nt dist/browser ]; then
    build_frontend
else
    log_info "Frontend unchanged, using cache"
fi
```

#### 1.3 Build Statistics
**Current**: Basic file count
**Proposed**: Comprehensive metrics

```bash
# Build report
- Frontend: 288KB (gzip: 80KB)
- Backend: 792KB
- Total: 1.08MB
- Build time: 45s
- Cache hit: Yes/No
```

#### 1.4 Test Integration
**Current**: No tests in pipeline
**Proposed**: Run tests automatically

```bash
# In build pipeline
run_tests() {
    log_step "Running tests..."
    cd frontend && bun test
    v test ./src
}
```

### Phase 2: Environment Support (Week 2)

#### 2.1 Environment Configurations
```bash
# Environment support
./run.sh build --env=development
./run.sh build --env=production
./run.sh build --env=staging

# Configuration files
config/
├── development.json
├── production.json
└── staging.json
```

#### 2.2 Build Profiles
```bash
# Build profiles
./run.sh build --profile=fast      # Skip tests, no optimization
./run.sh build --profile=standard  # Tests, standard optimization
./run.sh build --profile=release   # Tests, full optimization
```

### Phase 3: Advanced Features (Week 3)

#### 3.1 Watch Mode (Backend)
```bash
# Backend watch mode
./run.sh watch:backend

# Uses v -watch for hot reload
v -watch ./src
```

#### 3.2 Build Reports
```bash
# Generate build report
./run.sh build --report

# Output: build-report.json
{
  "timestamp": "2026-03-15T10:30:00Z",
  "duration": 45000,
  "frontend": {
    "size": 288690,
    "gzipSize": 80120,
    "files": 6
  },
  "backend": {
    "size": 811008,
    "files": 10
  },
  "tests": {
    "passed": 246,
    "failed": 0
  }
}
```

#### 3.3 Linting Integration
```bash
# Add linting to pipeline
./run.sh lint
./run.sh lint:fix

# In build pipeline
if [ "$LINT" = true ]; then
    run_linting || exit 1
fi
```

### Phase 4: CI/CD & Docker (Week 4)

#### 4.1 CI/CD Configuration
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
      - uses: vlang/setup-v@v1
      - run: ./run.sh ci
```

#### 4.2 Docker Support
```dockerfile
# Dockerfile
FROM node:20-alpine AS frontend
COPY frontend/ /app/
RUN cd /app && bun install && bun run build

FROM vlang/vlang:latest AS backend
COPY src/ /app/src/
RUN v build /app

FROM alpine:latest
COPY --from=frontend /app/dist/browser /app/www
COPY --from=backend /app/desktopapp /app/
CMD ["/app/desktopapp"]
```

---

## Implementation Priority

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 🔴 P0 | Test Integration | Low | High |
| 🔴 P0 | Build Caching | Medium | High |
| 🟡 P1 | Build Statistics | Low | Medium |
| 🟡 P1 | Environment Support | Medium | Medium |
| 🟡 P1 | Linting Integration | Low | Medium |
| 🟢 P2 | Parallel Builds | Medium | Medium |
| 🟢 P2 | Watch Mode (Backend) | Low | Low |
| 🟢 P2 | Build Reports | Low | Low |
| 🟢 P3 | CI/CD Config | Medium | High |
| 🟢 P3 | Docker Support | High | Medium |

---

## Proposed New Script Structure

```bash
#!/usr/bin/env bash
# Enhanced Build Pipeline Script
# Version: 2.0.0

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly CONFIG_FILE="${SCRIPT_DIR}/.build.config"
readonly CACHE_DIR="${SCRIPT_DIR}/.build-cache"
readonly REPORT_FILE="${SCRIPT_DIR}/build-report.json"

# Environment (default: development)
ENV="${ENV:-development}"
PROFILE="${PROFILE:-standard}"

# ============================================================================
# Functions
# ============================================================================

# Core functions
check_prerequisites() { ... }
build_frontend() { ... }
build_v_app() { ... }
run_tests() { ... }
run_linting() { ... }

# Enhanced functions
check_cache() { ... }
save_cache() { ... }
generate_report() { ... }
parallel_build() { ... }

# Commands
cmd_dev() { ... }
cmd_build() { ... }
cmd_test() { ... }
cmd_lint() { ... }
cmd_clean() { ... }
cmd_watch() { ... }
cmd_ci() { ... }

# ============================================================================
# Main
# ============================================================================
main() {
    parse_args "$@"
    load_config
    execute_command
}

main "$@"
```

---

## New Commands

| Command | Description | Example |
|---------|-------------|---------|
| `ci` | CI/CD pipeline (build + test + lint) | `./run.sh ci` |
| `test` | Run tests only | `./run.sh test` |
| `lint` | Run linters | `./run.sh lint` |
| `watch` | Watch mode (frontend + backend) | `./run.sh watch` |
| `watch:backend` | Watch backend only | `./run.sh watch:backend` |
| `watch:frontend` | Watch frontend only | `./run.sh watch:frontend` |
| `report` | Generate build report | `./run.sh report` |
| `stats` | Show build statistics | `./run.sh stats` |
| `docker:build` | Build Docker image | `./run.sh docker:build` |
| `docker:run` | Run Docker container | `./run.sh docker:run` |

---

## Configuration File

```bash
# .build.config

# Environment settings
ENV_DEVELOPMENT=true
ENV_PRODUCTION=false

# Build options
ENABLE_CACHE=true
ENABLE_PARALLEL=true
ENABLE_LINTING=true
ENABLE_TESTS=true

# Paths
FRONTEND_DIR="frontend"
BACKEND_DIR="src"
OUTPUT_DIR="dist"

# Compiler options
V_COMPILER="gcc"
ANGULAR_CONFIG="production"

# Test options
TEST_COVERAGE_THRESHOLD=80
TEST_TIMEOUT=60000
```

---

## Expected Improvements

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| **Build Time** | 60s | 35s | -42% |
| **Cache Hit Rate** | 0% | 70% | +70% |
| **Test Coverage** | 75% | 85% | +13% |
| **CI/CD Ready** | No | Yes | 100% |
| **Docker Support** | No | Yes | 100% |
| **Developer Experience** | Good | Excellent | +50% |

---

## Migration Plan

### Week 1: Foundation
- [ ] Add test integration
- [ ] Add build caching
- [ ] Add build statistics
- [ ] Update documentation

### Week 2: Environments
- [ ] Add environment support
- [ ] Add build profiles
- [ ] Add configuration file
- [ ] Test all environments

### Week 3: Advanced Features
- [ ] Add parallel builds
- [ ] Add backend watch mode
- [ ] Add build reports
- [ ] Add linting integration

### Week 4: CI/CD & Docker
- [ ] Create CI/CD configuration
- [ ] Create Dockerfile
- [ ] Test CI/CD pipeline
- [ ] Test Docker builds

---

## Success Criteria

- ✅ **40% faster builds** (60s → 35s)
- ✅ **70% cache hit rate**
- ✅ **85%+ test coverage**
- ✅ **CI/CD pipeline working**
- ✅ **Docker builds working**
- ✅ **All environments supported**
- ✅ **Comprehensive build reports**
- ✅ **Excellent developer experience**

---

*Last updated: 2026-03-15*
*Status: Ready for Implementation*
