module main

import os
import time

// ============================================================================
// Application State
// ============================================================================

pub struct AppState {
	window_created   bool
	handlers_bound   bool
	root_folder_set  bool
	window_opened    bool
}

// ============================================================================
// Structured Error Handling System
// ============================================================================

// Error codes for programmatic handling
pub enum ErrorCode {
	// System errors (1000-1999)
	system_error = 1000
	invalid_state = 1001
	resource_exhausted = 1002

	// File system errors (2000-2999)
	file_not_found = 2000
	file_access_denied = 2001
	file_read_failed = 2002
	file_write_failed = 2003
	directory_not_found = 2004
	directory_list_failed = 2005

	// Memory errors (3000-3999)
	memory_read_failed = 3000
	memory_parse_failed = 3001
	invalid_memory_data = 3002

	// Process errors (4000-4999)
	process_list_failed = 4000
	process_access_denied = 4001
	invalid_process_data = 4002

	// Network errors (5000-5999)
	network_unavailable = 5000
	connection_failed = 5001
	timeout = 5002

	// UI/WebUI errors (6000-6999)
	ui_init_failed = 6000
	ui_window_failed = 6001
	ui_binding_failed = 6002
	ui_render_failed = 6003

	// Validation errors (7000-7999)
	validation_failed = 7000
	invalid_parameter = 7001
	missing_parameter = 7002

	// Serialization errors
	serialization_failed = 8000

	// Unknown
	unknown = 9999
}

// Structured error type
pub struct AppError {
mut:
	code      ErrorCode
	message   string
	details   string
	operation string
	timestamp string
	recoverable bool
}

// Error registry for tracking error counts
pub struct ErrorRegistry {
mut:
	errors           []AppError
	critical_count   int
	warning_count    int
	last_error       ?AppError
	recovery_actions map[string]string
}

// Create a new error registry
pub fn new_error_registry() ErrorRegistry {
	mut recovery_actions := map[string]string{}

	recovery_actions['file_not_found'] = 'Check if the file exists and path is correct'
	recovery_actions['file_access_denied'] = 'Check file permissions'
	recovery_actions['memory_read_failed'] = 'Verify /proc/meminfo is accessible'
	recovery_actions['process_list_failed'] = 'Check /proc directory permissions'
	recovery_actions['ui_init_failed'] = 'Ensure display server is running'
	recovery_actions['ui_window_failed'] = 'Check browser installation'
	recovery_actions['network_unavailable'] = 'Check network connectivity'
	recovery_actions['timeout'] = 'Retry operation or check system load'

	return ErrorRegistry{
		errors:           []
		critical_count:   0
		warning_count:    0
		last_error:       none
		recovery_actions: recovery_actions
	}
}

// Create an error with full context
pub fn create_error(code ErrorCode, message string, operation string) AppError {
	return AppError{
		code:       code
		message:    message
		details:    ''
		operation:  operation
		timestamp:  time.now().custom_format('YYYY-MM-DD HH:mm:ss')
		recoverable: is_recoverable(code)
	}
}

// Create an error with additional details

// Check if an error code is recoverable
fn is_recoverable(code ErrorCode) bool {
	return code in [.timeout, .network_unavailable, .file_read_failed, .memory_read_failed]
}

// Get error code as string
pub fn error_code_string(code ErrorCode) string {
	return match code {
		.system_error           { 'SYSTEM_ERROR' }
		.invalid_state          { 'INVALID_STATE' }
		.resource_exhausted     { 'RESOURCE_EXHAUSTED' }
		.file_not_found          { 'FILE_NOT_FOUND' }
		.file_access_denied      { 'FILE_ACCESS_DENIED' }
		.file_read_failed        { 'FILE_READ_FAILED' }
		.file_write_failed       { 'FILE_WRITE_FAILED' }
		.directory_not_found     { 'DIRECTORY_NOT_FOUND' }
		.directory_list_failed   { 'DIRECTORY_LIST_FAILED' }
		.memory_read_failed      { 'MEMORY_READ_FAILED' }
		.memory_parse_failed     { 'MEMORY_PARSE_FAILED' }
		.invalid_memory_data     { 'INVALID_MEMORY_DATA' }
		.process_list_failed     { 'PROCESS_LIST_FAILED' }
		.process_access_denied   { 'PROCESS_ACCESS_DENIED' }
		.invalid_process_data    { 'INVALID_PROCESS_DATA' }
		.network_unavailable    { 'NETWORK_UNAVAILABLE' }
		.connection_failed      { 'CONNECTION_FAILED' }
		.timeout               { 'TIMEOUT' }
		.ui_init_failed          { 'UI_INIT_FAILED' }
		.ui_window_failed        { 'UI_WINDOW_FAILED' }
		.ui_binding_failed        { 'UI_BINDING_FAILED' }
		.ui_render_failed        { 'UI_RENDER_FAILED' }
		.validation_failed      { 'VALIDATION_FAILED' }
		.invalid_parameter      { 'INVALID_PARAMETER' }
		.missing_parameter      { 'MISSING_PARAMETER' }
		.serialization_failed   { 'SERIALIZATION_FAILED' }
		.unknown               { 'UNKNOWN' }
	}
}

