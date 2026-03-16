module config

import os

// ============================================================================
// Application Configuration
// Centralized configuration management
// ============================================================================

pub struct AppConfig {
pub mut:
	data_dir        string
	log_file        string
	db_file         string
	debug_mode      bool
	max_file_size   int
	allowed_paths   []string
	app_name        string
	app_version     string
}

// Get base directory (executable location or current directory)
fn get_base_dir() string {
	exe_path := os.executable() or { return os.cwd() }
	return exe_path.dir()
}

// Initialize configuration with sensible defaults
pub fn init_config() AppConfig {
	base_dir := get_base_dir()
	
	return AppConfig{
		data_dir: os.join_path(base_dir, 'data')
		log_file: os.join_path(base_dir, 'logs', 'app.log')
		db_file: os.join_path(base_dir, 'data', 'users.db.json')
		debug_mode: os.getenv('APP_DEBUG') == '1'
		max_file_size: 100000  // 100KB limit for safety
		allowed_paths: ['/home', '/tmp', os.join_path(base_dir, 'data')]
		app_name: 'Desktop App'
		app_version: '1.0.0'
	}
}

// Ensure all required directories exist
pub fn (mut config AppConfig) ensure_directories() ! {
	// Create data directory
	if !os.is_dir(config.data_dir) {
		os.mkdir(config.data_dir) or {
			return error('Failed to create data directory: ${config.data_dir}')
		}
	}
	
	// Create log directory
	log_dir := config.log_file.dir()
	if !os.is_dir(log_dir) {
		os.mkdir(log_dir) or {
			return error('Failed to create log directory: ${log_dir}')
		}
	}
}

// Validate path for security
pub fn (config AppConfig) is_path_allowed(path string) bool {
	// Check if path starts with any allowed path
	for allowed in config.allowed_paths {
		if path.starts_with(allowed) {
			return true
		}
	}
	return false
}

// Get configuration as JSON for DevTools
pub fn (config AppConfig) to_json() string {
	info := {
		app_name: config.app_name
		version: config.app_version
		data_dir: config.data_dir
		log_file: config.log_file
		db_file: config.db_file
		debug_mode: config.debug_mode
		max_file_size: config.max_file_size
		allowed_paths: config.allowed_paths
	}
	
	return json.encode(info) or { '{}' }
}
