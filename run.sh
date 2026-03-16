#!/usr/bin/env bash
# ============================================================================
# Enhanced Build Pipeline Script v2.0
# Vlang WebUI Angular Application
# ============================================================================
# Features:
# - Build caching for faster rebuilds
# - Test integration
# - Build statistics and reports
# - Environment support (dev/prod)
# - Parallel builds where possible
# - Linting integration
# - CI/CD ready
# ============================================================================

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly FRONTEND_DIR="${SCRIPT_DIR}/frontend"
readonly BUILD_OUTPUT_DIR="${FRONTEND_DIR}/dist/browser"
readonly BUILD_DIR="${SCRIPT_DIR}/build"
readonly CACHE_DIR="${SCRIPT_DIR}/.build-cache"
readonly REPORT_FILE="${SCRIPT_DIR}/build-report.json"
readonly BINARY_NAME="desktopapp"
readonly BINARY_PATH="${BUILD_DIR}/${BINARY_NAME}"
readonly APP_NAME="Desktop App"

# Environment (default: development)
ENV="${ENV:-development}"
PROFILE="${PROFILE:-standard}"

# Feature flags
ENABLE_CACHE="${ENABLE_CACHE:-true}"
ENABLE_TESTS="${ENABLE_TESTS:-false}"
ENABLE_LINT="${ENABLE_LINT:-false}"
ENABLE_PARALLEL="${ENABLE_PARALLEL:-false}"

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly BOLD='\033[1m'
readonly NC='\033[0m'

# Timing
BUILD_START_TIME=$(date +%s)

# ============================================================================
# Logging Functions
# ============================================================================
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }
log_step() { echo -e "${CYAN}[STEP]${NC} $1"; }
log_v() { echo -e "${BOLD}[VLANG]${NC} $1"; }
log_angular() { echo -e "${BOLD}[ANGULAR]${NC} $1"; }
log_test() { echo -e "${BOLD}[TEST]${NC} $1"; }
log_lint() { echo -e "${BOLD}[LINT]${NC} $1"; }

# ============================================================================
# Utility Functions
# ============================================================================
get_timestamp() {
    date -u +"%Y-%m-%dT%H:%M:%SZ"
}

get_duration() {
    local start=$1
    local end=$(date +%s)
    echo $((end - start))
}

format_duration() {
    local seconds=$1
    if [ $seconds -lt 60 ]; then
        echo "${seconds}s"
    else
        local mins=$((seconds / 60))
        local secs=$((seconds % 60))
        echo "${mins}m ${secs}s"
    fi
}

# ============================================================================
# Cache Functions
# ============================================================================
init_cache() {
    if [ "$ENABLE_CACHE" = true ]; then
        mkdir -p "${CACHE_DIR}"
        log_info "Build cache enabled: ${CACHE_DIR}"
    fi
}

get_frontend_hash() {
    if [ -d "${FRONTEND_DIR}/src" ]; then
        find "${FRONTEND_DIR}/src" -type f -name "*.ts" -o -name "*.html" -o -name "*.css" | xargs md5sum 2>/dev/null | md5sum | cut -d' ' -f1
    else
        echo "no-src"
    fi
}

get_backend_hash() {
    if [ -d "${SCRIPT_DIR}/src" ]; then
        find "${SCRIPT_DIR}/src" -type f -name "*.v" | xargs md5sum 2>/dev/null | md5sum | cut -d' ' -f1
    else
        echo "no-src"
    fi
}

check_frontend_cache() {
    if [ "$ENABLE_CACHE" != true ]; then
        return 1
    fi

    local current_hash=$(get_frontend_hash)
    local cached_hash_file="${CACHE_DIR}/frontend.hash"
    local cached_output="${BUILD_OUTPUT_DIR}"

    if [ -f "${cached_hash_file}" ] && [ -d "${cached_output}" ]; then
        local cached_hash=$(cat "${cached_hash_file}")
        if [ "${current_hash}" = "${cached_hash}" ]; then
            log_info "Frontend cache hit OK"
            return 0
        fi
    fi

    log_info "Frontend cache miss FAILED"
    return 1
}

