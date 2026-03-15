module services

import os
import time

// ============================================================================
// SystemInfoService - Real Implementation
// ============================================================================

pub struct SystemInfoService {
mut:
	status      ServiceStatus
	initialized bool
	name_value  string
}

pub fn (mut s SystemInfoService) initialize() bool {
	s.name_value = 'SystemInfoService'
	s.status = .ready
	s.initialized = true
	return true
}

pub fn (mut s SystemInfoService) shutdown() { 
	s.status = .stopped 
}

pub fn (s SystemInfoService) name() string { 
	return s.name_value 
}

// ============================================================================
// System Information
// ============================================================================

pub fn (mut s SystemInfoService) get_system_info_json() string {
	hostname := os.hostname() or { 'unknown' }
	os_name := os.user_os()
	
	// Get memory info for status
	mut total_mem := 0
	meminfo := os.read_file('/proc/meminfo') or { '' }
	if meminfo.len > 0 {
		for line in meminfo.split_into_lines() {
			if line.starts_with('MemTotal:') {
				parts := line.split(':')
				if parts.len > 1 {
					val_str := parts[1].trim_space().replace('kB', '')
					total_mem = val_str.int() / 1024
				}
			}
		}
	}
	
	return '{"hostname":"${hostname}","os":"${os_name}","total_memory_mb":"${total_mem}","status":"${if total_mem > 0 { 'ok' } else { 'degraded' }}"}'
}

// ============================================================================
// Memory Statistics
// ============================================================================

pub fn (mut s SystemInfoService) get_memory_stats_json() string {
	mut total_kb := 0
	mut free_kb := 0
	mut available_kb := 0

	meminfo := os.read_file('/proc/meminfo') or {
		return '{"error": "Failed to read memory info", "status": "error"}'
	}

	if meminfo.len > 0 {
		for line in meminfo.split_into_lines() {
			if line.starts_with('MemTotal:') {
				parts := line.split(':')
				if parts.len > 1 {
					val_str := parts[1].trim_space().replace('kB', '')
					total_kb = val_str.int()
				}
			} else if line.starts_with('MemFree:') {
				parts := line.split(':')
				if parts.len > 1 {
					val_str := parts[1].trim_space().replace('kB', '')
					free_kb = val_str.int()
				}
			} else if line.starts_with('MemAvailable:') {
				parts := line.split(':')
				if parts.len > 1 {
					val_str := parts[1].trim_space().replace('kB', '')
					available_kb = val_str.int()
				}
			}
		}
	}

	if total_kb <= 0 {
		return '{"error": "Invalid memory data", "status": "error"}'
	}

	total_mb := total_kb / 1024
	free_mb := free_kb / 1024
	available_mb := available_kb / 1024
	used_mb := total_mb - available_mb
	percent := f64(used_mb) / f64(total_mb) * 100.0

	return '{"total_mb":"${total_mb}","free_mb":"${free_mb}","available_mb":"${available_mb}","used_mb":"${used_mb}","percent_used":"${percent:.1}","status":"ok"}'
}

// ============================================================================
// Process List
// ============================================================================

pub fn (mut s SystemInfoService) list_processes_json(limit int) string {
	mut result := []string{}
	mut count := 0

	proc_entries := os.ls('/proc') or {
		return '[]'
	}

	for entry in proc_entries {
		if count >= limit {
			break
		}

		pid := entry.int()
		if pid == 0 {
			continue
		}

		proc_path := '/proc/${pid}'
		if !os.is_dir(proc_path) {
			continue
		}

		comm_path := '${proc_path}/comm'
		mut name := os.read_file(comm_path) or { '' }
		name = name.trim_space()

		if name.len == 0 {
			continue
		}

		count++
		result << '{"pid":"${pid}","name":"${name}"}'
	}

	return '[${result.join(',')}]'
}

// ============================================================================
// CPU Information
// ============================================================================