// Get user-friendly message for error code
pub fn get_user_message(code ErrorCode, custom_message string) string {
	base_msg := match code {
		.system_error           { 'A system error occurred' }
		.invalid_state          { 'Invalid application state' }
		.resource_exhausted     { 'System resources exhausted' }
		.file_not_found          { 'File not found' }
		.file_access_denied      { 'Access denied to file' }
		.file_read_failed        { 'Failed to read file' }
		.file_write_failed       { 'Failed to write file' }
		.directory_not_found     { 'Directory not found' }
		.directory_list_failed   { 'Failed to list directory' }
		.memory_read_failed      { 'Failed to read memory info' }
		.memory_parse_failed     { 'Failed to parse memory data' }
		.invalid_memory_data     { 'Invalid memory data' }
		.process_list_failed     { 'Failed to list processes' }
		.process_access_denied   { 'Access denied to process' }
		.invalid_process_data    { 'Invalid process data' }
		.network_unavailable    { 'Network unavailable' }
		.connection_failed      { 'Connection failed' }
		.timeout               { 'Operation timed out' }
		.ui_init_failed          { 'Failed to initialize UI' }
		.ui_window_failed        { 'Failed to create window' }
		.ui_binding_failed        { 'Failed to bind UI handler' }
		.ui_render_failed        { 'Failed to render UI' }
		.validation_failed      { 'Validation failed' }
		.invalid_parameter      { 'Invalid parameter' }
		.missing_parameter      { 'Missing required parameter' }
		.serialization_failed   { 'Serialization failed' }
		.unknown               { 'An unknown error occurred' }
	}

	if custom_message.len > 0 {
		return '${base_msg}: ${custom_message}'
	}
	return base_msg
}

// Get recovery suggestion for error
pub fn get_recovery_suggestion(registry &ErrorRegistry, code ErrorCode) string {
	code_str := error_code_string(code).to_lower()
	return registry.recovery_actions[code_str] or { 'No automatic recovery available' }
}

// Register an error in the registry
pub fn (mut registry ErrorRegistry) register_error(error AppError) {
	registry.errors << error
	registry.last_error = error

	if error.code in [.system_error, .resource_exhausted] {
		registry.critical_count++
	} else {
		registry.warning_count++
	}
}

// Get error summary as JSON
pub fn (registry ErrorRegistry) get_summary_json() string {
	mut summary := []string{}
	summary << '"total_errors":"${registry.errors.len}"'
	summary << '"critical_count":"${registry.critical_count}"'
	summary << '"warning_count":"${registry.warning_count}"'

	last_error_str := if registry.last_error != none {
		err := registry.last_error
		'"last_error":"${err.message}"'
	} else {
		'"last_error":null'
	}
	summary << last_error_str

	return '{${summary.join(',')}}'
}

// Check if last error exists
pub fn (registry ErrorRegistry) has_last_error() bool {
	return registry.last_error != none
}

// Get last error
pub fn (registry ErrorRegistry) get_last_error() ?AppError {
	return registry.last_error
}

// Clear error registry
pub fn (mut registry ErrorRegistry) clear() {
	registry.errors = []
	registry.critical_count = 0
	registry.warning_count = 0
	registry.last_error = none
}

// ============================================================================
// Result Types for Error Handling
// ============================================================================

// Result type for string operations
pub struct StringResult {
	value  ?string
	error  ?AppError
	is_ok  bool
}

// Result type for int operations
pub struct IntResult {
	value  ?int
	error  ?AppError
	is_ok  bool
}

// Create a successful string result
pub fn ok_str(value string) StringResult {
	return StringResult{
		value: value
		error: none
		is_ok: true
	}
}

// Create a failed string result
pub fn err_str(error AppError) StringResult {
	return StringResult{
		value: none
		error: error
		is_ok: false
	}
}

// Create a successful int result
pub fn ok_int(value int) IntResult {
	return IntResult{
		value: value
		error: none
		is_ok: true
	}
}

// Create a failed int result
pub fn err_int(error AppError) IntResult {
	return IntResult{
		value: none
		error: error
		is_ok: false
	}
}

// Check if result is successful
pub fn (r StringResult) is_ok() bool {
	return r.is_ok
}

// Check if result is an error
pub fn (r StringResult) is_err() bool {
	return !r.is_ok
}

// Check if int result is successful
pub fn (r IntResult) is_ok() bool {
	return r.is_ok
}

// Check if int result is an error
pub fn (r IntResult) is_err() bool {
	return !r.is_ok
}

// Get value or default
pub fn (r StringResult) unwrap_or(default string) string {
	return if r.is_ok { r.value or { default } } else { default }
}

// Get value or default for int
pub fn (r IntResult) unwrap_or(default int) int {
	return if r.is_ok { r.value or { default } } else { default }
}

// Get error if present
pub fn (r StringResult) error_msg() ?string {
	if r.is_err() {
		err := r.error or { return none }
		return err.message
	}
	return none
}

// ============================================================================
// Error Handling Helpers
// ============================================================================

// Safe file read with error handling
pub fn safe_read_file(path string) StringResult {
	content := os.read_file(path) or {
		return err_str(create_error(.file_read_failed, 'Failed to read file: ${path}', 'read_file'))
	}
	return ok_str(content)
}

// Safe directory list with error handling
pub fn safe_list_dir(path string) StringResult {
	entries := os.ls(path) or {
		return err_str(create_error(.directory_list_failed, 'Failed to list directory: ${path}', 'list_dir'))
	}
	return ok_str(entries.join('\n'))
}

// Safe JSON parse with error handling
pub fn safe_json_parse(json_str string) StringResult {
	// Just return the input as we can't properly parse JSON in V without a type
	if json_str.len == 0 {
		return err_str(create_error(.serialization_failed, 'Empty JSON string', 'json_parse'))
	}
	return ok_str(json_str)
}