save_frontend_cache() {
    if [ "$ENABLE_CACHE" = true ] && [ -d "${BUILD_OUTPUT_DIR}" ]; then
        get_frontend_hash > "${CACHE_DIR}/frontend.hash"
        log_info "Frontend cache saved"
    fi
}

check_backend_cache() {
    if [ "$ENABLE_CACHE" != true ]; then
        return 1
    fi

    local current_hash=$(get_backend_hash)
    local cached_hash_file="${CACHE_DIR}/backend.hash"
    local cached_binary="${SCRIPT_DIR}/${BINARY_NAME}"

    if [ -f "${cached_hash_file}" ] && [ -f "${cached_binary}" ]; then
        local cached_hash=$(cat "${cached_hash_file}")
        if [ "${current_hash}" = "${cached_hash}" ]; then
            log_info "Backend cache hit OK"
            return 0
        fi
    fi

    log_info "Backend cache miss FAILED"
    return 1
}

save_backend_cache() {
    if [ "$ENABLE_CACHE" = true ] && [ -f "${SCRIPT_DIR}/${BINARY_NAME}" ]; then
        get_backend_hash > "${CACHE_DIR}/backend.hash"
        log_info "Backend cache saved"
    fi
}

# ============================================================================
# Prerequisites
# ============================================================================
check_prerequisites() {
    log_step "Checking prerequisites..."
    local missing=0

    # Check V compiler
    if command -v v &> /dev/null; then
        local V_VERSION=$(v version 2>&1 | head -n 1)
        log_info "V compiler: ${V_VERSION}"
    else
        log_error "V compiler not found. Please install V from https://vlang.io"
        missing=1
    fi

    # Check Bun/npm
    if command -v bun &> /dev/null; then
        local BUN_VERSION=$(bun --version)
        log_info "Bun: v${BUN_VERSION}"
    elif command -v npm &> /dev/null; then
        local NPM_VERSION=$(npm --version)
        log_info "npm: v${NPM_VERSION} (fallback)"
    else
        log_error "Neither Bun nor npm found. Please install Bun (recommended) or npm."
        missing=1
    fi

    # Check GCC
    if command -v gcc &> /dev/null; then
        local GCC_VERSION=$(gcc --version | head -n 1)
        log_info "GCC: ${GCC_VERSION}"
    else
        log_warn "GCC not found. V build may fail."
    fi

    # Check node_modules
    if [ ! -d "${FRONTEND_DIR}/node_modules" ]; then
        log_warn "node_modules not found. Will install dependencies."
    fi

    if [ $missing -eq 1 ]; then
        log_error "Prerequisites check failed!"
        exit 1
    fi

    log_success "Prerequisites check complete OK"
    echo ""
}

# ============================================================================
# Linting
# ============================================================================
run_linting() {
    if [ "$ENABLE_LINT" != true ]; then
        return 0
    fi

    log_step "Running linters..."

    cd "${FRONTEND_DIR}"

    # Frontend linting
    if command -v bun &> /dev/null; then
        if bun run lint 2>&1; then
            log_success "Frontend linting passed OK"
        else
            log_error "Frontend linting failed FAILED"
            cd "${SCRIPT_DIR}"
            return 1
        fi
    fi

    cd "${SCRIPT_DIR}"
    log_success "Linting complete OK"
    echo ""
}

