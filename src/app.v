module main

import vwebui as ui
import time
import services

// ============================================================================
// Application Service
// ============================================================================

// App represents the main application
@[heap]
pub struct App {
mut:
	logging          services.LoggingService
	system_info      services.SystemInfoService
	file             services.FileService
	network          services.NetworkService
	config           services.ConfigService
	user             services.UserService
	devtools         services.DevToolsService

	app_name         string
	app_version      string
	handlers_bound   bool
	window_opened    bool
}

// NewApp creates a new application instance
pub fn new_app(app_name string, app_version string) App {
	mut logging := services.LoggingService{}
	logging.initialize()
	logging.set_min_level('debug')

	mut system_info := services.SystemInfoService{}
	system_info.initialize()

	mut file := services.FileService{}
	file.initialize()
	file.set_deny_write(true)

	mut network := services.NetworkService{}
	network.initialize()

	mut config_svc := services.ConfigService{}
	config_svc.initialize()

	mut user := services.UserService{}
	user.initialize() or {
		logging.error('Failed to initialize user service: ${err}')
	}

	mut devtools := services.DevToolsService{}
	devtools.initialize()

	return App{
		logging:      logging
		system_info:  system_info
		file:         file
		network:      network
		config:       config_svc
		user:         user
		devtools:     devtools
		app_name:     app_name
		app_version:  app_version
	}
}

// Initialize initializes the application
pub fn (mut app App) initialize() {
	app.logging.info('Starting ${app.app_name} v${app.app_version}')
}

// Shutdown shuts down the application
pub fn (mut app App) shutdown() {
	app.logging.info('Shutting down ${app.app_name}...')
	app.logging.shutdown()
	app.system_info.shutdown()
	app.file.shutdown()
	app.network.shutdown()
	app.config.shutdown()
	app.user.shutdown()
	app.logging.info('Application shutdown complete')
}

// ============================================================================
// Event Handlers - System Info
// ============================================================================

pub fn (mut app App) handle_get_system_info(e &ui.Event) string {
	app.logging.debug_source('getSystemInfo called', 'App')
	return app.system_info.get_system_info_json()
}

pub fn (mut app App) handle_get_memory_stats(e &ui.Event) string {
	app.logging.debug_source('getMemoryStats called', 'App')
	return app.system_info.get_memory_stats_json()
}

pub fn (mut app App) handle_list_processes(e &ui.Event) string {
	app.logging.debug_source('listProcesses called', 'App')
	limit := e.element.int()
	return app.system_info.list_processes_json(limit)
}

pub fn (mut app App) handle_browse_directory(e &ui.Event) string {
	app.logging.debug_source('browseDirectory called', 'App')
	path := e.element
	return app.file.browse_directory(path)
}

pub fn (mut app App) handle_get_app_info(e &ui.Event) string {
	app.logging.debug_source('getAppInfo called', 'App')
	timestamp := time.now().custom_format('YYYY-MM-DD HH:mm:ss')
	return '{"name":"${app.app_name}","version":"${app.app_version}","timestamp":"${timestamp}","status":"ok"}'
}

// ============================================================================
// Event Handlers - CPU
// ============================================================================

pub fn (mut app App) handle_get_cpu_info(e &ui.Event) string {
	app.logging.debug_source('getCpuInfo called', 'App')
	return app.system_info.get_cpu_info_json()
}

pub fn (mut app App) handle_get_cpu_usage(e &ui.Event) string {
	app.logging.debug_source('getCpuUsage called', 'App')
	return app.system_info.get_cpu_usage_json()
}

// ============================================================================
// Event Handlers - Disk
// ============================================================================

pub fn (mut app App) handle_get_disk_usage(e &ui.Event) string {
	app.logging.debug_source('getDiskUsage called', 'App')
	return app.system_info.get_disk_usage_json()
}

pub fn (mut app App) handle_get_disk_partitions(e &ui.Event) string {
	app.logging.debug_source('getDiskPartitions called', 'App')
	return app.system_info.get_disk_partitions_json()
}

// ============================================================================
// Event Handlers - Network
// ============================================================================

pub fn (mut app App) handle_get_network_interfaces(e &ui.Event) string {
	app.logging.debug_source('getNetworkInterfaces called', 'App')
	return app.network.get_network_interfaces_json()
}

pub fn (mut app App) handle_get_network_stats(e &ui.Event) string {
	app.logging.debug_source('getNetworkStats called', 'App')
	return app.network.get_network_stats_json()
}

pub fn (mut app App) handle_get_ip_addresses(e &ui.Event) string {
	app.logging.debug_source('getIpAddresses called', 'App')
	return app.network.get_ip_addresses_json()
}

// ============================================================================
// Event Handlers - System Load
// ============================================================================

pub fn (mut app App) handle_get_system_load(e &ui.Event) string {
	app.logging.debug_source('getSystemLoad called', 'App')
	return app.system_info.get_system_load_json()
}

pub fn (mut app App) handle_get_uptime(e &ui.Event) string {
	app.logging.debug_source('getUptime called', 'App')
	return app.system_info.get_uptime_json()
}

pub fn (mut app App) handle_get_hostname_info(e &ui.Event) string {
	app.logging.debug_source('getHostnameInfo called', 'App')
	return app.system_info.get_hostname_info_json()
}

// ============================================================================
// Event Handlers - User Info
// ============================================================================

