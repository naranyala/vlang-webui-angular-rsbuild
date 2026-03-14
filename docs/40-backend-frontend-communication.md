# Backend-Frontend Communication Guide

> **Project**: Vlang WebUI Angular Application
> **Last Updated**: 2026-03-14
> **Document ID**: 40

This document provides a comprehensive overview of all backend-frontend communication approaches, protocols, and data formats available in this project.

---

## Table of Contents

- [Overview](#overview)
- [Communication Architecture](#communication-architecture)
- [Approach 1: WebUI Function Binding](#approach-1-webui-function-binding)
- [Approach 2: Custom Events](#approach-2-custom-events)
- [Approach 3: HTTP REST API](#approach-3-http-rest-api)
- [Approach 4: WebSocket Real-time](#approach-4-websocket-real-time)
- [Data Formats](#data-formats)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Comparison Matrix](#comparison-matrix)

---

## Overview

This application supports multiple communication patterns between the V backend and Angular frontend:

| Approach | Protocol | Direction | Use Case |
|----------|----------|-----------|----------|
| **WebUI Function Binding** | Custom Bridge | Bidirectional | Primary method for RPC calls |
| **Custom Events** | DOM Events | Frontend → Backend | Real-time notifications |
| **HTTP REST API** | HTTP/HTTPS | Bidirectional | External integrations |
| **WebSocket** | WebSocket | Bidirectional | Real-time bidirectional data |

---

## Communication Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Angular Frontend                             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  WebUIService                                             │ │
│  │  • call<T>(function, args, options)                       │ │
│  │  • callWithRetry<T>(function, args, options)              │ │
│  │  • callAll(calls)                                         │ │
│  │  • callSequential(calls)                                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│         ┌────────────────────┼────────────────────┐            │
│         │                    │                    │            │
│  ┌──────▼──────┐    ┌───────▼───────┐   ┌───────▼───────┐    │
│  │   WebUI     │    │ Custom Events │   │   HTTP/WS     │    │
│  │   Bridge    │    │  (Optional)   │   │  (Optional)   │    │
│  └──────┬──────┘    └───────────────┘   └───────┬───────┘    │
│         │                                        │            │
└─────────┼────────────────────────────────────────┼────────────┘
          │                                        │
          │              ┌─────────────────────────┘
          │              │
┌─────────▼──────────────▼────────────────────────────────────┐
│                    V Backend                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ Function       │  │ Event Handlers │  │ HTTP/WS        │ │
│  │ Bindings       │  │                │  │ Server         │ │
│  │                │  │                │  │                │ │
│  │ w.bind('fn',   │  │ window.dispatch│  │ mg_start()     │ │
│  │   handler)     │  │   Event()      │  │                │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Approach 1: WebUI Function Binding

**Primary communication method** - Uses the WebUI library's function binding mechanism.

### How It Works

1. **Backend**: V functions are bound to JavaScript-callable names
2. **Frontend**: Angular calls bound functions via `WebUIService`
3. **Response**: Results returned via callback events

### Backend Implementation

```v
module main

import vwebui as ui

fn main() {
    mut w := ui.new_window()
    
    // Bind a function that frontend can call
    w.bind('getUsers', fn (e &ui.Event) string {
        users := get_all_users()
        return json.encode(users) or { '[]' }
    })
    
    // Bind with parameters
    w.bind('saveUser', fn (e &ui.Event) string {
        data := e.element  // Parameters passed in e.element
        mut user := User{}
        json.decode(data, mut user)
        
        created_user := create_user(user) or {
            return '{"error": "${err}"}'
        }
        return json.encode(created_user)
    })
    
    // Bind with complex parameters
    w.bind('searchUsers', fn (e &ui.Event) string {
        query := e.element
        results := search_users(query)
        return json.encode(results)
    })
    
    w.show('index.html', ui.ShowOptions{})
    ui.wait()
}
```

### Frontend Implementation

```typescript
// src/services/webui.service.ts
@Injectable({ providedIn: 'root' })
export class WebUIService {
  readonly connected = signal<boolean>(false);
  readonly port = signal<number | null>(null);

  constructor(private ngZone: NgZone, private eventBus: EventBusViewModel) {
    this.setupEventListeners();
  }

  /**
   * Call a backend function and get a typed response
   */
  async call<T>(
    functionName: string,
    args?: unknown[],
    options?: WebUICallOptions
  ): Promise<Result<T>> {
    const { timeout = 30000, retryCount = 0, responseEvent } = options || {};
    const responseEventName = responseEvent || `${functionName}_response`;

    return new Promise<Result<T>>((resolve) => {
      // Setup response handler
      const handler = (event: Event) => {
        const customEvent = event as CustomEvent<{ response?: Record<string, unknown> }>;
        const response = customEvent.detail?.response;

        this.ngZone.run(() => {
          window.removeEventListener(responseEventName, handler as EventListener);

          if (response && 'data' in response && response.data !== undefined) {
            resolve({ ok: true, value: response.data as T });
          } else {
            resolve({ 
              ok: false, 
              error: { message: response?.error?.message || 'Call failed' } 
            });
          }
        });
      };

      // Setup timeout
      const timeoutId = setTimeout(() => {
        window.removeEventListener(responseEventName, handler as EventListener);
        resolve({ 
          ok: false, 
          error: { message: `Timeout after ${timeout}ms` } 
        });
      }, timeout);

      // Listen for response
      window.addEventListener(responseEventName, handler as EventListener, { once: true });

      // Call backend function
      const backendFn = (window as any)[functionName];
      if (typeof backendFn === 'function') {
        backendFn(...(args || []));
      } else {
        clearTimeout(timeoutId);
        resolve({ ok: false, error: { message: `Function not found: ${functionName}` } });
      }
    });
  }

  /**
   * Call with automatic retry
   */
  async callWithRetry<T>(
    functionName: string,
    args?: unknown[],
    options?: WebUICallOptions
  ): Promise<Result<T>> {
    const { retryCount = 3, retryDelay = 1000, ...callOptions } = options || {};

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      if (attempt > 0) {
        await this.delay(retryDelay * attempt);
      }

      const result = await this.call<T>(functionName, args, callOptions);
      if (isOk(result)) {
        return result;
      }
    }

    return { ok: false, error: { message: 'All retries failed' } };
  }

  /**
   * Call multiple functions in parallel
   */
  async callAll<T extends Record<string, unknown>>(
    calls: Array<{ name: string; args?: unknown[]; options?: WebUICallOptions }>
  ): Promise<{ [K in keyof T]: Result<T[K]> }> {
    const results = await Promise.all(
      calls.map((call) => this.call(call.name, call.args, call.options))
    );
    return results as { [K in keyof T]: Result<T[K]> };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### Usage Example

```typescript
// In Angular component
@Component({ /* ... */ })
export class UsersComponent implements OnInit {
  private readonly webui = inject(WebUIService);
  private readonly toast = inject(ToastService);

  readonly users = signal<User[]>([]);
  readonly loading = signal(false);

  async ngOnInit(): Promise<void> {
    await this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    this.loading.set(true);
    
    const result = await this.webui.call<User[]>('getUsers');
    
    if (isOk(result)) {
      this.users.set(result.value);
      this.toast.success('Users loaded');
    } else {
      this.toast.error(result.error.message);
    }
    
    this.loading.set(false);
  }

  async saveUser(user: Partial<User>): Promise<void> {
    const result = await this.webui.call<User>('saveUser', [JSON.stringify(user)]);
    
    if (isOk(result)) {
      this.toast.success('User saved');
      await this.loadUsers(); // Refresh list
    } else {
      this.toast.error(result.error.message);
    }
  }

  async deleteUser(id: number): Promise<void> {
    const result = await this.webui.call<void>('deleteUser', [id.toString()]);
    
    if (isOk(result)) {
      this.toast.success('User deleted');
      await this.loadUsers();
    } else {
      this.toast.error(result.error.message);
    }
  }
}
```

### Data Flow

```
┌─────────────┐                    ┌─────────────┐
│   Angular   │                    │     V       │
│  Component  │                    │   Backend   │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │  this.webui.call('getUsers')     │
       │─────────────────────────────────>│
       │                                  │
       │                                  │ w.bind('getUsers', handler)
       │                                  │ executes handler
       │                                  │
       │    window.dispatchEvent(         │
       │      'getUsers_response',        │
       │      { data: [...] }             │
       │    )                             │
       │<─────────────────────────────────│
       │                                  │
       │  Promise resolves with Result<T> │
       │                                  │
```

### Pros & Cons

| Pros | Cons |
|------|------|
| ✅ Simple RPC-style calls | ❌ Requires WebUI library |
| ✅ Type-safe with generics | ❌ Limited to string parameters |
| ✅ Built-in retry logic | ❌ No streaming support |
| ✅ Automatic event handling | ❌ Tightly coupled to WebUI |

---

## Approach 2: Custom Events

**Supplementary method** - Uses browser's CustomEvent API for notifications and state updates.

### How It Works

1. **Backend**: V dispatches custom events via WebUI
2. **Frontend**: Angular listens for events via event listeners
3. **Use Case**: Real-time notifications, state synchronization

### Backend Implementation

```v
module main

import vwebui as ui

// Send event to frontend
fn send_status_update(w ui.Window, status string) {
    // Dispatch custom event to all connected clients
    ui.eval(w, 'window.dispatchEvent(new CustomEvent("webui:status", {
        detail: { state: "${status}", timestamp: ${time.now().unix()} }
    }))')
}

// Example: Send connection status
fn notify_connected(w ui.Window) {
    ui.eval(w, 'window.dispatchEvent(new CustomEvent("webui:connected", {
        detail: { port: ${port}, timestamp: ${time.now().unix()} }
    }))')
}

// Example: Send error notification
fn notify_error(w ui.Window, message string) {
    ui.eval(w, 'window.dispatchEvent(new CustomEvent("webui:error", {
        detail: { message: "${message}", severity: "error" }
    }))')
}
```

### Frontend Implementation

```typescript
// src/viewmodels/connection-monitor.service.ts
@Injectable({ providedIn: 'root' })
export class ConnectionMonitorService implements OnDestroy {
  private readonly logger = getLogger('connection-monitor');
  private readonly eventBus = inject(EventBusViewModel);

  readonly stats = signal<ConnectionStats>({
    state: 'disconnected',
    port: 0,
    latency: 0,
    uptime: 0,
  });

  private eventListeners: Array<() => void> = [];

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for status events
    this.addEventListener('webui:status', (event: CustomEvent) => {
      const detail = event.detail;
      this.logger.debug('Status update', detail);
      
      this.stats.update(s => ({
        ...s,
        state: detail.state,
        port: detail.port || s.port,
      }));
      
      this.eventBus.publish('connection:status', detail);
    });

    // Listen for connected events
    this.addEventListener('webui:connected', (event: CustomEvent) => {
      this.logger.info('Connected', event.detail);
      this.stats.update(s => ({ ...s, state: 'connected' }));
    });

    // Listen for error events
    this.addEventListener('webui:error', (event: CustomEvent) => {
      this.logger.error('Backend error', event.detail);
      this.eventBus.publish('backend:error', event.detail);
    });
  }

  private addEventListener(
    eventType: string,
    handler: (event: CustomEvent) => void
  ): void {
    const listener = (event: Event) => handler(event as CustomEvent);
    window.addEventListener(eventType, listener);
    
    // Store cleanup function
    this.eventListeners.push(() => {
      window.removeEventListener(eventType, listener);
    });
  }

  ngOnDestroy(): void {
    // Cleanup all listeners
    this.eventListeners.forEach(cleanup => cleanup());
  }
}
```

### Usage Example

```typescript
// In component
@Component({ /* ... */ })
export class AppComponent implements OnInit {
  private readonly connectionMonitor = inject(ConnectionMonitorService);
  private readonly eventBus = inject(EventBusViewModel);