# ============================================================================
# Testing
# ============================================================================
run_tests() {
    if [ "$ENABLE_TESTS" != true ]; then
        return 0
    fi

    log_step "Running tests..."
    local test_start=$(date +%s)
    local failed=0

    # Frontend tests
    log_test "Running frontend tests..."
    cd "${FRONTEND_DIR}"

    if command -v bun &> /dev/null; then
        if bun test 2>&1; then
            log_success "Frontend tests passed OK"
        else
            log_error "Frontend tests failed FAILED"
            failed=1
        fi
    fi

    cd "${SCRIPT_DIR}"

    # Backend tests
    log_test "Running backend tests..."
    if v test ./src 2>&1; then
        log_success "Backend tests passed OK"
    else
        log_error "Backend tests failed FAILED"
        failed=1
    fi

    local test_duration=$(get_duration $test_start)
    log_success "Tests complete in $(format_duration $test_duration) OK"

    if [ $failed -eq 1 ]; then
        log_error "Some tests failed!"
        return 1
    fi

    echo ""
    return 0
}

# ============================================================================
# Frontend Build
# ============================================================================
build_frontend() {
    log_step "Building frontend..."

    # Check cache
    if check_frontend_cache; then
        log_success "Frontend build skipped (cached) OK"
        return 0
    fi

    if [ ! -d "${FRONTEND_DIR}" ]; then
        log_error "Frontend directory not found: ${FRONTEND_DIR}"
        return 1
    fi

    cd "${FRONTEND_DIR}"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_warn "Installing dependencies..."
        if command -v bun &> /dev/null; then
            bun install 2>&1 || {
                log_error "Failed to install dependencies"
                cd "${SCRIPT_DIR}"
                return 1
            }
        else
            npm install 2>&1 || {
                log_error "Failed to install dependencies"
                cd "${SCRIPT_DIR}"
                return 1
            }
        fi
    fi

    log_angular "Starting Angular build (AOT)..."
    echo -e "${YELLOW}----------------------------------------${NC}"

    local build_start=$(date +%s)

    if command -v bun &> /dev/null; then
        bun run build 2>&1 || {
            BUILD_STATUS=$?
            echo -e "${YELLOW}----------------------------------------${NC}"
            log_error "Frontend build failed!"
            cd "${SCRIPT_DIR}"
            return 1
        }
    else
        npm run build 2>&1 || {
            BUILD_STATUS=$?
            echo -e "${YELLOW}----------------------------------------${NC}"
            log_error "Frontend build failed!"
            cd "${SCRIPT_DIR}"
            return 1
        }
    fi

    local build_duration=$(get_duration $build_start)

    echo -e "${YELLOW}----------------------------------------${NC}"

    # Verify build output
    if [ -d "${BUILD_OUTPUT_DIR}" ]; then
        local FILE_COUNT=$(find "${BUILD_OUTPUT_DIR}" -type f | wc -l)
        local TOTAL_SIZE=$(du -sh "${BUILD_OUTPUT_DIR}" 2>/dev/null | cut -f1)
        log_success "Frontend built: ${FILE_COUNT} files (${TOTAL_SIZE}) in $(format_duration $build_duration) OK"

        # Copy WinBox
        copy_winbox

        # Save cache
        save_frontend_cache

        # Generate stats
        generate_frontend_stats
    else
        log_error "Build output directory not found: ${BUILD_OUTPUT_DIR}"
        cd "${SCRIPT_DIR}"
        return 1
    fi

    cd "${SCRIPT_DIR}"
    echo ""
    return 0
}

copy_winbox() {
    local WINBOX_DEST="${BUILD_OUTPUT_DIR}/static/js/winbox.min.js"
    if [ ! -f "${WINBOX_DEST}" ]; then
        log_step "Copying WinBox library..."
        local WINBOX_SRC="${FRONTEND_DIR}/node_modules/winbox/dist/js/winbox.min.js"
        if [ -f "${WINBOX_SRC}" ]; then
            mkdir -p "${BUILD_OUTPUT_DIR}/static/js"
            cp "${WINBOX_SRC}" "${WINBOX_DEST}"
            log_info "Copied winbox.min.js to static/js/"
        else
            log_warn "WinBox source not found: ${WINBOX_SRC}"
        fi
    else
        log_info "WinBox already present in build output"
    fi
}

