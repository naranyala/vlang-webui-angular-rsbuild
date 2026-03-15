module main

import vwebui as ui
import time
import services

// ============================================================================
// Application Service - Simplified without DI container
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

	mut config := services.ConfigService{}
	config.initialize()

	mut user := services.UserService{}
	user.initialize() or {
		logging.error('Failed to initialize user service: ${err}')
	}

	return App{
		logging:      logging
		system_info:  system_info
		file:         file
		network:      network
		config:       config
		user:         user
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
// Event Handlers using Services
// ============================================================================

// HandleGetAppInfo handles the getAppInfo event
pub fn (mut app App) handle_get_app_info(e &ui.Event) string {
	app.logging.debug_source('getAppInfo called', 'App')
	timestamp := time.now().custom_format('YYYY-MM-DD HH:mm:ss')

	return '{"name":"${app.app_name}","version":"${app.app_version}","timestamp":"${timestamp}","status":"ok"}'
}

// HandleGetSystemInfo handles the getSystemInfo event
pub fn (mut app App) handle_get_system_info(e &ui.Event) string {
	app.logging.debug_source('getSystemInfo called', 'App')
	return app.system_info.get_system_info_json()
}

// HandleGetMemoryStats handles the getMemoryStats event
pub fn (mut app App) handle_get_memory_stats(e &ui.Event) string {
	app.logging.debug_source('getMemoryStats called', 'App')
	return app.system_info.get_memory_stats_json()
}

// HandleListProcesses handles the listProcesses event
pub fn (mut app App) handle_list_processes(e &ui.Event) string {
	app.logging.debug_source('listProcesses called', 'App')
	return app.system_info.list_processes_json(100)
}

// HandleBrowseDirectory handles the browseDirectory event
pub fn (mut app App) handle_browse_directory(e &ui.Event) string {
	app.logging.debug_source('browseDirectory called', 'App')
	mut path := e.element
	if path.len == 0 {
		path = '/'
	}
	return app.file.browse_directory(path)
}

// HandleGetBrowseDirectory is an alias for handle_browse_directory
pub fn (mut app App) handle_get_browse_directory(e &ui.Event) string {
	return app.handle_browse_directory(e)
}

// HandleGetCpuInfo handles the getCpuInfo event
pub fn (mut app App) handle_get_cpu_info(e &ui.Event) string {
	app.logging.debug_source('getCpuInfo called', 'App')
	return app.system_info.get_cpu_info_json()
}

// HandleGetCpuUsage handles the getCpuUsage event
pub fn (mut app App) handle_get_cpu_usage(e &ui.Event) string {
	app.logging.debug_source('getCpuUsage called', 'App')
	return app.system_info.get_cpu_usage_json()
}

// HandleGetDiskUsage handles the getDiskUsage event
pub fn (mut app App) handle_get_disk_usage(e &ui.Event) string {
	app.logging.debug_source('getDiskUsage called', 'App')
	return app.system_info.get_disk_usage_json()
}

// HandleGetDiskPartitions handles the getDiskPartitions event
pub fn (mut app App) handle_get_disk_partitions(e &ui.Event) string {
	app.logging.debug_source('getDiskPartitions called', 'App')
	return app.system_info.get_disk_partitions_json()
}

// HandleGetNetworkInterfaces handles the getNetworkInterfaces event
pub fn (mut app App) handle_get_network_interfaces(e &ui.Event) string {
	app.logging.debug_source('getNetworkInterfaces called', 'App')
	return app.network.get_network_interfaces_json()
}

// HandleGetNetworkStats handles the getNetworkStats event
pub fn (mut app App) handle_get_network_stats(e &ui.Event) string {
	app.logging.debug_source('getNetworkStats called', 'App')
	return app.network.get_network_stats_json()
}

// HandleGetIpAddresses handles the getIpAddresses event
pub fn (mut app App) handle_get_ip_addresses(e &ui.Event) string {
	app.logging.debug_source('getIpAddresses called', 'App')
	return app.network.get_ip_addresses_json()
}

// HandleGetSystemLoad handles the getSystemLoad event
pub fn (mut app App) handle_get_system_load(e &ui.Event) string {
	app.logging.debug_source('getSystemLoad called', 'App')
	return app.system_info.get_system_load_json()
}

// HandleGetUptime handles the getUptime event
pub fn (mut app App) handle_get_uptime(e &ui.Event) string {
	app.logging.debug_source('getUptime called', 'App')
	return app.system_info.get_uptime_json()
}

// HandleGetHostnameInfo handles the getHostnameInfo event
pub fn (mut app App) handle_get_hostname_info(e &ui.Event) string {
	app.logging.debug_source('getHostnameInfo called', 'App')
	return app.network.get_hostname_info_json()
}

// HandleGetUserInfo handles the getUserInfo event
pub fn (mut app App) handle_get_user_info(e &ui.Event) string {
	app.logging.debug_source('getUserInfo called', 'App')
	return '{"username":"user","home_dir":"/home/user","status":"ok"}'
}

// HandleGetEnvironmentVariables handles the getEnvironmentVariables event
pub fn (mut app App) handle_get_environment_variables(e &ui.Event) string {
	app.logging.debug_source('getEnvironmentVariables called', 'App')
	return app.system_info.get_environment_variables_json()
}

// HandleGetHardwareInfo handles the getHardwareInfo event
pub fn (mut app App) handle_get_hardware_info(e &ui.Event) string {
	app.logging.debug_source('getHardwareInfo called', 'App')
	return app.system_info.get_hardware_info_json()
}

// HandleGetSensorTemperatures handles the getSensorTemperatures event
pub fn (mut app App) handle_get_sensor_temperatures(e &ui.Event) string {
	app.logging.debug_source('getSensorTemperatures called', 'App')
	return app.system_info.get_sensor_temperatures_json()
}

// HandleReadFile handles the readFile event
pub fn (mut app App) handle_read_file(e &ui.Event) string {
	app.logging.debug_source('readFile called', 'App')
	path := e.element
	return app.file.read_file_json(path)
}

// HandleWriteFile handles the writeFile event
pub fn (mut app App) handle_write_file(e &ui.Event) string {
	app.logging.warning_source('writeFile called - disabled for security', 'App')
	return '{"error": "Write operations are disabled for security", "status": "disabled"}'
}

// HandleCreateDirectory handles the createDirectory event
pub fn (mut app App) handle_create_directory(e &ui.Event) string {
	app.logging.debug_source('createDirectory called', 'App')
	path := e.element
	return app.file.create_directory_json(path)
}

// HandleDeleteFileOrDirectory handles the deleteFileOrDirectory event
pub fn (mut app App) handle_delete_file_or_directory(e &ui.Event) string {
	app.logging.debug_source('deleteFileOrDirectory called', 'App')
	path := e.element
	return app.file.delete_file_or_directory_json(path)
}

// ============================================================================
// User Management Handlers (SQLite CRUD)
// ============================================================================

// HandleGetUsers handles the getUsers event
pub fn (mut app App) handle_get_users(e &ui.Event) string {
	app.logging.debug_source('getUsers called', 'App')
	return app.user.get_users_json()
}

// HandleGetUser handles the getUser event
pub fn (mut app App) handle_get_user(e &ui.Event) string {
	app.logging.debug_source('getUser called', 'App')
	id := e.element.int()
	return app.user.get_user_json(id)
}

// HandleSaveUser handles the saveUser event (create or update)
pub fn (mut app App) handle_save_user(e &ui.Event) string {
	app.logging.debug_source('saveUser called', 'App')
	data := e.element
	return app.user.save_user_json(data)
}

// HandleDeleteUser handles the deleteUser event
pub fn (mut app App) handle_delete_user(e &ui.Event) string {
	app.logging.debug_source('deleteUser called', 'App')
	id := e.element.int()
	return app.user.delete_user_json(id)
}

// HandleSearchUsers handles the searchUsers event
pub fn (mut app App) handle_search_users(e &ui.Event) string {
	app.logging.debug_source('searchUsers called', 'App')
	query := e.element
	return app.user.search_users_json(query)
}

// HandleGetUserStats handles the getUserStats event
pub fn (mut app App) handle_get_user_stats(e &ui.Event) string {
	app.logging.debug_source('getUserStats called', 'App')
	return app.user.get_stats_json()
}
