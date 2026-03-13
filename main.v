module main

import vwebui as ui
import os
import time

// Application configuration
const (
	app_name    = 'Desktop App'
	app_version = '1.0.0'
	log_prefix  = '[APP]'
	debug_mode  = true
)

// Logging functions
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
	println('${log_prefix} [${timestamp}] [SUCCESS] + ${msg}')
}

// Get system info - returns JSON string
fn get_system_info_json() string {
	hostname := os.hostname() or { 'unknown' }
	os_name := os.user_os()
	
	// Read memory info
	mut total_mem := 0
	mut avail_mem := 0
	meminfo := os.read_file('/proc/meminfo') or { '' }
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
	
	return '{"hostname":"${hostname}","os":"${os_name}","total_memory_mb":${total_mem},"available_memory_mb":${avail_mem}}'
}

// Get memory stats - returns JSON string
fn get_memory_stats_json() string {
	mut total_mem := 0
	mut free_mem := 0
	mut avail_mem := 0
	
	meminfo := os.read_file('/proc/meminfo') or { '' }
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
	
	used_mem := total_mem - avail_mem
	percent := if total_mem > 0 { f64(used_mem) / f64(total_mem) * 100.0 } else { 0.0 }
	
	return '{"total_mb":${total_mem},"free_mb":${free_mem},"available_mb":${avail_mem},"used_mb":${used_mem},"percent_used":${percent}}'
}

// List processes - returns JSON array
fn list_processes_json() string {
	mut result := '['
	mut first := true
	mut count := 0
	
	proc_entries := os.ls('/proc') or { return '[]' }
	
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
		
		// Read process name
		comm_path := '${proc_path}/comm'
		mut name := os.read_file(comm_path) or { '' }
		name = name.trim_space()
		
		if name.len == 0 {
			continue
		}
		
		if !first {
			result += ','
		}
		first = true
		count++
		
		result += '{"pid":${pid},"name":"${name}"}'
	}
	
	result += ']'
	return result
}

// Browse directory - returns JSON
fn browse_directory_json(path string) string {
	if !os.is_dir(path) {
		return '{"error":"Path not found","path":"${path}"}'
	}
	
	mut result := '{"path":"${path}","files":['
	mut first := true
	
	entries := os.ls(path) or { return '{"error":"Failed to list"}' }
	
	for entry in entries {
		full_path := os.join_path(path, entry)
		is_dir := os.is_dir(full_path)
		size := os.file_size(full_path)
		
		if !first {
			result += ','
		}
		first = true
		
		result += '{"name":"${entry}","is_dir":${is_dir},"size":${size}}'
	}
	
	result += ']}'
	return result
}

// Handler: Get system info
fn handle_get_system_info(e &ui.Event) string {
	log_debug('get_system_info called')
	return get_system_info_json()
}

// Handler: Get memory stats
fn handle_get_memory_stats(e &ui.Event) string {
	log_debug('get_memory_stats called')
	return get_memory_stats_json()
}

// Handler: List processes
fn handle_list_processes(e &ui.Event) string {
	log_debug('list_processes called')
	return list_processes_json()
}

// Handler: Browse directory
fn handle_browse_directory(e &ui.Event) string {
	log_debug('browse_directory called')
	mut path := e.element
	if path.len == 0 {
		path = '/'
	}
	return browse_directory_json(path)
}

// Handler: Get app info
fn handle_get_app_info(e &ui.Event) string {
	log_debug('get_app_info called')
	timestamp := time.now().custom_format('YYYY-MM-DD HH:mm:ss')
	return '{"name":"${app_name}","version":"${app_version}","timestamp":"${timestamp}"}'
}

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
	log_debug('Current directory: ${os.getwd()}')
	log_debug('OS: ${os.user_os()}')

	// Create window
	log_info('Creating WebUI window...')
	mut w := ui.new_window()
	log_success('Window created successfully')

	// Bind JavaScript handlers
	log_info('Binding JavaScript handlers...')
	w.bind('getSystemInfo', handle_get_system_info)
	w.bind('getMemoryStats', handle_get_memory_stats)
	w.bind('listProcesses', handle_list_processes)
	w.bind('browseDirectory', handle_browse_directory)
	w.bind('getAppInfo', handle_get_app_info)
	log_success('Handlers bound')

	// Set root folder
	// Note: Angular 19+ with application builder outputs to dist/browser/browser/
	root_folder := 'frontend/dist/browser/browser'
	log_info('Setting root folder: ${root_folder}')

	// Verify root folder exists
	if !os.is_dir(root_folder) {
		log_error('Root folder not found: ${root_folder}')
		log_error('Please run "./run.sh build" first')
		return
	}

	// List files in root folder
	log_debug('Files in root folder:')
	files := os.ls(root_folder) or {
		log_error('Failed to list directory')
		[]string{}
	}
	for file in files {
		log_debug('  - ${file}')
	}

	// Set default root folder
	ui.set_root_folder(root_folder)

	// Open window
	log_info('Opening window with index.html...')
	w.show('index.html', ui.ShowOptions{}) or {
		log_error('Failed to open window: ${err}')
		log_error('')
		log_error('Troubleshooting:')
		log_error('  1. Make sure you have a display server running (X11/Wayland)')
		log_error('  2. Check that a browser is installed (Chrome, Firefox, etc.)')
		log_error('  3. If running headless, set DISPLAY environment variable')
		log_error('  4. Try: export DISPLAY=:0 && ./run.sh dev')
		return
	}
	log_success('Window opened successfully')

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
