# Testing Guide

## Overview

This document describes the testing infrastructure for the Desktop App project, covering both backend (V) and frontend (Angular) testing.

## Test Infrastructure

### Frontend Testing

The frontend uses **Bun Test** as the primary testing framework with Angular Testing utilities.

#### Test Configuration

- **Test Runner**: Bun Test
- **Test Files**: `*.spec.ts`
- **Location**: Alongside source files
- **Coverage**: Enabled with `bun test --coverage`

#### Running Tests

```bash
cd frontend

# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage report
bun test:ci

# Run specific test file
bun test src/core/error-recovery.service.spec.ts

# Run tests matching pattern
bun test --test-name-pattern "service"
```

#### Test File Structure

```typescript
import { describe, test, expect, beforeEach } from 'bun:test';
import { TestBed } from '@angular/core/testing';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MyService],
    });
    service = TestBed.inject(MyService);
  });

  test('should be created', () => {
    expect(service).toBeDefined();
  });

  test('should do something', () => {
    expect(service.doSomething()).toBe('expected');
  });
});
```

### Backend Testing

The backend uses **V's built-in testing framework**.

#### Running Tests

```bash
# Run all V tests
v test ./src

# Run specific test file
v test ./src/errors_test.v

# Run tests with verbose output
v -v test ./src
```

#### Test File Structure

```v
module main

import testing

fn test_error_creation() {
    err := create_error(.file_not_found, 'File missing', 'read_file')
    
    assert err.code == .file_not_found
    assert err.message == 'File missing'
    assert err.operation == 'read_file'
    assert err.recoverable == false
}

fn test_error_registry() {
    mut registry := new_error_registry()
    
    assert registry.errors.len == 0
    assert registry.critical_count == 0
    assert registry.warning_count == 0
}
```

## Test Categories

### Unit Tests

Test individual components, services, and functions in isolation.

#### Frontend Unit Tests

Location: `frontend/src/**/*.spec.ts`

Examples:
- Service tests (error-recovery.service.spec.ts)
- Component tests (home.component.spec.ts)
- ViewModel tests (event-bus.viewmodel.spec.ts)
- Interceptor tests (error.interceptor.spec.ts)

#### Backend Unit Tests

Location: `src/*_test.v`

Examples:
- Error handling tests (errors_test.v)
- System info tests (system_test.v)
- JSON encoding tests (json_test.v)

### Integration Tests

Test interactions between multiple components.

#### Frontend Integration Tests

Location: `frontend/src/app/**/*.spec.ts`

Examples:
- Component with service integration
- HTTP interceptor with service
- Error boundary with recovery service

#### Backend Integration Tests

Location: `src/integration/*_test.v`

Examples:
- WebUI handler integration
- File system operations
- Memory info retrieval

### End-to-End (E2E) Tests

Test the complete application flow.

Location: `frontend/e2e/`

```bash
# Run E2E tests
bun run e2e
```

## Writing Tests

### Best Practices

1. **Test Naming**: Use descriptive names that explain what is being tested
   ```typescript
   // Good
   test('should return error when connection fails', () => { ... })
   
   // Bad
   test('test1', () => { ... })
   ```

2. **Arrange-Act-Assert Pattern**:
   ```typescript
   test('should update state on success', () => {
       // Arrange
       const service = new MyService();
       const inputData = { value: 'test' };
       
       // Act
       const result = service.process(inputData);
       
       // Assert
       expect(result).toBe('expected');
       expect(service.state()).toEqual({ updated: true });
   });
   ```

3. **Test Edge Cases**:
   - Empty inputs
   - Null/undefined values
   - Maximum values
   - Error conditions

4. **Mock External Dependencies**:
   ```typescript
   const mockHttp = {
       get: jest.fn().mockReturnValue(of({ data: 'test' })),
       post: jest.fn(),
   };
   ```

### Testing Async Code

#### Frontend (Async/Await)

```typescript
test('should fetch data asynchronously', async () => {
    const service = new DataService(mockHttp);
    
    const result = await service.fetchData();
    
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
});
```

#### Frontend (Observables)

```typescript
test('should emit values from observable', () => {
    const service = new EventService();
    const values: string[] = [];
    
    service.events$.subscribe(v => values.push(v));
    service.emit('test');
    
    expect(values).toContain('test');
});
```

#### Backend (Async)

```v
fn test_async_operation() {
    mut result := ''
    
    go fn() {
        result = fetch_data()
    }()
    
    time.sleep(100 * time.Millisecond)
    
    assert result != ''
}
```

## Test Coverage

### Frontend Coverage

```bash
# Generate coverage report
bun test --coverage

# View coverage report
cat coverage/coverage-final.json
```

### Coverage Goals

| Component | Target | Current |
|-----------|--------|---------|
| Services | 80% | - |
| Components | 70% | - |
| Interceptors | 90% | - |
| ViewModels | 80% | - |

## Continuous Integration

### Pre-commit Checks

```bash
# Run linting
bun run lint

# Run formatting
bun run format:fix

# Run tests
bun test

# Build production
bun run build
```

### CI Pipeline

```yaml
# Example GitHub Actions workflow
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
      
      - name: Run linting
        run: bun run lint
      
      - name: Run tests
        run: bun test:ci
      
      - name: Build
        run: bun run build
```

## Test Utilities

### Mock Data

```typescript
// frontend/test/mocks/data.ts
export const mockSystemInfo = {
    hostname: 'localhost',
    os: 'linux',
    total_memory_mb: '16384',
    available_memory_mb: '8192',
    status: 'ok',
};

export const mockMemoryStats = {
    total_mb: '16384',
    free_mb: '4096',
    available_mb: '8192',
    used_mb: '8192',
    percent_used: '50.0',
    status: 'ok',
};
```

### Test Helpers

```typescript
// frontend/test/helpers.ts
export function createMockEvent(type: string, detail?: unknown): CustomEvent {
    return new CustomEvent(type, { detail });
}

export function waitFor(fn: () => boolean, timeout = 1000): Promise<void> {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const interval = setInterval(() => {
            if (fn()) {
                clearInterval(interval);
                resolve();
            } else if (Date.now() - start > timeout) {
                clearInterval(interval);
                reject(new Error('Timeout'));
            }
        }, 50);
    });
}
```

## Debugging Tests

### Frontend

```bash
# Run with verbose output
bun test --verbose

# Run specific test with logging
bun test --test-name-pattern "error recovery"
```

### Backend

```bash
# Run with verbose output
v -v test ./src

# Run single test function
v test ./src -run test_error_creation
```

## Common Issues

### Issue: Tests fail with "Cannot find module"

**Solution:** Ensure all dependencies are installed:
```bash
cd frontend
bun install
```

### Issue: Tests timeout

**Solution:** Increase timeout or optimize test:
```typescript
test('long running test', () => {
    // Test code
}, 10000); // 10 second timeout
```

### Issue: Mock not working

**Solution:** Ensure mock is set up before service creation:
```typescript
const mockHttp = { get: jest.fn() };
const service = new DataService(mockHttp); // Use mock
```

## Resources

- [Bun Test Documentation](https://bun.sh/docs/cli/test)
- [Angular Testing Guide](https://angular.dev/guide/testing)
- [V Testing Documentation](https://docs.vlang.io/guide/testing.html)

---

**Date:** March 13, 2026
**Status:** Active
