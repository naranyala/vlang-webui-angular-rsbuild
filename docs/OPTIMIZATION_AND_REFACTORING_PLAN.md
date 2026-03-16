# Code Optimization and Refactoring Plan

Project: Vlang WebUI Angular Application
Date: 2026-03-15
Status: In Progress

---

## Executive Summary

This document outlines the optimization and refactoring plan to split large files into smaller, maintainable modules and improve overall code quality.

---

## File Size Analysis

### Backend (V) - Files to Split (>300 lines)

| File | Lines | Priority | Action |
|------|-------|----------|--------|
| `communication.v` | 644 | 🔴 High | Split into 6 files |
| `di.v` | 450 | 🔴 High | Split into 4 files |
| `di_services.v` | 428 | 🟡 Medium | Split into service files |
| `app.v` | 373 | 🔴 High | Split handlers by feature |
| `main.v` | 196 | 🟢 Low | Extract utilities |

### Frontend (TypeScript) - Files to Split (>300 lines)

| File | Lines | Priority | Action |
|------|-------|----------|--------|
| `card.model.ts` | 601 | 🔴 High | Split into feature models |
| `devtools.service.ts` | 471 | 🔴 High | Split into feature services |
| `app.component.spec.ts` | 459 | 🟡 Medium | Split into test suites |
| `communication.ts` | 445 | 🔴 High | Split into pattern files |
| `error.types.ts` | 343 | 🟡 Medium | Split into error modules |

---

## Backend Refactoring Plan

### 1. Split communication.v (644 → 6 files)

**Target Structure**:
```
src/communication/
├── communication.v       # Main exports (50 lines)
├── message_bus.v         # MessageBus pattern (150 lines)
├── event_store.v         # EventStore pattern (150 lines)
├── command_bus.v         # CommandBus pattern (150 lines)
├── rpc.v                 # RPC pattern (100 lines)
├── channel.v             # Channel pattern (100 lines)
└── hub.v                 # CommunicationHub (150 lines)
```

**Benefits**:
- Easier to understand individual patterns
- Better testability
- Reduced compilation time
- Clearer responsibilities

### 2. Split di.v (450 → 4 files)

**Target Structure**:
```
src/di/
├── di.v              # Main exports (30 lines)
├── injector.v        # Injector core (200 lines)
├── provider.v        # Providers (150 lines)
└── module.v          # DIModule (100 lines)
```

**Benefits**:
- Separation of concerns
- Easier to maintain
- Better documentation

### 3. Split app.v (373 → modular handlers)

**Target Structure**:
```
src/app/
├── app.v                 # App struct and init (100 lines)
├── handlers/
│   ├── system_handlers.v # System info handlers (100 lines)
│   ├── file_handlers.v   # File operation handlers (80 lines)
│   ├── network_handlers.v# Network handlers (60 lines)
│   ├── user_handlers.v   # User CRUD handlers (80 lines)
│   └── devtools_handlers.v# DevTools handlers (100 lines)
└── services/
    └── (existing services)
```

**Benefits**:
- Feature-based organization
- Easier to find handlers
- Parallel development

---

## Frontend Refactoring Plan

### 1. Split card.model.ts (601 → feature models)

**Target Structure**:
```
src/models/
├── index.ts              # Barrel exports (20 lines)
├── card.model.ts         # Card interfaces (150 lines)
├── user.model.ts         # User interfaces (100 lines)
├── window.model.ts       # Window interfaces (80 lines)
├── devtools.model.ts     # DevTools interfaces (150 lines)
└── common.model.ts       # Shared interfaces (100 lines)
```

**Benefits**:
- Smaller, focused files
- Better tree-shaking
- Easier navigation

### 2. Split devtools.service.ts (471 → feature services)

**Target Structure**:
```
src/services/app/
├── devtools.service.ts       # Main service (100 lines)
├── devtools/
│   ├── system-info.service.ts# System info (100 lines)
│   ├── memory-info.service.ts# Memory info (80 lines)
│   ├── network-info.service.ts# Network info (80 lines)
│   └── event-log.service.ts  # Event logging (100 lines)
```

**Benefits**:
- Single responsibility
- Easier testing
- Better lazy loading

### 3. Split communication.ts (445 → pattern files)

**Target Structure**:
```
src/communication/
├── index.ts              # Barrel exports (20 lines)
├── message-bus.ts        # MessageBus (120 lines)
├── event-store.ts        # EventStore (100 lines)
├── command-bus.ts        # CommandBus (100 lines)
├── rpc.ts                # RPC (80 lines)
└── channel.ts            # Channel (80 lines)
```

