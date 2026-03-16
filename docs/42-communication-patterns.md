# Communication Patterns Documentation

## Overview

This document describes the alternative communication patterns available for backend-frontend communication without using HTTP/HTTPS.

---

## Available Patterns

### 1. WebUI Function Binding (Primary)

**Purpose**: RPC-style calls for 95% of use cases

**Pattern**: Request/Response

**Implementation**:
- Backend: `w.bind('functionName', handler)`
- Frontend: `webui.call('functionName', args)`

**Backend Example**:

```v
w.bind('getUsers', fn (e &ui.Event) string {
    users := get_all_users()
    return json.encode(users) or { '[]' }
})
```

**Frontend Example**:

```typescript
const result = await webui.call<User[]>('getUsers');
if (isOk(result)) {
    this.users.set(result.value);
}
```

**Best For**:
- Direct function calls
- Synchronous operations
- Simple request/response
- 95% of use cases

**Pros**:
- Simple to use
- Built-in error handling
- Type-safe with generics
- Automatic response handling

**Cons**:
- No broadcasting
- No event-driven architecture
- Tightly coupled

---

### 2. Message Bus (Pub/Sub)

**Purpose**: Decoupled event-driven communication

**Pattern**: Publish/Subscribe

**Implementation**:
- Backend: `message_bus.publish(channel, event_type, data)`
- Frontend: `messageBus.subscribe(channel, handler)`

**Backend Example**:

```v
mut bus := communication.create_message_bus()

// Publish
bus.publish('system', 'user_login', json.encode(user_data), .high)

// Subscribe
bus.subscribe('system', fn (msg communication.Message) {
    println('Received: ${msg.event_type}')
})
```

**Frontend Example**:

```typescript
const messageBus = commService.messageBus;

// Subscribe
const unsubscribe = messageBus.subscribe('system', (msg) => {
  console.log('Event:', msg.eventType, msg.data);
});

// Publish
messageBus.publish('system', 'user_login', userData, 'high');

// Unsubscribe
unsubscribe();
```

**Best For**:
- Real-time notifications
- System events broadcasting
- Cross-component communication
- Event-driven architecture

**Pros**:
- Decoupled communication
- Multiple subscribers
- Priority-based delivery
- Message history

**Cons**:
- No return values
- More complex setup
- Potential memory leaks if not unsubscribed

---

### 3. Event Store (Event Sourcing)

**Purpose**: Complete audit trail and state reconstruction

**Pattern**: Event Sourcing

**Implementation**:
- Backend: `event_store.append(aggregate_id, event_type, data)`
- Frontend: `eventStore.append(aggregateId, eventType, data)`

**Backend Example**:

```v
mut store := communication.create_event_store()

// Append event
event := store.append('user_123', 'user_created', json.encode(user_data))

// Get events
events := store.get_events('user_123')

// Get events by type
login_events := store.get_events_by_type('user_login')
```

**Frontend Example**:

```typescript
const eventStore = commService.eventStore;

// Append event
const event = eventStore.append('user_123', 'user_created', userData);

// Get events
const events = eventStore.getEvents('user_123');

// Get events by type
const loginEvents = eventStore.getEventsByType('user_login');

// Get events since timestamp
const recentEvents = eventStore.getEventsSince('2026-03-15T00:00:00Z');
```

**Best For**:
- Audit logging
- State reconstruction
- CQRS implementations
- Compliance requirements

**Pros**:
- Complete history
- State reconstruction
- Temporal queries
- Event replay

**Cons**:
- Higher storage requirements
- More complex queries
- Event versioning needed

---

### 4. Command Bus (CQRS)

**Purpose**: Structured command execution with tracking

**Pattern**: Command/Handler

**Implementation**:
- Backend: `command_bus.register(name, handler)`
- Frontend: `commandBus.register(commandName, handler)`

**Backend Example**:

```v
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

**Frontend Example**:

```typescript
const commandBus = commService.commandBus;

// Register handler
commandBus.register('create_user', (cmd) => {
  return userService.create(cmd.payload);
});

// Execute command
const cmd = commandBus.execute('create_user', userData);
if (cmd.executed) {
  console.log('Success:', cmd.result);
} else {
  console.error('Failed:', cmd.error);
}
```

**Best For**:
- CQRS implementations
- Command validation
- Undo/redo functionality
- Command logging and auditing

**Pros**:
- Clear separation of concerns
- Command tracking
- Result/error handling
- Command logging

**Cons**:
- More boilerplate
- Command handler registration
- Potential complexity

---

### 5. RPC (Remote Procedure Call)

**Purpose**: Direct function invocation

**Pattern**: Client/Server

**Implementation**:
- Backend: `rpc_server.register(method_name, handler)`
- Frontend: `rpcServer.register(methodName, handler)`

**Backend Example**:

```v
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

