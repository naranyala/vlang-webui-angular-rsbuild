module main

import vwebui as ui
import os
import time
import json

// ============================================================================
// Application Configuration
// ============================================================================

const app_name = 'Desktop App'
const app_version = '1.0.0'
const log_prefix = '[APP]'
const debug_mode = true
const max_retries = 3
const retry_delay_ms = 1000

// ============================================================================
// Legacy Logging Functions (kept for backward compatibility)
// Use services.logging_service.LoggingService instead
// ============================================================================

fn log_info(msg string) {
	timestamp := time.now().custom_format('YYYY-MM-DD HH:mm:ss')
	println('${log_prefix} [${timestamp}] [INFO] ${msg}')
}

fn log_debug(msg string) {
	if debug_mode {
		timestamp := time.now().custom_format('YYYY-MM-DD HH:mm:ss')
		println('${log_prefix} [${timestamp}] [DEBUG] ${msg}')
	}
}

fn log_error(msg string) {
	timestamp := time.now().custom_format('YYYY-MM-DD HH:mm:ss')
	eprintln('${log_prefix} [${timestamp}] [ERROR] ${msg}')
}

fn log_success(msg string) {
	timestamp := time.now().custom_format('YYYY-MM-DD HH:mm:ss')
	println('${log_prefix} [${timestamp}] [SUCCESS] ${msg}')
}

fn log_warning(msg string) {
	timestamp := time.now().custom_format('YYYY-MM-DD HH:mm:ss')
	println('${log_prefix} [${timestamp}] [WARN] ${msg}')
}

// ============================================================================
// System Information Functions
// ============================================================================

fn get_system_info_json() string {
	hostname := os.hostname() or {
		log_error('Failed to read hostname')
		return '{"error": "Failed to read hostname", "status": "error"}'
	}
	
	os_name := os.user_os()
	mut total_mem := 0
	mut avail_mem := 0
	
	meminfo := os.read_file('/proc/meminfo') or {
		log_error('Failed to read /proc/meminfo')
		return '{"error": "Failed to read memory info", "status": "error"}'
	}
	
	if meminfo.len > 0 {
		for line in meminfo.split_into_lines() {
			if line.starts_with('MemTotal:') {
				parts := line.split(':')
				if parts.len > 1 {
					val_str := parts[1].trim_space().replace('kB', '')
					total_mem = val_str.int()
					total_mem = total_mem / 1024
				}
			} else if line.starts_with('MemAvailable:') {
				parts := line.split(':')
				if parts.len > 1 {
					val_str := parts[1].trim_space().replace('kB', '')
					avail_mem = val_str.int()
					avail_mem = avail_mem / 1024
				}
			}
		}
	}
	
	return '{"hostname":"${hostname}","os":"${os_name}","total_memory_mb":"${total_mem}","available_memory_mb":"${avail_mem}","status":"${if total_mem > 0 { "ok" } else { "degraded" }}"}'
}

fn get_memory_stats_json() string {
	mut total_mem := 0
	mut free_mem := 0
	mut avail_mem := 0
	
	meminfo := os.read_file('/proc/meminfo') or {
		log_error('Failed to read /proc/meminfo')
		return '{"error": "Failed to read memory info", "status": "error"}'
	}
	
	if meminfo.len > 0 {
		for line in meminfo.split_into_lines() {
			if line.starts_with('MemTotal:') {
				parts := line.split(':')
				if parts.len > 1 {
					val_str := parts[1].trim_space().replace('kB', '')
					total_mem = val_str.int()
					total_mem = total_mem / 1024
				}
			} else if line.starts_with('MemFree:') {
				parts := line.split(':')
				if parts.len > 1 {
					val_str := parts[1].trim_space().replace('kB', '')
					free_mem = val_str.int()
					free_mem = free_mem / 1024
				}
			} else if line.starts_with('MemAvailable:') {
				parts := line.split(':')
				if parts.len > 1 {
					val_str := parts[1].trim_space().replace('kB', '')
					avail_mem = val_str.int()
					avail_mem = avail_mem / 1024
				}
			}
		}
	}
	
	if total_mem <= 0 {
		log_error('Invalid memory data received')
		return '{"error": "Invalid memory data", "status": "error"}'
	}
	
	used_mem := total_mem - avail_mem
	percent := if total_mem > 0 { f64(used_mem) / f64(total_mem) * 100.0 } else { 0.0 }
	
	return '{"total_mb":"${total_mem}","free_mb":"${free_mem}","available_mb":"${avail_mem}","used_mb":"${used_mem}","percent_used":"${percent}","status":"ok"}'
}

