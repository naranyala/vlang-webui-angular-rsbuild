# Angular 19 Build Output Path Configuration

## Issue Description

The WebUI application failed to load the Angular final build with error:

```
Warning: Resource Not Available
The requested resource is not available.
```

## Root Cause

**Angular 19+** with the **application builder** (`@angular-devkit/build-angular:application`) changed the output directory structure.

### Old Structure (Angular 18 and earlier)

```
frontend/dist/browser/
├── index.html
├── main-XXXXX.js
├── polyfills-XXXXX.js
└── styles-XXXXX.css
```

### New Structure (Angular 19+)

```
frontend/dist/browser/
├── browser/              <-- New nested directory
│   ├── index.html
│   ├── main-XXXXX.js
│   ├── polyfills-XXXXX.js
│   └── styles-XXXXX.css
├── static/
└── 3rdpartylicenses.txt
```

## Solution

Updated the root folder path in two locations:

### 1. src/main.v

**Before:**
```v
root_folder := 'frontend/dist/browser'
```

**After:**
```v
root_folder := 'frontend/dist/browser/browser'
```

### 2. run.sh

**Before:**
```bash
BUILD_OUTPUT_DIR="${FRONTEND_DIR}/dist/browser"
```

**After:**
```bash
BUILD_OUTPUT_DIR="${FRONTEND_DIR}/dist/browser/browser"
```

## Verification

After the fix, the application correctly identifies all build artifacts:

```
[APP] [2026-03-13 09:29:15] [DEBUG] Files in root folder:
[APP] [2026-03-13 09:29:15] [DEBUG]   - favicon.ico
[APP] [2026-03-13 09:29:15] [DEBUG]   - index.html
[APP] [2026-03-13 09:29:15] [DEBUG]   - main-WWS3PI6L.js
[APP] [2026-03-13 09:29:15] [DEBUG]   - polyfills-B6TNHZQ6.js
[APP] [2026-03-13 09:29:15] [DEBUG]   - scripts-WSPI2WCD.js
[APP] [2026-03-13 09:29:15] [DEBUG]   - styles-OHY537IN.css
```

## Alternative Solutions

### Option 1: Change Angular Output Path (Not Recommended)

Modify `angular.json` to output to the old location:

```json
{
  "projects": {
    "angular-rspack-demo": {
      "architect": {
        "build": {
          "options": {
            "outputPath": {
              "base": "dist/browser",
              "browser": ""
            }
          }
        }
      }
    }
  }
}
```

**Why not recommended:** This goes against Angular 19+ conventions and may cause other issues.

### Option 2: Use Rsbuild (If Available)

If using Rsbuild instead of Angular CLI, the output structure may differ. Check your Rsbuild configuration.

## Files Modified

1. `src/main.v` - Updated `root_folder` path
2. `run.sh` - Updated `BUILD_OUTPUT_DIR` variable

## Testing Procedure

1. Rebuild the frontend:
   ```bash
   ./run.sh build
   ```

2. Run the application:
   ```bash
   ./run.sh dev
   ```

3. Verify in logs:
   ```
   [APP] [INFO] Setting root folder: frontend/dist/browser/browser
   [APP] [DEBUG] Files in root folder:
   [APP] [DEBUG]   - index.html
   [APP] [DEBUG]   - main-*.js
   ...
   [SUCCESS] Application running
   ```

## References

- Angular 19 Application Builder: https://angular.dev/tools/cli/build-system-migration
- Output Path Changes: https://angular.dev/update-guide

---

**Date:** March 13, 2026
**Status:** Fixed
