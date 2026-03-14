# Remediation Plan

**Project**: Vlang WebUI Angular Application  
**Created**: 2026-03-14  
**Total Estimated Effort**: 120-180 hours

---

## Executive Summary

This remediation plan addresses 18 identified findings across 4 severity levels. The recommended approach is to work through findings in priority order, focusing on critical architectural issues before adding new features.

### Total Effort by Severity

| Severity | Count | Total Effort |
|----------|-------|-------------|
| 🔴 Critical | 4 | 44-72 hours |
| 🟠 High | 4 | 36-64 hours |
| 🟡 Medium | 5 | 33-53 hours |
| 🟢 Low | 5 | 19-33 hours |
| **Total** | **18** | **120-180 hours** |

---

## Phase 1: Critical Fixes (Week 1-2)

**Goal**: Stabilize the codebase and establish honest implementation

### 1.1 Fix Build Path (HIGH-002)
**Priority**: Immediate (Day 1)  
**Effort**: 15 minutes

```bash
# Edit run.sh line 20
# FROM:
BUILD_OUTPUT_DIR="${FRONTEND_DIR}/dist/browser/browser/"

# TO:
BUILD_OUTPUT_DIR="${FRONTEND_DIR}/dist/browser"
```

**Verification**:
```bash
./run.sh build
# Should complete without "Build output directory not found" error
```

---

### 1.2 Consolidate Duplicate Code (CRIT-003)
**Priority**: High (Day 1-2)  
**Effort**: 4-8 hours

**Steps**:
1. Review `app.v` to ensure all handlers are implemented
2. Remove duplicate functions from `main.v`:
   - All `get_*_json()` functions
   - All `handle_*()` functions that duplicate `app.v`
3. Update `main()` to use `app` methods exclusively

**Files to modify**:
- `src/main.v` - Remove ~600 lines
- `src/app.v` - Verify completeness

**Verification**:
```bash
v -cc gcc -o desktopapp ./src
# Should build successfully
./desktopapp
# Should run with all features working
```

---

### 1.3 Decide DI Approach (CRIT-001)
**Priority**: High (Day 2-3)  
**Effort**: 2-4 hours (documentation) or 8-16 hours (implementation)

**Option A: Update Documentation (Recommended for now)**
1. Edit `docs/10-backend-dependency-injection.md`:
   - Remove references to non-existent DI container
   - Document actual direct-instantiation approach
2. Remove stub functions from `src/service_provider.v`
3. Update `README.md` architecture diagram

**Option B: Implement DI System**
1. Create `src/core/di_container.v`
2. Create `src/core/base_service.v`
3. Update `service_provider.v` to register services
4. Update `app.v` to use container

---

### 1.4 Implement Real Services or Label as Stubs (CRIT-002)
**Priority**: High (Day 3-5)  
**Effort**: 16-24 hours

**Steps**:
1. For each service method returning fake data:
   - Implement actual system calls
   - OR clearly label as mock/stub
2. Start with most visible features:
   - `get_memory_stats_json()` - Read from `/proc/meminfo`
   - `get_cpu_usage_json()` - Calculate from `/proc/stat`
   - `get_disk_usage_json()` - Use `os.disk_usage()`

**Implementation example**:
```v
pub fn (mut s SystemInfoService) get_memory_stats_json() string {
    meminfo := os.read_file('/proc/meminfo') or {
        return '{"error": "Failed to read memory info", "status": "error"}'
    }
    
    mut total_kb := 0
    mut available_kb := 0
    
    for line in meminfo.split_into_lines() {
        if line.starts_with('MemTotal:') {
            total_kb = extract_kb(line)
        } else if line.starts_with('MemAvailable:') {
            available_kb = extract_kb(line)
        }
    }
    
    total_mb := total_kb / 1024
    available_mb := available_kb / 1024
    used_mb := total_mb - available_mb
    percent := f64(used_mb) / f64(total_mb) * 100.0
    
    return '{"total_mb":"${total_mb}","available_mb":"${available_mb}","used_mb":"${used_mb}","percent_used":"${percent:.1}","status":"ok"}'
}

fn extract_kb(line string) int {
    parts := line.split(':')
    if parts.len > 1 {
        val_str := parts[1].trim_space().replace('kB', '')
        return val_str.int()
    }
    return 0
}
```

**Files to modify**:
- `src/system_info_service.v` - Implement all methods
- `src/network_service.v` - Implement network stats
- `src/file_service.v` - Already mostly implemented

---

### 1.5 Add Input Validation (MED-002)
**Priority**: High (Day 5)  
**Effort**: 4-6 hours

**Steps**:
1. Add `is_path_safe()` function to `FileService`
2. Update all file operations to validate paths
3. Test with path traversal attempts

