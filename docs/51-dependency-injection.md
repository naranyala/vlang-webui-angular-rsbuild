# Dependency Injection Documentation

## Overview

This document describes the Dependency Injection (DI) system for the Vlang backend, designed to mirror Angular's DI approach.

---

## DI Module Structure

```
src/di/
├── di.v              # Main exports
├── injector.v        # Injector core
├── provider.v        # Provider types
└── module.v          # DIModule
```

---

## Core Concepts

### Service Scopes

Three service lifetime scopes are available:

1. **Singleton**: Single instance for entire application
2. **Transient**: New instance every time
3. **Scoped**: Single instance per scope/request

### Providers

Four provider types:

1. **Class Provider**: Use class constructor
2. **Factory Provider**: Use factory function
3. **Existing Provider**: Alias to another service
4. **Value Provider**: Use constant value

### Injector

The injector manages service creation and resolution:

- Root injector (application-wide)
- Child injectors (hierarchical)
- Scoped injectors (request-specific)

---

## Usage Guide

### Registering Services

```v
import di

// Create root injector
mut injector := di.create_root_injector()

// Create provider
provider := di.provide_factory('&LoggingService', create_logging_service, .singleton)

// Register provider
injector.register([provider]!)
```

### Resolving Services

```v
// Get service
logging := injector.get['&LoggingService']('LoggingService') or {
    println('Service not found')
    return
}

// Use service
logging.info('Application started')
```

### Creating Modules

```v
// Create module
mut module := di.create_module('CoreModule')

// Add providers
logging_provider := di.provide_factory('&LoggingService', create_logging_service, .singleton)
module.add_provider(logging_provider)

// Register module
module.register_with(mut injector)
```

---

## Angular Comparison

| Angular | Vlang DI |
|---------|----------|
| `@Injectable({providedIn: 'root'})` | `provide_factory(name, factory, .singleton)` |
| `constructor(private svc: Service)` | `injector.get['&Service']('Service')` |
| `@NgModule({providers: []})` | `DIModule` |
| `inject(Service)` | `di.global_inject['&Service']('Service')` |

---

## Best Practices

### 1. Use Singleton for Stateful Services

```v
// Good: Single instance maintains state
provider := di.provide_factory('&UserService', create_user_service, .singleton)

// Bad: New instance loses state
provider := di.provide_factory('&UserService', create_user_service, .transient)
```

### 2. Inject Dependencies

```v
// Good: Dependencies injected
pub fn create_user_service(logging &LoggingService) &UserService {
  return &UserService{
    logging: logging
  }
}

// Bad: Service creates dependencies
pub fn create_user_service() &UserService {
  return &UserService{
    logging: create_logging_service()  // Don't do this
  }
}
```

### 3. Use Modules for Organization

```v
// Create separate modules
core_module := create_core_module()
data_module := create_data_module()
ui_module := create_ui_module()

// Register all
core_module.register_with(mut injector)
data_module.register_with(mut injector)
ui_module.register_with(mut injector)
```

---

## Testing

### Mock Services

```v
// Create mock service
pub fn create_mock_logging_service() &LoggingService {
  return &LoggingService{
    min_level: 'debug'
  }
}

// Register mock in test
mut test_injector := di.create_root_injector()
test_injector.register([
  di.provide_factory('&LoggingService', create_mock_logging_service, .singleton),
]!)

// Run tests with mock injector
```

---

*Last updated: 2026-03-16*
*Version: 1.0*
