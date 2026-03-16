# Backend Services Documentation

## Overview

The backend consists of modular services that provide various functionalities. Each service is self-contained and follows a consistent API pattern.

---

## Service Architecture

All services are located in `src/services/` and follow this pattern:

```v
@[heap]
pub struct ServiceName {
mut:
    // Mutable state
}

// Factory function
pub fn create_service() &ServiceName {
    return &ServiceName{}
}

// Initialize
pub fn (mut service ServiceName) initialize() {
    // Initialization logic
}

// Public methods
pub fn (service ServiceName) method_name() ReturnType {
    // Implementation
}
```

---

## Services Reference

### LoggingService

**File**: `src/services/logging_service.v`

**Purpose**: Centralized logging with multiple levels and export capabilities.

**Methods**:

```v
// Initialize service
pub fn (mut service LoggingService) initialize()

// Set minimum log level
pub fn (mut service LoggingService) set_min_level(level string)

// Log at different levels
pub fn (mut service LoggingService) info(message string)
pub fn (mut service LoggingService) debug(message string)
pub fn (mut service LoggingService) warning(message string)
pub fn (mut service LoggingService) error(message string)

// Log with context
pub fn (mut service LoggingService) log(level string, message string, context map[string]string)

// Get log entries
pub fn (service LoggingService) get_entries() []LogEntry

// Export logs to file
pub fn (service LoggingService) export_logs(path string) !

// Clear logs
pub fn (mut service LoggingService) clear()
```

**Usage Example**:

```v
mut logging := LoggingService{}
logging.initialize()
logging.set_min_level('debug')

logging.info('Application started')
logging.error('Error occurred', {'user_id': '123'})

// Export logs
logging.export_logs('/path/to/logs.txt') or {
    println('Failed to export: ${err}')
}
```

---

### SystemInfoService

**File**: `src/services/system_info_service.v`

**Purpose**: System monitoring and information retrieval.

**Methods**:

```v
// Initialize service
pub fn (mut service SystemInfoService) initialize()

// Get system information
pub fn (service SystemInfoService) get_system_info_json() string
pub fn (service SystemInfoService) get_memory_stats_json() string
pub fn (service SystemInfoService) get_cpu_info_json() string
pub fn (service SystemInfoService) get_cpu_usage_json() string
pub fn (service SystemInfoService) get_disk_usage_json() string
pub fn (service SystemInfoService) get_disk_partitions_json() string
pub fn (service SystemInfoService) get_network_interfaces_json() string
pub fn (service SystemInfoService) get_network_stats_json() string
pub fn (service SystemInfoService) get_system_load_json() string
pub fn (service SystemInfoService) get_uptime_json() string
pub fn (service SystemInfoService) get_hostname_info_json() string
pub fn (service SystemInfoService) get_hardware_info_json() string
pub fn (service SystemInfoService) get_sensor_temperatures_json() string
pub fn (service SystemInfoService) list_processes_json(limit int) string
pub fn (service SystemInfoService) get_environment_variables_json() string

// Shutdown service
pub fn (mut service SystemInfoService) shutdown()
```

**Usage Example**:

```v
mut sys := SystemInfoService{}
sys.initialize()

memory := sys.get_memory_stats_json()
cpu := sys.get_cpu_usage_json()
disk := sys.get_disk_usage_json()
```

**Response Format**:

```json
{
  "total_mb": 8192,
  "used_mb": 4096,
  "free_mb": 4096,
  "percent_used": "50.0"
}
```

---

### FileService

**File**: `src/services/file_service.v`

**Purpose**: Secure file operations with path validation.

**Methods**:

```v
// Initialize service
pub fn (mut service FileService) initialize()

// Configure security
pub fn (mut service FileService) set_deny_write(deny bool)
pub fn (service FileService) is_path_safe(path string) bool

// File operations
pub fn (service FileService) read_file(path string) string
pub fn (service FileService) read_file_json(path string) string
pub fn (service FileService) browse_directory(path string) string
pub fn (service FileService) create_directory(path string) string
pub fn (service FileService) delete_file_or_directory(path string) string

// Shutdown service
pub fn (mut service FileService) shutdown()
```

**Security Features**:

- Path traversal protection (blocks ../)
- Sensitive path blocking (/etc/, /root/, /proc/, /sys/)
- Null byte rejection
- Configurable write protection

**Usage Example**:

```v
mut file := FileService{}
file.initialize()
file.set_deny_write(true)

// Check path safety
if file.is_path_safe('/home/user/file.txt') {
    content := file.read_file('/home/user/file.txt')
}

// Browse directory
files := file.browse_directory('/home/user')
```

---

### NetworkService

**File**: `src/services/network_service.v`

**Purpose**: Network information and statistics.

**Methods**:

```v
// Initialize service
pub fn (mut service NetworkService) initialize()

// Get network information
pub fn (service NetworkService) get_network_interfaces_json() string
pub fn (service NetworkService) get_network_stats_json() string
pub fn (service NetworkService) get_ip_addresses_json() string
pub fn (service NetworkService) is_network_available() bool

// Shutdown service
pub fn (mut service NetworkService) shutdown()
```

**Usage Example**:

```v
mut network := NetworkService{}
network.initialize()

interfaces := network.get_network_interfaces_json()
stats := network.get_network_stats_json()
ips := network.get_ip_addresses_json()
```

---

### ConfigService

**File**: `src/services/config_service.v`

**Purpose**: Configuration management.

**Methods**:

