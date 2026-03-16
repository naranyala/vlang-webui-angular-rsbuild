# Alternative Backend-Frontend Communication Patterns

Project: Vlang WebUI Angular Application
Date: 2026-03-15
Version: 1.0

---

## Overview

This document describes the alternative communication patterns implemented for backend-frontend communication **without using HTTP/HTTPS**. These patterns provide efficient, type-safe, and flexible communication mechanisms.

---

## Communication Patterns Implemented

### 1. Message Bus (Pub/Sub Pattern)

**Purpose**: Decoupled event-driven communication

**Features**:
- Subscribe/unsubscribe to channels
- Priority-based message delivery
- Message history tracking
- Multiple subscribers per channel

**Backend (V)**:
```v
// Create message bus
mut bus := communication.create_message_bus()

// Subscribe to channel
bus.subscribe('system', fn (msg communication.Message) {
    println('Received: ${msg.event_type}')
})

// Publish message
bus.publish('system', 'user_login', json.encode(user_data), .high)
```

**Frontend (TypeScript)**:
```typescript
// Subscribe to channel
const unsubscribe = commService.subscribe('system', (msg) => {
  console.log('Received:', msg.eventType, msg.data);
});

// Publish message
commService.publish('system', 'user_login', userData, 'high');

// Unsubscribe
unsubscribe();
```

**Use Cases**:
- Real-time notifications
- System events broadcasting
- Cross-component communication
- Event-driven architecture

---

### 2. Event Store (Event Sourcing)

**Purpose**: Complete audit trail and state reconstruction

**Features**:
- Append-only event log
- Aggregate-based organization
- Event versioning
- Time-based queries

**Backend (V)**:
```v
// Create event store
mut store := communication.create_event_store()

// Append event
event := store.append('user_123', 'user_created', json.encode(user_data))

// Get events for aggregate
events := store.get_events('user_123')

// Get events by type
login_events := store.get_events_by_type('user_login')
```

**Frontend (TypeScript)**:
```typescript
// Append event
const event = commService.appendEvent('user_123', 'user_created', userData);

// Get events for aggregate
const events = commService.getEvents('user_123');

// Get events by type
const loginEvents = commService.getEventsByType('user_login');

// Get events since timestamp
const recentEvents = commService.getEventsSince('2026-03-15T00:00:00Z');
```

**Use Cases**:
- Audit logging
- State reconstruction
- CQRS implementations
- Compliance requirements

---

### 3. Command Bus (CQRS Pattern)

**Purpose**: Structured command execution with tracking

**Features**:
- Command registration
- Execution tracking
- Result/error handling
- Command logging

**Backend (V)**:
```v
// Create command bus
mut bus := communication.create_command_bus()

// Register handler
bus.register('create_user', fn (cmd communication.Command) string {
    // Execute command
    result := create_user(cmd.payload)
    return json.encode(result)
})

// Execute command
cmd := bus.execute('create_user', json.encode(user_data))
if cmd.executed {
    println('Success: ${cmd.result}')
} else {
    println('Failed: ${cmd.result}')
}
```

**Frontend (TypeScript)**:
```typescript
// Register handler
commService.registerCommand('create_user', (cmd) => {
  return userService.create(cmd.payload);
});

// Execute command
const cmd = commService.executeCommand('create_user', userData);
if (cmd.executed) {
  console.log('Success:', cmd.result);
} else {
  console.error('Failed:', cmd.error);
}
```

**Use Cases**:
- CQRS implementations
- Command validation
- Undo/redo functionality
- Command logging and auditing

---

### 4. RPC (Remote Procedure Call)

**Purpose**: Direct function invocation

**Features**:
- Method registration
- Synchronous execution
- Error handling
- Call logging

**Backend (V)**:
```v
// Create RPC server
mut server := communication.create_rpc_server()

// Register method
server.register('get_user', fn (params string) string {
    user := get_user_from_db(params)
    return json.encode(user)
})

// Call method
resp := server.call('get_user', '123')
if resp.error.len > 0 {
    println('Error: ${resp.error}')
} else {
    println('Result: ${resp.result}')
}
```