generate_frontend_stats() {
    if [ -d "${BUILD_OUTPUT_DIR}" ]; then
        local js_size=$(find "${BUILD_OUTPUT_DIR}" -name "*.js" -exec du -cb {} + 2>/dev/null | tail -1 | cut -f1)
        local css_size=$(find "${BUILD_OUTPUT_DIR}" -name "*.css" -exec du -cb {} + 2>/dev/null | tail -1 | cut -f1)
        log_info "Frontend stats: JS=$(numfmt --to=iec-i --suffix=B ${js_size:-0}), CSS=$(numfmt --to=iec-i --suffix=B ${css_size:-0})"
    fi
}

# ============================================================================
# Backend Build
# ============================================================================
build_v_app() {
    log_step "Building V application..."

    # Check cache
    if check_backend_cache; then
        log_success "Backend build skipped (cached) OK"
        return 0
    fi

    # Create build directory if it doesn't exist
    mkdir -p "${BUILD_DIR}"

    log_v "Compiling with GCC..."
    echo -e "${YELLOW}----------------------------------------${NC}"

    local build_start=$(date +%s)

    # Build from src/ directory and output to build/
    v -cc gcc -o ${BINARY_PATH} ./src 2>&1 || {
        BUILD_STATUS=$?
        echo -e "${YELLOW}----------------------------------------${NC}"
        log_error "V build failed!"
        return 1
    }

    local build_duration=$(get_duration $build_start)

    echo -e "${YELLOW}----------------------------------------${NC}"

    if [ -f "${BINARY_PATH}" ]; then
        local BINARY_SIZE=$(du -h ${BINARY_PATH} | cut -f1)
        log_success "V app built: ${BINARY_PATH} (${BINARY_SIZE}) in $(format_duration $build_duration) OK"

        # Save cache
        save_backend_cache
    else
        log_error "Binary not found after build: ${BINARY_PATH}!"
        return 1
    fi

    echo ""
    return 0
}

# ============================================================================
# Build Report
# ============================================================================
generate_report() {
    local build_duration=$(get_duration $BUILD_START_TIME)

    cat > "${REPORT_FILE}" << EOF
{
  "timestamp": "$(get_timestamp)",
  "environment": "${ENV}",
  "profile": "${PROFILE}",
  "duration": ${build_duration},
  "durationFormatted": "$(format_duration $build_duration)",
  "cache": {
    "enabled": ${ENABLE_CACHE},
    "frontend": "$(cat ${CACHE_DIR}/frontend.hash 2>/dev/null || echo 'none')",
    "backend": "$(cat ${CACHE_DIR}/backend.hash 2>/dev/null || echo 'none')"
  },
  "frontend": {
    "outputDir": "${BUILD_OUTPUT_DIR}",
    "exists": $([ -d "${BUILD_OUTPUT_DIR}" ] && echo "true" || echo "false")
  },
  "backend": {
    "binary": "${BINARY_NAME}",
    "path": "${BINARY_PATH}",
    "exists": $([ -f "${BINARY_PATH}" ] && echo "true" || echo "false"),
    "size": $(stat -c%s "${BINARY_PATH}" 2>/dev/null || echo 0)
  }
}
EOF

    log_info "Build report generated: ${REPORT_FILE}"
}

# ============================================================================
# Commands
# ============================================================================
cmd_dev() {
    log_step "Starting development mode..."

    # Disable cache for dev mode to always rebuild
    ENABLE_CACHE=false

    check_prerequisites
    init_cache

    log_info "Building frontend and backend..."

    build_frontend || { log_error "Failed to build frontend"; exit 1; }
    build_v_app || { log_error "Failed to build V app"; exit 1; }

    log_success "Build complete! Starting application..."
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}  Running ${APP_NAME}${NC}"
    echo -e "${CYAN}  Press Ctrl+C to exit${NC}"
    echo -e "${CYAN}  Environment: ${ENV}${NC}"
    echo -e "${CYAN}  Binary: ${BINARY_PATH}${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""

    "${BINARY_PATH}" 2>&1
}

