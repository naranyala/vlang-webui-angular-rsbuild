module services

import os

// ============================================================================
// FileService - With Input Validation
// ============================================================================

pub struct FileService {
mut:
	status      ServiceStatus
	initialized bool
	name_value  string
	config      FileServiceConfig
}

pub struct FileServiceConfig {
mut:
	deny_write bool
}

pub fn default_file_service_config() FileServiceConfig {
	return FileServiceConfig{deny_write: true}
}

pub fn (mut s FileService) initialize() bool {
	s.name_value = 'FileService'
	s.status = .ready
	s.initialized = true
	s.config = default_file_service_config()
	return true
}

pub fn (mut s FileService) shutdown() { 
	s.status = .stopped 
}

pub fn (s FileService) name() string { 
	return s.name_value 
}

pub fn (mut s FileService) set_deny_write(deny bool) { 
	s.config.deny_write = deny 
}

// ============================================================================
// Path Validation (Security)
// ============================================================================

// Allowed base directories for file operations
const allowed_base_dirs = ['/home', '/tmp', '/opt/app/data', '/var/tmp']

// Blocked path prefixes (sensitive locations)
const blocked_prefixes = ['/etc/', '/root/', '/proc/', '/sys/', '/dev/', '/boot/']

/**
 * Validate if a path is safe to access
 * Returns true if path is safe, false otherwise
 */
pub fn (s FileService) is_path_safe(path string) bool {
	// Reject empty paths
	if path.len == 0 {
		return false
	}

	// Reject paths with directory traversal
	if path.contains('../') || path.contains('..\\') {
		return false
	}

	// Reject paths with null bytes
	if path.contains('\x00') {
		return false
	}

	// Reject paths starting with blocked prefixes
	for prefix in blocked_prefixes {
		if path.starts_with(prefix) {
			return false
		}
	}

	// For absolute paths, check if within allowed base directories
	if path.starts_with('/') {
		mut is_allowed := false
		for base_dir in allowed_base_dirs {
			if path.starts_with(base_dir) {
				is_allowed = true
				break
			}
		}
		
		// Also allow common user directories
		if path.starts_with('/home/') {
			is_allowed = true
		}
		
		if !is_allowed {
			return false
		}
	}

	// Relative paths are allowed (will be resolved from current directory)
	return true
}

/**
 * Get user-friendly error message for path validation failure
 */
pub fn (s FileService) get_path_validation_error_message(path string) string {
	if path.contains('../') || path.contains('..\\') {
		return 'Path traversal not allowed'
	}
	
	for prefix in blocked_prefixes {
		if path.starts_with(prefix) {
			return 'Access to ${prefix} is restricted for security'
		}
	}
	
	if path.starts_with('/') {
		return 'Access limited to user directories'
	}
	
	return 'Invalid path'
}

// ============================================================================
// File Operations
// ============================================================================

pub fn (mut s FileService) read_file(path string) string {
	if !s.is_path_safe(path) {
		return ''
	}
	return os.read_file(path) or { '' }
}

pub fn (mut s FileService) read_file_json(path string) string {
	if !s.is_path_safe(path) {
		return '{"error": "${s.get_path_validation_error_message(path)}", "path": "${path}", "status": "access_denied"}'
	}

	content := os.read_file(path) or {
		return '{"error": "Failed to read file", "path": "${path}", "status": "error"}'
	}

	// Limit content size for safety
	mut safe_content := content
	if safe_content.len > 100000 {
		safe_content = safe_content[..100000] + '... (truncated)'
	}

	escaped := safe_content.replace('\n', '\\n').replace('"', '\\"')
	return '{"success":true,"path":"${path}","content":"${escaped}","size":"${safe_content.len}","status":"ok"}'
}

pub fn (mut s FileService) browse_directory(path string) string {
	mut current_path := path
	
	// Default to root if empty
	if current_path.len == 0 { 
		current_path = '/' 
	}
	
	// Validate path
	if !s.is_path_safe(current_path) {
		return '{"error": "${s.get_path_validation_error_message(current_path)}", "path": "${current_path}", "status": "access_denied"}'
	}

	// Check if directory exists
	if !os.is_dir(current_path) { 
		return '{"error": "Not a directory", "path": "${current_path}", "status": "error"}' 
	}

	mut files := []string{}
	entries := os.ls(current_path) or { 
		return '{"error": "Failed to list directory", "path": "${current_path}", "status": "error"}' 
	}

	for entry in entries {
		full_path := os.join_path(current_path, entry)
		is_dir := os.is_dir(full_path)
		size := os.file_size(full_path)
		
		files << '{"name":"${entry}","is_dir":${if is_dir { 'true' } else { 'false' }},"size":"${size}","path":"${full_path}"}'
	}

	return '{"path":"${current_path}","files":[${files.join(',')}],"count":"${files.len}","status":"ok"}'
}

pub fn (mut s FileService) list_directory(path string) string {
	return s.browse_directory(path)
}

pub fn (mut s FileService) create_directory_json(path string) string {
	if !s.is_path_safe(path) {
		return '{"error": "${s.get_path_validation_error_message(path)}", "path": "${path}", "status": "access_denied"}'
	}

	os.mkdir(path) or { 
		return '{"error": "Failed to create directory", "path": "${path}", "status": "error"}' 
	}
	
	return '{"success":true,"path":"${path}","status":"ok"}'
}

pub fn (mut s FileService) delete_file_or_directory_json(path string) string {
	if !s.is_path_safe(path) {
		return '{"error": "${s.get_path_validation_error_message(path)}", "path": "${path}", "status": "access_denied"}'
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
	
	return '{"success":true,"path":"${path}","status":"ok"}'
}
