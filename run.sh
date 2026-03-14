#!/usr/bin/env bash
# Desktop App - Enhanced build & run script with full terminal logging

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="${SCRIPT_DIR}/frontend"
# Angular 19+ with application builder outputs to dist/browser/browser/
BUILD_OUTPUT_DIR="${FRONTEND_DIR}/dist/browser/browser"
APP_NAME="Desktop App"
BINARY_NAME="desktopapp"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

log_v() {
    echo -e "${BOLD}[VLANG]${NC} $1"
}

log_angular() {
    echo -e "${BOLD}[ANGULAR]${NC} $1"
}

# Print banner
print_banner() {
    echo -e "${BOLD}${CYAN}"
    echo "========================================"
    echo "  ${APP_NAME} - Build & Run"
    echo "========================================"
    echo -e "${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Check V compiler
    if command -v v &> /dev/null; then
        V_VERSION=$(v version 2>&1 | head -n 1)
        log_info "V compiler: ${V_VERSION}"
    else
        log_error "V compiler not found. Please install V first."
        exit 1
    fi
    
    # Check Bun/npm
    if command -v bun &> /dev/null; then
        BUN_VERSION=$(bun --version)
        log_info "Bun: v${BUN_VERSION}"
    elif command -v npm &> /dev/null;
    then
        NPM_VERSION=$(npm --version)
        log_info "npm: v${NPM_VERSION}"
    else
        log_warn "Neither Bun nor npm found. Frontend build may fail."
    fi
    
    # Check GCC
    if command -v gcc &> /dev/null; then
        GCC_VERSION=$(gcc --version | head -n 1)
        log_info "GCC: ${GCC_VERSION}"
    else
        log_warn "GCC not found. Build may fail."
    fi
    
    log_success "Prerequisites check complete"
    echo ""
}

# Build frontend
build_frontend() {
    log_step "Building frontend..."
    
    if [ ! -d "${FRONTEND_DIR}" ]; then
        log_error "Frontend directory not found: ${FRONTEND_DIR}"
        return 1
    fi
    
    cd "${FRONTEND_DIR}"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        log_warn "node_modules not found. Installing dependencies..."
        if command -v bun &> /dev/null; then
            bun install 2>&1
        else
            npm install 2>&1
        fi
    fi
    
    log_angular "Starting Angular build (AOT)..."
    echo -e "${YELLOW}----------------------------------------${NC}"
    
    # Use Angular CLI for proper AOT compilation
    if command -v bun &> /dev/null; then
        bun run build 2>&1
    else
        npm run build 2>&1
    fi
    
    BUILD_STATUS=$?
    
    echo -e "${YELLOW}----------------------------------------${NC}"
    
    if [ ${BUILD_STATUS} -ne 0 ]; then
        log_error "Frontend build failed!"
        cd "${SCRIPT_DIR}"
        return 1
    fi
    
    # Verify build output
    if [ -d "${BUILD_OUTPUT_DIR}" ]; then
        FILE_COUNT=$(find "${BUILD_OUTPUT_DIR}" -type f | wc -l)
        TOTAL_SIZE=$(du -sh "${BUILD_OUTPUT_DIR}" 2>/dev/null | cut -f1)
        log_success "Frontend built: ${FILE_COUNT} files (${TOTAL_SIZE})"
        log_info "Output directory: ${BUILD_OUTPUT_DIR}"
        
        # List build artifacts
        log_step "Build artifacts:"
        ls -lh "${BUILD_OUTPUT_DIR}" 2>&1 | head -20

        # Copy WinBox if not already present
        WINBOX_DEST="${BUILD_OUTPUT_DIR}/static/js/winbox.min.js"
        if [ ! -f "${WINBOX_DEST}" ]; then
            log_step "Copying WinBox library..."
            WINBOX_SRC="${FRONTEND_DIR}/node_modules/winbox/dist/js/winbox.min.js"
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
    else
        log_error "Build output directory not found: ${BUILD_OUTPUT_DIR}"
        cd "${SCRIPT_DIR}"
        return 1
    fi
    
    cd "${SCRIPT_DIR}"
    echo ""
    return 0
}

# Build V application
build_v_app() {
    log_step "Building V application..."

    log_v "Compiling with GCC..."
    echo -e "${YELLOW}----------------------------------------${NC}"

    # Build with verbose output from src/ directory
    v -cc gcc -o ${BINARY_NAME} ./src 2>&1

    BUILD_STATUS=$?

    echo -e "${YELLOW}----------------------------------------${NC}"

    if [ ${BUILD_STATUS} -ne 0 ]; then
        log_error "V build failed!"
        return 1
    fi

    if [ -f "${BINARY_NAME}" ]; then
        BINARY_SIZE=$(du -h ${BINARY_NAME} | cut -f1)
        log_success "V app built: ${BINARY_NAME} (${BINARY_SIZE})"
    else
        log_error "Binary not found after build!"
        return 1
    fi

    echo ""
    return 0
}

