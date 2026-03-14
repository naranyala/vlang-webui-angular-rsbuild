# Medium and Low Severity Findings

**Severity**: 🟡 Medium (5 findings), 🟢 Low (5 findings)  
**Impact**: These issues affect code quality, maintainability, and developer experience.

---

## Medium Severity Findings

### MED-001: Memory Leak Potential in AppComponent

| Attribute | Value |
|-----------|-------|
| **Location** | `frontend/src/views/app.component.ts` |
| **Severity** | 🟡 Medium |
| **Effort to Fix** | Low (1-2 hours) |
| **Category** | Performance |

#### Description

Window tracking arrays in `AppComponent` can grow unbounded because cleanup may be skipped on errors.

#### Evidence

```typescript
export class AppComponent implements OnInit, OnDestroy {
  private existingBoxes: WinBoxInstance[] = [];
  private windowIdByCardId = new Map<number, string>();

  openCard(card: Card): void {
    // ...
    this.existingBoxes.push(box);  // Added
    this.windowIdByCardId.set(card.id, windowId);
  }

  closeAllBoxes(): void {
    const boxesToClose = [...this.existingBoxes];

    boxesToClose.forEach((box, index) => {
      try {
        box.close(true);  // Force close
      } catch (error) {
        this.logger.error('Error closing window', { windowId, error });
        // ❌ Box NOT removed from existingBoxes on error!
        // ❌ windowIdByCardId NOT cleaned up on error!
      }
    });
  }

  ngOnDestroy(): void {
    // Cleanup happens here but may not catch all cases
  }
}
```

#### Impact

- Long-running sessions accumulate memory
- Closed windows remain in tracking arrays
- Performance degradation over extended use

#### Recommendation

```typescript
closeAllBoxes(): void {
  const boxesToClose = [...this.existingBoxes];

  boxesToClose.forEach((box) => {
    if (!box) return;

    const windowId = box.__windowId;
    const cardId = box.__cardId;

    try {
      if (box.min) {
        box.restore();
      }
      box.close(true);
    } catch (error) {
      this.logger.error('Error closing window', { windowId, error });
    } finally {
      // ALWAYS cleanup tracking, even on error
      const boxIndex = this.existingBoxes.indexOf(box);
      if (boxIndex > -1) {
        this.existingBoxes.splice(boxIndex, 1);
      }
      if (cardId) {
        this.windowIdByCardId.delete(cardId);
      }
      if (windowId) {
        this.eventBus.publish('window:closed', { id: windowId });
        this.windowState.sendStateChange(windowId, 'closed');
      }
    }
  });

  // Ensure complete cleanup
  this.windowEntries.set([]);
  this.windowIdByCardId.clear();
}
```

#### Files to Modify

- `frontend/src/views/app.component.ts` - Add finally blocks to cleanup

---

### MED-002: No Input Validation

| Attribute | Value |
|-----------|-------|
| **Location** | `src/file_service.v`, `src/main.v` |
| **Severity** | 🟡 Medium |
| **Effort to Fix** | Medium (4-6 hours) |
| **Category** | Security |

#### Description

File operations don't validate paths, allowing potential path traversal attacks.

#### Evidence

```v
// file_service.v
pub fn (mut s FileService) read_file(path string) string {
    return os.read_file(path) or { '' }
    // ❌ No validation for:
    // - Path traversal (../)
    // - Absolute vs relative paths
    // - Allowed directories
    // - Null bytes or special characters
}

pub fn (mut s FileService) browse_directory(path string) string {
    // ❌ No validation that path is within allowed directories
}

// main.v
fn browse_directory_json(path string) string {
    if path.len == 0 {
        // Only checks for empty path
        return '{"error": "Path is required"}'
    }
    if !os.is_dir(path) {
        // Only checks if directory exists
        return '{"error": "Directory not found"}'
    }
    // ❌ No path sanitization
}
```

#### Impact

- **Path traversal vulnerability** - Could read `/etc/passwd`, `~/.ssh/id_rsa`
- **Information disclosure** - Access to files outside intended directories
- **Security risk** - Especially in multi-user or server environments

#### Recommendation