  readonly connectionState = computed(() => 
    this.connectionMonitor.stats().state
  );

  ngOnInit(): void {
    // Subscribe to connection status changes
    this.eventBus.subscribe('connection:status', (data) => {
      console.log('Connection status changed:', data);
    });

    // Subscribe to backend errors
    this.eventBus.subscribe('backend:error', (data) => {
      this.showErrorNotification(data);
    });
  }

  private showErrorNotification(data: any): void {
    // Show toast notification
    console.error('Backend error:', data.message);
  }
}
```

### Pros & Cons

| Pros | Cons |
|------|------|
| ✅ Decoupled communication | ❌ No return values |
| ✅ Broadcast to multiple listeners | ❌ Event naming must be coordinated |
| ✅ Good for notifications | ❌ Limited payload (must be JSON-serializable) |
| ✅ Works with existing WebUI | ❌ No built-in error handling |

---

## Approach 3: HTTP REST API (Optional)

**External integration method** - Embed HTTP server for REST API access.

### How It Works

1. **Backend**: V embeds additional HTTP server (beyond WebUI's civetweb)
2. **Frontend**: Angular makes HTTP calls via HttpClient
3. **Use Case**: External integrations, file uploads, streaming

### Backend Implementation

```v
module main

// Note: This requires additional HTTP server setup
// WebUI's civetweb can also serve REST endpoints