**Verification**:
```v
// Should be rejected
file.read_file('../../../etc/passwd')
file.read_file('/etc/shadow')

// Should be allowed
file.read_file('/home/user/file.txt')
```

---

## Phase 2: High Priority (Week 3-4)

### 2.1 Fix WebUI Binding Naming (HIGH-004)
**Priority**: Medium (Day 1-2)  
**Effort**: 4-8 hours

**Steps**:
1. Create binding reference document
2. Standardize on camelCase
3. Update all bindings to match frontend expectations

---

### 2.2 Decide Auth Approach (HIGH-001)
**Priority**: Medium (Day 2-4)  
**Effort**: 2 hours (remove) or 24-40 hours (implement)

**Option A: Remove Auth (Recommended for now)**
1. Delete `frontend/src/services/auth.service.ts`
2. Remove auth imports from components
3. Update documentation

**Option B: Implement Auth**
1. Add user data structures to backend
2. Implement password hashing
3. Create session management
4. Add all auth handlers

---

### 2.3 Consolidate Logging (MED-003)
**Priority**: Medium (Day 4-5)  
**Effort**: 4-6 hours

**Steps**:
1. Remove legacy logging functions from `main.v`
2. Update all calls to use `app.logging`
3. Standardize log format

---

## Phase 3: Medium Priority (Week 5-6)

### 3.1 Implement Error Handling Pattern (CRIT-004)
**Priority**: Medium (Day 1-3)  
**Effort**: 16-24 hours

**Steps**:
1. Update all service methods to return `Result<T>`
2. Update all callers to handle results
3. Add error context and codes

---

### 3.2 Fix Memory Leaks (MED-001)
**Priority**: Medium (Day 3)  
**Effort**: 1-2 hours

**Steps**:
1. Add `finally` blocks to `closeAllBoxes()`
2. Ensure cleanup on all error paths
3. Test with extended use

---

### 3.3 Remove Unused Module (MED-005)
**Priority**: Low (Day 4)  
**Effort**: 30 minutes

```bash
rm frontend/src/views/app.module.ts
rm frontend/src/views/app-routing.module.ts
```

---

### 3.4 Add Tests (MED-004)
**Priority**: Medium (Day 4-10)  
**Effort**: 24-40 hours

**Backend tests to create**:
- `src/logging_service_test.v`
- `src/file_service_test.v`
- `src/system_info_service_test.v`
- `src/network_service_test.v`
- `src/config_service_test.v`

**Frontend tests to create**:
- `frontend/src/services/*.spec.ts`

---

## Phase 4: Cleanup (Week 7-8)

### 4.1 Fix Naming (LOW-001)
**Effort**: 2-4 hours

### 4.2 Fix Magic Numbers (LOW-002)
**Effort**: 1 hour

### 4.3 Add Cross-Platform Support (LOW-003)
**Effort**: 8-12 hours

### 4.4 Update Documentation (LOW-004)
**Effort**: 4-8 hours

### 4.5 Fix Config Service (LOW-005)
**Effort**: 4-6 hours

---

## Milestone Checklist

### Milestone 1: Honest Implementation (Week 2)
- [ ] Build works (`./run.sh build`)
- [ ] No duplicate code
- [ ] Services return real data OR labeled as stubs
- [ ] Documentation matches code

### Milestone 2: Stable Foundation (Week 4)
- [ ] WebUI bindings standardized
- [ ] Auth decision made (implemented or removed)
- [ ] Logging consolidated
- [ ] Input validation added

### Milestone 3: Quality (Week 6)
- [ ] Error handling pattern implemented
- [ ] Memory leaks fixed
- [ ] Test coverage > 50%
- [ ] Unused code removed

### Milestone 4: Polish (Week 8)
- [ ] Naming consistent
- [ ] Magic numbers documented
- [ ] Cross-platform support
- [ ] Documentation complete

---

## Risk Mitigation

### Risk 1: Scope Creep
**Mitigation**: Do not add new features until all critical findings are resolved.

### Risk 2: Breaking Changes
**Mitigation**: Test thoroughly after each phase. Keep a changelog.

### Risk 3: Time Overrun
**Mitigation**: Focus on critical and high findings first. Low findings can be deferred.

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Critical findings | 4 | 0 |
| High findings | 4 | 0 |
| Test coverage | <10% | >50% |
| Duplicate code | ~600 lines | 0 |
| Fake services | 10+ | 0 |
| Documentation accuracy | Low | High |

---

## Next Steps

1. **Review this plan** with the team
2. **Prioritize** findings based on business needs
3. **Create GitHub issues** for each finding
4. **Start with Phase 1** - Critical fixes
5. **Track progress** against milestone checklist

---

*Last updated: 2026-03-14*
