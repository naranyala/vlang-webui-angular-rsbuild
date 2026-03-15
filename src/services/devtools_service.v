module services

import os
import time
import json

// ============================================================================
// DevToolsService - Minimal version to avoid V compiler bug
// ============================================================================

@[heap]
pub struct DevToolsService {
mut:
	initialized      bool
	start_time       string
	event_log        []string
	log_entries      []string
}

// Initialize DevTools service
pub fn (mut svc DevToolsService) initialize() {
	if svc.initialized {
		return
	}
	
	svc.start_time = time.now().custom_format('YYYY-MM-DD HH:mm:ss')
	svc.event_log = []string{}
	svc.log_entries = []string{}
	svc.initialized = true
}

// Shutdown service
pub fn (mut svc DevToolsService) shutdown() {
	svc.event_log.clear()
	svc.log_entries.clear()
	svc.initialized = false
}

// Add event
pub fn (mut svc DevToolsService) add_event(event_type string, message string) {
	timestamp := time.now().custom_format('YYYY-MM-DD HH:mm:ss')
	svc.event_log << '${timestamp} [${event_type}] ${message}'
}

// Add log entry
pub fn (mut svc DevToolsService) add_log(level string, message string) {
	timestamp := time.now().custom_format('YYYY-MM-DD HH:mm:ss')
	svc.log_entries << '${timestamp} [${level}] ${message}'
}

// Get system info
pub fn (svc DevToolsService) get_system_info_json() string {
	hostname := os.hostname() or { 'unknown' }
	info := {
		hostname: hostname
		username: os.user() or { 'unknown' }
		os: os.user_os()
		arch: os.user_arch()
		cpu_count: os.cpu_count()
		app_version: '1.0.0'
		build_time: svc.start_time
	}
	return json.encode(info) or { '{}' }
}

// Get memory info
pub fn (svc DevToolsService) get_memory_info_json() string {
	meminfo := os.read_file('/proc/meminfo') or {
		return '{"total_mb":0,"used_mb":0,"free_mb":0,"percent_used":"0"}'
	}
	
	mut total_kb := 0
	mut free_kb := 0
	
	for line in meminfo.split_into_lines() {
		if line.starts_with('MemTotal:') {
			parts := line.split(':')
			if parts.len > 1 {
				val_str := parts[1].trim_space().replace('kB', '')
				total_kb = val_str.int() or { 0 }
			}
		} else if line.starts_with('MemFree:') {
			parts := line.split(':')
			if parts.len > 1 {
				val_str := parts[1].trim_space().replace('kB', '')
				free_kb = val_str.int() or { 0 }
			}
		}
	}
	
	total_mb := total_kb / 1024
	free_mb := free_kb / 1024
	used_mb := total_mb - free_mb
	percent := f64(used_mb) / f64(total_mb) * 100.0
	
	info := {
		total_mb: total_mb
		used_mb: used_mb
		free_mb: free_mb
		percent_used: '${percent:.1}'
	}
	return json.encode(info) or { '{}' }
}

// Get process info
pub fn (svc DevToolsService) get_process_info_json() string {
	pid := os.getpid()
	info := {
		pid: pid
		name: 'desktopapp'
		cpu_percent: 0.0
		memory_mb: 45.0
		threads: 1
		uptime_seconds: 0
		start_time: svc.start_time
	}
	return json.encode(info) or { '{}' }
}

// Get network info
pub fn (svc DevToolsService) get_network_info_json() string {
	info := {
		interfaces: [
			{name: 'lo', ip: '127.0.0.1', mac: '00:00:00:00:00:00', is_up: true}
		]
		default_port: 0
		is_webui_bound: true
	}
	return json.encode(info) or { '{}' }
}

// Get database info
pub fn (svc DevToolsService) get_database_info_json(db_path string) string {
	db_exists := os.file_exists(db_path)
	info := {
		path: db_path
		size_kb: 0
		table_count: if db_exists { 1 } else { 0 }
		tables: if db_exists {
			[
				{name: 'users', row_count: 5, size_kb: 0, columns: [
					{name: 'id', type: 'INTEGER', nullable: false, is_primary_key: true}
				]}
			]
		} else {
			[]
		}
		connection_pool_size: 1
		active_connections: 0
	}
	return json.encode(info) or { '{}' }
}

// Get config info
pub fn (svc DevToolsService) get_config_info_json() string {
	info := {
		app_name: 'Desktop App'
		version: '1.0.0'
		log_level: 'debug'
		log_file: 'logs/app.log'
		database_path: 'data/users.db.json'
		port: 0
		debug_mode: false
		features: ['system_monitoring', 'file_operations', 'network_info', 'database']
	}
	return json.encode(info) or { '{}' }
}

// Get performance metrics
pub fn (svc DevToolsService) get_performance_metrics_json() string {
	info := {
		fps: 60
		dom_nodes: 0
		js_heap_size_mb: 0
		js_heap_used_mb: 0
		event_listeners: 0
		open_windows: 0
		active_timers: 0
		pending_requests: 0
	}
	return json.encode(info) or { '{}' }
}

// Get events
pub fn (svc DevToolsService) get_events_json() string {
	return json.encode(svc.event_log)
}

// Get bindings
pub fn (svc DevToolsService) get_bindings_json() string {
	bindings := [
		{name: 'getSystemInfo', bound: true, call_count: '0'}
	]
	return json.encode(bindings)
}

// Get logs
pub fn (svc DevToolsService) get_logs_json() string {
	return json.encode(svc.log_entries)
}

// Clear events
pub fn (mut svc DevToolsService) clear_events() {
	svc.event_log.clear()
	svc.add_event('system', 'Events cleared')
}

// Clear logs
pub fn (mut svc DevToolsService) clear_logs() {
	svc.log_entries.clear()
	svc.add_log('info', 'Logs cleared')
}

// Helper
pub fn (svc DevToolsService) is_initialized() bool {
	return svc.initialized
}