import http

// Example: Start REST API server
fn start_rest_api(port int) {
    // This is conceptual - WebUI's civetweb handles HTTP
    // For dedicated REST, you'd use V's http module
}

// Handler for REST endpoint
fn handle_get_users(req http.Request) http.Response {
    users := get_all_users()
    return http.Response{
        status_code: 200
        body: json.encode(users) or { '[]' }
        header: { 'Content-Type': 'application/json' }
    }
}

fn handle_create_user(req http.Request) http.Response {
    mut user := User{}
    json.decode(req.body, mut user) or {
        return http.Response{
            status_code: 400
            body: '{"error": "Invalid user data"}'
        }
    }

    created := create_user(user) or {
        return http.Response{
            status_code: 500
            body: '{"error": "${err}"}'
        }
    }

    return http.Response{
        status_code: 201
        body: json.encode(created)
        header: { 'Content-Type': 'application/json' }
    }
}
```

### Frontend Implementation

```typescript
// src/services/user-api.service.ts
@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api'; // Relative to WebUI server

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, user);
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }
}
```

### Usage Example

```typescript
@Component({ /* ... */ })
export class UsersComponent {
  private readonly userApi = inject(UserApiService);
  private readonly toast = inject(ToastService);

  readonly users = signal<User[]>([]);

