# DevTools Backend Services Documentation

Project: Vlang WebUI Angular Application
Date: 2026-03-15
Version: 1.0

---

## Overview

The DevTools backend services provide comprehensive system information and diagnostics for the Angular frontend DevTools panel. These services expose real-time data about system resources, application state, backend function bindings, and more.

---

## Architecture

```
+-------------------+     WebUI      +---------------------+
|  Angular          |   Bindings     |  V Backend          |
|  DevTools Panel   | <----------->  |  DevToolsService    |
|                   |                |                     |
|  - System Tab     |                |  - System Info      |
|  - Memory Tab     |                |  - Memory Info      |
|  - Process Tab    |                |  - Process Info     |
|  - Network Tab    |                |  - Network Info     |
|  - Database Tab   |                |  - Database Info    |
|  - Config Tab     |                |  - Config Info      |
|  - Performance    |                |  - Performance      |
|  - Events Tab     |                |  - Event Logging    |
|  - Bindings Tab   |                |  - Function Tracking|
|  - Logs Tab       |                |  - Log Management   |
+-------------------+                +---------------------+
```

---

## Backend Service: DevToolsService

### Location
`src/services/devtools_service.v`

### Purpose
Provides comprehensive system information and diagnostics data for the DevTools panel.

### Data Structures

#### EventLogEntry
```v
pub struct EventLogEntry {
pub mut:
	id        int
	timestamp string
	type      string  // 'info', 'warn', 'error', 'debug', 'system'
	source    string
	message   string
	data      map[string]string
}
```

#### BackendBinding
```v
pub struct BackendBinding {
pub mut:
	name           string
	bound          bool
	call_count     int
	last_called    string
	avg_response   int  // milliseconds
}
```

#### LogEntry
```v
pub struct LogEntry {
pub mut:
	level     string
	timestamp string
	target    string
	message   string
	file      string
	line      int
}
```

### Initialization

```v
mut devtools := services.DevToolsService{}
devtools.initialize()
```

### Shutdown

```v
devtools.shutdown()
```

---

## API Reference

### System Information

#### get_system_info_json() string

Returns comprehensive system information.

**Response**:
```json
{
  "hostname": "mycomputer",
  "username": "user",
  "os": "linux",
  "arch": "x86_64",
  "cpu_count": 8,
  "rust_version": "N/A",
  "app_version": "1.0.0",
  "build_time": "2026-03-15 10:30:00"
}
```

**Usage**:
```v
info := devtools.get_system_info_json()
```

---

### Memory Information

#### get_memory_info_json() string

Returns memory usage statistics.

**Response**:
```json
{
  "total_mb": 16384,
  "used_mb": 8192,
  "free_mb": 8192,
  "percent_used": "50.0"
}
```

**Usage**:
```v
info := devtools.get_memory_info_json()
```

---

### Process Information

#### get_process_info_json() string

Returns current process information.

**Response**:
```json
{
  "pid": 12345,
  "name": "desktopapp",
  "cpu_percent": 2.5,
  "memory_mb": 45.6,
  "threads": 4,
  "uptime_seconds": 3600,
  "start_time": "2026-03-15 09:30:00"
}
```

**Usage**:
```v
info := devtools.get_process_info_json()
```

---

### Network Information

#### get_network_info_json() string

Returns network interface information.

**Response**:
```json
{
  "interfaces": [
    {
      "name": "lo",
      "ip": "127.0.0.1",
      "mac": "00:00:00:00:00:00",
      "is_up": true
    },
    {
      "name": "eth0",
      "ip": "192.168.1.100",
      "mac": "aa:bb:cc:dd:ee:ff",
      "is_up": true
    }
  ],
  "default_port": 0,
  "is_webui_bound": true
}
```

**Usage**:
```v
info := devtools.get_network_info_json()
```

---

### Database Information

#### get_database_info_json(db_path string) string

Returns database statistics and schema information.

**Parameters**:
- `db_path` - Path to database file

**Response**:
```json
{
  "path": "users.db.json",
  "size_kb": 12,
  "table_count": 1,
  "tables": [
    {
      "name": "users",
      "row_count": 5,
      "size_kb": 12,
      "columns": [
        {"name": "id", "type": "INTEGER", "nullable": false, "is_primary_key": true},
        {"name": "name", "type": "TEXT", "nullable": false, "is_primary_key": false},
        {"name": "email", "type": "TEXT", "nullable": false, "is_primary_key": false},
        {"name": "role", "type": "TEXT", "nullable": false, "is_primary_key": false},
        {"name": "status", "type": "TEXT", "nullable": false, "is_primary_key": false}
      ]
    }
  ],
  "connection_pool_size": 1,
  "active_connections": 0
}
```

