import { Injectable, signal, computed, inject } from '@angular/core';
import { LoggerService } from '../core/logger.service';
import {
  CommunicationHub,
  Message,
  Event,
  Command,
  RPCResponse,
  globalCommHub,
} from '../../communication/communication';

/**
 * Communication Service - Alternative Backend-Frontend Communication
 * Provides multiple non-HTTP/HTTPS communication patterns
 */
@Injectable({ providedIn: 'root' })
export class CommunicationService {
  private readonly logger = inject(LoggerService).getLogger('CommunicationService');
  private readonly hub: CommunicationHub = globalCommHub;

  // Signal-based state
  private readonly initialized = signal<boolean>(false);
  private readonly messageCount = signal<number>(0);
  private readonly eventCount = signal<number>(0);
  private readonly commandCount = signal<number>(0);

  // Computed stats
  readonly stats = computed(() => ({
    initialized: this.initialized(),
    messageCount: this.messageCount(),
    eventCount: this.eventCount(),
    commandCount: this.commandCount(),
  }));

  constructor() {
    this.initialize();
  }

  /**
   * Initialize communication hub
   */
  private initialize(): void {
    this.hub.initialize();
    this.initialized.set(true);
    this.logger.info('Communication hub initialized');

    // Setup message bus logging
    this.hub.messageBus.subscribe('system', (msg: Message) => {
      this.logger.debug('System message', { event: msg.eventType, data: msg.data });
      this.messageCount.update(count => count + 1);
    });

    // Setup event store logging
    this.hub.eventStore.append('system', 'initialized', { timestamp: new Date().toISOString() });
    this.eventCount.update(count => count + 1);
  }

  // ============================================================================
  // Message Bus (Pub/Sub)
  // ============================================================================

  /**
   * Subscribe to a channel
   */
  subscribe(channel: string, handler: (msg: Message) => void): () => void {
    const unsubscribe = this.hub.messageBus.subscribe(channel, handler);
    this.logger.debug('Subscribed to channel', { channel });
    return unsubscribe;
  }

  /**
   * Publish message to channel
   */
  publish(channel: string, eventType: string, data: unknown, priority: Message['priority'] = 'normal'): void {
    this.hub.messageBus.publish(channel, eventType, data, priority);
    this.messageCount.update(count => count + 1);
    this.logger.debug('Published message', { channel, eventType, priority });
  }

  /**
   * Get message history
   */
  getMessageHistory(): Message[] {
    return this.hub.messageBus.getHistory();
  }

  /**
   * Get channel-specific history
   */
  getChannelHistory(channel: string): Message[] {
    return this.hub.messageBus.getChannelHistory(channel);
  }

  // ============================================================================
  // Event Store (Event Sourcing)
  // ============================================================================

  /**
   * Append event to store
   */
  appendEvent(aggregateId: string, eventType: string, data: unknown): Event {
    const event = this.hub.eventStore.append(aggregateId, eventType, data);
    this.eventCount.update(count => count + 1);
    this.logger.debug('Event appended', { aggregateId, eventType });
    return event;
  }

  /**
   * Get events for aggregate
   */
  getEvents(aggregateId: string): Event[] {
    return this.hub.eventStore.getEvents(aggregateId);
  }

  /**
   * Get all events
   */
  getAllEvents(): Event[] {
    return this.hub.eventStore.getAllEvents();
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: string): Event[] {
    return this.hub.eventStore.getEventsByType(eventType);
  }

  /**
   * Get events since timestamp
   */
  getEventsSince(timestamp: string): Event[] {
    return this.hub.eventStore.getEventsSince(timestamp);
  }

  // ============================================================================
  // Command Bus (CQRS)
  // ============================================================================

  /**
   * Register command handler
   */
  registerCommand(commandName: string, handler: (cmd: Command) => unknown): void {
    this.hub.commandBus.register(commandName, handler);
    this.logger.debug('Command handler registered', { command: commandName });
  }

  /**
   * Execute command
   */
  executeCommand(commandName: string, payload: unknown): Command {
    const cmd = this.hub.commandBus.execute(commandName, payload);
    this.commandCount.update(count => count + 1);
    
    if (cmd.error) {
      this.logger.error('Command execution failed', { command: commandName, error: cmd.error });
    } else {
      this.logger.debug('Command executed', { command: commandName });
    }
    
    return cmd;
  }

  /**
   * Get command log
   */
  getCommandLog(): Command[] {
    return this.hub.commandBus.getLog();
  }

  /**
   * Get pending commands
   */
  getPendingCommands(): Command[] {
    return this.hub.commandBus.getPending();
  }

  // ============================================================================
  // RPC (Remote Procedure Call)
  // ============================================================================

  /**
   * Register RPC method
   */
  registerRPC(methodName: string, handler: (params: unknown) => unknown): void {
    this.hub.rpcServer.register(methodName, handler);
    this.logger.debug('RPC method registered', { method: methodName });
  }

  /**
   * Call RPC method
   */
  callRPC(methodName: string, params: unknown): RPCResponse {
    const response = this.hub.rpcServer.call(methodName, params);
    
    if (response.error) {
      this.logger.error('RPC call failed', { method: methodName, error: response.error });
    } else {
      this.logger.debug('RPC call succeeded', { method: methodName });
    }
    
    return response;
  }

  /**
   * Get available RPC methods
   */
  getRPCMethods(): string[] {
    return this.hub.rpcServer.getMethods();
  }

  // ============================================================================
  // Channels (Message Passing)
  // ============================================================================

  /**
   * Send to channel
   */
  sendToChannel<T>(channelName: string, message: T): boolean {
    const success = this.hub.sendToChannel(channelName, message);
    if (!success) {
      this.logger.warn('Failed to send to channel', { channel: channelName });
    }
    return success;
  }

  /**
   * Receive from channel
   */
  receiveFromChannel<T>(channelName: string): T | undefined {
    return this.hub.receiveFromChannel<T>(channelName);
  }

  /**
   * Get channel
   */
  getChannel<T>(channelName: string) {
    return this.hub.getChannel<T>(channelName);
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  /**
   * Get communication statistics
   */
  getStats(): ReturnType<CommunicationHub['getStats']> {
    return this.hub.getStats();
  }

  /**
   * Get stats as JSON string
   */
  getStatsJSON(): string {
    const stats = this.getStats();
    return JSON.stringify({
      messageBus: stats.messageBus,
      eventStore: stats.eventStore,
      commandBus: stats.commandBus,
      rpcServer: stats.rpcServer,
      channels: Object.fromEntries(stats.channels),
    });
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Clear all data
   */
  clear(): void {
    this.hub.messageBus.clearHistory();
    this.hub.eventStore.clear();
    this.hub.commandBus.clearLog();
    this.messageCount.set(0);
    this.eventCount.set(0);
    this.commandCount.set(0);
    this.logger.info('Communication hub cleared');
  }

  /**
   * Destroy communication hub
   */
  destroy(): void {
    this.clear();
    this.initialized.set(false);
    this.logger.info('Communication hub destroyed');
  }
}
