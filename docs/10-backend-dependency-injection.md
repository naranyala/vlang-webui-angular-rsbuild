# Backend Dependency Injection System

> **Category**: Backend Architecture  
> **Updated**: 2026-03-14  
> **Related**: [Errors as Values](11-errors-as-values-pattern.md), [Testing Guide](20-testing-guide.md)

---

## Overview

The V backend implements a comprehensive **Dependency Injection (DI) system** inspired by patterns from Rust, Go, and enterprise Java frameworks. This system provides:

- **Service Container** - Central registry for all services
- **Service Lifetimes** - Singleton, Scoped, and Transient management
- **Service Provider** - Automatic service registration and initialization
- **Errors as Values** - Rust-like `Result<T>` pattern throughout

---

## Current Project Structure

```
src/
├── core/                           # DI Infrastructure
│   ├── di_container.v              # Service container implementation
│   └── base_service.v              # Base service types and interfaces
├── services/                       # Business Services (moved to src root)
│   ├── logging_service.v           # Centralized logging
│   ├── system_info_service.v       # System monitoring
│   ├── file_service.v              # File operations
│   ├── network_service.v           # Network management
│   └── config_service.v            # Configuration management
├── errors/                         # Error Handling System
│   ├── errors_core.v               # Result/Option types, ErrorBuilder
│   ├── errors.v                    # Module index
│   └── errors_test.v               # Integration tests
├── service_provider.v              # Service registration & lifecycle
├── app.v                           # Application wrapper with DI
└── main.v                          # Entry point
```

> **Note**: Services were moved from `src/services/` to `src/` root to work around V module limitations. The `service_provider.v` coordinates all service registration.

---

## Architecture

### Service Container

The `ServiceContainer` is the heart of the DI system:

```v
module main

import core
import service_provider

fn main() {
    // Create container
    mut container := core.new_service_container()
    
    // Register all services
    service_provider.register_services_in_container(mut container)
    
    // Initialize all services
    service_provider.initialize_services(mut container)
    
    // Resolve services
    logging_ptr := container.get_required_service('logging')
    logging := unsafe { logging_ptr as &LoggingService }
    
    // Use services
    logging.info('Application started')
    
    // Cleanup
    service_provider.shutdown_services(mut container)
}
```

### Service Lifetimes

| Lifetime | Description | Use Case |
|----------|-------------|----------|
| **Singleton** | Single instance for app lifetime | `LoggingService`, `ConfigService` |
| **Scoped** | One instance per scope | Request-specific data (future) |
| **Transient** | New instance each resolution | Stateless operations |

---

## Available Services

### LoggingService

Centralized logging with multiple levels and export capabilities.

```v
mut logging := LoggingService{}
logging.initialize() or {
    eprintln('Failed to initialize logging')
    return
}

// Log at different levels
logging.info('Application started')
logging.debug('Debug information')
logging.warning('Warning message')
logging.error('Error occurred')
logging.critical('Critical issue')

// Export logs to file
logging.export_logs('/path/to/logs.txt') or {
    println('Failed to export logs')
}

// Get statistics
stats := logging.get_statistics()
println('Total: ${stats['total']}, Errors: ${stats['error']}')
```

**File**: `src/logging_service.v`  
**Methods**: `info()`, `debug()`, `warning()`, `error()`, `critical()`, `export_logs()`, `get_statistics()`

---

### SystemInfoService

Comprehensive system monitoring capabilities.

```v
mut sys := SystemInfoService{}
sys.initialize() or { return }

// Get comprehensive system info
info := sys.get_system_info()
println('Hostname: ${info.hostname}')
println('OS: ${info.os}')
println('Memory: ${info.total_memory_mb} MB')

// Get specific metrics
cpu_usage := sys.get_cpu_usage()
memory := sys.get_memory_stats()
disk := sys.get_disk_usage()
network := sys.get_network_interfaces()
battery := sys.get_battery_info()

// JSON variants for API responses
json := sys.get_system_info_json()
```

**File**: `src/system_info_service.v`  
**Methods**: `get_system_info()`, `get_cpu_usage()`, `get_memory_stats()`, `get_disk_usage()`, `get_network_interfaces()`, `get_battery_info()`

---

### FileService

File and directory operations with security features.