**Frontend Example**:

```typescript
const rpcServer = commService.rpcServer;

// Register method
rpcServer.register('get_user', (params) => {
  return userService.getById(params as string);
});

// Call method
const resp = rpcServer.call('get_user', '123');
if (resp.error) {
  console.error('Error:', resp.error);
} else {
  console.log('Result:', resp.result);
}
```

**Best For**:
- Direct function calls
- Synchronous operations
- Simple request/response
- Utility functions

**Pros**:
- Simple API
- Synchronous execution
- Error handling
- Method registration

**Cons**:
- Tightly coupled
- No broadcasting
- Limited flexibility

---

### 6. Channels (Message Passing)

**Purpose**: Typed message queues

**Pattern**: Producer/Consumer

**Implementation**:
- Backend: `channel.send(msg)`, `channel.receive()`
- Frontend: `channel.send(msg)`, `channel.receive()`

**Backend Example**:

```v
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

**Frontend Example**:

```typescript
const channel = commService.getChannel<string>('system');

// Send message
const success = channel?.send('Hello, World!');

// Receive message
const msg = channel?.receive();
if (msg) {
  console.log('Received:', msg);
}

// Peek at next message
const next = channel?.peek();
```

**Best For**:
- Producer/consumer patterns
- Work queues
- Stream processing
- Backpressure handling

**Pros**:
- Type-safe
- FIFO ordering
- Capacity limits
- Peek/receive operations

**Cons**:
- Buffer management
- Potential blocking
- Limited subscribers

---

## Pattern Comparison

| Feature | WebUI Binding | Message Bus | Event Store | Command Bus | RPC | Channels |
|---------|---------------|-------------|-------------|-------------|-----|----------|
| Setup Complexity | Low | Low | Medium | Medium | Low | Low |
| Performance | Fast | Fast | Medium | Medium | Fast | Very Fast |
| Bidirectional | Yes | No | No | Yes | Yes | Yes |
| Return Values | Yes | No | No | Yes | Yes | No |
| Real-time | No | Yes | No | No | No | Yes |
| Error Handling | Built-in | Manual | Manual | Built-in | Built-in | Manual |
| Type Safety | Yes | Warning | Yes | Yes | Yes | Yes |
| Retry Support | Yes | No | No | Yes | Yes | No |
| File Upload | No | No | No | No | No | Yes |
| External Access | No | No | No | No | Yes | No |
| Best For | RPC calls | Notifications | Audit | CQRS | Direct calls | Queues |

---

## Choosing the Right Pattern

### Decision Tree

1. **Need return value?**
   - Yes: Go to 2
   - No: Message Bus or Channels

2. **Need to broadcast to multiple listeners?**
   - Yes: Message Bus
   - No: Go to 3

3. **Need audit trail?**
   - Yes: Event Store
   - No: Go to 4

4. **Need command validation/tracking?**
   - Yes: Command Bus
   - No: Go to 5

5. **Simple function call?**
   - Yes: WebUI Binding or RPC

### Recommendations

| Use Case | Recommended Pattern |
|----------|---------------------|
| Get user data | WebUI Binding |
| User login notification | Message Bus |
| Audit user actions | Event Store |
| Create user with validation | Command Bus |
| Call utility function | RPC |
| Process background job | Channels |

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

## Performance Considerations

### Message Bus

- **Latency**: <1ms for local delivery
- **Throughput**: 10,000+ messages/second
- **Memory**: ~1KB per message in history

### Event Store

- **Latency**: <5ms for append
- **Throughput**: 1,000+ events/second
- **Memory**: ~2KB per event

### Command Bus

- **Latency**: <2ms for execution
- **Throughput**: 5,000+ commands/second
- **Memory**: ~1KB per command in log

### RPC

- **Latency**: <1ms for call
- **Throughput**: 10,000+ calls/second
- **Memory**: ~500 bytes per call in log

### Channels

- **Latency**: <0.5ms for send/receive
- **Throughput**: 50,000+ messages/second
- **Memory**: ~500 bytes per message in buffer

---

## Security Considerations

### Input Validation

Always validate incoming data:

```typescript
// Good
commService.registerCommand('create_user', (cmd) => {
  const payload = cmd.payload as { name: string; email: string };
  
  if (!payload.name || !payload.email) {
    throw new Error('Invalid payload');
  }
  
  return userService.create(payload);
});
```

### Access Control

Check permissions before executing:

```typescript
// Good
commService.registerCommand('delete_user', (cmd) => {
  if (!authService.hasPermission('delete_user')) {
    throw new Error('Unauthorized');
  }
  
  return userService.delete(cmd.payload as string);
});
```

### Rate Limiting

Implement rate limiting:

```typescript
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

*Last updated: 2026-03-16*
*Version: 1.0*