**Frontend (TypeScript)**:
```typescript
// Register method
commService.registerRPC('get_user', (params) => {
  return userService.getById(params as string);
});

// Call method
const resp = commService.callRPC('get_user', '123');
if (resp.error) {
  console.error('Error:', resp.error);
} else {
  console.log('Result:', resp.result);
}
```

**Use Cases**:
- Direct function calls
- Synchronous operations
- Simple request/response
- Utility functions

---

### 5. Channels (Message Passing)

**Purpose**: Typed message queues

**Features**:
- Capacity limits
- FIFO ordering
- Type safety
- Peek/receive operations

**Backend (V)**:
```v
// Create channel
mut ch := communication.create_channel[string](100)

// Send message
success := ch.send('Hello, World!')

// Receive message
msg := ch.receive() or {
    println('No messages')
    return
}
println('Received: ${msg}')

// Peek at next message
msg = ch.peek() or { return }
```

**Frontend (TypeScript)**:
```typescript
// Get channel
const channel = commService.getChannel<string>('system');

// Send message
const success = commService.sendToChannel('system', 'Hello, World!');

// Receive message
const msg = commService.receiveFromChannel<string>('system');
if (msg) {
  console.log('Received:', msg);
}

// Peek at next message
const next = channel?.peek();
```

**Use Cases**:
- Producer/consumer patterns
- Work queues
- Stream processing
- Backpressure handling

---

### 6. Communication Hub (Unified Layer)

**Purpose**: Single access point for all patterns

**Features**:
- Combines all patterns
- Centralized statistics
- Easy initialization
- Type-safe access

**Backend (V)**:
```v
// Create hub
mut hub := communication.create_comm_hub()
hub.initialize()

// Access components
mut msg_bus := hub.message_bus()
mut evt_store := hub.event_store()
mut cmd_bus := hub.command_bus()
mut rpc_server := hub.rpc_server()

// Get statistics
stats_json := hub.get_stats_json()
```

**Frontend (TypeScript)**:
```typescript
// Use global instance
const hub = globalCommHub;
hub.initialize();

// Access components
const messageBus = hub.messageBus;
const eventStore = hub.eventStore;
const commandBus = hub.commandBus;
const rpcServer = hub.rpcServer;

// Get statistics
const stats = hub.getStats();
console.log('Stats:', JSON.stringify(stats));
```

**Use Cases**:
- Unified communication layer
- Simplified dependency injection
- Centralized monitoring
- Easy testing

---

## Integration with WebUI

### Backend Integration

```v
module main

import communication
import vwebui as ui

// Create communication hub
mut comm_hub := communication.create_comm_hub()
comm_hub.initialize()

// Setup message bus for WebUI events
comm_hub.message_bus().subscribe('webui', fn (msg communication.Message) {
    // Handle WebUI events
    println('WebUI event: ${msg.event_type}')
})

// Bind WebUI handler
w.bind('publishEvent', fn (e &ui.Event) string {
    comm_hub.message_bus().publish('webui', e.element, '{}', .normal)
    return '{"success": true}'
})

// Bind RPC handler
w.bind('callRPC', fn (e &ui.Event) string {
    // Parse request
    mut req := json.decode(RPCRequest, e.element) or {
        return '{"error": "Invalid request"}'
    }
    
    // Execute RPC
    resp := comm_hub.rpc_server().call(req.method, req.params)
    return json.encode(resp)
})
```

### Frontend Integration

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { CommunicationService } from './services/app/communication.service';

@Component({
  selector: 'app-root',
  template: `
    <div>
      <h2>Communication Hub Stats</h2>
      <pre>{{ stats() | json }}</pre>
    </div>
  `,
})
export class AppComponent implements OnInit {
  private readonly commService = inject(CommunicationService);
  
  readonly stats = signal({});

