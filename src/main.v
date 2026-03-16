module main

import vwebui as ui
import os

// ============================================================================
// Application Constants
// ============================================================================

const app_name = 'Desktop App'
const app_version = '1.0.0'
const max_retries = 3                   // Number of retry attempts for window creation
const window_width_percent = 80         // Default window width as percentage of screen
const window_height_percent = 80        // Default window height as percentage of screen
const root_folder_check_min_files = 2   // Minimum expected files in build output

// ============================================================================
// Main Entry Point
// ============================================================================

fn main() {
	// Application startup banner
	println('')
	println('+========================================================+')
	println('|           ${app_name} v${app_version}                  |')
	println('|           System Utilities Dashboard                   |')
	println('+========================================================+')
	println('')

	// Create application with services
	mut app := new_app(app_name, app_version)
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
	w.bind('getSystemInfo', app.handle_get_system_info)
	w.bind('getMemoryStats', app.handle_get_memory_stats)
	w.bind('listProcesses', app.handle_list_processes)
	w.bind('browseDirectory', app.handle_browse_directory)
	w.bind('getAppInfo', app.handle_get_app_info)

	// CPU handlers
	w.bind('getCpuInfo', app.handle_get_cpu_info)
	w.bind('getCpuUsage', app.handle_get_cpu_usage)

	// Disk handlers
	w.bind('getDiskUsage', app.handle_get_disk_usage)
	w.bind('getDiskPartitions', app.handle_get_disk_partitions)

	// Network handlers
	w.bind('getNetworkInterfaces', app.handle_get_network_interfaces)
	w.bind('getNetworkStats', app.handle_get_network_stats)
	w.bind('getIpAddresses', app.handle_get_ip_addresses)

	// System load handlers
	w.bind('getSystemLoad', app.handle_get_system_load)
	w.bind('getUptime', app.handle_get_uptime)
	w.bind('getHostnameInfo', app.handle_get_hostname_info)

	// User handlers
	w.bind('getUserInfo', app.handle_get_user_info)
	w.bind('getEnvironmentVariables', app.handle_get_environment_variables)

	// Hardware handlers
	w.bind('getHardwareInfo', app.handle_get_hardware_info)
	w.bind('getSensorTemperatures', app.handle_get_sensor_temperatures)

	// File operation handlers
	w.bind('readFile', app.handle_read_file)
	// w.bind('writeFile', app.handle_write_file)  // Disabled for security
	w.bind('createDirectory', app.handle_create_directory)
//	w.bind('deleteFileOrDirectory', app.handle_delete_file_or_directory)
//
//	// User management handlers (SQLite CRUD)
//	w.bind('getUsers', app.handle_get_users)
//	w.bind('getUser', app.handle_get_user)
//	w.bind('saveUser', app.handle_save_user)
//	w.bind('deleteUser', app.handle_delete_user)
//	w.bind('searchUsers', app.handle_search_users)
//	w.bind('getUserStats', app.handle_get_user_stats)

	// DevTools handlers
//	w.bind('getDevToolsSystemInfo', app.handle_get_devtools_system_info)
//	w.bind('getDevToolsMemoryInfo', app.handle_get_devtools_memory_info)
//	w.bind('getDevToolsProcessInfo', app.handle_get_devtools_process_info)
//	w.bind('getDevToolsNetworkInfo', app.handle_get_devtools_network_info)
//	w.bind('getDevToolsDatabaseInfo', app.handle_get_devtools_database_info)
//	w.bind('getDevToolsConfigInfo', app.handle_get_devtools_config_info)
//	w.bind('getDevToolsPerformanceMetrics', app.handle_get_devtools_performance_metrics)
//	w.bind('getDevToolsEvents', app.handle_get_devtools_events)
//	w.bind('getDevToolsBindings', app.handle_get_devtools_bindings)
//	w.bind('getDevToolsLogs', app.handle_get_devtools_logs)
//	w.bind('clearDevToolsEvents', app.handle_clear_devtools_events)
//	w.bind('clearDevToolsLogs', app.handle_clear_devtools_logs)

	app.logging.success('All handlers bound successfully')

	// Set root folder (Angular 19+ outputs to dist/browser/browser/)
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

// ============================================================================
// Helper Functions
// ============================================================================

fn create_window_with_retry() ?ui.Window {
	mut attempts := 0

	for attempts < max_retries {
		attempts++
		w := ui.new_window()
		return w
	}

	return none
}

fn verify_root_folder(path string) bool {
	if !os.is_dir(path) {
		return false
	}

	files := os.ls(path) or {
		return false
	}

	mut found_files := 0
	for file in files {
		if file.ends_with('.html') || file.ends_with('.js') {
			found_files++
		}
	}

	return found_files >= 2
}

fn open_window(w ui.Window, root_folder string) bool {
	w.show('index.html', ui.ShowOptions{}) or {
		return false
	}

	return true
}