# Run in development mode
run_dev() {
    log_step "Starting development mode..."
    
    # Build frontend first
    build_frontend || {
        log_error "Failed to build frontend. Exiting."
        exit 1
    }
    
    # Build V app
    build_v_app || {
        log_error "Failed to build V app. Exiting."
        exit 1
    }
    
    log_success "Build complete! Starting application..."
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}  Running ${APP_NAME}${NC}"
    echo -e "${CYAN}  Press Ctrl+C to exit${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
    
    # Run with full output
    log_v "Launching application..."
    ./${BINARY_NAME} 2>&1
}

# Build only (no run)
do_build() {
    log_step "Starting full build..."
    
    # Build frontend first
    build_frontend || {
        log_error "Failed to build frontend. Exiting."
        exit 1
    }
    
    # Build V app
    build_v_app || {
        log_error "Failed to build V app. Exiting."
        exit 1
    }
    
    log_success "Full build complete!"
}

# Clean build artifacts
do_clean() {
    log_step "Cleaning build artifacts..."
    
    # Clean V binary
    if [ -f "${BINARY_NAME}" ]; then
        rm -f ${BINARY_NAME}
        log_info "Removed: ${BINARY_NAME}"
    fi
    
    # Clean frontend build
    if [ -d "${BUILD_OUTPUT_DIR}" ]; then
        rm -rf "${BUILD_OUTPUT_DIR}"
        log_info "Removed: ${BUILD_OUTPUT_DIR}"
    fi
    
    # Clean Angular dist
    if [ -d "${FRONTEND_DIR}/dist-angular" ]; then
        rm -rf "${FRONTEND_DIR}/dist-angular"
        log_info "Removed: ${FRONTEND_DIR}/dist-angular"
    fi
    
    log_success "Clean complete"
}

# Deep clean (including node_modules)
do_clean_all() {
    log_step "Deep cleaning (including node_modules)..."
    
    do_clean
    
    # Clean node_modules
    if [ -d "${FRONTEND_DIR}/node_modules" ]; then
        rm -rf "${FRONTEND_DIR}/node_modules"
        log_info "Removed: ${FRONTEND_DIR}/node_modules"
    fi
    
    # Clean Bun lock
    if [ -f "${FRONTEND_DIR}/bun.lock" ]; then
        rm -f "${FRONTEND_DIR}/bun.lock"
        log_info "Removed: ${FRONTEND_DIR}/bun.lock"
    fi
    
    log_success "Deep clean complete"
}

# Install frontend dependencies
install_deps() {
    log_step "Installing frontend dependencies..."
    
    cd "${FRONTEND_DIR}"
    
    if command -v bun &> /dev/null; then
        log_info "Using Bun to install dependencies..."
        bun install 2>&1
    else
        log_info "Using npm to install dependencies..."
        npm install 2>&1
    fi
    
    INSTALL_STATUS=$?
    
    cd "${SCRIPT_DIR}"
    
    if [ ${INSTALL_STATUS} -ne 0 ]; then
        log_error "Failed to install dependencies!"
        return 1
    fi
    
    log_success "Dependencies installed"
    echo ""
    return 0
}

# Watch mode for frontend
watch_frontend() {
    log_step "Starting frontend watch mode..."
    
    cd "${FRONTEND_DIR}"
    
    if command -v bun &> /dev/null; then
        bun run dev 2>&1
    else
        npm run dev 2>&1
    fi
}

# Print usage
print_usage() {
    echo -e "${BOLD}Usage:${NC} ./run.sh [command]"
    echo ""
    echo -e "${BOLD}Commands:${NC}"
    echo "  dev       Build frontend + V app and run (default)"
    echo "  build     Build frontend + V app (no run)"
    echo "  run       Run existing binary (no build)"
    echo "  clean     Remove build artifacts"
    echo "  clean-all Deep clean (including node_modules)"
    echo "  install   Install frontend dependencies"
    echo "  watch     Start frontend dev server (watch mode)"
    echo "  help      Show this help message"
    echo ""
    echo -e "${BOLD}Examples:${NC}"
    echo "  ./run.sh          # Run dev mode (build + run)"
    echo "  ./run.sh dev      # Same as above"
    echo "  ./run.sh build    # Build only"
    echo "  ./run.sh run      # Run without building"
    echo "  ./run.sh clean    # Clean build artifacts"
    echo ""
}

# Main entry point
main() {
    print_banner
    
    cmd="${1:-dev}"
    
    case "$cmd" in
        dev)
            check_prerequisites
            run_dev
            ;;
        build)
            check_prerequisites
            do_build
            ;;
        run)
            if [ ! -f "${BINARY_NAME}" ]; then
                log_error "Binary not found. Run './run.sh build' first."
                exit 1
            fi
            log_info "Running existing binary..."
            ./${BINARY_NAME} 2>&1
            ;;
        clean)
            do_clean
            ;;
        clean-all)
            do_clean_all
            ;;
        install)
            install_deps
            ;;
        watch)
            watch_frontend
            ;;
        help|--help|-h)
            print_usage
            ;;
        *)
            log_error "Unknown command: $cmd"
            print_usage
            exit 1
            ;;
    esac
}

# Run main
main "$@"