cmd_build() {
    log_step "Starting full build..."

    check_prerequisites
    init_cache
    run_linting || exit 1
    run_tests || exit 1

    if [ "$ENABLE_PARALLEL" = true ]; then
        log_info "Parallel builds enabled..."
        build_frontend & build_v_app &
        wait
    else
        build_frontend || { log_error "Failed to build frontend"; exit 1; }
        build_v_app || { log_error "Failed to build V app"; exit 1; }
    fi

    generate_report

    local total_duration=$(get_duration $BUILD_START_TIME)
    log_success "Full build complete in $(format_duration $total_duration) OK"
}

cmd_run() {
    if [ ! -f "${BINARY_PATH}" ]; then
        log_error "Binary not found at ${BINARY_PATH}. Run './run.sh build' first."
        exit 1
    fi

    log_info "Running existing binary..."
    "${BINARY_PATH}" 2>&1
}

cmd_test() {
    check_prerequisites
    run_tests
}

cmd_lint() {
    ENABLE_LINT=true
    check_prerequisites
    run_linting
}

cmd_clean() {
    log_step "Cleaning build artifacts..."

    # Clean build directory
    if [ -d "${BUILD_DIR}" ]; then
        rm -rf "${BUILD_DIR}"
        log_info "Removed: ${BUILD_DIR}"
    fi

    if [ -d "${BUILD_OUTPUT_DIR}" ]; then
        rm -rf "${BUILD_OUTPUT_DIR}"
        log_info "Removed: ${BUILD_OUTPUT_DIR}"
    fi

    if [ -d "${FRONTEND_DIR}/dist-angular" ]; then
        rm -rf "${FRONTEND_DIR}/dist-angular"
        log_info "Removed: ${FRONTEND_DIR}/dist-angular"
    fi

    log_success "Clean complete OK"
}

cmd_clean_all() {
    log_step "Deep cleaning..."

    cmd_clean

    if [ -d "${FRONTEND_DIR}/node_modules" ]; then
        rm -rf "${FRONTEND_DIR}/node_modules"
        log_info "Removed: ${FRONTEND_DIR}/node_modules"
    fi

    if [ -f "${FRONTEND_DIR}/bun.lock" ]; then
        rm -f "${FRONTEND_DIR}/bun.lock"
        log_info "Removed: ${FRONTEND_DIR}/bun.lock"
    fi

    if [ -d "${CACHE_DIR}" ]; then
        rm -rf "${CACHE_DIR}"
        log_info "Removed: ${CACHE_DIR}"
    fi

    log_success "Deep clean complete OK"
}

cmd_install() {
    log_step "Installing dependencies..."

    cd "${FRONTEND_DIR}"

    if command -v bun &> /dev/null; then
        log_info "Using Bun..."
        bun install 2>&1 || {
            log_error "Failed to install dependencies"
            cd "${SCRIPT_DIR}"
            exit 1
        }
    else
        log_info "Using npm..."
        npm install 2>&1 || {
            log_error "Failed to install dependencies"
            cd "${SCRIPT_DIR}"
            exit 1
        }
    fi

    cd "${SCRIPT_DIR}"
    log_success "Dependencies installed OK"
}

cmd_watch() {
    log_step "Starting watch mode..."

    # Frontend watch
    cd "${FRONTEND_DIR}"
    if command -v bun &> /dev/null; then
        bun run dev 2>&1 &
        FRONTEND_PID=$!
    else
        npm run dev 2>&1 &
        FRONTEND_PID=$!
    fi
    cd "${SCRIPT_DIR}"

    # Backend watch
    v -watch ./src 2>&1 &
    BACKEND_PID=$!

    log_success "Watch mode started (PID: Frontend=${FRONTEND_PID}, Backend=${BACKEND_PID})"
    log_info "Press Ctrl+C to stop"

    # Wait for both processes
    wait $FRONTEND_PID $BACKEND_PID
}