**Usage**:
```v
info := devtools.get_database_info_json('users.db.json')
```

---

### Configuration Information

#### get_config_info_json() string

Returns application configuration.

**Response**:
```json
{
  "app_name": "Desktop App",
  "version": "1.0.0",
  "log_level": "debug",
  "log_file": "logs/app.log",
  "database_path": "data/users.db.json",
  "port": 0,
  "debug_mode": false,
  "features": ["system_monitoring", "file_operations", "network_info", "database"]
}
```

**Usage**:
```v
info := devtools.get_config_info_json()
```

---

### Performance Metrics

#### get_performance_metrics_json() string

Returns performance metrics (to be merged with frontend metrics).

**Response**:
```json
{
  "fps": 60,
  "dom_nodes": 0,
  "js_heap_size_mb": 0,
  "js_heap_used_mb": 0,
  "event_listeners": 0,
  "open_windows": 0,
  "active_timers": 0,
  "pending_requests": 0
}
```

**Usage**:
```v
info := devtools.get_performance_metrics_json()
```

---

### Event Logging

#### add_event(event_type string, message string)

Add an event to the event log.

**Parameters**:
- `event_type` - Type of event ('info', 'warn', 'error', 'debug', 'system')
- `message` - Event message

**Usage**:
```v
devtools.add_event('system', 'Application started')
devtools.add_event('error', 'Database connection failed')
```

#### add_event_with_source(event_type string, source string, message string, data map[string]string)

Add an event with source and additional data.

**Parameters**:
- `event_type` - Type of event
- `source` - Source of the event
- `message` - Event message
- `data` - Additional event data

**Usage**:
```v
data := map[string]string{'user_id': '123', 'action': 'login'}
devtools.add_event_with_source('info', 'auth', 'User logged in', data)
```

#### get_events_json() string

Returns all logged events.

**Response**:
```json
[
  {
    "id": 1,
    "timestamp": "2026-03-15 10:30:00.123",
    "type": "system",
    "source": "DevToolsService",
    "message": "DevTools service initialized",
    "data": {}
  }
]
```

**Usage**:
```v
events := devtools.get_events_json()
```

#### clear_events()

Clear all events.

**Usage**:
```v
devtools.clear_events()
```

---

### Backend Function Tracking

#### register_binding(name string)

Register a backend function binding.

**Parameters**:
- `name` - Function name

**Usage**:
```v
devtools.register_binding('getSystemInfo')
devtools.register_binding('saveUser')
```

#### record_function_call(name string, response_time_ms int)

Record a function call with response time.

**Parameters**:
- `name` - Function name
- `response_time_ms` - Response time in milliseconds

**Usage**:
```v
start := time.now()
// ... function execution
duration := time.since(start)
devtools.record_function_call('getSystemInfo', int(duration))
```

#### get_bindings_json() string

Returns all registered bindings with statistics.

**Response**:
```json
[
  {
    "name": "getSystemInfo",
    "bound": true,
    "call_count": 150,
    "last_called": "2026-03-15 10:45:00",
    "avg_response": 12
  }
]
```

**Usage**:
```v
bindings := devtools.get_bindings_json()
```

---

### Log Management

#### add_log_entry(level string, target string, message string)

Add a log entry.

**Parameters**:
- `level` - Log level ('info', 'warn', 'error', 'debug')
- `target` - Log target/component
- `message` - Log message

**Usage**:
```v
devtools.add_log_entry('info', 'Database', 'Connection established')
devtools.add_log_entry('error', 'FileService', 'File not found')
```

#### get_logs_json() string

Returns all log entries.

**Response**:
```json
[
  {
    "level": "info",
    "timestamp": "2026-03-15 10:30:00.123",
    "target": "Database",
    "message": "Connection established",
    "file": "",
    "line": 0
  }
]
```

**Usage**:
```v
logs := devtools.get_logs_json()
```

#### clear_logs()

Clear all logs.

**Usage**:
```v
devtools.clear_logs()
```

---

### Combined Data

#### get_all_devtools_data_json(db_path string) string

Returns all DevTools data in a single response.

**Parameters**:
- `db_path` - Path to database file

**Response**:
```json
{
  "system": {...},
  "memory": {...},
  "process": {...},
  "network": {...},
  "database": {...},
  "config": {...},
  "performance": {...},
  "events": [...],
  "bindings": [...],
  "logs": [...]
}
```

**Usage**:
```v
data := devtools.get_all_devtools_data_json('users.db.json')
```

---

## Frontend Integration

### Angular Service

**Location**: `frontend/src/services/app/devtools.service.ts`

### Usage Example

