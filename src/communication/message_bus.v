module message_bus

import time
import json

// ============================================================================
// Message Bus - Pub/Sub Pattern
// ============================================================================

// Message represents a communication message
pub struct Message {
pub mut:
	id          string
	timestamp   string
	channel     string
	event_type  string
	data        string  // JSON-encoded payload
	priority    Priority
}

// Priority levels for messages
pub enum Priority {
	low = 0
	normal = 1
	high = 2
	critical = 3
}

// MessageHandler is a callback function for handling messages
pub type MessageHandler = fn (msg Message)

// MessageBus implements pub/sub pattern
@[heap]
pub struct MessageBus {
mut:
	subscribers        map[string][]MessageHandler
	message_history    []Message
	max_history        int
	message_counter    int
}

// Create new message bus
pub fn create_message_bus() MessageBus {
	return MessageBus{
		subscribers: map[string][]MessageHandler{}
		message_history: []Message{}
		max_history: 100
		message_counter: 0
	}
}

// Subscribe to a channel
pub fn (mut bus MessageBus) subscribe(channel string, handler MessageHandler) {
	if channel !in bus.subscribers {
		bus.subscribers[channel] = []MessageHandler{}
	}
	bus.subscribers[channel] << handler
}

// Unsubscribe from a channel
pub fn (mut bus MessageBus) unsubscribe(channel string, handler MessageHandler) {
	if channel !in bus.subscribers {
		return
	}
	
	mut handlers := bus.subscribers[channel]
	mut new_handlers := []MessageHandler{}
	for h in handlers {
		if h != handler {
			new_handlers << h
		}
	}
	bus.subscribers[channel] = new_handlers
}

// Publish message to a channel
pub fn (mut bus MessageBus) publish(channel string, event_type string, data string) {
	bus.publish_with_priority(channel, event_type, data, .normal)
}

// Publish message with priority
pub fn (mut bus MessageBus) publish_with_priority(channel string, event_type string, data string, priority Priority) {
	bus.message_counter++
	
	msg := Message{
		id: 'msg_${bus.message_counter}'
		timestamp: time.now().custom_format('YYYY-MM-DD HH:mm:ss.SSS')
		channel: channel
		event_type: event_type
		data: data
		priority: priority
	}
	
	// Deliver to subscribers
	if channel in bus.subscribers {
		for handler in bus.subscribers[channel] {
			handler(msg)
		}
	}
	
	// Store in history
	bus.message_history << msg
	if bus.message_history.len > bus.max_history {
		bus.message_history = bus.message_history[bus.message_history.len - bus.max_history..]
	}
}

// Get message history
pub fn (bus MessageBus) get_history() []Message {
	return bus.message_history
}

// Get history for specific channel
pub fn (bus MessageBus) get_channel_history(channel string) []Message {
	mut result := []Message{}
	for msg in bus.message_history {
		if msg.channel == channel {
			result << msg
		}
	}
	return result
}

// Clear history
pub fn (mut bus MessageBus) clear_history() {
	bus.message_history.clear()
}

// Get statistics
pub fn (bus MessageBus) get_stats() map[string]int {
	mut stats := map[string]int{}
	stats['total_messages'] = bus.message_counter
	stats['active_channels'] = bus.subscribers.len
	stats['history_size'] = bus.message_history.len
	
	return stats
}
