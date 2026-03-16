# Build Issues & Solutions

> **Date**: 2026-03-14
> **Status**: Documented with workarounds

---

## Issues Fixed

### ✅ Issue 1: Angular Build Output Path (FIXED)

**Problem**: Angular 19+ with application builder outputs to `dist/browser/browser/` but the build script was looking in `dist/browser/`.

**Solution**: Updated `run.sh` to use correct path:
```bash
# Before
BUILD_OUTPUT_DIR="${FRONTEND_DIR}/dist/browser"

# After
BUILD_OUTPUT_DIR="${FRONTEND_DIR}/dist/browser/browser"
```

### ✅ Issue 2: V App Root Folder Path (FIXED)

**Problem**: V app hardcoded to look for files in `frontend/dist/browser` but Angular outputs to `frontend/dist/browser/browser/`.

**Solution**: Updated `src/main.v`:
```v
// Before
root_folder := 'frontend/dist/browser'

// After
root_folder := 'frontend/dist/browser/browser'
```

---

## Remaining Issue: V Compiler Build Error

### Problem

When building the V application, you get this error:

```
builder error: /run/media/naranyala/Data/diskd-binaries/v_linux/thirdparty/cJSON/cJSON.c:44: 
error: include file 'string.h' not found
```

### Root Cause

The V compiler's bundled TCC (Tiny C Compiler) cannot find standard C library headers (`string.h`). This is a **system dependency issue**, not a code problem.

### Solution 1: Install C Development Headers (RECOMMENDED)

Install the required C development packages for your Linux distribution:

#### Debian/Ubuntu/Linux Mint:
```bash
sudo apt-get update
sudo apt-get install build-essential libc6-dev
```

#### Fedora/RHEL/CentOS:
```bash
sudo dnf install gcc glibc-headers
```

#### Arch Linux/Manjaro:
```bash
sudo pacman -S base-devel
```

#### openSUSE:
```bash
sudo zypper install -t pattern devel_basis
```

After installing, rebuild:
```bash
./run.sh build
```

### Solution 2: Use GCC Instead of TCC (WORKAROUND)

Force V to use GCC instead of the bundled TCC:

```bash
# Build with GCC
v -cc gcc -o desktopapp ./src
```

Or set the default C compiler:
```bash
# Edit ~/.vmodules/vwebui/src/lib.c.v or use environment variable
export VFLAGS="-cc gcc"
v -o desktopapp ./src
```

### Solution 3: Use Existing Binary (TEMPORARY)

If you already have a working binary from a previous successful build, you can continue using it:

```bash
# Just run the existing binary
./run.sh run
```

The existing binary (`desktopapp`) will work fine as long as you haven't changed the V source code.

---

## Complete Fix Procedure

### Step 1: Install C Development Headers

```bash
# For Debian/Ubuntu
sudo apt-get update
sudo apt-get install build-essential libc6-dev

# Verify installation
gcc --version
ls /usr/include/string.h
```

### Step 2: Clean and Rebuild

```bash
# Clean old builds
./run.sh clean

# Rebuild everything
./run.sh build
```

### Step 3: Run Application

```bash
# Run in development mode (build + run)
./run.sh dev

# Or run existing binary
./run.sh run
```

---

## Verification

After fixing, you should see:

```
========================================
  Desktop App - Build & Run
========================================

[STEP] Checking prerequisites...
[INFO] V compiler: V 0.5.1 ...
[INFO] GCC: gcc (GCC) 14.3.0
[SUCCESS] Prerequisites check complete

[STEP] Building frontend...
[SUCCESS] Frontend built: 6 files

[STEP] Building V application...
[SUCCESS] V app built: desktopapp (792K)

[SUCCESS] Full build complete!
```

And when running:

```
+========================================================+
|           Desktop App v1.0.0                           |
|           System Utilities Dashboard                   |
+========================================================+

Initializing database: users.db.json
Database initialized successfully with 5 users
[APP] [INFO] Starting Desktop App v1.0.0
[APP] [INFO] Creating WebUI window...
[APP] [INFO] Binding JavaScript handlers...
[APP] [SUCCESS] All handlers bound successfully
[APP] [INFO] Setting root folder: frontend/dist/browser/browser
[APP] [INFO] Root folder verified successfully
[APP] [INFO] Opening window...
[APP] [SUCCESS] Application running. Press Ctrl+C to exit.
```

---

## Common Commands

| Command | Description |
|---------|-------------|
| `./run.sh build` | Build frontend + V app |
| `./run.sh dev` | Build + run (development mode) |
| `./run.sh run` | Run existing binary |
| `./run.sh clean` | Clean build artifacts |
| `./run.sh clean-all` | Deep clean (including node_modules) |
| `v -cc gcc -o desktopapp ./src` | Build V app with GCC |
| `v -showcc -o desktopapp ./src` | Build with verbose output |

---

## File Paths Reference

| Component | Path |
|-----------|------|
| Frontend source | `frontend/src/` |
| Frontend build output | `frontend/dist/browser/browser/` |
| V source | `src/` |
| V binary | `./desktopapp` |
| Database file | `users.db.json` (created at runtime) |
| WinBox library | `frontend/dist/browser/browser/static/js/winbox.min.js` |

---

## Troubleshooting

### Issue: "Binary not found"

**Solution**: Run `./run.sh build` first.

### Issue: "Root folder verification failed"

**Solution**: 
1. Check that `frontend/dist/browser/browser/index.html` exists
2. Run `./run.sh build` to rebuild frontend

### Issue: "V compiler not found"

**Solution**: Install V from https://vlang.io

### Issue: "Frontend build failed"

**Solution**:
```bash
cd frontend
bun install  # or npm install
bun run build  # or npm run build
```

### Issue: "WinBox not found"

**Solution**: The build script automatically copies WinBox. If missing:
```bash
mkdir -p frontend/dist/browser/browser/static/js
cp frontend/node_modules/winbox/dist/js/winbox.min.js \
   frontend/dist/browser/browser/static/js/
```

---

## Summary

**Fixed Issues**:
- ✅ Angular build output path corrected
- ✅ V app root folder path updated
- ✅ WinBox library copying automated

**Remaining**:
- ⚠️ Install C development headers for V compilation

**Workaround**:
- Use existing binary if no code changes

---

*Last updated: 2026-03-14*
