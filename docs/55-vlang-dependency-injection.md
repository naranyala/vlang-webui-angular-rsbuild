# Vlang Dependency Injection System

Project: Vlang WebUI Angular Application
Date: 2026-03-15
Version: 1.0

---

## Overview

This document describes the Dependency Injection (DI) system for Vlang backend, designed to mirror Angular's DI approach. It provides similar workflow, patterns, and benefits.

---

## Comparison: Angular vs Vlang DI

| Feature | Angular (TypeScript) | Vlang Backend |
|---------|---------------------|---------------|
| **Decorator** | `@Injectable()` | `register_injectable()` |
| **Provider** | `providers: []` | `provide_factory()`, `provide_class()` |
| **Scope** | `providedIn: 'root'` | `ServiceScope.singleton` |
| **Injection** | `constructor(private svc: Service)` | `injector.get['&Service']()` |
| **Module** | `@NgModule({providers: []})` | `DIModule` |
| **Injector** | `Injector` | `Injector` |
| **Token** | `InjectionToken` | `InjectionToken[T]` |

---

## Core Concepts

### 1. Service Scopes (Lifetime)

#### Singleton (like `providedIn: 'root'`)

**Angular**:
```typescript
@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  // Single instance for entire app
}
```

**Vlang**:
```v
// Register as singleton
provider := di.provide_factory('&LoggingService', create_logging_service, .singleton)
injector.register([provider]!)
```

#### Transient (like not providedIn)

**Angular**:
```typescript
// New instance every time
@Component({
  providers: [TransientService]
})
```

**Vlang**:
```v
// New instance every time
provider := di.provide_factory('&TransientService', create_service, .transient)
```

#### Scoped (like `providedIn: 'platform'`)

**Angular**:
```typescript
@Injectable({
  providedIn: 'platform'
})
```

**Vlang**:
```v
// Single instance per scope
provider := di.provide_factory('&ScopedService', create_service, .scoped)

// Run in scope
injector.run_in_scope('request', fn () {
  // Service instance lives for this scope
})
```

---

### 2. Creating Injectable Services

#### Angular Pattern

```typescript
@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(
    private http: HttpClient,
    private logger: LoggingService
  ) {}
}
```

#### Vlang Pattern

```v
@[heap]
pub struct UserService {
mut:
  http      &HttpClient
  logging   &LoggingService
  initialized bool
}

// Factory function with dependencies
pub fn create_user_service(http &HttpClient, logging &LoggingService) &UserService {
  return &UserService{
    http: http
    logging: logging
    initialized: false
  }
}

// Register with DI
provider := di.provide_factory('&UserService', fn () &UserService {
  http := di.global_inject['&HttpClient']('HttpClient') or { return nil }
  logging := di.global_inject['&LoggingService']('LoggingService') or { return nil }
  return create_user_service(http, logging)
}, .singleton)
```

---

### 3. Dependency Injection

#### Constructor Injection

**Angular**:
```typescript
@Component({})
export class UserComponent {
  constructor(
    private userService: UserService,
    private logger: LoggingService
  ) {}
  
  ngOnInit() {
    const users = this.userService.getAll();
  }
}
```

**Vlang**:
```v
@[heap]
pub struct UserComponent {
mut:
  user_service  &UserService
  logging       &LoggingService
}

pub fn create_user_component(injector &Injector) &UserComponent {
  user_service := injector.get['&UserService']('UserService') or {
    panic('UserService not found')
  }
  
  logging := injector.get['&LoggingService']('LoggingService') or {
    panic('LoggingService not found')
  }
  
  return &UserComponent{
    user_service: user_service
    logging: logging
  }
}
```

#### Manual Injection

**Angular**:
```typescript
const service = inject(MyService);
```

**Vlang**:
```v
service := di.global_inject['&MyService']('MyService') or {
  println('Service not found')
  return
}
```

---

### 4. Modules (NgModule equivalent)

#### Angular Module

