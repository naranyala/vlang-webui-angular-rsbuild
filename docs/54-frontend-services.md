# Frontend Services Documentation

## Overview

The frontend consists of Angular services that provide various functionalities. All services use Angular's dependency injection with `@Injectable({ providedIn: 'root' })`.

---

## Service Architecture

All services follow this pattern:

```typescript
@Injectable({ providedIn: 'root' })
export class ServiceName {
  constructor(
    private dependencies: Dependencies
  ) {}

  // Public methods
  methodName(): ReturnType {
    // Implementation
  }
}
```

---

## Services Reference

### WebUIService

**File**: `frontend/src/services/app/webui.service.ts`

**Purpose**: Backend communication via WebUI bridge.

**Methods**:

```typescript
// Call backend function
call<T>(functionName: string, args?: unknown[], options?: WebUICallOptions): Promise<T>

// Call with retry
callWithRetry<T>(functionName: string, args?: unknown[], options?: WebUICallOptions): Promise<T>

// Call multiple functions in parallel
callAll<T extends Record<string, unknown>>(
  calls: Array<{ name: string; args?: unknown[] }>
): Promise<{ [K in keyof T]: T[K] }>

// Reset connection
resetConnection(): void
```

**Signals**:

```typescript
connected: Signal<boolean>
port: Signal<number | null>
connectionState: Computed<WebUIConnectionState>
```

**Usage Example**:

```typescript
const webui = inject(WebUIService);

// Call backend
const users = await webui.call<User[]>('getUsers');

// Call with retry
const result = await webui.callWithRetry('getData', [], {
  retryCount: 3,
  retryDelay: 1000
});

// Parallel calls
const [users, settings] = await webui.callAll({
  users: { name: 'getUsers' },
  settings: { name: 'getSettings' }
});
```

---

### CommunicationService

**File**: `frontend/src/services/app/communication.service.ts`

**Purpose**: Alternative communication patterns (pub/sub, event store, command bus, RPC).

**Methods**:

```typescript
// Message Bus (Pub/Sub)
subscribe(channel: string, handler: (msg: Message) => void): () => void
publish(channel: string, eventType: string, data: unknown, priority?: Priority): void
getMessageHistory(): Message[]
getChannelHistory(channel: string): Message[]

// Event Store (Event Sourcing)
appendEvent(aggregateId: string, eventType: string, data: unknown): Event
getEvents(aggregateId: string): Event[]
getAllEvents(): Event[]
getEventsByType(eventType: string): Event[]
getEventsSince(timestamp: string): Event[]

// Command Bus (CQRS)
registerCommand(commandName: string, handler: (cmd: Command) => unknown): void
executeCommand(commandName: string, payload: unknown): Command
getCommandLog(): Command[]
getPendingCommands(): Command[]

// RPC
registerRPC(methodName: string, handler: (params: unknown) => unknown): void
callRPC(methodName: string, params: unknown): RPCResponse
getRPCMethods(): string[]

// Channels
sendToChannel<T>(channelName: string, message: T): boolean
receiveFromChannel<T>(channelName: string): T | undefined
getChannel<T>(channelName: string): Channel<T> | undefined

// Statistics
getStats(): ReturnType<CommunicationHub['getStats']>
```

**Usage Example**:

```typescript
const commService = inject(CommunicationService);

// Subscribe to channel
const unsubscribe = commService.subscribe('system', (msg) => {
  console.log('Event:', msg.eventType, msg.data);
});

// Publish event
commService.publish('system', 'user_login', userData, 'high');

// Execute command
const cmd = commService.executeCommand('create_user', userData);
if (cmd.executed) {
  console.log('Success:', cmd.result);
}

// Call RPC
const resp = commService.callRPC('get_user', '123');
if (resp.error) {
  console.error('Error:', resp.error);
}
```

---

### ErrorService

**File**: `frontend/src/services/core/error.service.ts`

**Purpose**: Centralized error handling.

**Methods**:

```typescript
// Report error
report(error: Partial<AppError>): void

// Clear errors
clear(): void
clearAll(): void

// Get error history
getHistory(): AppError[]

// Create typed errors
validationError(message: string, field?: string): AppError
networkError(message: string, url?: string): AppError
internalError(message: string, details?: string): AppError

// Convert from Result
fromResult<T>(result: Result<T>, defaultMessage: string): T | null
```

**Signals**:

```typescript
errors: Signal<AppError[]>
activeError: Signal<AppError | null>
hasError: Computed<boolean>
errorCount: Computed<number>
lastError: Computed<AppError | null>
```

**Usage Example**:

