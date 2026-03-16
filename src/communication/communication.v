module communication

// ============================================================================
// Communication Module - Main Exports
// ============================================================================
// This file re-exports all communication patterns for easy import

pub import message_bus
pub import event_store
pub import command_bus
pub import rpc
pub import channel
pub import hub

// Re-export main types for backward compatibility
pub type Message = message_bus.Message
pub type Priority = message_bus.Priority
pub type MessageBus = message_bus.MessageBus

pub type Event = event_store.Event
pub type EventStore = event_store.EventStore

pub type Command = command_bus.Command
pub type CommandHandler = command_bus.CommandHandler
pub type CommandBus = command_bus.CommandBus

pub type RPCRequest = rpc.RPCRequest
pub type RPCResponse = rpc.RPCResponse
pub type RPCMethod = rpc.RPCMethod
pub type RPCServer = rpc.RPCServer

pub type Channel = channel.Channel

pub type CommHub = hub.CommHub

// Re-export constructors
pub fn create_message_bus() MessageBus {
	return message_bus.create_message_bus()
}

pub fn create_event_store() EventStore {
	return event_store.create_event_store()
}

pub fn create_command_bus() CommandBus {
	return command_bus.create_command_bus()
}

pub fn create_rpc_server() RPCServer {
	return rpc.create_rpc_server()
}

pub fn create_channel[T](capacity int) Channel[T] {
	return channel.create_channel[T](capacity)
}

pub fn create_comm_hub() CommHub {
	return hub.create_comm_hub()
}
