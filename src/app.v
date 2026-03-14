module main

import vwebui as ui
import time

// ============================================================================
// Application Service - Simplified without DI container
// ============================================================================

// App represents the main application
pub struct App {
mut:
	logging          LoggingService
	system_info      SystemInfoService
	file             FileService
	network          NetworkService
	config           ConfigService

	app_name         string
	app_version      string
	handlers_bound   bool
	window_opened    bool
}

// NewApp creates a new application instance
pub fn new_app(app_name string, app_version string) App {
	mut logging := LoggingService{}
	logging.initialize()
	logging.set_min_level('debug')

	mut system_info := SystemInfoService{}
	system_info.initialize()

	mut file := FileService{}
	file.initialize()
	file.set_deny_write(true)

	mut network := NetworkService{}
	network.initialize()

	mut config := ConfigService{}
	config.initialize()

	return App{
		logging:      logging
		system_info:  system_info
		file:         file
		network:      network
		config:       config
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