  loadUsers(): void {
    this.userApi.getUsers().subscribe({
      next: (users) => this.users.set(users),
      error: (err) => this.toast.error('Failed to load users'),
    });
  }

  createUser(user: Partial<User>): void {
    this.userApi.createUser(user).subscribe({
      next: () => {
        this.toast.success('User created');
        this.loadUsers();
      },
      error: (err) => this.toast.error(err.message),
    });
  }
}
```

### Pros & Cons

| Pros | Cons |
|------|------|
| ✅ Standard REST API | ❌ Requires additional server setup |
| ✅ Works with HttpClient | ❌ More complex than WebUI binding |
| ✅ Supports file uploads | ❌ CORS configuration needed |
| ✅ External integrations | ❌ Not needed for internal communication |

---

## Approach 4: WebSocket Real-time (Optional)

**Real-time bidirectional** - Uses WebUI's built-in WebSocket support.

### How It Works

1. **Backend**: V uses WebUI WebSocket API
2. **Frontend**: Angular uses WebSocket or WebUI events
3. **Use Case**: Real-time updates, live data streaming

### Backend Implementation

```v
module main

import vwebui as ui

// WebSocket is built into WebUI
// Events are automatically bidirectional

fn broadcast_update(w ui.Window, data string) {
    // Send to all connected clients
    ui.eval(w, 'window.dispatchEvent(new CustomEvent("app:update", {
        detail: ${data}
    }))')
}