pub fn (mut app App) handle_get_user_info(e &ui.Event) string {
	app.logging.debug_source('getUserInfo called', 'App')
	return '{"username":"user","home_dir":"/home/user","status":"ok"}'
}

pub fn (mut app App) handle_get_environment_variables(e &ui.Event) string {
	app.logging.debug_source('getEnvironmentVariables called', 'App')
	return app.system_info.get_environment_variables_json()
}

// ============================================================================
// Event Handlers - Hardware
// ============================================================================

pub fn (mut app App) handle_get_hardware_info(e &ui.Event) string {
	app.logging.debug_source('getHardwareInfo called', 'App')
	return app.system_info.get_hardware_info_json()
}

pub fn (mut app App) handle_get_sensor_temperatures(e &ui.Event) string {
	app.logging.debug_source('getSensorTemperatures called', 'App')
	return app.system_info.get_sensor_temperatures_json()
}

// ============================================================================
// Event Handlers - File Operations
// ============================================================================

pub fn (mut app App) handle_read_file(e &ui.Event) string {
	app.logging.debug_source('readFile called', 'App')
	path := e.element
	return app.file.read_file_json(path)
}

pub fn (mut app App) handle_create_directory(e &ui.Event) string {
	app.logging.debug_source('createDirectory called', 'App')
	path := e.element
	return app.file.create_directory_json(path)
}

pub fn (mut app App) handle_delete_file_or_directory(e &ui.Event) string {
	app.logging.debug_source('deleteFileOrDirectory called', 'App')
	path := e.element
	return app.file.delete_file_or_directory_json(path)
}

// ============================================================================
// Event Handlers - User Management (SQLite CRUD)
// ============================================================================

pub fn (mut app App) handle_get_users(e &ui.Event) string {
	app.logging.debug_source('getUsers called', 'App')
	return app.user.get_users_json()
}

pub fn (mut app App) handle_get_user(e &ui.Event) string {
	app.logging.debug_source('getUser called', 'App')
	id := e.element.int()
	return app.user.get_user_json(id)
}

pub fn (mut app App) handle_save_user(e &ui.Event) string {
	app.logging.debug_source('saveUser called', 'App')
	data := e.element
	return app.user.save_user_json(data)
}

pub fn (mut app App) handle_delete_user(e &ui.Event) string {
	app.logging.debug_source('deleteUser called', 'App')
	id := e.element.int()
	return app.user.delete_user_json(id)
}

pub fn (mut app App) handle_search_users(e &ui.Event) string {
	app.logging.debug_source('searchUsers called', 'App')
	query := e.element
	return app.user.search_users_json(query)
}

pub fn (mut app App) handle_get_user_stats(e &ui.Event) string {
	app.logging.debug_source('getUserStats called', 'App')
	return app.user.get_stats_json()
}

// ============================================================================
// Event Handlers - DevTools
// ============================================================================

pub fn (mut app App) handle_get_devtools_system_info(e &ui.Event) string {
	app.logging.debug_source('getDevToolsSystemInfo called', 'App')
	return app.devtools.get_system_info_json()
}

pub fn (mut app App) handle_get_devtools_memory_info(e &ui.Event) string {
	app.logging.debug_source('getDevToolsMemoryInfo called', 'App')
	return app.devtools.get_memory_info_json()
}

pub fn (mut app App) handle_get_devtools_process_info(e &ui.Event) string {
	app.logging.debug_source('getDevToolsProcessInfo called', 'App')
	return app.devtools.get_process_info_json()
}

pub fn (mut app App) handle_get_devtools_network_info(e &ui.Event) string {
	app.logging.debug_source('getDevToolsNetworkInfo called', 'App')
	return app.devtools.get_network_info_json()
}

pub fn (mut app App) handle_get_devtools_database_info(e &ui.Event) string {
	app.logging.debug_source('getDevToolsDatabaseInfo called', 'App')
	return app.devtools.get_database_info_json('users.db.json')
}

pub fn (mut app App) handle_get_devtools_config_info(e &ui.Event) string {
	app.logging.debug_source('getDevToolsConfigInfo called', 'App')
	return app.devtools.get_config_info_json()
}

pub fn (mut app App) handle_get_devtools_performance_metrics(e &ui.Event) string {
	app.logging.debug_source('getDevToolsPerformanceMetrics called', 'App')
	return app.devtools.get_performance_metrics_json()
}

pub fn (mut app App) handle_get_devtools_events(e &ui.Event) string {
	app.logging.debug_source('getDevToolsEvents called', 'App')
	return app.devtools.get_events_json()
}

pub fn (mut app App) handle_get_devtools_bindings(e &ui.Event) string {
	app.logging.debug_source('getDevToolsBindings called', 'App')
	return app.devtools.get_bindings_json()
}

pub fn (mut app App) handle_get_devtools_logs(e &ui.Event) string {
	app.logging.debug_source('getDevToolsLogs called', 'App')
	return app.devtools.get_logs_json()
}

pub fn (mut app App) handle_clear_devtools_events(e &ui.Event) string {
	app.logging.debug_source('clearDevToolsEvents called', 'App')
	app.devtools.clear_events()
	return '{"success": true}'
}

pub fn (mut app App) handle_clear_devtools_logs(e &ui.Event) string {
	app.logging.debug_source('clearDevToolsLogs called', 'App')
	app.devtools.clear_logs()
	return '{"success": true}'
}