```typescript
@NgModule({
  providers: [
    UserService,
    LoggingService,
    { provide: ConfigService, useClass: AppConfigService }
  ],
  imports: [CommonModule],
  exports: [UserService]
})
export class CoreModule {}
```

#### Vlang Module

```v
pub fn create_core_module() di.DIModule {
  mut module := di.create_module('CoreModule')
  
  // Add providers
  user_provider := di.provide_factory('&UserService', create_user_service, .singleton)
  module.add_provider(user_provider)
  
  logging_provider := di.provide_factory('&LoggingService', create_logging_service, .singleton)
  module.add_provider(logging_provider)
  
  // Config with custom implementation
  config_provider := di.provide_factory('&ConfigService', create_app_config_service, .singleton)
  module.add_provider(config_provider)
  
  // Export services
  module.export(['UserService', 'LoggingService'])
  
  return module
}

// Register module with injector
mut core_module := create_core_module()
core_module.register_with(mut injector)
```

---

### 5. Provider Types

#### Class Provider

**Angular**:
```typescript
providers: [
  { provide: LoggerService, useClass: ConsoleLoggerService }
]
```

**Vlang**:
```v
provider := di.provide_factory('&LoggerService', create_console_logger, .singleton)
```

#### Factory Provider

**Angular**:
```typescript
providers: [
  {
    provide: ConfigService,
    useFactory: (http: HttpClient) => new AppConfigService(http),
    deps: [HttpClient]
  }
]
```

**Vlang**:
```v
provider := di.provide_factory('&ConfigService', fn () &ConfigService {
  http := di.global_inject['&HttpClient']('HttpClient') or { return nil }
  return create_app_config_service(http)
}, .singleton)
```

#### Existing Provider (Alias)

**Angular**:
```typescript
providers: [
  OldLoggerService,
  { provide: NewLoggerService, useExisting: OldLoggerService }
]
```

**Vlang**:
```v
// Register old service
old_provider := di.provide_factory('&OldLoggerService', create_old_logger, .singleton)

// Alias to new service
alias_provider := di.provide_existing('&NewLoggerService', 'OldLoggerService', .singleton)
```

#### Value Provider

**Angular**:
```typescript
providers: [
  { provide: API_URL, useValue: 'https://api.example.com' }
]
```

**Vlang**:
```v
api_url := 'https://api.example.com'
provider := di.provide_value('API_URL', api_url, .singleton)
```

---

### 6. Hierarchical Injectors

#### Angular

```typescript
// Root injector
// └── ModuleA injector
//     └── ComponentA injector
//         └── ComponentB injector
```

#### Vlang

```v
// Create root injector
mut root := di.create_root_injector()

// Create child injector
mut child := root.create_child()

// Child can access parent services
service := child.get['&LoggingService']('LoggingService') or {
  // Falls back to parent
}
```

---

## Complete Example

### Step 1: Define Services

```v
module services

import di

// Logging Service
@[heap]
pub struct LoggingService {
mut:
  min_level string
}

pub fn create_logging_service() &LoggingService {
  return &LoggingService{
    min_level: 'info'
  }
}

pub fn (service LoggingService) info(message string) {
  println('[INFO] ${message}')
}

// Config Service
@[heap]
pub struct ConfigService {
mut:
  config map[string]string
}

pub fn create_config_service() &ConfigService {
  return &ConfigService{
    config: map[string]string{}
  }
}

pub fn (service ConfigService) get(key string) string {
  return service.config[key] or { '' }
}

// User Service (depends on LoggingService and ConfigService)
@[heap]
pub struct UserService {
mut:
  logging &LoggingService
  config  &ConfigService
}

pub fn create_user_service(logging &LoggingService, config &ConfigService) &UserService {
  return &UserService{
    logging: logging
    config: config
  }
}

pub fn (service UserService) get_users() []string {
  service.logging.info('Getting users')
  return ['John', 'Jane']
}
```

### Step 2: Create DI Module