```v
mut file := FileService{}
file.initialize() or { return }

// Configure security
file.set_deny_write(true)  // Read-only mode
file.set_max_read_size(1000000)  // 1MB limit

// Read file (returns Result<string>)
result := file.read_file('/path/to/file.txt')
if result.is_ok() {
    content := result.value
    println('File content: ${content}')
} else {
    err := result.error
    eprintln('Error: ${err.message}')
}

// List directory
dir_result := file.list_directory('/path')
for entry in dir_result.files {
    println('${entry.name} - ${if entry.is_dir { 'DIR' } else { 'FILE' }}')
}

// Create/delete operations
file.create_directory('/path/new_dir')
file.delete_file_or_directory('/path/to/delete')
```

**File**: `src/file_service.v`  
**Methods**: `read_file()`, `list_directory()`, `create_directory()`, `delete_file_or_directory()`

---

### NetworkService

Network interface and connectivity management.

```v
mut network := NetworkService{}
network.initialize() or { return }

// Get network information
interfaces := network.get_network_interfaces()
for iface in interfaces {
    println('${iface.name}: RX ${iface.rx_bytes} TX ${iface.tx_bytes}')
}

// Get statistics
stats := network.get_network_stats()
println('Total RX: ${stats.total_rx_mb} MB')
println('Total TX: ${stats.total_tx_mb} MB')

// Check connectivity
if network.is_network_available() {
    println('Network is available')
}
```

**File**: `src/network_service.v`  
**Methods**: `get_network_interfaces()`, `get_network_stats()`, `get_ip_addresses()`, `is_network_available()`

---

### ConfigService

Application configuration management.

```v
mut config := ConfigService{}
config.initialize() or { return }

// Set defaults
config.set_default_string('app.name', 'My Application')
config.set_default_int('app.max_retries', 3)
config.set_default_bool('app.debug_mode', true)

// Get values
name := config.get_string('app.name')
max_retries := config.get_int('app.max_retries')
debug := config.get_bool('app.debug_mode')

// Get app configuration
app_config := config.get_app_config()
println('Running ${app_config.app_name} v${app_config.app_version}')
```

**File**: `src/config_service.v`  
**Methods**: `get()`, `set()`, `get_string()`, `get_int()`, `get_bool()`, `get_app_config()`

---

## Service Provider

The `service_provider.v` module coordinates service registration and lifecycle:

```v
// Register all services in container
pub fn register_services_in_container(mut c core.ServiceContainer) {
    mut logging := LoggingService{}
    c.register_singleton('logging', &logging)
    
    mut system_info := SystemInfoService{}
    c.register_singleton('system_info', &system_info)
    
    mut file := FileService{}
    c.register_singleton('file', &file)
    
    mut network := NetworkService{}
    c.register_singleton('network', &network)
    
    mut config := ConfigService{}
    c.register_singleton('config', &config)
}

// Initialize all services
pub fn initialize_services(mut c core.ServiceContainer) {
    if mut logging_ptr := c.resolve('logging') {
        mut logging := unsafe { logging_ptr as &LoggingService }
        logging.initialize()
    }
    // ... initialize other services
}

// Shutdown all services
pub fn shutdown_services(mut c core.ServiceContainer) {
    if mut logging_ptr := c.resolve('logging') {
        mut logging := unsafe { logging_ptr as &LoggingService }
        logging.shutdown()
    }
    // ... shutdown other services
}
```

---

## Application Integration

The `app.v` module provides an application wrapper that uses DI:

```v
pub struct App {
mut:
    container     core.ServiceContainer
    logging       &LoggingService
    system_info   &SystemInfoService
    file          &FileService
    network       &NetworkService
    config        &ConfigService
    app_name      string
}

pub fn new_app(app_name string, app_version string) App {
    mut container := core.new_service_container()
    
    // Register and initialize services
    service_provider.register_services_in_container(mut container)
    service_provider.initialize_services(mut container)
    
    // Resolve services
    logging_ptr := container.get_required_service('logging')
    
    return App{
        container: container
        logging: unsafe { logging_ptr as &LoggingService }
        // ... resolve other services
        app_name: app_name
    }
}

pub fn (mut app App) initialize() {
    app.logging.info('Starting ${app.app_name}')
}

pub fn (mut app App) shutdown() {
    service_provider.shutdown_services(mut app.container)
}
```

---

## Errors as Values Integration

All services use the **Errors as Values** pattern with `Result<T>` types:

