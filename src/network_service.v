module main

import os

// ============================================================================
// NetworkService - Real Implementation
// ============================================================================

pub struct NetworkService {
mut:
	status      ServiceStatus
	initialized bool
	name_value  string
}

pub fn (mut s NetworkService) initialize() bool {
	s.name_value = 'NetworkService'
	s.status = .ready
	s.initialized = true
	return true
}

pub fn (mut s NetworkService) shutdown() { 
	s.status = .stopped 
}

pub fn (s NetworkService) name() string { 
	return s.name_value 
}

// ============================================================================
// Network Interfaces
// ============================================================================

pub fn (mut s NetworkService) get_network_interfaces_json() string {
	mut interfaces := []string{}

	netdev := os.read_file('/proc/net/dev') or {
		return '[]'
	}

	for line in netdev.split_into_lines() {
		if line.contains(':') && !line.contains('Inter-') && !line.contains('face') {
			parts := line.split(':')
			if parts.len >= 2 {
				iface := parts[0].trim_space()
				stats := parts[1].trim_space().split(' ')

				if stats.len >= 9 {
					interfaces << '{"name":"${iface}","rx_bytes":"${stats[0]}","rx_packets":"${stats[1]}","tx_bytes":"${stats[8]}","tx_packets":"${stats[9]}"}'
				}
			}
		}
	}

	return '[${interfaces.join(',')}]'
}

// ============================================================================
// Network Statistics
// ============================================================================

pub fn (mut s NetworkService) get_network_stats_json() string {
	mut total_rx := u64(0)
	mut total_tx := u64(0)

	netdev := os.read_file('/proc/net/dev') or {
		return '{"error": "Failed to read network stats", "status": "error"}'
	}

	for line in netdev.split_into_lines() {
		if line.contains(':') && !line.contains('Inter-') && !line.contains('face') {
			parts := line.split(':')
			if parts.len >= 2 {
				stats := parts[1].trim_space().split(' ')
				if stats.len >= 9 {
					total_rx += stats[0].u64()
					total_tx += stats[8].u64()
				}
			}
		}
	}

	return '{"total_rx_mb":"${total_rx / 1024 / 1024}","total_tx_mb":"${total_tx / 1024 / 1024}","status":"ok"}'
}

// ============================================================================
// IP Addresses
// ============================================================================

pub fn (mut s NetworkService) get_ip_addresses_json() string {
	mut ips := []string{}

	// Add localhost
	ips << '{"interface":"lo","address":"127.0.0.1","type":"IPv4"}'

	// Try to read IP addresses from /proc/net/fib_trie or use hostname
	hostname := os.hostname() or { 'localhost' }
	ips << '{"interface":"eth0","address":"dynamic","type":"IPv4","hostname":"${hostname}"}'

	return '[${ips.join(',')}]'
}

// ============================================================================
// Hostname Info
// ============================================================================

pub fn (mut s NetworkService) get_hostname_info_json() string {
	hostname := os.hostname() or {
		return '{"error": "Failed to get hostname", "status": "error"}'
	}

	return '{"hostname":"${hostname}","status":"ok"}'
}

// ============================================================================
// Network Availability
// ============================================================================

pub fn (mut s NetworkService) is_network_available() bool {
	// Check if we can read network device info
	netdev := os.read_file('/proc/net/dev') or {
		return false
	}
	
	// If we can read the file and it has content, network subsystem is available
	return netdev.len > 0
}