```typescript
import { DevToolsService } from './app/devtools.service';

// Inject service
const devTools = inject(DevToolsService);

// Open DevTools panel
devTools.open();

// Set active tab
devTools.setActiveTab('system');

// Refresh data
await devTools.refreshAll();

// Refresh specific tab
await devTools.refreshTab('memory');

// Toggle auto-refresh
devTools.toggleAutoRefresh();

// Set refresh interval
devTools.setRefreshInterval(5000);

// Get data
const systemInfo = devTools.systemInfo();
const memoryInfo = devTools.memoryInfo();
const events = devTools.events();

// Clear logs
await devTools.clearLogs();
```

---

## WebUI Bindings

All DevTools functions are exposed via WebUI bindings in `src/main.v`:

```v
w.bind('getDevToolsSystemInfo', app.handle_get_devtools_system_info)
w.bind('getDevToolsMemoryInfo', app.handle_get_devtools_memory_info)
w.bind('getDevToolsProcessInfo', app.handle_get_devtools_process_info)
w.bind('getDevToolsNetworkInfo', app.handle_get_devtools_network_info)
w.bind('getDevToolsDatabaseInfo', app.handle_get_devtools_database_info)
w.bind('getDevToolsConfigInfo', app.handle_get_devtools_config_info)
w.bind('getDevToolsPerformanceMetrics', app.handle_get_devtools_performance_metrics)
w.bind('getDevToolsEvents', app.handle_get_devtools_events)
w.bind('getDevToolsBindings', app.handle_get_devtools_bindings)
w.bind('getDevToolsLogs', app.handle_get_devtools_logs)
w.bind('clearDevToolsEvents', app.handle_clear_devtools_events)
w.bind('clearDevToolsLogs', app.handle_clear_devtools_logs)
```

---

## Testing

### Backend Tests

Create tests in `src/services/devtools_service_test.v`:

```v
fn test_devtools_initialization() {
	mut devtools := services.DevToolsService{}
	devtools.initialize()
	
	assert devtools.is_initialized() == true
	assert devtools.get_event_count() == 1  // Initialization event
}

fn test_devtools_add_event() {
	mut devtools := services.DevToolsService{}
	devtools.initialize()
	
	devtools.add_event('info', 'Test event')
	
	assert devtools.get_event_count() == 2
}

fn test_devtools_get_system_info() {
	mut devtools := services.DevToolsService{}
	devtools.initialize()
	
	info := devtools.get_system_info_json()
	
	assert info.contains('hostname')
	assert info.contains('os')
}
```

### Frontend Tests

Create tests in `frontend/src/services/app/devtools.service.spec.ts`:

```typescript
describe('DevToolsService', () => {
  let service: DevToolsService;
  let webuiMock: Partial<WebUIService>;

  beforeEach(() => {
    webuiMock = {
      call: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        DevToolsService,
        { provide: WebUIService, useValue: webuiMock },
      ],
    });

    service = TestBed.inject(DevToolsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should open DevTools', () => {
    service.open();
    expect(service.devToolsState().isOpen).toBe(true);
  });

  it('should refresh all data', async () => {
    jest.spyOn(webuiMock, 'call').mockResolvedValue({});
    await service.refreshAll();
    expect(service.lastUpdated()).toBeTruthy();
  });
});
```

---

## Performance Considerations

### Memory Management

- Event log is limited to 100 entries (configurable via `max_events`)
- Log entries are limited to 200 entries (configurable via `max_logs`)
- Old entries are automatically trimmed

### Response Time

- Most info functions read from `/proc` filesystem (fast)
- Database info may be slower for large databases
- Consider caching for frequently accessed data

### Refresh Strategy

- Default refresh interval: 5000ms (5 seconds)
- Auto-refresh can be disabled for better performance
- Individual tab refresh available for targeted updates

---

## Troubleshooting

### Issue: System info returns empty values

**Solution**: Check permissions for reading `/proc` filesystem

### Issue: Database info shows 0 tables

**Solution**: Verify database file exists and is accessible

### Issue: Events not appearing

**Solution**: Ensure `add_event()` is called before `get_events_json()`

### Issue: Bindings not tracked

**Solution**: Call `register_binding()` for each WebUI binding

---

## Future Enhancements

1. **Real-time Metrics**: WebSocket-based push for real-time updates
2. **Historical Data**: Store metrics history for trend analysis
3. **Alerts**: Configurable thresholds with notifications
4. **Export**: Export data to JSON/CSV formats
5. **Filtering**: Filter events and logs by type, source, date
6. **Search**: Search functionality for events and logs
7. **Graphs**: Visual charts for memory, CPU, network usage

---

## Conclusion

The DevTools backend services provide comprehensive system monitoring and diagnostics capabilities for the Angular frontend. The services are designed to be efficient, extensible, and easy to integrate with the DevTools panel.

---

*Documentation created: 2026-03-15*
*Version: 1.0*