```v
// Add to file_service.v
const allowed_base_dirs = ['/home', '/opt/app/data', '/tmp']

pub fn (mut s FileService) is_path_safe(path string) bool {
    // Reject paths with traversal
    if path.contains('../') || path.contains('..\\') {
        return false
    }

    // Reject absolute paths to sensitive locations
    if path.starts_with('/etc/') || 
       path.starts_with('/root/') || 
       path.starts_with('/proc/') ||
       path.starts_with('/sys/') {
        return false
    }

    // Reject paths with null bytes
    if path.contains('\x00') {
        return false
    }

    // Ensure path is within allowed directories
    mut is_allowed := false
    for base_dir in allowed_base_dirs {
        if path.starts_with(base_dir) {
            is_allowed = true
            break
        }
    }

    // If not absolute path, it's relative (allow with caution)
    if !path.starts_with('/') {
        is_allowed = true
    }

    return is_allowed
}

pub fn (mut s FileService) read_file(path string) errors.Result<string> {
    if !s.is_path_safe(path) {
        return errors.err<string>(
            create_error(.file_access_denied, 'Path not allowed: ${path}', 'read_file')
        )
    }

    content := os.read_file(path) or {
        return errors.err<string>(
            create_error(.file_read_failed, 'Failed to read: ${path}', 'read_file')
        )
    }

    return errors.ok(content)
}
```

#### Files to Modify

- `src/file_service.v` - Add path validation
- `src/main.v` - Add path validation to legacy functions
- `src/app.v` - Use validated file service methods

---

### MED-003: Inconsistent Logging

| Attribute | Value |
|-----------|-------|
| **Location** | `src/main.v`, `src/logging_service.v`, `frontend/src/viewmodels/logger.ts` |
| **Severity** | 🟡 Medium |
| **Effort to Fix** | Medium (4-6 hours) |
| **Category** | Code Quality |

#### Description

Three different logging systems coexist with different formats and capabilities.

#### Evidence

**System 1: Legacy functions** (`src/main.v`):
```v
fn log_info(msg string) {
    timestamp := time.now().custom_format('YYYY-MM-DD HH:mm:ss')
    println('[APP] [${timestamp}] [INFO] ${msg}')
}

fn log_error(msg string) {
    timestamp := time.now().custom_format('YYYY-MM-DD HH:mm:ss')
    eprintln('[APP] [${timestamp}] [ERROR] ${msg}')
}

fn log_debug(msg string) {
    if debug_mode {
        // ...
    }
}
```

**System 2: LoggingService** (`src/logging_service.v`):
```v
pub struct LoggingService {
mut:
    entries        []LogEntry  // In-memory log storage
}

pub fn (mut s LoggingService) info(msg string) {
    timestamp := time.now().custom_format('YYYY-MM-DD HH:mm:ss')
    println('[APP] [${timestamp}] [INFO] ${msg}')
    s.entries << LogEntry{level: 'info', message: msg, timestamp: timestamp}
}

pub fn (mut s LoggingService) debug_source(msg string, source string) {
    // Different format with source
}
```

**System 3: Frontend Logger** (`frontend/src/viewmodels/logger.ts`):
```typescript
export function getLogger(scope?: string): Logger {
    return rootLogger.child(scope)
}

// Usage
private readonly logger = getLogger('webui')
this.logger.info('Connected', { port: 8080 })
```

#### Impact

- Inconsistent log formats make parsing difficult
- Cannot aggregate backend and frontend logs easily
- Duplicate code and maintenance burden
- Different log levels and capabilities

#### Recommendation

**Consolidate to LoggingService**:

```v
// Remove from main.v
// fn log_info() - REMOVE
// fn log_error() - REMOVE
// fn log_debug() - REMOVE
// fn log_success() - REMOVE
// fn log_warning() - REMOVE

// Update all calls in main.v
log_info('Message')      // OLD
app.logging.info('Message')  // NEW

log_error('Error')       // OLD
app.logging.error('Error')   // NEW

log_debug('Debug')       // OLD
app.logging.debug('Debug')   // NEW
```

**Standardize log format**:
```v
// Single format across all logs
pub fn (mut s LoggingService) format_entry(level string, msg string, source string) string {
    timestamp := time.now().custom_format('YYYY-MM-DD HH:mm:ss')
    return '[${timestamp}] [${level}] [${source}] ${msg}'
}
```

#### Files to Modify

- `src/main.v` - Remove legacy functions, update calls
- `src/logging_service.v` - Make canonical logging system
- `frontend/src/viewmodels/logger.ts` - Align format with backend

---

### MED-004: Empty Test Coverage

| Attribute | Value |
|-----------|-------|
| **Location** | Frontend spec files, missing V tests |
| **Severity** | 🟡 Medium |
| **Effort to Fix** | High (24-40 hours) |
| **Category** | Testing |

#### Evidence

**Frontend test files exist**:
```
frontend/src/core/error-recovery.service.spec.ts
frontend/src/core/global-error.service.spec.ts
frontend/src/viewmodels/devtools.service.spec.ts
frontend/src/views/devtools/devtools.component.spec.ts
frontend/src/views/home/home.component.spec.ts
```