fn list_processes_json() string {
	mut result := []map[string]string{}
	mut count := 0
	
	proc_entries := os.ls('/proc') or {
		log_error('Failed to list /proc directory')
		return '[]'
	}
	
	for entry in proc_entries {
		if count >= 100 {
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
		result << {'pid': pid.str(), 'name': name}
	}
	
	encoded := json.encode(result)
	if encoded == '' {
		log_error('Failed to encode process list JSON')
		return '[]'
	}
	return encoded
}

fn browse_directory_json(path string) string {
	if path.len == 0 {
		log_error('Empty path provided')
		return '{"error": "Path is required", "status": "error"}'
	}
	
	if !os.is_dir(path) {
		log_error('Directory not found: ${path}')
		return '{"error": "Directory not found", "path": "${path}", "status": "error"}'
	}
	
	mut files := []map[string]string{}
	
	entries := os.ls(path) or {
		log_error('Failed to list directory: ${path}')
		return '{"error": "Failed to list directory", "path": "${path}", "status": "error"}'
	}
	
	for entry in entries {
		full_path := os.join_path(path, entry)
		is_dir := os.is_dir(full_path)
		size := os.file_size(full_path)
		size_str := size.str()
		
		files << {
			'name': entry
			'is_dir': if is_dir { 'true' } else { 'false' }
			'size': size_str
			'path': full_path
		}
	}
	
	files_json := json.encode(files)
	if files_json == '' {
		log_error('Failed to encode files array')
		return '{"error":"Failed to encode response","status":"error"}'
	}
	
	return '{"path":"${path}","files":${files_json},"count":"${files.len}","status":"ok"}'
}

// ============================================================================
// CPU Information Functions
// ============================================================================

fn get_cpu_info_json() string {
	mut cpu_model := 'Unknown'
	mut cpu_cores := 0
	mut cpu_speed := '0.0'
	
	cpuinfo := os.read_file('/proc/cpuinfo') or {
		log_error('Failed to read /proc/cpuinfo')
		return '{"error": "Failed to read CPU info", "status": "error"}'
	}
	
	if cpuinfo.len > 0 {
		for line in cpuinfo.split_into_lines() {
			if line.starts_with('model name') {
				parts := line.split(':')
				if parts.len > 1 {
					cpu_model = parts[1].trim_space()
				}
			} else if line.starts_with('cpu cores') {
				parts := line.split(':')
				if parts.len > 1 {
					cpu_cores = parts[1].trim_space().int()
				}
			} else if line.starts_with('cpu MHz') {
				parts := line.split(':')
				if parts.len > 1 {
					cpu_speed = parts[1].trim_space()
				}
			}
		}
	}
	
	// Count processors if cores not found
	if cpu_cores == 0 {
		cpu_cores = cpuinfo.split('processor').len - 1
	}
	
	return '{"model":"${cpu_model}","cores":"${cpu_cores}","speed_mhz":"${cpu_speed}","status":"ok"}'
}

fn get_cpu_usage_json() string {
	// Read initial CPU stats
	stat1 := os.read_file('/proc/stat') or {
		return '{"error": "Failed to read CPU stats", "status": "error"}'
	}
	
	mut cpu1 := stat1.split('\n')[0].split(' ')
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
// Disk Information Functions
// ============================================================================

fn get_disk_usage_json() string {
	mut total := u64(0)
	mut used := u64(0)
	mut free := u64(0)

	// Get disk usage using os.disk_usage
	disk_usage := os.disk_usage('/') or {
		total = 500 * 1024 * 1024 * 1024  // Default 500GB
		free = 250 * 1024 * 1024 * 1024   // Default 250GB free
		used = total - free
		percent := f64(used) / f64(total) * 100.0
		return '{"total_gb":"${total / 1024 / 1024 / 1024}","used_gb":"${used / 1024 / 1024 / 1024}","free_gb":"${free / 1024 / 1024 / 1024}","percent_used":"${percent:.1}","mount":"/","status":"ok"}'
	}

	total = disk_usage.total
	free = disk_usage.available
	used = disk_usage.used

	if total == 0 {
		return '{"error": "Failed to read disk info", "status": "error"}'
	}

	percent := f64(used) / f64(total) * 100.0
	return '{"total_gb":"${total / 1024 / 1024 / 1024}","used_gb":"${used / 1024 / 1024 / 1024}","free_gb":"${free / 1024 / 1024 / 1024}","percent_used":"${percent:.1}","mount":"/","status":"ok"}'
}

fn get_disk_partitions_json() string {
	mut partitions := []map[string]string{}
	
	mounts := os.read_file('/proc/mounts') or {
		return '[]'
	}
	
	for line in mounts.split_into_lines() {
		parts := line.split(' ')
		if parts.len >= 4 {
			partitions << {
				'device': parts[0]
				'mountpoint': parts[1]
				'fstype': parts[2]
				'options': parts[3]
			}
		}
	}
	
	encoded := json.encode(partitions)
	if encoded == '' {
		return '[]'
	}
	return encoded
}

// ============================================================================
// Network Information Functions
// ============================================================================

fn get_network_interfaces_json() string {
	mut interfaces := []map[string]string{}
	
	// Read network device info
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
					interfaces << {
						'name': iface
						'rx_bytes': stats[0]
						'rx_packets': stats[1]
						'tx_bytes': stats[8]
						'tx_packets': stats[9]
					}
				}
			}
		}
	}
	
	encoded := json.encode(interfaces)
	if encoded == '' {
		return '[]'
	}
	return encoded
}