```typescript
const errorService = inject(ErrorService);

// Report error
errorService.report({
  message: 'Something went wrong',
  severity: 'error',
  context: { userId: 123 }
});

// Create typed errors
const validationErr = errorService.validationError('Email required', 'email');
const networkErr = errorService.networkError('Connection failed', '/api/users');

// Handle Result
const result = await someOperation();
const value = errorService.fromResult(result, 'Operation failed');
```

---

### LoggerService

**File**: `frontend/src/services/core/logger.service.ts`

**Purpose**: Logging with levels and history.

**Methods**:

```typescript
// Create logger instance
getLogger(scope: string): Logger

// Log at different levels
log(context: string, level: LogLevel, message: string, data?: unknown): void

// Get history
getHistory(): LogEntry[]
clearHistory(): void
```

**Usage Example**:

```typescript
const loggerService = inject(LoggerService);
const logger = loggerService.getLogger('MyComponent');

logger.debug('Debug message', { data: 'value' });
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', error);
```

---

### UserService

**File**: `frontend/src/services/app/user.service.ts`

**Purpose**: User management with validation.

**Methods**:

```typescript
// CRUD operations
getAll(): Promise<User[]>
getById(id: number): Promise<User>
save(user: Partial<User>): Promise<User>
delete(id: number): Promise<void>

// Search
search(query: string): Promise<User[]>

// Statistics
getStats(): Promise<{ total: number; active: number; inactive: number }>
```

**Usage Example**:

```typescript
const userService = inject(UserService);

// Get all users
const users = await userService.getAll();

// Get by ID
const user = await userService.getById(1);

// Save user (with validation)
try {
  const saved = await userService.save({ name: 'John', email: 'john@example.com' });
} catch (error) {
  console.error('Validation failed:', error);
}

// Delete user
await userService.delete(1);

// Search users
const results = await userService.search('john');
```

---

## Validation Utilities

**File**: `frontend/src/utils/validation.ts`

**Functions**:

```typescript
// Email validation
validateEmail(email: string, fieldName?: string): ValidationError | null

// Name validation
validateName(name: string, fieldName?: string, minLength?: number, maxLength?: number): ValidationError | null

// Password validation
validatePassword(password: string, fieldName?: string, minLength?: number): ValidationError | null

// Role validation
validateRole(role: string, fieldName?: string, allowedRoles?: string[]): ValidationError | null

// Status validation
validateStatus(status: string, fieldName?: string, allowedStatuses?: string[]): ValidationError | null

// Combined validation
validateUserInput(user: Partial<User>): ValidationResult

// Format errors
formatValidationErrors(errors: ValidationError[]): string
```

**Usage Example**:

```typescript
import { validateEmail, validateUserInput } from './utils/validation';

// Single validation
const emailError = validateEmail('invalid');
if (emailError) {
  console.error(emailError.message);
}

// Combined validation
const result = validateUserInput({
  name: 'John',
  email: 'invalid',
  role: 'user'
});

if (!result.isValid) {
  console.error(formatValidationErrors(result.errors));
}
```

---

## Service Dependencies

```
WebUIService
  - None (core service)

CommunicationService
  - WebUIService (optional)
  - LoggerService

ErrorService
  - None (core service)

LoggerService
  - ErrorService (for error logging)

UserService
  - WebUIService
  - Validation utilities
```

---

## Testing Services

Each service has corresponding test files:

```
frontend/src/
├── services/
│   ├── app/
│   │   ├── webui.service.ts
│   │   ├── webui.service.spec.ts
│   │   ├── communication.service.ts
│   │   ├── user.service.ts
│   │   └── user.service.spec.ts
│   └── core/
│       ├── error.service.ts
│       ├── error.service.spec.ts
│       ├── logger.service.ts
│       └── logger.service.spec.ts
└── utils/
    ├── validation.ts
    └── validation.spec.ts
```

Run tests:

```bash
cd frontend
bun test
```

---

## Best Practices

### 1. Inject Services

Use `inject()` function:

```typescript
// Good
const service = inject(ServiceName);

// Avoid constructor injection
constructor(private service: ServiceName) {}
```

### 2. Use Signals

Prefer signals over RxJS:

```typescript
// Good
readonly data = signal<Data[]>([]);
readonly count = computed(() => this.data().length);

// Avoid
private data$ = new BehaviorSubject<Data[]>([]);
```

### 3. Handle Errors

Always handle errors:

```typescript
// Good
try {
  const result = await service.operation();
} catch (error) {
  errorService.report({ message: 'Operation failed', severity: 'error' });
}

// Avoid
const result = await service.operation(); // No error handling
```

### 4. Validate Input

Validate before sending to backend:

```typescript
// Good
const validation = validateUserInput(user);
if (!validation.isValid) {
  throw new Error(formatValidationErrors(validation.errors));
}
await userService.save(user);

// Avoid
await userService.save(user); // No validation
```

---

*Last updated: 2026-03-16*
*Version: 1.0*