  ngOnInit(): void {
    // Subscribe to system events
    this.commService.subscribe('system', (msg) => {
      console.log('System event:', msg);
    });

    // Register command handler
    this.commService.registerCommand('navigate', (cmd) => {
      const route = (cmd.payload as { route: string }).route;
      this.router.navigate([route]);
      return { success: true };
    });

    // Update stats periodically
    setInterval(() => {
      this.stats.set(this.commService.getStats());
    }, 5000);
  }
}
```

---

## Performance Characteristics

| Pattern | Latency | Throughput | Memory | Best For |
|---------|---------|------------|--------|----------|
| Message Bus | Low | High | Medium | Events, notifications |
| Event Store | Medium | Medium | High | Audit, history |
| Command Bus | Low | High | Medium | CQRS, validation |
| RPC | Low | High | Low | Direct calls |
| Channels | Low | Very High | Low | Queues, streams |
| Hub | Low | High | High | Unified access |

---

## Security Considerations

### Input Validation
```typescript
// Always validate incoming data
commService.registerCommand('create_user', (cmd) => {
  const payload = cmd.payload as { name: string; email: string };
  
  if (!payload.name || !payload.email) {
    throw new Error('Invalid payload');
  }
  
  return userService.create(payload);
});
```

### Access Control
```typescript
// Check permissions before executing
commService.registerCommand('delete_user', (cmd) => {
  if (!authService.hasPermission('delete_user')) {
    throw new Error('Unauthorized');
  }
  
  return userService.delete(cmd.payload as string);
});
```

### Rate Limiting
```typescript
// Implement rate limiting
const rateLimits = new Map<string, number>();

commService.registerCommand('send_message', (cmd) => {
  const userId = (cmd.payload as { userId: string }).userId;
  const now = Date.now();
  
  const lastCall = rateLimits.get(userId) || 0;
  if (now - lastCall < 1000) {
    throw new Error('Rate limit exceeded');
  }
  
  rateLimits.set(userId, now);
  return messageService.send(cmd.payload);
});
```

---

## Testing

### Unit Tests

```typescript
describe('CommunicationService', () => {
  let service: CommunicationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommunicationService);
  });

  it('should publish and subscribe', () => {
    const handler = jest.fn();
    service.subscribe('test', handler);
    
    service.publish('test', 'event', { data: 'test' });
    
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'test',
        eventType: 'event',
      })
    );
  });

  it('should execute commands', () => {
    service.registerCommand('test', (cmd) => 'result');
    
    const cmd = service.executeCommand('test', {});
    
    expect(cmd.executed).toBe(true);
    expect(cmd.result).toBe('result');
  });
});
```

### Integration Tests

```typescript
describe('Communication Integration', () => {
  it('should handle full workflow', () => {
    // Setup
    commService.registerCommand('create_user', createUserHandler);
    commService.subscribe('system', systemEventHandler);
    
    // Execute
    const cmd = commService.executeCommand('create_user', userData);
    
    // Verify
    expect(cmd.executed).toBe(true);
    expect(systemEventHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'user_created',
      })
    );
  });
});
```

---

## Best Practices

### 1. Use Appropriate Pattern

- **Events/Notifications** → Message Bus
- **Audit/History** → Event Store
- **Commands/Actions** → Command Bus
- **Direct Calls** → RPC
- **Queues** → Channels

### 2. Error Handling

```typescript
try {
  const cmd = commService.executeCommand('risky_operation', data);
  if (cmd.error) {
    handleError(cmd.error);
  }
} catch (error) {
  handleUnexpectedError(error);
}
```

### 3. Cleanup

```typescript
// Always unsubscribe
const unsubscribe = commService.subscribe('channel', handler);
onDestroy(() => unsubscribe());

// Clear when done
commService.clear();
```

### 4. Monitoring

```typescript
// Monitor statistics
setInterval(() => {
  const stats = commService.getStats();
  if (stats.messageBus.totalMessages > threshold) {
    alert('High message volume');
  }
}, 60000);
```

---

## Migration from HTTP

### Before (HTTP)
```typescript
// HTTP POST
await this.http.post('/api/users', userData).toPromise();

// HTTP GET
const user = await this.http.get(`/api/users/${id}`).toPromise();
```

### After (Alternative)
```typescript
// Command Bus
const cmd = commService.executeCommand('create_user', userData);

// RPC
const resp = commService.callRPC('get_user', id);
const user = resp.result;
```

---

## Conclusion

These alternative communication patterns provide:

✅ **No HTTP/HTTPS dependency**
✅ **Type-safe communication**
✅ **Multiple patterns for different needs**
✅ **High performance**
✅ **Easy testing**
✅ **Flexible architecture**

Choose the pattern that best fits your use case, or combine multiple patterns for complex scenarios.

---

*Documentation created: 2026-03-15*
*Version: 1.0*
*Status: Production Ready*
