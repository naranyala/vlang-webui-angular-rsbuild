/**
 * Communication Module - Alternative Backend-Frontend Communication Patterns
 * Non-HTTP/HTTPS communication methods
 */

// ============================================================================
// Message Bus - Pub/Sub Pattern
// ============================================================================

export interface Message {
  id: string;
  timestamp: string;
  channel: string;
  eventType: string;
  data: unknown;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export type MessageHandler = (msg: Message) => void;

export class MessageBus {
  private subscribers: Map<string, Set<MessageHandler>> = new Map();
  private messageHistory: Message[] = [];
  private maxHistory = 100;
  private messageCounter = 0;

  subscribe(channel: string, handler: MessageHandler): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel)!.add(handler);

    // Return unsubscribe function
    return () => this.unsubscribe(channel, handler);
  }

  unsubscribe(channel: string, handler: MessageHandler): void {
    const handlers = this.subscribers.get(channel);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscribers.delete(channel);
      }
    }
  }

  publish(channel: string, eventType: string, data: unknown, priority: Message['priority'] = 'normal'): void {
    this.messageCounter++;
    
    const msg: Message = {
      id: `msg_${this.messageCounter}`,
      timestamp: new Date().toISOString(),
      channel,
      eventType,
      data,
      priority,
    };

    // Deliver to subscribers
    const handlers = this.subscribers.get(channel);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(msg);
        } catch (error) {
          console.error(`Message handler error for channel ${channel}:`, error);
        }
      });
    }

    // Store in history
    this.messageHistory.push(msg);
    if (this.messageHistory.length > this.maxHistory) {
      this.messageHistory = this.messageHistory.slice(-this.maxHistory);
    }
  }

  getHistory(): Message[] {
    return [...this.messageHistory];
  }

  getChannelHistory(channel: string): Message[] {
    return this.messageHistory.filter(msg => msg.channel === channel);
  }

  clearHistory(): void {
    this.messageHistory = [];
  }

  getStats(): { totalMessages: number; activeChannels: number; historySize: number } {
    return {
      totalMessages: this.messageCounter,
      activeChannels: this.subscribers.size,
      historySize: this.messageHistory.length,
    };
  }
}

// ============================================================================
// Event Store - Event Sourcing Pattern
// ============================================================================

export interface Event {
  id: string;
  aggregateId: string;
  eventType: string;
  timestamp: string;
  version: number;
  data: unknown;
}

export class EventStore {
  private events: Event[] = [];
  private aggregates: Map<string, Event[]> = new Map();

  append(aggregateId: string, eventType: string, data: unknown): Event {
    const version = (this.aggregates.get(aggregateId)?.length || 0) + 1;
    
    const event: Event = {
      id: `evt_${this.events.length + 1}`,
      aggregateId,
      eventType,
      timestamp: new Date().toISOString(),
      version,
      data,
    };

    this.events.push(event);

    if (!this.aggregates.has(aggregateId)) {
      this.aggregates.set(aggregateId, []);
    }
    this.aggregates.get(aggregateId)!.push(event);

    return event;
  }

  getEvents(aggregateId: string): Event[] {
    return this.aggregates.get(aggregateId) || [];
  }

  getAllEvents(): Event[] {
    return [...this.events];
  }

  getEventsByType(eventType: string): Event[] {
    return this.events.filter(event => event.eventType === eventType);
  }

  getEventsSince(timestamp: string): Event[] {
    return this.events.filter(event => event.timestamp >= timestamp);
  }

  clear(): void {
    this.events = [];
    this.aggregates.clear();
  }

  getStats(): { totalEvents: number; aggregateCount: number } {
    return {
      totalEvents: this.events.length,
      aggregateCount: this.aggregates.size,
    };
  }
}

// ============================================================================
// Command Bus - CQRS Command Pattern
// ============================================================================

export interface Command {
  id: string;
  name: string;
  timestamp: string;
  payload: unknown;
  executed: boolean;
  result?: unknown;
  error?: string;
}

export type CommandHandler = (cmd: Command) => unknown;

export class CommandBus {
  private handlers: Map<string, CommandHandler> = new Map();
  private commandLog: Command[] = [];
  private maxLog = 50;

  register(commandName: string, handler: CommandHandler): void {
    this.handlers.set(commandName, handler);
  }

  execute(commandName: string, payload: unknown): Command {
    const cmd: Command = {
      id: `cmd_${this.commandLog.length + 1}`,
      name: commandName,
      timestamp: new Date().toISOString(),
      payload,
      executed: false,
    };

    const handler = this.handlers.get(commandName);
    if (!handler) {
      cmd.error = `Handler not found: ${commandName}`;
      this.commandLog.push(cmd);
      return cmd;
    }

    try {
      const result = handler(cmd);
      cmd.executed = true;
      cmd.result = result;
    } catch (error) {
      cmd.error = error instanceof Error ? error.message : 'Unknown error';
    }

    this.commandLog.push(cmd);
    if (this.commandLog.length > this.maxLog) {
      this.commandLog = this.commandLog.slice(-this.maxLog);
    }

    return cmd;
  }

  getLog(): Command[] {
    return [...this.commandLog];
  }

