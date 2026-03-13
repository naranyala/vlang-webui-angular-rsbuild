module main

import vwebui as ui
import os
import time
import json

// ============================================================================
// Application Configuration
// ============================================================================

const (
	app_name       = 'Desktop App'
	app_version    = '1.0.0'
	log_prefix     = '[APP]'
	debug_mode     = true
	max_retries    = 3
	retry_delay_ms = 1000
)

// ============================================================================
// Logging Functions
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
	println('${log_prefix} [${timestamp}] [SUCCESS] ✓ ${msg}')
}

fn log_warning(msg string) {
	timestamp := time.now().custom_format('YYYY-MM-DD HH:mm:ss')
	println('${log_prefix} [${timestamp}] [WARN] ⚠ ${msg}')
}

// ============================================================================
// System Information Functions
// ============================================================================

fn get_system_info_json() string {
	hostname := os.hostname() or { 'unknown' }
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
					total_mem = val_str.int() / 1024
				}
			} else if line.starts_with('MemAvailable:') {
				parts := line.split(':')
				if parts.len > 1 {
					val_str := parts[1].trim_space().replace('kB', '')
					avail_mem = val_str.int() / 1024
				}
			}
		}
	}
	
	return json.encode({
		'hostname': hostname
		'os': os_name
		'total_memory_mb': total_mem.str()
		'available_memory_mb': avail_mem.str()
		'status': if total_mem > 0 { 'ok' } else { 'degraded' }
	})
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
					total_mem = val_str.int() / 1024
				}
			} else if line.starts_with('MemFree:') {
				parts := line.split(':')
				if parts.len > 1 {
					val_str := parts[1].trim_space().replace('kB', '')
					free_mem = val_str.int() / 1024
				}
			} else if line.starts_with('MemAvailable:') {
				parts := line.split(':')
				if parts.len > 1 {
					val_str := parts[1].trim_space().replace('kB', '')
					avail_mem = val_str.int() / 1024
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
	
	return json.encode({
		'total_mb': total_mem.str()
		'free_mb': free_mem.str()
		'available_mb': avail_mem.str()
		'used_mb': used_mem.str()
		'percent_used': percent.str()
		'status': 'ok'
	})
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
		if pid == 0 { continue }
		
		proc_path := '/proc/${pid}'
		if !os.is_dir(proc_path) { continue }
		
		comm_path := '${proc_path}/comm'
		mut name := os.read_file(comm_path) or { "" }
		name = name.trim_space()
		
		if name.len == 0 { continue }
		
		count++
		result << {'pid': pid.str(), 'name': name}
	}
	
	return json.encode(result)
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
		
		files << {'name': entry, 'is_dir': if is_dir { 'true' } else { 'false' }, 'size': size.str(), 'path': full_path}
	}
	
	return json.encode({
		'path': path
		'files': json.encode(files)
		'count': files.len.str()
		'status': 'ok'
	})
}

// ============================================================================
// UI Event Handlers
// ============================================================================

fn handle_get_app_info(e &ui.Event) string {
	log_debug('get_app_info called')
	timestamp := time.now().custom_format('YYYY-MM-DD HH:mm:ss')
	
	return json.encode({
		'name': app_name
		'version': app_version
		'timestamp': timestamp
		'status': 'ok'
	})
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
	if path.len == 0 { path = '/' }
	return browse_directory_json(path)
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
		
		if true {
			log_success('Window created successfully on attempt ${attempts}')
			return w
		}
		
		log_error('Window creation attempt ${attempts} failed')
		
		if attempts < max_retries {
			log_info('Retrying in ${retry_delay_ms}ms...')
			time.sleep(retry_delay_ms)
		}
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

fn open_window_with_fallback(w ui.Window, root_folder string) bool {
	log_info('Opening window with index.html...')
	
	w.show('index.html', ui.ShowOptions{}) or { return false }
	
        log_success('Window opened successfully')
        return true
	
}

// ============================================================================
// Main Entry Point
// ============================================================================

fn main() {
	// Application startup banner
	println('')
	println('+========================================================+')
	println('|           ${app_name} v${app_version}                  |')
	println('|           Enhanced Desktop Utilities                   |')
	println('+========================================================+')
	println('')
	
	log_info('Starting ${app_name} application...')
	log_debug('Version: ${app_version}')
	log_debug('Debug mode: ${debug_mode}')
	log_debug('Max retries: ${max_retries}')
	log_debug('Current directory: ${os.getwd()}')
	log_debug('OS: ${os.user_os()}')
	
	// Create window with retry logic
	log_info('Creating WebUI window...')
	mut w := create_window_with_retry() or {
		log_error('Critical: Cannot continue without UI window')
		return
	}
	log_success('Window created successfully')
	
	// Bind JavaScript handlers
	log_info('Binding JavaScript handlers...')
	
	w.bind('getSystemInfo', handle_get_system_info)
	w.bind('getMemoryStats', handle_get_memory_stats)
	w.bind('listProcesses', handle_list_processes)
	w.bind('browseDirectory', handle_browse_directory)
	w.bind('getAppInfo', handle_get_app_info)
	
	log_success('All handlers bound successfully')
	
	// Set root folder
	root_folder := 'frontend/dist/browser/browser'
	log_info('Setting root folder: ${root_folder}')
	
	if !verify_root_folder(root_folder) {
		log_error('Root folder verification failed')
		log_error('Please run "./run.sh build" first')
		return
	}
	
	ui.set_root_folder(root_folder)
	
	// Open window
	if !open_window_with_fallback(w, root_folder) {
		log_error('Failed to open window, application cannot continue')
		return
	}
	
	// Application main loop
	println('')
	log_info('========================================================')
	log_success('Application running. Press Ctrl+C to exit.')
	log_info('========================================================')
	println('')
	log_info('Available utilities:')
	log_info('  - System Information')
	log_info('  - Memory Statistics')
	log_info('  - Process List')
	log_info('  - File Browser')
	println('')
	
	// Wait for events
	log_info('Waiting for events...')
	ui.wait()
	
	// Cleanup
	log_info('Application shutting down...')
	log_success('Goodbye!')
}
