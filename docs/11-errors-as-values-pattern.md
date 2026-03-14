# Errors as Values Pattern

> **Category**: Backend Architecture  
> **Updated**: 2026-03-14  
> **Related**: [Backend DI](10-backend-dependency-injection.md), [Testing Guide](20-testing-guide.md)

---

## Overview

The V backend implements the **"Errors as Values"** pattern, treating errors as regular values that are explicitly returned and handled rather than using exceptions or panic-based error handling. This approach is inspired by Rust's `Result<T, E>` type and functional programming error handling.

---

## Philosophy

### Core Principles

1. **Explicit Error Handling** - Errors must be explicitly handled, not silently ignored
2. **No Hidden Control Flow** - No exceptions that jump up the call stack unexpectedly
3. **Rich Error Context** - Errors carry detailed information about what went wrong
4. **Composability** - Error handling can be composed and chained elegantly
5. **Type Safety** - The type system enforces error handling

### Why Errors as Values?

```v
// Traditional V: Error might be ignored
content := os.read_file(path) or {
    // Easy to forget this block
    return
}

// Errors as Values: Compiler forces handling
result := read_file(path)
// MUST handle result - can't ignore it
if result.is_err() {
    handle_error(result.error)
}
```

---

## Core Types

### Result<T>

The `Result<T>` type represents either a successful value (`Ok`) or an error (`Err`):

```v
import errors

// Success case
result := errors.ok<User>(user)
if result.is_ok() {
    user := result.value
    println('Got user: ${user.name}')
}

// Error case
result := errors.err<User>(error)
if result.is_err() {
    println('Error: ${result.error.message}')
}
```

### Option<T>

The `Option<T>` type represents either a value (`Some`) or absence (`None`):

```v
// Some value
opt := errors.some<int>(42)
if opt.is_some() {
    println('Value: ${opt.value}')
}

// None
opt := errors.none<int>()
if opt.is_none() {
    println('No value')
}
```

### AppError

The `AppError` struct carries rich error information:

```v
pub struct AppError {
    id                  string              // Unique identifier
    message             string              // Human-readable message
    details             string              // Technical details
    severity            ErrorSeverity       // trace, debug, info, warning, error, critical, fatal
    category            ErrorCategory       // system, filesystem, network, etc.
    operation           string              // Operation that failed
    source              string              // Source location
    timestamp           string              // When it occurred
    cause               ?AppError           // Underlying cause (error chains)
    context             map[string]string   // Additional context
    recovery_suggestion string              // How to fix it
    is_recoverable      bool                // Can be retried
    retry_count         int                 // Current retry count
    max_retries         int                 // Maximum retries
}
```

---

## Creating Errors

### Using ErrorBuilder (Recommended)

```v
import errors

// Simple error
err := errors.error_builder()
    .message('File not found')
    .category(.filesystem)
    .severity(.error)
    .operation('read_file')
    .context('path', '/path/to/file')
    .build()

// Error with recovery suggestion
err := errors.error_builder()
    .message('Database connection failed')
    .category(.network)
    .severity(.critical)
    .operation('connect')
    .recovery_suggestion('Check database server is running')
    .recoverable()
    .max_retries(3)
    .build()

// Error chain (wrapping underlying cause)
underlying_err := errors.io_error('open', 'Permission denied')
err := errors.error_builder()
    .message('Failed to load configuration')
    .category(.configuration)
    .cause(underlying_err)
    .build()
```

### Using Convenience Functions

```v
// Validation error
err := errors.validation_error('email', 'Invalid email format')

// Not found error
err := errors.not_found_error('User', '123')

// Internal error
err := errors.internal_error('Unexpected state in state machine')

// IO error
err := errors.io_error('write', 'Disk full')

// Network error (automatically recoverable)
err := errors.network_error('request', 'Timeout after 30s')

// Serialization error
err := errors.serialization_error('Invalid JSON format')

// Authentication error
err := errors.auth_error('Invalid credentials')

// Permission denied
err := errors.permission_denied_error('admin_panel')
```

---

## Working with Results

### Basic Pattern Matching

```v
result := some_operation()

// Pattern 1: Explicit check
if result.is_ok() {
    value := result.value
    // Use value
} else {
    err := result.error
    // Handle error
}

// Pattern 2: Unwrap with default
value := result.unwrap_or(default_value)

// Pattern 3: Unwrap or else
value := result.unwrap_or_else(fn (err AppError) string {
    log_error(err)
    return 'default'
})

// Pattern 4: Expect with message
value := result.expect('Operation must succeed')
```

### Functional Transformations

```v
// Map: Transform the success value
result := read_file('config.json')
parsed := result.map(fn (content string) Config {
    return parse_config(content)
})

// Map Err: Transform the error
result := operation().map_err(fn (err AppError) AppError {
    return errors.error_builder()
        .message('Wrapped: ${err.message}')
        .cause(err)
        .build()
})

// And Then: Chain operations (flat map)
result := get_user(id)
    .and_then(fn (user User) errors.Result<Profile> {
        return get_profile(user.profile_id)
    })
    .and_then(fn (profile Profile) errors.Result<Settings> {
        return get_settings(profile.settings_id)
    })

// Inspect: Side effects without consuming
result := operation()
    .inspect(fn (value string) {
        println('Success: ${value}')
    })
    .inspect_err(fn (err AppError) {
        log_error(err)
    })
```