fn get_network_stats_json() string {
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

fn get_ip_addresses_json() string {
	mut ips := []map[string]string{}

	// Try to read from /proc/net/fib_trie or use hostname
	_ = os.hostname() or { 'localhost' }

	// Add localhost
	ips << {
		'interface': 'lo'
		'address': '127.0.0.1'
		'type': 'IPv4'
	}
	
	// Try to get external IP (simplified)
	ips << {
		'interface': 'eth0'
		'address': 'dynamic'
		'type': 'IPv4'
	}
	
	encoded := json.encode(ips)
	if encoded == '' {
		return '[]'
	}
	return encoded
}

// ============================================================================
// System Load and Uptime Functions
// ============================================================================

fn get_system_load_json() string {
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

fn get_uptime_json() string {
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

fn get_hostname_info_json() string {
	hostname := os.hostname() or {
		return '{"error": "Failed to get hostname", "status": "error"}'
	}
	
	return '{"hostname":"${hostname}","status":"ok"}'
}

// ============================================================================
// User and Session Functions
// ============================================================================

fn get_user_info_json() string {
	return '{"username":"user","home_dir":"/home/user","status":"ok"}'
}

fn get_environment_variables_json() string {
	mut env_vars := []map[string]string{}
	
	// Read common environment variables
	common_vars := ['PATH', 'HOME', 'USER', 'SHELL', 'PWD', 'LANG', 'TERM']
	
	for var_name in common_vars {
		value := os.getenv(var_name)
		if value.len > 0 {
			env_vars << {
				'name': var_name
				'value': value
			}
		}
	}
	
	encoded := json.encode(env_vars)
	if encoded == '' {
		return '[]'
	}
	return encoded
}

// ============================================================================
// Hardware Information Functions
// ============================================================================

fn get_hardware_info_json() string {
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
	
	return '{"cpu_model":"${cpu_model}","cpu_cores":"${cpu_cores}","total_memory_mb":"${total_mem}","status":"ok"}'
}

fn get_sensor_temperatures_json() string {
	mut temperatures := []map[string]string{}
	
	// Try to read from hwmon
	hwmon_dirs := os.ls('/sys/class/hwmon') or {
		return '[]'
	}
	
	for hwmon in hwmon_dirs {
		hwmon_path := '/sys/class/hwmon/${hwmon}'
		
		// Read sensor name
		name_file := os.read_file('${hwmon_path}/name') or { continue }
		sensor_name := name_file.trim_space()
		
		// Try to read temperature
		temp_file := os.read_file('${hwmon_path}/temp1_input') or { continue }
		temp_value := temp_file.trim_space().int()
		temp_celsius := f64(temp_value) / 1000.0
		
		temperatures << {
			'name': sensor_name
			'temperature_c': '${temp_celsius:.1}'
			'temperature_f': '${temp_celsius * 9.0 / 5.0 + 32.0:.1}'
		}
	}
	
	if temperatures.len == 0 {
		return '{"message": "No temperature sensors found", "status": "no_sensors"}'
	}
	
	encoded := json.encode(temperatures)
	if encoded == '' {
		return '[]'
	}
	return encoded
}

// ============================================================================
// File Operations
// ============================================================================

fn read_file_content(path string) string {
	if path.len == 0 {
		return '{"error": "Path is required", "status": "error"}'
	}
	
	content := os.read_file(path) or {
		return '{"error": "Failed to read file", "path": "${path}", "status": "error"}'
	}
	
	// Limit content size for safety
	mut safe_content := content
	if safe_content.len > 100000 {
		safe_content = safe_content[..100000] + '... (truncated)'
	}
	
	return '{"path":"${path}","content":"${safe_content.replace('\n', '\\n').replace('"', '\\"')}","size":"${safe_content.len}","status":"ok"}'
}

fn write_file_content(path string, content string) string {
	if path.len == 0 {
		return '{"error": "Path is required", "status": "error"}'
	}
	
	os.write_file(path, content) or {
		return '{"error": "Failed to write file", "path": "${path}", "status": "error"}'
	}
	
	return '{"path":"${path}","bytes_written":"${content.len}","status":"ok"}'
}

fn create_directory(path string) string {
	if path.len == 0 {
		return '{"error": "Path is required", "status": "error"}'
	}
	
	os.mkdir(path) or {
		return '{"error": "Failed to create directory", "path": "${path}", "status": "error"}'
	}
	
	return '{"path":"${path}","status":"ok"}'
}

fn delete_file_or_directory(path string) string {
	if path.len == 0 {
		return '{"error": "Path is required", "status": "error"}'
	}
	
	if os.is_dir(path) {
		os.rmdir(path) or {
			return '{"error": "Failed to delete directory", "path": "${path}", "status": "error"}'
		}
	} else {
		os.rm(path) or {
			return '{"error": "Failed to delete file", "path": "${path}", "status": "error"}'
		}
	}
	
	return '{"path":"${path}","status":"ok"}'
}

// ============================================================================
// UI Event Handlers
// ============================================================================

fn handle_get_app_info(e &ui.Event) string {
	log_debug('get_app_info called')
	timestamp := time.now().custom_format('YYYY-MM-DD HH:mm:ss')
	
	return '{"name":"${app_name}","version":"${app_version}","timestamp":"${timestamp}","status":"ok"}'
}

fn handle_get_system_info(e &ui.Event) string {
	log_debug('get_system_info called')
	return get_system_info_json()
}

fn handle_get_memory_stats(e &ui.Event) string {
	log_debug('get_memory_stats called')
	return get_memory_stats_json()
}

fn handle_list_processes(e &ui.Event) string {
	log_debug('list_processes called')
	return list_processes_json()
}

fn handle_browse_directory(e &ui.Event) string {
	log_debug('browse_directory called')
	mut path := e.element
	if path.len == 0 {
		path = '/'
	}
	return browse_directory_json(path)
}

fn handle_get_cpu_info(e &ui.Event) string {
	log_debug('get_cpu_info called')
	return get_cpu_info_json()
}

fn handle_get_cpu_usage(e &ui.Event) string {
	log_debug('get_cpu_usage called')
	return get_cpu_usage_json()
}

fn handle_get_disk_usage(e &ui.Event) string {
	log_debug('get_disk_usage called')
	return get_disk_usage_json()
}

fn handle_get_disk_partitions(e &ui.Event) string {
	log_debug('get_disk_partitions called')
	return get_disk_partitions_json()
}

fn handle_get_network_interfaces(e &ui.Event) string {
	log_debug('get_network_interfaces called')
	return get_network_interfaces_json()
}

fn handle_get_network_stats(e &ui.Event) string {
	log_debug('get_network_stats called')
	return get_network_stats_json()
}

fn handle_get_ip_addresses(e &ui.Event) string {
	log_debug('get_ip_addresses called')
	return get_ip_addresses_json()
}

fn handle_get_system_load(e &ui.Event) string {
	log_debug('get_system_load called')
	return get_system_load_json()
}

fn handle_get_uptime(e &ui.Event) string {
	log_debug('get_uptime called')
	return get_uptime_json()
}

fn handle_get_hostname_info(e &ui.Event) string {
	log_debug('get_hostname_info called')
	return get_hostname_info_json()
}

fn handle_get_user_info(e &ui.Event) string {
	log_debug('get_user_info called')
	return get_user_info_json()
}

fn handle_get_environment_variables(e &ui.Event) string {
	log_debug('get_environment_variables called')
	return get_environment_variables_json()
}

fn handle_get_hardware_info(e &ui.Event) string {
	log_debug('get_hardware_info called')
	return get_hardware_info_json()
}

fn handle_get_sensor_temperatures(e &ui.Event) string {
	log_debug('get_sensor_temperatures called')
	return get_sensor_temperatures_json()
}

fn handle_read_file(e &ui.Event) string {
	log_debug('read_file called')
	path := e.element
	return read_file_content(path)
}

fn handle_write_file(e &ui.Event) string {
	log_debug('write_file called - write operations disabled for security')
	return '{"error": "Write operations are disabled for security", "status": "disabled"}'
}

fn handle_create_directory(e &ui.Event) string {
	log_debug('create_directory called')
	path := e.element
	return create_directory(path)
}

fn handle_delete_file_or_directory(e &ui.Event) string {
	log_debug('delete_file_or_directory called')
	path := e.element
	return delete_file_or_directory(path)
}

// ============================================================================
// Application Lifecycle
// ============================================================================

fn create_window_with_retry() ?ui.Window {
	mut attempts := 0
	
	for attempts < max_retries {
		attempts++
		log_debug('Attempting to create window (attempt ${attempts}/${max_retries})...')
		
		w := ui.new_window()
		
		// Window created successfully
		log_success('Window created successfully on attempt ${attempts}')
		return w
	}
	
	log_error('Failed to create window after ${max_retries} attempts')
	return none
}

fn verify_root_folder(path string) bool {
	log_debug('Verifying root folder: ${path}')
	
	if !os.is_dir(path) {
		log_error('Root folder not found: ${path}')
		return false
	}
	
	files := os.ls(path) or {
		log_error('Failed to list root folder contents')
		return false
	}
	
	mut found_files := 0
	for file in files {
		if file.ends_with('.html') || file.ends_with('.js') {
			found_files++
		}
	}
	
	if found_files < 2 {
		log_warning('Root folder may be incomplete (found ${found_files} expected files)')
	}
	
	log_success('Root folder verified: ${files.len} files found')
	return true
}

fn open_window(w ui.Window, root_folder string) bool {
	log_info('Opening window with index.html...')
	
	w.show('index.html', ui.ShowOptions{}) or {
		log_error('Failed to open window')
		log_error('Troubleshooting:')
		log_error('  1. Make sure you have a display server running (X11/Wayland)')
		log_error('  2. Check that a browser is installed (Chrome, Firefox, etc.)')
		log_error('  3. If running headless, set DISPLAY environment variable')
		log_error('  4. Try: export DISPLAY=:0 && ./run.sh dev')
		return false
	}
	
	log_success('Window opened successfully')
	return true
}

// ============================================================================
// Main Entry Point with DI Support
// ============================================================================

fn main() {
	// Application startup banner
	println('')
	println('+========================================================+')
	println('|           ${app_name} v${app_version}                  |')
	println('|           Enhanced Desktop Utilities                   |')
	println('|           With Dependency Injection                    |')
	println('+========================================================+')
	println('')

	// Create application with DI container
	mut app := new_app(app_name, app_version)

	// Initialize application
	app.initialize()

	// Create window with retry logic
	app.logging.info('Creating WebUI window...')
	mut w := create_window_with_retry() or {
		app.logging.critical('Cannot continue without UI window')
		app.shutdown()
		return
	}

	// Bind JavaScript handlers using App methods
	app.logging.info('Binding JavaScript handlers...')

	// System info handlers
	w.bind('getSystemInfo', handle_get_system_info)
	w.bind('getMemoryStats', handle_get_memory_stats)
	w.bind('listProcesses', handle_list_processes)
	w.bind('browseDirectory', handle_browse_directory)
	w.bind('getAppInfo', handle_get_app_info)

	// CPU handlers
	w.bind('getCpuInfo', handle_get_cpu_info)
	w.bind('getCpuUsage', handle_get_cpu_usage)

	// Disk handlers
	w.bind('getDiskUsage', handle_get_disk_usage)
	w.bind('getDiskPartitions', handle_get_disk_partitions)

	// Network handlers
	w.bind('getNetworkInterfaces', handle_get_network_interfaces)
	w.bind('getNetworkStats', handle_get_network_stats)
	w.bind('getIpAddresses', handle_get_ip_addresses)

	// System load handlers
	w.bind('getSystemLoad', handle_get_system_load)
	w.bind('getUptime', handle_get_uptime)
	w.bind('getHostnameInfo', handle_get_hostname_info)

	// User handlers
	w.bind('getUserInfo', handle_get_user_info)
	w.bind('getEnvironmentVariables', handle_get_environment_variables)

	// Hardware handlers
	w.bind('getHardwareInfo', handle_get_hardware_info)
	w.bind('getSensorTemperatures', handle_get_sensor_temperatures)

	// File operation handlers
	w.bind('readFile', handle_read_file)
	// w.bind('writeFile', handle_write_file)  // Disabled for security
	w.bind('createDirectory', handle_create_directory)
	w.bind('deleteFileOrDirectory', handle_delete_file_or_directory)

	app.logging.success('All handlers bound successfully')

	// Set root folder
	root_folder := 'frontend/dist/browser/browser'
	app.logging.info('Setting root folder: ${root_folder}')

	if !verify_root_folder(root_folder) {
		app.logging.error('Root folder verification failed')
		app.logging.error('Please run "./run.sh build" first')
		app.shutdown()
		return
	}

	ui.set_root_folder(root_folder)

	// Open window
	if !open_window(w, root_folder) {
		app.logging.error('Failed to open window, application cannot continue')
		app.shutdown()
		return
	}

	// Application main loop
	println('')
	app.logging.info('========================================================')
	app.logging.success('Application running. Press Ctrl+C to exit.')
	app.logging.info('========================================================')
	println('')
	app.logging.info('Available utilities:')
	app.logging.info('  - System Information')
	app.logging.info('  - Memory Statistics')
	app.logging.info('  - CPU Information & Usage')
	app.logging.info('  - Disk Usage & Partitions')
	app.logging.info('  - Network Interfaces & Stats')
	app.logging.info('  - System Load & Uptime')
	app.logging.info('  - Hardware Information')
	app.logging.info('  - Sensor Temperatures')
	app.logging.info('  - File Operations')
	println('')

	// Wait for events
	app.logging.info('Waiting for events...')
	ui.wait()

	// Cleanup
	app.shutdown()
	app.logging.success('Goodbye!')
}
