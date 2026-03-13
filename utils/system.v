// System Information Utility - Simplified for V 0.5.1

module utils

import os

// SystemInfo holds comprehensive system information
pub struct SystemInfo {
	hostname       string
	username       string
	os_name        string
	arch           string
	cpu_cores      int
	total_memory_mb int
	available_memory_mb int
}

// MemoryStats holds memory statistics
pub struct MemoryStats {
	total_mb     int
	used_mb      int
	free_mb      int
	available_mb int
	percent_used f64
}

// Get system information
pub fn get_system_info() SystemInfo {
	mut info := SystemInfo{}

	// Get hostname
	info.hostname = os.hostname() or { 'unknown' }

	// Get username
	info.username = os.user() or { 'unknown' }

	// Get OS information
	info.os_name = os.user_os()
	info.arch = os.arch() or { 'unknown' }

	// Get CPU cores
	info.cpu_cores = os.cpu_count()

	// Get memory information
	meminfo := os.read_file('/proc/meminfo') or { '' }
	if meminfo.len > 0 {
		for line in meminfo.split_into_lines() {
			parts := line.split(':')
			if parts.len != 2 {
				continue
			}
			key := parts[0].trim_space()
			value_str := parts[1].trim_space().replace('kB', '')
			value_kb := value_str.int() or { 0 }
			value_mb := value_kb / 1024

			if key == 'MemTotal' {
				info.total_memory_mb = value_mb
			} else if key == 'MemAvailable' {
				info.available_memory_mb = value_mb
			}
		}
	}

	return info
}

// Get memory statistics
pub fn get_memory_stats() MemoryStats {
	mut stats := MemoryStats{}

	meminfo := os.read_file('/proc/meminfo') or { '' }
	if meminfo.len > 0 {
		for line in meminfo.split_into_lines() {
			parts := line.split(':')
			if parts.len != 2 {
				continue
			}
			key := parts[0].trim_space()
			value_str := parts[1].trim_space().replace('kB', '')
			value_kb := value_str.int() or { 0 }
			value_mb := value_kb / 1024

			if key == 'MemTotal' {
				stats.total_mb = value_mb
			} else if key == 'MemFree' {
				stats.free_mb = value_mb
			} else if key == 'MemAvailable' {
				stats.available_mb = value_mb
			}
		}
	}

	// Calculate used and percent
	stats.used_mb = stats.total_mb - stats.available_mb
	if stats.total_mb > 0 {
		stats.percent_used = f64(stats.used_mb) / f64(stats.total_mb) * 100.0
	}

	return stats
}

// Get disk information (simplified)
pub fn get_disk_info() string {
	// Return JSON array with root partition info
	df_output := os.read_file('/proc/mounts') or { '[]' }
	
	mut result := '['
	mut first := true
	
	for line in df_output.split_into_lines() {
		parts := line.split(' ')
		if parts.len < 4 {
			continue
		}
		
		mountpoint := parts[1]
		if mountpoint == '/' || mountpoint.starts_with('/home') {
			if !first {
				result += ','
			}
			first = false
			result += '{"mountpoint":"${mountpoint}","device":"${parts[0]}","fstype":"${parts[2]}"}'
		}
	}
	
	result += ']'
	return result
}

// Get network interfaces (simplified)
pub fn get_network_interfaces() string {
	// Read /proc/net/dev
	netdev := os.read_file('/proc/net/dev') or { return '[]' }
	
	mut result := '['
	mut first := true
	
	for line in netdev.split_into_lines() {
		if line.trim_space().len == 0 || line.starts_with('Inter') || line.starts_with(' ') {
			continue
		}

		parts := line.split(':')
		if parts.len != 2 {
			continue
		}

		name := parts[0].trim_space()
		
		// Skip loopback
		if name == 'lo' {
			continue
		}

		if !first {
			result += ','
		}
		first = false
		
		// Get MAC address
		ip_path := '/sys/class/net/${name}/address'
		mac := os.read_file(ip_path) or { 'unknown' }
		
		result += '{"name":"${name}","mac":"${mac.trim_space()}","is_up":true}'
	}
	
	result += ']'
	return result
}