**But no V backend tests**:
```bash
$ find . -name "*.test.v"
# No results

$ find . -name "*_test.v"
src/errors_test.v  # Only one test file
```

**errors_test.v content**:
```v
// Likely minimal or integration tests only
module main

// ... test functions
```

#### Impact

- No automated verification of functionality
- Regressions will go undetected
- Refactoring is risky without test safety net
- Cannot verify bug fixes

#### Recommendation

**Create comprehensive test suite**:

```v
// src/logging_service_test.v
module main

import testing

fn test_logging_service_info(t &testing.T) {
    mut logging := LoggingService{}
    logging.initialize()
    
    logging.info('Test message')
    
    assert logging.entries.len == 1
    assert logging.entries[0].level == 'info'
    assert logging.entries[0].message == 'Test message'
}

fn test_logging_service_error(t &testing.T) {
    mut logging := LoggingService{}
    logging.initialize()
    
    logging.error('Error message')
    
    assert logging.entries.len == 1
    assert logging.entries[0].level == 'error'
}

// src/file_service_test.v
fn test_file_service_read_valid(t &testing.T) {
    mut file := FileService{}
    file.initialize()
    
    // Create temp file
    os.write_file('/tmp/test.txt', 'content') or {
        t.fail('Failed to create test file')
    }
    
    result := file.read_file('/tmp/test.txt')
    assert result == 'content'
}

fn test_file_service_read_invalid(t &testing.T) {
    mut file := FileService{}
    file.initialize()
    
    result := file.read_file('/nonexistent')
    assert result == ''
}

// src/system_info_service_test.v
fn test_system_info_memory(t &testing.T) {
    mut sys := SystemInfoService{}
    sys.initialize()
    
    json := sys.get_memory_stats_json()
    assert json.contains('status')
    // Should validate actual system data, not fake data
}
```

**Frontend tests**:
```typescript
// frontend/src/services/cache.service.spec.ts
import { describe, it, expect } from 'bun:test';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  it('should store and retrieve values', () => {
    const cache = CacheService.create();
    cache.set('key', 'value');
    expect(cache.get('key')).toBe('value');
  });

  it('should expire values after TTL', async () => {
    const cache = CacheService.create({ defaultTtl: 100 });
    cache.set('key', 'value');
    await sleep(150);
    expect(cache.get('key')).toBeUndefined();
  });
});
```

#### Files to Create

- `src/logging_service_test.v`
- `src/file_service_test.v`
- `src/system_info_service_test.v`
- `src/network_service_test.v`
- `src/config_service_test.v`
- `frontend/src/services/*.spec.ts`

---

### MED-005: Unused Angular Module

| Attribute | Value |
|-----------|-------|
| **Location** | `frontend/src/views/app.module.ts`, `frontend/src/main.ts` |
| **Severity** | 🟡 Medium |
| **Effort to Fix** | Low (30 minutes) |
| **Category** | Code Quality |

#### Description

`main.ts` uses standalone Angular bootstrap but `app.module.ts` still exists with unused imports.

#### Evidence

**main.ts** (standalone bootstrap):
```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './views/app.component';
import { provideZoneChangeDetection } from '@angular/core';
import { ErrorHandler } from '@angular/core';
import { GlobalErrorHandler } from './core/global-error.handler';

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
})
```

**app.module.ts** (unused):
```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  imports: [BrowserModule, AppRoutingModule, BrowserAnimationsModule],
  providers: [],
})
export class AppModule {}  // ❌ Never imported or used!
```

**app-routing.module.ts** (likely unused):
```typescript
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
```

#### Impact

- Dead code increases bundle size slightly
- Confusion about which approach to use (standalone vs NgModule)
- Maintenance burden for unused files

#### Recommendation

**Remove unused files**:
```bash
rm frontend/src/views/app.module.ts
rm frontend/src/views/app-routing.module.ts
```

**Verify no imports**:
```bash
grep -r "AppModule" frontend/src/
grep -r "AppRoutingModule" frontend/src/
```

#### Files to Remove

- `frontend/src/views/app.module.ts`
- `frontend/src/views/app-routing.module.ts` (if unused)

---

## Low Severity Findings

### LOW-001: Naming Inconsistencies

| Attribute | Value |
|-----------|-------|
| **Location** | Multiple files |
| **Severity** | 🟢 Low |
| **Effort to Fix** | Low (2-4 hours) |
| **Category** | Code Quality |

