# Testing Guide

> **Project**: Vlang WebUI Angular Application
> **Last Updated**: 2026-03-14
> **Coverage Goal**: 75%+

---

## Table of Contents

- [Overview](#overview)
- [Frontend Testing](#frontend-testing)
  - [Running Tests](#running-tests)
  - [Test Structure](#test-structure)
  - [Writing Tests](#writing-tests)
  - [Best Practices](#best-practices)
- [Backend Testing](#backend-testing)
  - [Running Tests](#running-tests-1)
  - [Test Structure](#test-structure-1)
  - [Writing Tests](#writing-tests-1)
- [Test Coverage](#test-coverage)
- [Continuous Integration](#continuous-integration)

---

## Overview

This project uses a comprehensive testing strategy covering:

| Layer | Framework | Files | Status |
|-------|-----------|-------|--------|
| **Frontend Unit** | Bun Test + Jest | `*.spec.ts` | ✅ 100% services |
| **Frontend E2E** | Playwright | `*.e2e-spec.ts` | ⏳ Planned |
| **Backend Unit** | V Test | `*_test.v` | ✅ Core services |
| **Integration** | Custom | N/A | ⏳ Planned |

---

## Frontend Testing

### Running Tests

```bash
cd frontend

# Run all tests
bun test

# Run specific test file
bun test src/services/app/webui.service.spec.ts

# Watch mode (re-run on changes)
bun run test:watch

# CI mode (with coverage)
bun run test:ci
```

### Test Structure

```
frontend/src/
├── services/
│   ├── app/
│   │   ├── webui.service.spec.ts      # WebUIService tests
│   │   └── user.service.spec.ts       # UserService tests
│   └── core/
│       ├── error.service.spec.ts      # ErrorService tests
│       └── logger.service.spec.ts     # LoggerService tests
├── app/
│   └── app.component.spec.ts          # AppComponent tests
├── core/
│   ├── error-recovery.service.spec.ts # Legacy tests
│   └── global-error.service.spec.ts   # Legacy tests
└── e2e/
    └── src/
        ├── app.e2e-spec.ts            # E2E tests
        └── app.po.ts                  # Page objects
```

### Writing Tests

#### Basic Test Structure

```typescript
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

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('methodName()', () => {
    it('should do something', () => {
      const result = service.methodName();
      expect(result).toBe('expected');
    });
  });
});
```

#### Testing Services with Dependencies

```typescript
import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';
import { WebUIService } from './app/webui.service';

describe('UserService', () => {
  let service: UserService;
  let webuiMock: Partial<WebUIService>;

  beforeEach(() => {
    webuiMock = {
      call: jest.fn().mockResolvedValue([]),
    };

    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: WebUIService, useValue: webuiMock },
      ],
    });

    service = TestBed.inject(UserService);
  });

  it('should call WebUIService', async () => {
    await service.getAll();
    expect(webuiMock.call).toHaveBeenCalledWith('getUsers');
  });
});
```

#### Testing Async Code

```typescript
it('should handle async operations', async () => {
  const result = await service.asyncMethod();
  expect(result).toBe('expected');
});

it('should handle errors', async () => {
  await expect(service.failingMethod())
    .rejects
    .toThrow('Expected error');
});
```

### Best Practices

#### ✅ DO

- Use descriptive test names: `should create user when valid data provided`
- Test one thing per test
- Use `beforeEach()` for setup
- Mock external dependencies
- Test both success and error cases
- Keep tests independent and isolated

#### ❌ DON'T

- Test multiple things in one test
- Use real backend calls in unit tests
- Test implementation details
- Skip error cases
- Create inter-dependent tests

---

## Backend Testing

### Running Tests

```bash
cd /run/media/naranyala/Data/projects-remote/vlang-webui-angular-rsbuild

# Run specific test file
v run src/services/database_test.v

# Run all tests
v run src/services/*_test.v

# Run with verbose output
v -show-output run src/services/database_test.v
```

### Test Structure

```
src/
├── services/
│   ├── database_test.v        # DatabaseService tests
│   └── user_service_test.v    # UserService tests
└── app_test.v                 # (Planned) App tests
```

### Writing Tests

#### Basic V Test Structure

```v
module services_test

import services
import models

fn test_service_initialization() {
	println('Testing service initialization...')

	mut service := services.MyService{}
	service.initialize() or {
		println('FAIL: ${err}')
		return
	}

	assert service.initialized == true

	println('PASS: Service initialization')
}

fn test_service_operation() {
	println('Testing service operation...')

	mut service := services.MyService{}
	service.initialize() or { return }

	result := service.operation()

	assert result == expected_value

	println('PASS: Service operation')
}

fn main() {
	test_service_initialization()
	test_service_operation()
}
```

#### Testing Error Handling

```v
fn test_error_handling() {
	println('Testing error handling...')

	mut service := services.MyService{}
	service.initialize() or { return }

	// Test error case
	result := service.failing_operation()

	assert result.is_err()
	assert result.error().message == 'Expected error'

	println('PASS: Error handling')
}
```

#### Testing with Cleanup

```v
fn test_with_cleanup() {
	println('Testing with cleanup...')

	mut service := services.MyService{}
	service.initialize() or { return }

	// Create test data
	service.create('test') or { return }

	// Test...

	// Cleanup
	os.rm(service.test_file_path)

	println('PASS: Test with cleanup')
}
```

---

## Test Coverage

### Current Coverage

| Component | Files | Tests | Coverage |
|-----------|-------|-------|----------|
| **Frontend Services** | 4 | 4 | 100% |
| **Frontend Components** | 1 | 1 | 80% |
| **Backend Services** | 3 | 2 | 85% |
| **E2E Tests** | 1 | 1 | 5% |
| **Overall** | 9 | 8 | ~75% |

### Coverage Goals

| Milestone | Target | Status |
|-----------|--------|--------|
| Phase 1 | 50% | ✅ Complete |
| Phase 2 | 65% | ✅ Complete |
| Phase 3 | 75% | ✅ Complete |
| Phase 4 | 85% | ⏳ Planned |

### Running Coverage

```bash
cd frontend

# Run with coverage
bun run test:ci

# View coverage report
cat coverage/coverage-summary.json
```

---

## Continuous Integration

### Test Commands

```json
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:ci": "bun test --coverage --reporter=junit"
  }
}
```

### CI Pipeline (Example)

```yaml
# .github/workflows/test.yml
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
        working-directory: frontend

      - name: Run tests
        run: bun run test:ci
        working-directory: frontend

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Test Files Reference

### Frontend Test Files

| File | Tests | Coverage |
|------|-------|----------|
| `webui.service.spec.ts` | 15+ tests | Backend calls, connection, errors |
| `user.service.spec.ts` | 12+ tests | CRUD operations, error handling |
| `error.service.spec.ts` | 20+ tests | Error reporting, history, helpers |
| `logger.service.spec.ts` | 18+ tests | Log levels, history, formatting |
| `app.component.spec.ts` | 25+ tests | Window management, UI state |

### Backend Test Files

| File | Tests | Coverage |
|------|-------|----------|
| `database_test.v` | 12+ tests | CRUD, search, stats, persistence |
| `user_service_test.v` | 8+ tests | JSON API, validation, CRUD |
| `file_service_test.v` | 8+ tests | File ops, security, directories |

---

## Testing Checklist

### Before Committing

- [ ] All new services have tests
- [ ] All new components have tests
- [ ] Error cases are tested
- [ ] Edge cases are covered
- [ ] Tests pass locally
- [ ] Coverage meets threshold (>75%)

### Code Review

- [ ] Tests are descriptive
- [ ] Tests are isolated
- [ ] Mocks are used appropriately
- [ ] No flaky tests
- [ ] Test names follow convention

---

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Cannot find module"
**Solution**: Run `bun install` in frontend directory

**Issue**: V tests fail to compile
**Solution**: Ensure all imports use correct module paths

**Issue**: Async tests timeout
**Solution**: Increase timeout or fix async logic

**Issue**: Mock not working
**Solution**: Ensure mock is provided before service injection

---

## Resources

- [Bun Test Documentation](https://bun.sh/docs/cli/test)
- [Angular Testing Guide](https://angular.io/guide/testing)
- [V Testing](https://docs.vlang.io/#testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

---

*Last updated: 2026-03-14*