cmd_stats() {
    log_step "Build Statistics"
    echo ""

    if [ -f "${REPORT_FILE}" ]; then
        cat "${REPORT_FILE}"
    else
        log_info "No build report found. Run a build first."
    fi

    echo ""

    if [ -d "${BUILD_OUTPUT_DIR}" ]; then
        log_info "Frontend output:"
        ls -lh "${BUILD_OUTPUT_DIR}"
    fi

    if [ -f "${BINARY_PATH}" ]; then
        log_info "Backend binary: ${BINARY_PATH} ($(du -h ${BINARY_PATH} | cut -f1))"
    fi

    if [ -d "${BUILD_DIR}" ]; then
        log_info "Build directory: ${BUILD_DIR}"
        ls -lh "${BUILD_DIR}"
    fi

    if [ -d "${CACHE_DIR}" ]; then
        log_info "Cache directory: ${CACHE_DIR}"
        ls -lh "${CACHE_DIR}"
    fi
}

cmd_ci() {
    log_step "Running CI pipeline..."

    ENABLE_TESTS=true
    ENABLE_LINT=true
    ENABLE_CACHE=true

    cmd_build

    log_success "CI pipeline complete OK"
}

cmd_help() {
    echo -e "${BOLD}Usage:${NC} ./run.sh [command] [options]"
    echo ""
    echo -e "${BOLD}Commands:${NC}"
    echo "  dev          Build and run (default)"
    echo "  build        Build frontend + backend only"
    echo "  run          Run existing binary (no rebuild)"
    echo "  test         Run tests only"
    echo "  lint         Run linters only"
    echo "  clean        Remove build artifacts"
    echo "  clean-all    Deep clean (including node_modules)"
    echo "  install      Install frontend dependencies"
    echo "  watch        Watch mode (hot reload)"
    echo "  stats        Show build statistics"
    echo "  ci           Run CI pipeline (build + test + lint)"
    echo "  help         Show this help message"
    echo ""
    echo -e "${BOLD}Environment Variables:${NC}"
    echo "  ENV            Environment (development/production)"
    echo "  PROFILE        Build profile (fast/standard/release)"
    echo "  ENABLE_CACHE   Enable build caching (true/false)"
    echo "  ENABLE_TESTS   Run tests during build (true/false)"
    echo "  ENABLE_LINT    Run linters during build (true/false)"
    echo "  ENABLE_PARALLEL Enable parallel builds (true/false)"
    echo ""
    echo -e "${BOLD}Examples:${NC}"
    echo "  ./run.sh                    # Build and run (default)"
    echo "  ./run.sh dev                # Build and run"
    echo "  ./run.sh build              # Build only"
    echo "  ./run.sh run                # Run existing binary"
    echo "  ./run.sh test               # Run tests"
    echo "  ./run.sh ci                 # Full CI pipeline"
    echo "  ENV=production ./run.sh build  # Production build"
    echo "  ENABLE_TESTS=true ./run.sh build # Build with tests"
    echo ""
}

# ============================================================================
# Main
# ============================================================================
main() {
    local cmd="${1:-dev}"

    case "$cmd" in
        dev)
            cmd_dev
            ;;
        build)
            cmd_build
            ;;
        run)
            cmd_run
            ;;
        test)
            cmd_test
            ;;
        lint)
            cmd_lint
            ;;
        clean)
            cmd_clean
            ;;
        clean-all)
            cmd_clean_all
            ;;
        install)
            cmd_install
            ;;
        watch)
            cmd_watch
            ;;
        stats)
            cmd_stats
            ;;
        ci)
            cmd_ci
            ;;
        help|--help|-h)
            cmd_help
            ;;
        *)
            log_error "Unknown command: $cmd"
            cmd_help
            exit 1
            ;;
    esac
}

main "$@"