// Real-time data streaming example
fn stream_system_stats(w ui.Window) {
    for {
        stats := get_system_stats()
        json_data := json.encode(stats) or { continue }
        
        broadcast_update(w, json_data)
        
        time.sleep(1 * time.second)
    }
}
```

### Frontend Implementation

```typescript
// src/services/realtime.service.ts
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly logger = getLogger('realtime');
  private readonly eventBus = inject(EventBusViewModel);

  readonly systemStats = signal<SystemStats | null>(null);

  constructor() {
    this.setupRealtimeListeners();
  }

  private setupRealtimeListeners(): void {
    // Listen for real-time updates
    window.addEventListener('app:update', (event: any) => {
      const data = event.detail;
      this.logger.debug('Real-time update', data);
      
      // Update signals
      if (data.type === 'system_stats') {
        this.systemStats.set(data);
      }
      
      // Publish to event bus
      this.eventBus.publish('realtime:update', data);
    });
  }

  // Subscribe to real-time data
  subscribe<T>(eventType: string, callback: (data: T) => void): () => void {
    const handler = (event: any) => callback(event.detail);
    window.addEventListener(eventType, handler);
    return () => window.removeEventListener(eventType, handler);
  }
}
```

### Pros & Cons

| Pros | Cons |
|------|------|
| ✅ Real-time bidirectional | ❌ More complex state management |
| ✅ Push-based updates | ❌ Requires connection management |
| ✅ Efficient for frequent updates | ❌ Overkill for simple RPC |
| ✅ Built into WebUI | ❌ Debugging can be challenging |

---

## Data Formats

### JSON Encoding (V → TypeScript)

```v
// V struct
pub struct User {
pub:
    id    int
    name  string
    email string
    role  string
}

// Encode to JSON
user := User{
    id: 1
    name: 'John Doe'
    email: 'john@example.com'
    role: 'admin'
}

json_data := json.encode(user) or { 'null' }
// Output: {"id":1,"name":"John Doe","email":"john@example.com","role":"admin"}
```

```typescript
// TypeScript interface
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

// Decode from JSON
const userData = JSON.parse(jsonString) as User;
```

### Result Pattern (Error Handling)

```typescript
// TypeScript Result type
export type Result<T> = 
  | { ok: true; value: T }
  | { ok: false; error: ErrorValue };

// Type guards
export function isOk<T>(result: Result<T>): result is { ok: true; value: T } {
  return result.ok === true;
}

export function isErr<T>(result: Result<T>): result is { ok: false; error: ErrorValue } {
  return result.ok === false;
}

// Usage
const result = await this.webui.call<User[]>('getUsers');

if (isOk(result)) {
  const users = result.value; // Type is User[]
} else {
  const error = result.error; // Type is ErrorValue
  console.error(error.message);
}
```

### Error Value Format

```typescript
export interface ErrorValue {
  code: ErrorCode;
  message: string;
  details?: string;
  context?: Record<string, unknown>;
}

export enum ErrorCode {
  InternalError = 'INTERNAL_ERROR',
  ValidationFailed = 'VALIDATION_FAILED',
  ResourceNotFound = 'RESOURCE_NOT_FOUND',
  Unauthorized = 'UNAUTHORIZED',
  Timeout = 'TIMEOUT',
}
```

---

## Error Handling

### Backend Error Handling

```v
// Return errors as values
fn get_user_by_id(id int) ?User {
    for user in get_all_users() {
        if user.id == id {
            return user
        }
    }
    return none  // Option pattern
}

// Or with Result
fn get_user_by_id_result(id int) Result<User> {
    user := get_user_by_id(id) or {
        return err<User>(AppError{
            code: .not_found
            message: 'User not found: ${id}'
        })
    }
    return ok(user)
}

// Handler returns error JSON
w.bind('getUser', fn (e &ui.Event) string {
    id := e.element.int()
    
    result := get_user_by_id_result(id)
    
    if result.is_ok() {
        return json.encode(result.value)
    } else {
        return json.encode({
            error: result.error.message
            code: result.error.code
        })
    }
})
```

### Frontend Error Handling

```typescript
async getUser(id: number): Promise<Result<User>> {
  const result = await this.webui.call<User>('getUser', [id.toString()], {
    timeout: 10000,
    retryCount: 2,
  });

  if (isErr(result)) {
    // Log error
    this.logger.error('Failed to get user', result.error);
    
    // Show notification
    this.toast.error(result.error.message);
    
    // Report to global error service
    this.globalErrorService.report(result.error);
  }

  return result;
}
```

---

## Best Practices

### 1. Use WebUI Function Binding for RPC

```typescript
// ✅ Good: Simple RPC calls
const users = await this.webui.call<User[]>('getUsers');

