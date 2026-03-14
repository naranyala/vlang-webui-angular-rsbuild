# Open Audits ⏳

**Status**: Pending Resolution  
**Total Remaining**: 8 issues

---

## Summary

Remaining issues are low-to-medium priority and can be addressed as time permits. None block core functionality.

---

## Remaining Issues

### Critical (1 remaining)

| ID | Issue | Severity | Effort | Status |
|----|-------|----------|--------|--------|
| [CRIT-004](#crit-004-error-handling-not-used) | Error Handling Pattern Not Used | 🔴 | 16-24h | ⏳ Pending |

### Medium (2 remaining)

| ID | Issue | Severity | Effort | Status |
|----|-------|----------|--------|--------|
| [MED-001](#med-001-memory-leaks) | Memory Leaks in AppComponent | 🟡 | 1-2h | ⏳ Pending |
| [MED-004](#med-004-no-tests) | No Test Coverage | 🟡 | 24-40h | ⏳ Pending |

### Low (5 remaining)

| ID | Issue | Severity | Effort | Status |
|----|-------|----------|--------|--------|
| [LOW-001](#low-001-naming) | Naming Inconsistencies | 🟢 | 2-4h | ⏳ Pending |
| [LOW-002](#low-002-magic-numbers) | Magic Numbers | 🟢 | 1h | ⏳ Pending |
| [LOW-003](#low-003-platform) | No Cross-Platform | 🟢 | 8-12h | ⏳ Pending |
| [LOW-004](#low-004-docs) | Documentation Over-Promising | 🟢 | 4-8h | ⏳ Pending |
| [LOW-005](#low-005-config) | Unused Config Options | 🟢 | 4-6h | ⏳ Pending |

---

## Detailed Descriptions

### CRIT-004: Error Handling Pattern Not Used

**Severity**: 🔴 Critical  
**Effort**: 16-24 hours  
**Files**: `src/errors.v`, all service files

**Problem**: 
Documentation describes `Result<T>` pattern, but services return bare strings:
```v
// Documented pattern (not used)
pub fn read_file(path string) errors.Result<string>

// Actual implementation
pub fn read_file(path string) string
```

**Impact**:
- No type-safe error handling
- Cannot compose error operations
- Inconsistent error responses

**Resolution Required**:
1. Update all service methods to return `errors.Result<T>`
2. Update all callers to handle results explicitly
3. Add error context and codes

**Priority**: Medium (core functionality works, this is architectural polish)

---

### MED-001: Memory Leaks in AppComponent

**Severity**: 🟡 Medium  
**Effort**: 1-2 hours  
**Files**: `frontend/src/views/app.component.ts`

**Problem**:
Window tracking arrays may not be cleaned up on errors:
```typescript
closeAllBoxes(): void {
  boxesToClose.forEach((box) => {
    try {
      box.close(true);
    } catch (error) {
      this.logger.error('Error closing window', { windowId, error });
      // ❌ Box NOT removed from array on error!
    }
  });
}
```

**Impact**:
- Memory accumulation over long sessions
- Performance degradation

**Resolution**:
Add `finally` blocks to ensure cleanup:
```typescript
try {
  box.close(true);
} catch (error) {
  this.logger.error('Error closing window', { windowId, error });
} finally {
  // Always cleanup
  const index = this.existingBoxes.indexOf(box);
  if (index > -1) this.existingBoxes.splice(index, 1);
}
```

**Priority**: Low (only affects very long sessions)

---

### MED-004: No Test Coverage

**Severity**: 🟡 Medium  
**Effort**: 24-40 hours  
**Files**: All (need test files)

**Problem**:
No automated tests for backend or frontend:
```bash
$ find . -name "*.test.v"
# No results

$ find . -name "*.spec.ts"
# Only 5 minimal spec files
```

**Impact**:
- Regressions go undetected
- Refactoring is risky
- Cannot verify bug fixes

**Resolution**:
Create test suites:
- Backend: `src/*_test.v`
- Frontend: `frontend/src/**/*spec.ts`

**Priority**: Medium (important for long-term maintainability)

---

### LOW-001: Naming Inconsistencies

**Severity**: 🟢 Low  
**Effort**: 2-4 hours  
**Files**: Multiple

**Problem**:
Backend uses snake_case, frontend uses camelCase:
| Backend | Frontend |
|---------|----------|
| `get_system_info_json` | `getSystemInfo` |

**Impact**: Minor developer friction

**Resolution**: Standardize on one convention

**Priority**: Low (cosmetic)

---

### LOW-002: Magic Numbers

**Severity**: 🟢 Low  
**Effort**: 1 hour  
**Files**: `src/main.v`, others

**Problem**:
Undocumented constants:
```v
if safe_content.len > 100000 {  // Why 100000?
```

**Resolution**:
```v
const max_file_read_size = 100000  // 100KB limit for safety
```

**Priority**: Low (code quality)

---

### LOW-003: No Cross-Platform Support

**Severity**: 🟢 Low  
**Effort**: 8-12 hours  
**Files**: `src/system_info_service.v`

**Problem**:
Linux-only paths:
```v
os.read_file('/proc/meminfo')  // Linux only
os.read_file('/proc/cpuinfo')  // Linux only
```

**Impact**: Won't run on Windows/macOS

**Resolution**: Add platform detection and alternatives

**Priority**: Low (only if cross-platform needed)

---

### LOW-004: Documentation Over-Promising

**Severity**: 🟢 Low  
**Effort**: 4-8 hours  
**Files**: `README.md`, docs

**Problem**:
README shows architecture diagrams that don't match implementation.

**Resolution**: Update docs to reflect actual implementation

**Priority**: Low (documentation hygiene)

---

### LOW-005: Unused Config Options

**Severity**: 🟢 Low  
**Effort**: 4-6 hours  
**Files**: `src/config_service.v`

**Problem**:
Config service values never loaded from files:
```v
pub struct ConfigService {
    values      map[string]string  // Always empty
}
```

**Resolution**: Implement file loading or remove service

**Priority**: Low (not currently used)

---

## Recommended Priority Order

### Next Sprint (Optional)
1. **CRIT-004**: Implement error handling pattern (16-24h)
2. **MED-004**: Add basic test coverage (24-40h)

### Backlog (As Time Permits)
3. **MED-001**: Fix memory leaks (1-2h)
4. **LOW-002**: Document magic numbers (1h)
5. **LOW-001**: Fix naming (2-4h)
6. **LOW-005**: Fix config service (4-6h)
7. **LOW-004**: Update docs (4-8h)
8. **LOW-003**: Cross-platform support (8-12h)

---

## Current State

| Category | Status |
|----------|--------|
| Build | ✅ Working |
| Core Functionality | ✅ Working |
| Security | ✅ Validated |
| Architecture | ✅ Documented |
| Error Handling | ⏳ Needs work |
| Tests | ⏳ Needs work |
| Cross-Platform | ⏳ Linux only |

---

*Last Updated: 2026-03-14*