```v
// Service method returning Result
pub fn (mut s FileService) read_file(path string) errors.Result<string> {
    if !s.validate_path(path) {
        return errors.err<string>(
            errors.validation_error('path', 'Invalid path')
                .context('path', path)
                .build()
        )
    }
    
    content := os.read_file(path) or {
        return errors.err<string>(
            errors.io_error('read_file', 'Failed to read: ${path}')
                .build()
        )
    }
    
    return errors.ok(content)
}

// Calling code handles errors explicitly
result := file.read_file('config.json')
if result.is_err() {
    logging.error('Failed: ${result.error.message}')
    return
}
content := result.value
```

See [Errors as Values Pattern](11-errors-as-values-pattern.md) for complete documentation.

---

## Testing

### Unit Tests

```v
fn test_logging_service() {
    mut logging := LoggingService{}
    assert logging.initialize().is_ok()
    
    logging.info('Test message')
    assert logging.get_statistics()['info'] == 1
    
    logging.shutdown()
}

fn test_file_service() {
    mut file := FileService{}
    file.initialize() or { assert false }
    
    result := file.read_file('/etc/hostname')
    assert result.is_ok()
}
```

### Integration Tests

```v
fn test_service_container() {
    mut container := core.new_service_container()
    service_provider.register_services_in_container(mut container)
    service_provider.initialize_services(mut container)
    
    // Verify all services are registered
    assert container.has_service('logging')
    assert container.has_service('system_info')
    assert container.has_service('file')
    assert container.has_service('network')
    assert container.has_service('config')
    
    // Verify services can be resolved
    assert container.resolve('logging') != none
}
```

Run tests with:
```bash
v test ./src/errors
v test ./src
```

---

## Best Practices

### 1. Always Initialize Services

```v
// BAD: Using uninitialized service
mut logging := LoggingService{}
logging.info('Message')  // May fail

// GOOD: Check initialization
mut logging := LoggingService{}
logging.initialize() or {
    eprintln('Failed to initialize')
    return
}
logging.info('Message')
```

### 2. Handle Result Types

```v
// BAD: Ignoring Result
file.read_file('config.json')

// GOOD: Explicit handling
result := file.read_file('config.json')
if result.is_err() {
    logging.error('${result.error.message}')
    return
}
```

### 3. Use Service Provider

```v
// BAD: Manual service creation throughout app
mut logging1 := LoggingService{}
mut logging2 := LoggingService{}  // Duplicate!

// GOOD: Use DI container
mut container := core.new_service_container()
service_provider.initialize_services(mut container)
logging := container.get_required_service('logging')
```

### 4. Shutdown Gracefully

```v
// Always shutdown services on exit
defer {
    service_provider.shutdown_services(mut container)
}
```

---

## Migration Notes

### From Legacy Error Handling

**Before:**
```v
fn read_file(path string) ?string {
    return os.read_file(path) or { return none }
}
```

**After:**
```v
fn read_file(path string) errors.Result<string> {
    return os.read_file(path) or {
        return errors.err<string>(errors.io_error('read', 'Failed'))
    }
}
```

### From Global State

**Before:**
```v
mut global_logging := LoggingService{}

fn main() {
    global_logging.initialize()
}
```

**After:**
```v
fn main() {
    mut container := core.new_service_container()
    service_provider.initialize_services(mut container)
    logging := container.get_required_service('logging')
}
```

---

## Related Documentation

- [Errors as Values Pattern](11-errors-as-values-pattern.md) - Error handling with Result types
- [Testing Guide](20-testing-guide.md) - Backend and frontend testing
- [Running the App](02-running-the-app.md) - Application startup guide
- [Angular Dependency Injection](../frontend/docs/10-angular-dependency-injection.md) - Frontend DI patterns

---

## API Reference

### ServiceContainer Methods

| Method | Description |
|--------|-------------|
| `new_service_container()` | Create new container |
| `register_singleton(name, instance)` | Register singleton service |
| `register_factory(name, lifetime, fn)` | Register factory service |
| `resolve(name)` | Resolve service (returns `?voidptr`) |
| `get_required_service(name)` | Resolve or panic |
| `has_service(name)` | Check if registered |
| `build()` | Lock container |

### Result Methods

| Method | Description |
|--------|-------------|
| `is_ok()` | Check if success |
| `is_err()` | Check if error |
| `unwrap()` | Get value or panic |
| `unwrap_or(default)` | Get value or default |
| `map(fn)` | Transform success value |
| `and_then(fn)` | Chain operations |
| `inspect(fn)` | Side effect on success |
| `inspect_err(fn)` | Side effect on error |

---

*Last updated: 2026-03-14*