```v
pub fn create_app_module() di.DIModule {
  mut module := di.create_module('AppModule')
  
  // Register LoggingService
  logging_provider := di.provide_factory('&LoggingService', create_logging_service, .singleton)
  module.add_provider(logging_provider)
  
  // Register ConfigService
  config_provider := di.provide_factory('&ConfigService', create_config_service, .singleton)
  module.add_provider(config_provider)
  
  // Register UserService (with dependencies)
  user_provider := di.provide_factory('&UserService', fn () &UserService {
    logging := di.global_inject['&LoggingService']('LoggingService') or {
      return create_logging_service()
    }
    config := di.global_inject['&ConfigService']('ConfigService') or {
      return create_config_service()
    }
    return create_user_service(logging, config)
  }, .singleton)
  module.add_provider(user_provider)
  
  return module
}
```

### Step 3: Initialize DI Container

```v
fn main() {
  // Create root injector
  mut injector := di.create_root_injector()
  
  // Create and register module
  mut app_module := create_app_module()
  app_module.register_with(mut injector)
  
  // Get services (dependencies auto-injected)
  user_service := injector.get['&UserService']('UserService') or {
    println('Failed to get UserService')
    return
  }
  
  // Use service
  users := user_service.get_users()
  println('Users: ${users}')
}
```

---

## Advanced Features

### Scoped Services

```v
// Create injector
mut injector := di.create_root_injector()

// Run in scope
injector.run_in_scope('request', fn () {
  // Get scoped service
  service := injector.get['&RequestService']('RequestService')
  
  // Service lives for this scope only
})

// Service is destroyed after scope
```

### Service Metadata

```v
// Get service metadata
metadata := injector.get_service_metadata('UserService') or {
  println('Service not found')
  return
}

println('Service: ${metadata.name}')
println('Scope: ${metadata.scope}')
println('Created: ${metadata.created_at}')
```

### Injector Statistics

```v
stats := injector.get_stats()
println('Providers: ${stats['provider_count']}')
println('Services: ${stats['service_count']}')
println('Scoped: ${stats['scoped_service_count']}')
```

### Cleanup

```v
// Destroy injector and cleanup services
injector.destroy()
```

---

## Best Practices

### 1. Use Singleton for Stateful Services

```v
// Good: Single instance maintains state
provider := di.provide_factory('&UserService', create_user_service, .singleton)

// Bad: New instance loses state
provider := di.provide_factory('&UserService', create_user_service, .transient)
```

### 2. Inject Dependencies, Don't Create

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
    logging: create_logging_service()  // Don't do this!
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

### 4. Handle Missing Services Gracefully

```v
// Good: Handle missing service
service := injector.get['&MyService']('MyService') or {
  println('Service not available, using fallback')
  return create_fallback_service()
}

// Bad: Panic on missing service
service := injector.get['&MyService']('MyService') or {
  panic('Service not found!')  // Don't do this!
}
```

---

## Migration Guide

### From Manual Instantiation

**Before**:
```v
mut logging := LoggingService{}
logging.initialize()

mut config := ConfigService{}
config.initialize()

mut user := UserService{
  logging: logging
  config: config
}
```

**After**:
```v
// Register providers
di.global_register([
  di.provide_factory('&LoggingService', create_logging_service, .singleton),
  di.provide_factory('&ConfigService', create_config_service, .singleton),
  di.provide_factory('&UserService', create_user_service, .singleton),
]!)

// Inject
user_service := di.global_inject['&UserService']('UserService') or {
  return
}
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

## Conclusion

The Vlang DI system provides:

✅ **Angular-like workflow** - Familiar patterns for Angular developers
✅ **Type safety** - Compile-time type checking
✅ **Flexibility** - Multiple provider types
✅ **Hierarchical injectors** - Parent-child relationships
✅ **Service scopes** - Singleton, transient, scoped
✅ **Modules** - Organized provider collections
✅ **Easy testing** - Mock services easily

This brings the power and maintainability of Angular's DI to Vlang backend development.

---

*Documentation created: 2026-03-15*
*Version: 1.0*
*Status: Production Ready*