#### Description

Inconsistent naming conventions between backend (snake_case) and frontend (camelCase).

#### Evidence

| Backend Function | Frontend Call |
|-----------------|---------------|
| `get_system_info_json` | `getSystemInfo` |
| `get_memory_stats_json` | `getMemoryStats` |
| `browse_directory` | `browseDirectory` |
| `get_cpu_usage_json` | `getCpuUsage` |
| `get_disk_usage_json` | `getDiskUsage` |

#### Impact

- Minor developer friction
- Requires mental translation
- Potential for typos

#### Recommendation

Standardize on camelCase for WebUI bindings (matches JavaScript conventions):
```v
// Backend bindings
w.bind('getSystemInfo', handle_get_system_info)
w.bind('getMemoryStats', handle_get_memory_stats)
w.bind('browseDirectory', handle_browse_directory)
```

---

### LOW-002: Magic Numbers

| Attribute | Value |
|-----------|-------|
| **Location** | `src/main.v` |
| **Severity** | 🟢 Low |
| **Effort to Fix** | Low (1 hour) |
| **Category** | Code Quality |

#### Evidence

```v
// Why 100000?
if safe_content.len > 100000 {
    safe_content = safe_content[..100000] + '... (truncated)'
}

// Why 3?
const max_retries = 3

// Why 1000?
const retry_delay_ms = 1000

// Why 100 processes?
if count >= 100 {
    break
}

// Why 2 expected files?
if found_files < 2 {
    log_warning('Root folder may be incomplete')
}
```

#### Recommendation

```v
// Documented constants
const max_file_read_size = 100000  // 100KB limit for safety
const max_retry_attempts = 3
const retry_delay_base_ms = 1000
const max_processes_to_list = 100
const min_expected_root_files = 2
```

---

### LOW-003: No Cross-Platform Support

| Attribute | Value |
|-----------|-------|
| **Location** | `src/main.v`, `src/system_info_service.v` |
| **Severity** | 🟢 Low |
| **Effort to Fix** | Medium (8-12 hours) |
| **Category** | Portability |

#### Evidence

```v
// Linux-specific paths throughout
meminfo := os.read_file('/proc/meminfo')
cpuinfo := os.read_file('/proc/cpuinfo')
netdev := os.read_file('/proc/net/dev')
loadavg := os.read_file('/proc/loadavg')
uptime := os.read_file('/proc/uptime')
hwmon := os.ls('/sys/class/hwmon')
```

#### Impact

- Will fail completely on Windows and macOS
- Limits deployment options

#### Recommendation

Add platform detection and alternative implementations using V's `os` module or platform-specific code.

---

### LOW-004: Documentation Over-Promising

| Attribute | Value |
|-----------|-------|
| **Location** | `README.md`, architecture diagrams |
| **Severity** | 🟢 Low |
| **Effort to Fix** | Medium (4-8 hours) |
| **Category** | Documentation |

#### Description

README shows complex architecture diagrams that don't match implementation reality.

#### Recommendation

Update documentation to reflect actual implementation. Remove or mark as "planned architecture".

---

### LOW-005: Unused Config Options

| Attribute | Value |
|-----------|-------|
| **Location** | `src/config_service.v` |
| **Severity** | 🟢 Low |
| **Effort to Fix** | Medium (4-6 hours) |
| **Category** | Code Quality |

#### Evidence

```v
pub struct ConfigService {
    values      map[string]string  // Always empty, never loaded from file
}

pub fn (mut s ConfigService) get_app_config() AppConfig {
    return AppConfig{
        app_name: s.get_string('app.name')  // Always returns empty
        // ...
    }
}
```

#### Recommendation

Implement config file loading or remove unused service.

---

## Summary

### Medium Severity Summary

| Finding | Impact | Effort |
|---------|--------|--------|
| MED-001: Memory leaks | Performance degradation | 1-2 hours |
| MED-002: No validation | Security vulnerability | 4-6 hours |
| MED-003: Logging inconsistency | Developer friction | 4-6 hours |
| MED-004: No tests | Regression risk | 24-40 hours |
| MED-005: Unused module | Dead code | 30 minutes |

### Low Severity Summary

| Finding | Impact | Effort |
|---------|--------|--------|
| LOW-001: Naming | Minor friction | 2-4 hours |
| LOW-002: Magic numbers | Maintainability | 1 hour |
| LOW-003: Platform | Limited deployment | 8-12 hours |
| LOW-004: Docs | Confusion | 4-8 hours |
| LOW-005: Config | Dead code | 4-6 hours |

---

*End of Audit Report*