// ❌ Avoid: Using HTTP for internal communication
const users = await this.http.get<User[]>('/api/users').toPromise();
```

### 2. Always Handle Errors

```typescript
// ✅ Good: Explicit error handling
const result = await this.webui.call<User>('saveUser', [data]);
if (isErr(result)) {
  this.toast.error(result.error.message);
  return;
}
// Use result.value

// ❌ Avoid: Ignoring errors
const result = await this.webui.call<User>('saveUser', [data]);
const user = result.value; // Might be undefined!
```

### 3. Use Retry for Unreliable Operations

```typescript
// ✅ Good: Retry for network operations
const result = await this.webui.callWithRetry<Data>('getLargeDataset', [], {
  retryCount: 3,
  retryDelay: 1000,
});

// ❌ Avoid: No retry for flaky operations
const result = await this.webui.call<Data>('getLargeDataset');
```

### 4. Batch Related Calls

```typescript
// ✅ Good: Parallel calls
const [users, settings, stats] = await this.webui.callAll({
  users: { name: 'getUsers' },
  settings: { name: 'getSettings' },
  stats: { name: 'getStats' },
});

// ❌ Avoid: Sequential calls
const users = await this.webui.call('getUsers');
const settings = await this.webui.call('getSettings');
const stats = await this.webui.call('getStats');
```

### 5. Use Custom Events for Notifications

```typescript
// ✅ Good: Events for broadcast
// Backend sends: window.dispatchEvent(new CustomEvent('app:notification', ...))
// Frontend listens: window.addEventListener('app:notification', ...)

// ❌ Avoid: Polling for updates
setInterval(() => this.checkForUpdates(), 1000);
```

### 6. Type-Safe Data Transfer

```typescript
// ✅ Good: Define interfaces
export interface User {
  id: number;
  name: string;
  email: string;
}

const result = await this.webui.call<User[]>('getUsers');

// ❌ Avoid: Using any
const result = await this.webui.call<any[]>('getUsers');
```

---

## Comparison Matrix

| Feature | WebUI Binding | Custom Events | HTTP REST | WebSocket |
|---------|---------------|---------------|-----------|-----------|
| **Setup Complexity** | Low | Low | Medium | Medium |
| **Performance** | Fast | Fast | Medium | Fast |
| **Bidirectional** | ✅ | ❌ | ✅ | ✅ |
| **Return Values** | ✅ | ❌ | ✅ | ✅ |
| **Real-time** | ❌ | ✅ | ❌ | ✅ |
| **Error Handling** | Built-in | Manual | Built-in | Manual |
| **Type Safety** | ✅ | ⚠️ | ✅ | ⚠️ |
| **Retry Support** | ✅ | ❌ | ✅ | ⚠️ |
| **File Upload** | ❌ | ❌ | ✅ | ⚠️ |
| **External Access** | ❌ | ❌ | ✅ | ⚠️ |
| **Best For** | RPC calls | Notifications | REST API | Real-time |

**Legend**: ✅ Excellent | ⚠️ Possible | ❌ Not Suitable

---

## Summary

For this Vlang + Angular application:

1. **Primary Method**: WebUI Function Binding via `WebUIService`
   - Use for all RPC-style backend calls
   - Built-in error handling and retry
   - Type-safe with generics

2. **Supplementary**: Custom Events
   - Use for backend-to-frontend notifications
   - Real-time status updates
   - Decoupled communication

3. **Optional**: HTTP REST / WebSocket
   - Use for external integrations
   - File uploads
   - Advanced real-time features

The WebUI binding approach is recommended for 95% of use cases in this architecture.

---

*Last updated: 2026-03-14*