### Converting Results

```v
// Result to Option (discard error)
opt := result.ok_option()

// Result to Option (discard success)
err_opt := result.err_option()

// Result to JSON
json_str := result.to_json()
```

---

## Error Collection

Use `ErrorCollector` to accumulate multiple errors:

```v
import errors

mut collector := errors.new_error_collector()

// Add individual errors
collector.add(errors.validation_error('name', 'Required'))
collector.add(errors.validation_error('email', 'Invalid format'))

// Add from Result
result := validate_age(age)
collector.add_result(result)

// Check for errors
if collector.has_errors() {
    // Get all errors
    all_errors := collector.get_all()
    
    // Get by severity
    critical := collector.by_severity(.critical)
    
    // Get by category
    validation_errors := collector.by_category(.validation)
    
    // Combine into single error
    combined_result := collector.combine_or_ok('Validation failed')
}

// Convert to JSON
json_str := collector.to_json()
```

---

## Retry Logic

Use `with_retry` for automatic retry with exponential backoff:

```v
import errors

config := errors.default_retry_config()
config.max_attempts = 5
config.initial_delay_ms = 100
config.max_delay_ms = 10000

// Custom retry condition
config.retry_on = fn (err AppError) bool {
    return err.is_recoverable && err.category == .network
}

result := errors.with_retry(fn () errors.Result<string> {
    return make_network_request()
}, config)

// Check results
if result.result.is_ok() {
    println('Success after ${result.attempts} attempts')
} else {
    println('Failed after ${result.attempts} attempts: ${result.last_error.message}')
    println('Total delay: ${result.total_delay_ms}ms')
}
```

---

## Service Examples

### LoggingService

```v
mut logging := LoggingService{}

// Initialize returns Result
init_result := logging.initialize()
if init_result.is_err() {
    println('Failed to initialize logging: ${init_result.error.message}')
    return
}

// Export logs returns Result
export_result := logging.export_logs('/path/to/logs.txt')
export_result.inspect_err(fn (err AppError) {
    eprintln('Failed to export logs: ${err.message}')
})
```

### FileService

```v
mut file := FileService{}
file.initialize() or {
    println('Failed to initialize file service')
    return
}

// Read file - returns Result<string>
result := file.read_file('/path/to/file.txt')

// Handle with pattern matching
if result.is_ok() {
    content := result.value
    println('File content: ${content}')
} else {
    err := result.error
    println('Error reading file: ${err.message}')
    
    // Check if recoverable
    if err.is_recoverable {
        println('Suggestion: ${err.recovery_suggestion}')
    }
}

// Or use functional style
content := file.read_file('/path/to/file.txt')
    .map(fn (data string) string {
        return data.trim_space()
    })
    .unwrap_or('default content')
```

---

## Best Practices

### 1. Always Handle Errors

```v
// BAD: Ignoring the Result
some_operation()

// GOOD: Explicit handling
result := some_operation()
if result.is_err() {
    // Handle error
}
```

### 2. Provide Context

```v
// BAD: Generic error
err := errors.internal_error('Failed')

// GOOD: Detailed context
err := errors.error_builder()
    .message('Failed to process user request')
    .operation('process_request')
    .context('user_id', user.id)
    .context('request_type', request.type)
    .context('timestamp', time.now().str())
    .build()
```

### 3. Chain Errors Appropriately

```v
// Wrap lower-level errors with higher-level context
result := read_config_file(path)
if result.is_err() {
    return errors.err<Config>(
        errors.error_builder()
            .message('Failed to load application configuration')
            .category(.configuration)
            .cause(result.error)
            .build()
    )
}
```

### 4. Use Appropriate Severity

```v
// Warning: Something unexpected but not critical
errors.error_builder().severity(.warning).build()

// Error: Operation failed but application can continue
errors.error_builder().severity(.error).build()

// Critical: Immediate attention required
errors.error_builder().severity(.critical).build()
```

### 5. Mark Recoverable Errors

```v
// Network errors are often transient
err := errors.network_error('request', 'Timeout')
    .recoverable()
    .max_retries(3)
    .build()

// Validation errors are not recoverable by retry
err := errors.validation_error('email', 'Invalid format')
    .build()
```

---

## Migration Guide

### From Boolean Returns to Result

**Before:**
```v
fn read_file(path string) ?string {
    content := os.read_file(path) or {
        return none
    }
    return content
}

// Usage
content := read_file('config.json') or {
    println('Failed to read file')
    return
}
```

**After:**
```v
fn read_file(path string) errors.Result<string> {
    content := os.read_file(path) or {
        return errors.err<string>(
            errors.io_error('read_file', 'Failed to read: ${path}')
                .context('path', path)
                .build()
        )
    }
    return errors.ok(content)
}

// Usage
result := read_file('config.json')
if result.is_err() {
    println('Error: ${result.error.message}')
    return
}
content := result.value
```