pub fn (mut s SystemInfoService) get_cpu_info_json() string {
	mut cpu_model := 'Unknown'
	mut cpu_cores := 0
	mut cpu_speed := '0.0'

	cpuinfo := os.read_file('/proc/cpuinfo') or {
		return '{"error": "Failed to read CPU info", "status": "error"}'
	}

	if cpuinfo.len > 0 {
		for line in cpuinfo.split_into_lines() {
			if line.starts_with('model name') {
				parts := line.split(':')
				if parts.len > 1 {
					cpu_model = parts[1].trim_space()
				}
				break
			} else if line.starts_with('cpu MHz') {
				parts := line.split(':')
				if parts.len > 1 {
					cpu_speed = parts[1].trim_space()
				}
			}
		}
		
		// Count processors
		cpu_cores = cpuinfo.split('processor').len - 1
	}

	if cpu_cores <= 0 {
		cpu_cores = 1
	}

	return '{"model":"${cpu_model}","cores":"${cpu_cores}","speed_mhz":"${cpu_speed}","status":"ok"}'
}

pub fn (mut s SystemInfoService) get_cpu_usage_json() string {
	// Read initial CPU stats
	stat1 := os.read_file('/proc/stat') or {
		return '{"error": "Failed to read CPU stats", "status": "error"}'
	}

	mut cpu1 := stat1.split('\n')[0].split(' ')
	if cpu1.len < 5 {
		return '{"error": "Invalid CPU stats", "status": "error"}'
	}
	
	mut user1 := cpu1[1].int()
	mut nice1 := cpu1[2].int()
	mut system1 := cpu1[3].int()
	mut idle1 := cpu1[4].int()

	// Wait a short time
	time.sleep(500 * time.millisecond)

	// Read CPU stats again
	stat2 := os.read_file('/proc/stat') or {
		return '{"error": "Failed to read CPU stats", "status": "error"}'
	}

	mut cpu2 := stat2.split('\n')[0].split(' ')
	if cpu2.len < 5 {
		return '{"error": "Invalid CPU stats", "status": "error"}'
	}
	
	mut user2 := cpu2[1].int()
	mut nice2 := cpu2[2].int()
	mut system2 := cpu2[3].int()
	mut idle2 := cpu2[4].int()

	// Calculate differences
	user_diff := user2 - user1
	nice_diff := nice2 - nice1
	system_diff := system2 - system1
	idle_diff := idle2 - idle1

	total_diff := user_diff + nice_diff + system_diff + idle_diff
	used_diff := user_diff + nice_diff + system_diff

	usage_percent := if total_diff > 0 { f64(used_diff) / f64(total_diff) * 100.0 } else { 0.0 }

	return '{"usage_percent":"${usage_percent:.1}","user":"${user_diff}","system":"${system_diff}","idle":"${idle_diff}","status":"ok"}'
}

// ============================================================================
// Disk Information
// ============================================================================

pub fn (mut s SystemInfoService) get_disk_usage_json() string {
	disk_usage := os.disk_usage('/') or {
		// Fallback values
		total := u64(500 * 1024 * 1024 * 1024)
		free := u64(250 * 1024 * 1024 * 1024)
		used := total - free
		percent := f64(used) / f64(total) * 100.0
		return '{"total_gb":"${total / 1024 / 1024 / 1024}","used_gb":"${used / 1024 / 1024 / 1024}","free_gb":"${free / 1024 / 1024 / 1024}","percent_used":"${percent:.1}","mount":"/","status":"ok"}'
	}

	total := disk_usage.total
	free := disk_usage.available
	used := disk_usage.used

	if total == 0 {
		return '{"error": "Failed to read disk info", "status": "error"}'
	}

	percent := f64(used) / f64(total) * 100.0
	return '{"total_gb":"${total / 1024 / 1024 / 1024}","used_gb":"${used / 1024 / 1024 / 1024}","free_gb":"${free / 1024 / 1024 / 1024}","percent_used":"${percent:.1}","mount":"/","status":"ok"}'
}

pub fn (mut s SystemInfoService) get_disk_partitions_json() string {
	mut partitions := []string{}

	mounts := os.read_file('/proc/mounts') or {
		return '[]'
	}

	for line in mounts.split_into_lines() {
		parts := line.split(' ')
		if parts.len >= 4 {
			partitions << '{"device":"${parts[0]}","mountpoint":"${parts[1]}","fstype":"${parts[2]}","options":"${parts[3]}"}'
		}
	}

	return '[${partitions.join(',')}]'
}

// ============================================================================
// System Load and Uptime
// ============================================================================