**Benefits**:
- Pattern isolation
- Better testing
- Clearer API

---

## Performance Optimizations

### Backend Optimizations

1. **Reduce Memory Allocations**
   - Use `@[heap]` only when necessary
   - Prefer stack allocation for small structs
   - Reuse buffers where possible

2. **Optimize JSON Encoding**
   - Cache encoded responses
   - Use streaming for large data
   - Minimize object creation

3. **Improve Service Initialization**
   - Lazy loading of services
   - Async initialization where possible
   - Connection pooling

### Frontend Optimizations

1. **Bundle Size Reduction**
   - Tree-shaking unused code
   - Lazy loading of features
   - Code splitting by route

2. **Change Detection Optimization**
   - Use `OnPush` change detection
   - Optimize signal computations
   - Reduce template complexity

3. **Memory Management**
   - Proper cleanup in ngOnDestroy
   - Avoid memory leaks in subscriptions
   - Use WeakMap/WeakSet where appropriate

---

## Code Quality Improvements

### 1. Consistent Naming

**Before**:
```v
// Mixed naming
get_system_info_json()
getMemoryStats()
browse_directory()
```

**After**:
```v
// Consistent camelCase for WebUI
getSystemInfo()
getMemoryStats()
browseDirectory()
```

### 2. Error Handling

**Before**:
```v
// Inconsistent error handling
data := get_data() or { return '' }
result := process_data(data) or { return error('Failed') }
```

**After**:
```v
// Consistent Result<T> pattern
data := get_data() or {
  return errors.err<string>(errors.create_error(.internal_error, 'Failed to get data', 'handler'))
}
```

### 3. Documentation

**Before**:
```v
// No documentation
pub fn (mut svc Service) process(data string) string {
  // Process data
}
```

**After**:
```v
// Complete documentation
/**
 * Process input data and return result
 * 
 * Parameters:
 * - data: Input data string
 * 
 * Returns:
 * - Processed result as JSON string
 * 
 * Example:
 * ```v
 * result := service.process('input')
 * ```
 */
pub fn (mut svc Service) process(data string) string {
  // Implementation
}
```

---

## Implementation Timeline

### Week 1: Backend Refactoring
- [ ] Split communication.v
- [ ] Split di.v
- [ ] Split app.v handlers
- [ ] Update imports and tests

### Week 2: Frontend Refactoring
- [ ] Split card.model.ts
- [ ] Split devtools.service.ts
- [ ] Split communication.ts
- [ ] Update imports and tests

### Week 3: Performance Optimization
- [ ] Backend memory optimization
- [ ] Frontend bundle optimization
- [ ] Change detection optimization
- [ ] Performance testing

### Week 4: Code Quality
- [ ] Consistent naming
- [ ] Error handling standardization
- [ ] Documentation completion
- [ ] Code review

---

## Success Metrics

### File Size Targets

| Metric | Before | Target | Status |
|--------|--------|--------|--------|
| Avg V file size | 300 lines | <200 lines | ⏳ In Progress |
| Avg TS file size | 250 lines | <200 lines | ⏳ In Progress |
| Max file size | 644 lines | <300 lines | ⏳ In Progress |

### Performance Targets

| Metric | Before | Target | Status |
|--------|--------|--------|--------|
| Backend build time | 15s | <10s | ⏳ In Progress |
| Frontend build time | 15s | <10s | ⏳ In Progress |
| Bundle size | 304KB | <250KB | ⏳ In Progress |
| Memory usage | 50MB | <40MB | ⏳ In Progress |

### Code Quality Targets

| Metric | Before | Target | Status |
|--------|--------|--------|--------|
| Test coverage | 75% | 85% | ⏳ In Progress |
| Documentation | 60% | 90% | ⏳ In Progress |
| Code consistency | 70% | 95% | ⏳ In Progress |

---

## Risk Mitigation

### Risks

1. **Breaking Changes**
   - Mitigation: Maintain backward compatibility
   - Fallback: Feature flags for gradual rollout

2. **Test Failures**
   - Mitigation: Update tests with refactoring
   - Fallback: Keep old code until tests pass

3. **Performance Regression**
   - Mitigation: Performance testing after each change
   - Fallback: Rollback plan

---

## Conclusion

This refactoring plan will significantly improve:
- **Maintainability** - Smaller, focused files
- **Performance** - Optimized code paths
- **Quality** - Consistent patterns and documentation
- **Developer Experience** - Easier to navigate and understand

Estimated effort: 4 weeks
Expected benefits: Long-term maintainability and performance improvements

---

*Plan created: 2026-03-15*
*Version: 1.0*
*Status: Ready for Implementation*