### From Panic to Result

**Before:**
```v
fn get_user(id int) User {
    if id <= 0 {
        panic('Invalid user ID: ${id}')
    }
    // ...
}
```

**After:**
```v
fn get_user(id int) errors.Result<User> {
    if id <= 0 {
        return errors.err<User>(
            errors.validation_error('id', 'Invalid user ID')
                .context('id', id.str())
                .build()
        )
    }
    // ...
    return errors.ok(user)
}
```

---

## Testing

```v
fn test_result_ok() {
    result := errors.ok<int>(42)
    assert result.is_ok()
    assert !result.is_err()
    assert result.unwrap() == 42
}

fn test_result_err() {
    err := errors.internal_error('test error')
    result := errors.err<string>(err)
    assert result.is_err()
    assert !result.is_ok()
    assert result.error.message == 'test error'
}

fn test_result_map() {
    result := errors.ok<int>(42)
    mapped := result.map(fn (v int) string {
        return 'value: ${v}'
    })
    assert mapped.unwrap() == 'value: 42'
}

fn test_result_chain() {
    result := errors.ok<int>(10)
        .and_then(fn (v int) errors.Result<int> {
            return errors.ok(v * 2)
        })
        .and_then(fn (v int) errors.Result<int> {
            return errors.ok(v + 5)
        })
    assert result.unwrap() == 25
}

fn test_error_collector() {
    mut collector := errors.new_error_collector()
    collector.add(errors.validation_error('a', 'error a'))
    collector.add(errors.validation_error('b', 'error b'))
    
    assert collector.has_errors()
    assert collector.count() == 2
}
```

Run tests with:
```bash
v test ./src/errors
```

---

## API Reference

### Result<T> Methods

| Method | Description |
|--------|-------------|
| `is_ok()` | Check if Result is Ok |
| `is_err()` | Check if Result is Err |
| `unwrap()` | Get value or panic |
| `unwrap_or(default)` | Get value or default |
| `unwrap_or_else(fn)` | Get value or call function |
| `expect(msg)` | Get value or panic with message |
| `unwrap_err()` | Get error or panic |
| `map(fn)` | Transform success value |
| `map_err(fn)` | Transform error value |
| `and_then(fn)` | Chain operations |
| `inspect(fn)` | Side effect on success |
| `inspect_err(fn)` | Side effect on error |
| `ok_option()` | Convert to Option (success) |
| `err_option()` | Convert to Option (error) |
| `to_json()` | Convert to JSON string |

### Option<T> Methods

| Method | Description |
|--------|-------------|
| `is_some()` | Check if Option has value |
| `is_none()` | Check if Option is None |
| `unwrap()` | Get value or panic |
| `unwrap_or(default)` | Get value or default |
| `unwrap_or_else(fn)` | Get value or call function |
| `map(fn)` | Transform value |
| `and_then(fn)` | Chain operations |
| `inspect(fn)` | Side effect on Some |
| `is_matching(fn)` | Check if value matches predicate |

### ErrorBuilder Methods

| Method | Description |
|--------|-------------|
| `message(msg)` | Set error message |
| `details(dtl)` | Set technical details |
| `severity(sev)` | Set severity level |
| `category(cat)` | Set category |
| `operation(op)` | Set operation name |
| `source(src)` | Set source location |
| `cause(err)` | Set underlying cause |
| `context(key, value)` | Add context pair |
| `context_many(pairs)` | Add multiple context pairs |
| `recovery_suggestion(s)` | Set recovery suggestion |
| `recoverable()` | Mark as recoverable |
| `max_retries(n)` | Set max retries |
| `build()` | Build the error |
| `err<T>()` | Build and wrap in Err |

### ErrorCategory Values

| Category | Description |
|----------|-------------|
| `.system` | Operating system errors |
| `.filesystem` | File/directory errors |
| `.memory` | Memory errors |
| `.network` | Network errors |
| `.database` | Database errors |
| `.validation` | Input validation errors |
| `.serialization` | JSON/encoding errors |
| `.configuration` | Config loading errors |
| `.authentication` | Auth errors |
| `.business` | Business logic errors |
| `.external` | Third-party errors |
| `.unknown` | Unclassified errors |

### ErrorSeverity Values

| Severity | Description |
|----------|-------------|
| `.trace` | Very detailed debugging |
| `.debug` | Diagnostic information |
| `.info` | Normal but significant |
| `.warning` | Potentially harmful |
| `.error` | Operation failed |
| `.critical` | Immediate attention |
| `.fatal` | Application terminating |

---

## Related Documentation

- [Backend Dependency Injection](10-backend-dependency-injection.md) - Service architecture
- [Testing Guide](20-testing-guide.md) - Testing patterns
- [Angular Error Handling](../frontend/docs/21-error-handling-patterns.md) - Frontend error patterns

---

*Last updated: 2026-03-14*