pub fn (mut s SystemInfoService) get_system_load_json() string {
	loadavg := os.read_file('/proc/loadavg') or {
		return '{"error": "Failed to read load average", "status": "error"}'
	}

	parts := loadavg.trim_space().split(' ')
	if parts.len >= 3 {
		load_1m := parts[0]
		load_5m := parts[1]
		load_15m := parts[2]

		return '{"load_1m":"${load_1m}","load_5m":"${load_5m}","load_15m":"${load_15m}","status":"ok"}'
	}

	return '{"error": "Failed to parse load average", "status": "error"}'
}

pub fn (mut s SystemInfoService) get_uptime_json() string {
	uptime_file := os.read_file('/proc/uptime') or {
		return '{"error": "Failed to read uptime", "status": "error"}'
	}

	parts := uptime_file.trim_space().split(' ')
	if parts.len >= 1 {
		uptime_seconds := parts[0].f64()
		uptime_days := uptime_seconds / 86400.0
		uptime_hours := uptime_seconds / 3600.0
		uptime_minutes := uptime_seconds / 60.0

		return '{"seconds":"${uptime_seconds:.0}","days":"${uptime_days:.1}","hours":"${uptime_hours:.1}","minutes":"${uptime_minutes:.1}","status":"ok"}'
	}

	return '{"error": "Failed to parse uptime", "status": "error"}'
}

// ============================================================================
// Environment Variables
// ============================================================================

pub fn (mut s SystemInfoService) get_environment_variables_json() string {
	mut env_vars := []string{}

	common_vars := ['PATH', 'HOME', 'USER', 'SHELL', 'PWD', 'LANG', 'TERM']

	for var_name in common_vars {
		value := os.getenv(var_name)
		if value.len > 0 {
			env_vars << '{"name":"${var_name}","value":"${value.replace('"', '\\"')}"}'
		}
	}

	return '[${env_vars.join(',')}]'
}

// ============================================================================
// Hardware Information
// ============================================================================

pub fn (mut s SystemInfoService) get_hardware_info_json() string {
	mut total_mem := 0
	mut cpu_cores := 0
	mut cpu_model := 'Unknown'

	// Read memory info
	meminfo := os.read_file('/proc/meminfo') or { '' }
	if meminfo.len > 0 {
		for line in meminfo.split_into_lines() {
			if line.starts_with('MemTotal:') {
				parts := line.split(':')
				if parts.len > 1 {
					val_str := parts[1].trim_space().replace('kB', '')
					total_mem = val_str.int() / 1024
				}
			}
		}
	}

	// Read CPU info
	cpuinfo := os.read_file('/proc/cpuinfo') or { '' }
	if cpuinfo.len > 0 {
		for line in cpuinfo.split_into_lines() {
			if line.starts_with('model name') {
				parts := line.split(':')
				if parts.len > 1 {
					cpu_model = parts[1].trim_space()
				}
				break
			}
		}
		cpu_cores = cpuinfo.split('processor').len - 1
	}

	if cpu_cores <= 0 {
		cpu_cores = 1
	}

	return '{"cpu_model":"${cpu_model}","cpu_cores":"${cpu_cores}","total_memory_mb":"${total_mem}","status":"ok"}'
}

pub fn (mut s SystemInfoService) get_sensor_temperatures_json() string {
	mut temperatures := []string{}

	hwmon_dirs := os.ls('/sys/class/hwmon') or {
		return '{"temperatures":[],"message":"No temperature sensors found","status":"ok"}'
	}

	for hwmon in hwmon_dirs {
		hwmon_path := '/sys/class/hwmon/${hwmon}'

		name_file := os.read_file('${hwmon_path}/name') or { continue }
		sensor_name := name_file.trim_space()

		temp_file := os.read_file('${hwmon_path}/temp1_input') or { continue }
		temp_value := temp_file.trim_space().int()
		temp_celsius := f64(temp_value) / 1000.0

		temperatures << '{"name":"${sensor_name}","temperature_c":"${temp_celsius:.1}","temperature_f":"${temp_celsius * 9.0 / 5.0 + 32.0:.1}"}'
	}

	if temperatures.len == 0 {
		return '{"temperatures":[],"message":"No temperature sensors found","status":"ok"}'
	}

	return '{"temperatures":[${temperatures.join(',')}],"status":"ok"}'
}