  getPending(): Command[] {
    return this.commandLog.filter(cmd => !cmd.executed);
  }

  clearLog(): void {
    this.commandLog = [];
  }

  getStats(): { totalCommands: number; handlerCount: number; executed: number; failed: number } {
    return {
      totalCommands: this.commandLog.length,
      handlerCount: this.handlers.size,
      executed: this.commandLog.filter(cmd => cmd.executed).length,
      failed: this.commandLog.filter(cmd => !cmd.executed).length,
    };
  }
}

// ============================================================================
// Channel - Typed Message Passing
// ============================================================================

export class Channel<T> {
  private messages: T[] = [];
  private capacity: number;
  private subscribers = 0;

  constructor(capacity: number = 100) {
    this.capacity = capacity;
  }

  send(msg: T): boolean {
    if (this.messages.length >= this.capacity) {
      return false;
    }
    this.messages.push(msg);
    return true;
  }

  receive(): T | undefined {
    if (this.messages.length === 0) {
      return undefined;
    }
    return this.messages.shift();
  }

  peek(): T | undefined {
    return this.messages[0];
  }

  hasMessages(): boolean {
    return this.messages.length > 0;
  }

  count(): number {
    return this.messages.length;
  }

  clear(): void {
    this.messages = [];
  }

  getInfo(): { count: number; capacity: number; subscribers: number } {
    return {
      count: this.messages.length,
      capacity: this.capacity,
      subscribers: this.subscribers,
    };
  }
}

// ============================================================================
// RPC - Remote Procedure Call Pattern
// ============================================================================

export interface RPCRequest {
  id: string;
  method: string;
  params: unknown;
  timestamp: string;
}

export interface RPCResponse {
  id: string;
  result?: unknown;
  error?: string;
  timestamp: string;
}

export type RPCMethod = (params: unknown) => unknown;

export class RPCServer {
  private methods: Map<string, RPCMethod> = new Map();
  private callLog: RPCRequest[] = [];
  private maxLog = 100;

  register(methodName: string, handler: RPCMethod): void {
    this.methods.set(methodName, handler);
  }

  call(methodName: string, params: unknown): RPCResponse {
    const req: RPCRequest = {
      id: `rpc_${this.callLog.length + 1}`,
      method: methodName,
      params,
      timestamp: new Date().toISOString(),
    };

    this.callLog.push(req);
    if (this.callLog.length > this.maxLog) {
      this.callLog = this.callLog.slice(-this.maxLog);
    }

    const resp: RPCResponse = {
      id: req.id,
      timestamp: new Date().toISOString(),
    };

    const handler = this.methods.get(methodName);
    if (!handler) {
      resp.error = `Method not found: ${methodName}`;
      return resp;
    }

    try {
      resp.result = handler(params);
    } catch (error) {
      resp.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return resp;
  }

  getMethods(): string[] {
    return Array.from(this.methods.keys());
  }

  getLog(): RPCRequest[] {
    return [...this.callLog];
  }

  getStats(): { methodCount: number; totalCalls: number } {
    return {
      methodCount: this.methods.size,
      totalCalls: this.callLog.length,
    };
  }
}

// ============================================================================
// Communication Hub - Unified Communication Layer
// ============================================================================

export class CommunicationHub {
  readonly messageBus: MessageBus;
  readonly eventStore: EventStore;
  readonly commandBus: CommandBus;
  readonly rpcServer: RPCServer;
  private channels: Map<string, Channel<unknown>> = new Map();

  constructor() {
    this.messageBus = new MessageBus();
    this.eventStore = new EventStore();
    this.commandBus = new CommandBus();
    this.rpcServer = new RPCServer();
  }

  initialize(): void {
    // Create default channels
    this.channels.set('system', new Channel(100));
    this.channels.set('user', new Channel(50));
    this.channels.set('data', new Channel(200));
  }

  sendToChannel<T>(channelName: string, message: T): boolean {
    const channel = this.channels.get(channelName) as Channel<T> | undefined;
    if (!channel) {
      return false;
    }
    return channel.send(message);
  }

  receiveFromChannel<T>(channelName: string): T | undefined {
    const channel = this.channels.get(channelName) as Channel<T> | undefined;
    if (!channel) {
      return undefined;
    }
    return channel.receive();
  }

  getChannel<T>(channelName: string): Channel<T> | undefined {
    return this.channels.get(channelName) as Channel<T> | undefined;
  }

  getStats(): {
    messageBus: ReturnType<MessageBus['getStats']>;
    eventStore: ReturnType<EventStore['getStats']>;
    commandBus: ReturnType<CommandBus['getStats']>;
    rpcServer: ReturnType<RPCServer['getStats']>;
    channels: Map<string, ReturnType<Channel<unknown>['getInfo']>>;
  } {
    return {
      messageBus: this.messageBus.getStats(),
      eventStore: this.eventStore.getStats(),
      commandBus: this.commandBus.getStats(),
      rpcServer: this.rpcServer.getStats(),
      channels: new Map(
        Array.from(this.channels.entries()).map(([name, channel]) => [name, channel.getInfo()])
      ),
    };
  }
}

// ============================================================================
// Global Communication Hub Instance
// ============================================================================

export const globalCommHub = new CommunicationHub();