```v
// Initialize service
pub fn (mut service ConfigService) initialize()

// Get/set values
pub fn (service ConfigService) get_string(key string) string
pub fn (service ConfigService) get_int(key string) int
pub fn (service ConfigService) get_bool(key string) bool
pub fn (mut service ConfigService) set_default_string(key string, value string)
pub fn (mut service ConfigService) set_default_int(key string, value int)
pub fn (mut service ConfigService) set_default_bool(key string, value bool)

// Get app configuration
pub fn (service ConfigService) get_app_config() AppConfig

// Shutdown service
pub fn (mut service ConfigService) shutdown()
```

**Usage Example**:

```v
mut config := ConfigService{}
config.initialize()

config.set_default_string('app.name', 'My App')
config.set_default_int('app.max_retries', 3)

name := config.get_string('app.name')
max_retries := config.get_int('app.max_retries')
```

---

### DatabaseService

**File**: `src/services/database.v`

**Purpose**: SQLite database with JSON file-based persistence.

**Methods**:

```v
// Initialize service
pub fn (mut service DatabaseService) initialize() !

// CRUD operations
pub fn (service DatabaseService) get_all_users() []models.User
pub fn (service DatabaseService) get_user_by_id(id int) ?models.User
pub fn (service DatabaseService) get_user_by_email(email string) ?models.User
pub fn (mut service DatabaseService) create_user(user models.User) !models.User
pub fn (mut service DatabaseService) update_user(id int, user models.User) !models.User
pub fn (mut service DatabaseService) delete_user(id int) !

// Search and filter
pub fn (service DatabaseService) search_users(query string) []models.User
pub fn (service DatabaseService) get_users_by_status(status string) []models.User

// Statistics
pub fn (service DatabaseService) get_stats() map[string]int

// Shutdown service
pub fn (mut service DatabaseService) shutdown()
```

**Usage Example**:

```v
mut db := DatabaseService{}
db.initialize() or {
    println('Failed to initialize: ${err}')
    return
}

// Get all users
users := db.get_all_users()

// Create user
new_user := models.new_user('John', 'john@example.com')
created := db.create_user(new_user) or {
    println('Failed: ${err}')
}

// Search users
results := db.search_users('john')
```

---

### UserService

**File**: `src/services/user_service.v`

**Purpose**: User management wrapper with JSON API for WebUI.

**Methods**:

```v
// Initialize service
pub fn (mut service UserService) initialize() !

// JSON API for WebUI
pub fn (service UserService) get_users_json() string
pub fn (service UserService) get_user_json(id int) string
pub fn (mut service UserService) save_user_json(data string) string
pub fn (mut service UserService) delete_user_json(id int) string
pub fn (service UserService) search_users_json(query string) string
pub fn (service UserService) get_users_by_status_json(status string) string
pub fn (service UserService) get_stats_json() string

// Shutdown service
pub fn (mut service UserService) shutdown()
```

**Usage Example**:

```v
mut user_service := UserService{}
user_service.initialize() or {
    println('Failed: ${err}')
    return
}

// Get users as JSON
users_json := user_service.get_users_json()

// Save user from JSON
user_json := '{"name":"John","email":"john@example.com"}'
result := user_service.save_user_json(user_json)
```

---

### DevToolsService

**File**: `src/services/devtools_service.v`

**Purpose**: Development tools and diagnostics.

**Methods**:

```v
// Initialize service
pub fn (mut service DevToolsService) initialize()

// Get diagnostics
pub fn (service DevToolsService) get_system_info_json() string
pub fn (service DevToolsService) get_memory_info_json() string
pub fn (service DevToolsService) get_process_info_json() string
pub fn (service DevToolsService) get_network_info_json() string
pub fn (service DevToolsService) get_database_info_json(db_path string) string
pub fn (service DevToolsService) get_config_info_json() string
pub fn (service DevToolsService) get_performance_metrics_json() string
pub fn (service DevToolsService) get_events_json() string
pub fn (service DevToolsService) get_bindings_json() string
pub fn (service DevToolsService) get_logs_json() string

// Management
pub fn (mut service DevToolsService) clear_events()
pub fn (mut service DevToolsService) clear_logs()

// Shutdown service
pub fn (mut service DevToolsService) shutdown()
```

**Usage Example**:

```v
mut devtools := DevToolsService{}
devtools.initialize()

system_info := devtools.get_system_info_json()
memory_info := devtools.get_memory_info_json()
events := devtools.get_events_json()
```

---

## Service Initialization Order

Services should be initialized in this order:

1. LoggingService (required by other services)
2. ConfigService
3. DatabaseService
4. UserService (depends on DatabaseService)
5. SystemInfoService
6. FileService
7. NetworkService
8. DevToolsService

Example:

```v
mut logging := LoggingService{}
logging.initialize()

mut config := ConfigService{}
config.initialize()

mut db := DatabaseService{}
db.initialize() or {
    logging.error('Failed to initialize database')
    return
}

mut user := UserService{}
user.initialize() or {
    logging.error('Failed to initialize user service')
}
```

---

## Error Handling

All services use V's error handling pattern:

```v
// Functions that can fail return !
pub fn (mut service Service) operation() ! {
    // Can return error
    if condition {
        return error('Error message')
    }
}

// Handle with or {}
service.operation() or {
    println('Failed: ${err}')
    return
}

// Or propagate
service.operation() or {
    return error('Operation failed: ${err}')
}
```

---

## Testing Services

Each service has corresponding test files:

```
src/services/
├── logging_service.v
├── logging_service_test.v
├── system_info_service.v
├── system_info_service_test.v
├── file_service.v
├── file_service_test.v
├── network_service.v
├── network_service_test.v
├── database.v
├── database_test.v
├── user_service.v
└── user_service_test.v
```

Run tests:

```bash
v test ./src/services
```

---

*Last updated: 2026-03-16*
*Version: 1.0*
