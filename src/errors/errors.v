module errors

import time

// ============================================================================
// Error Types
// ============================================================================

// ErrorCode enumerates all application error codes
pub enum ErrorCode {
	// General errors (0-999)
	unknown = 0
	internal_error = 1
	timeout = 2
	invalid_operation = 3
	
	// Validation errors (1000-1999)
	validation_failed = 1000
	missing_required_field = 1001
	invalid_field_value = 1002
	
	// File errors (2000-2999)
	file_not_found = 2000
	file_read_failed = 2001
	file_write_failed = 2002
	file_access_denied = 2003
	path_traversal_detected = 2004
	
	// Database errors (3000-3999)
	database_error = 3000
	record_not_found = 3001
	duplicate_record = 3002
	
	// Network errors (4000-4999)
	network_error = 4000
	connection_failed = 4001
	request_failed = 4002
	
	// Auth errors (5000-5999)
	authentication_failed = 5000
	authorization_failed = 5001
	invalid_token = 5002
	token_expired = 5003
	
	// User errors (6000-6999)
	user_not_found = 6000
	user_already_exists = 6001
	invalid_credentials = 6002
}

// AppError represents a structured application error
pub struct AppError {
pub mut:
	code        ErrorCode
	message     string
	details     string
	operation   string
	timestamp   string
	recoverable bool
	context     map[string]string
}

// Result represents either a success value or an error
// Usage: result := operation()
//        if result.is_err() { handle_error(result.error) }
//        else { use_value(result.value) }
pub struct Result[T] {
	value  ?T
	error  ?AppError
	is_ok  bool
}

// ============================================================================
// Result Methods
// ============================================================================

// Create a successful result
pub fn ok[T](value T) Result[T] {
	return Result[T]{
		value: value
		is_ok: true
	}
}

// Create an error result
pub fn err[T](error AppError) Result[T] {
	return Result[T]{
		error: error
		is_ok: false
	}
}

// Check if result is ok
pub fn (r Result[T]) is_ok() bool {
	return r.is_ok
}

// Check if result is error
pub fn (r Result[T]) is_err() bool {
	return !r.is_ok
}

// Get value (returns default if error)
pub fn (r Result[T]) unwrap_or(default T) T {
	if r.is_ok && r.value != none {
		return r.value
	}
	return default
}

// Get value or panic
pub fn (r Result[T]) unwrap() T {
	if r.is_ok && r.value != none {
		return r.value
	}
	panic('Result.unwrap() called on error: ${r.error.message}')
}

// Map success value
pub fn (r Result[T]) map[U](f fn (T) U) Result[U] {
	if r.is_ok && r.value != none {
		return ok[U](f(r.value))
	}
	return err[U](r.error)
}

// Flat map for chaining
pub fn (r Result[T]) and_then[U](f fn (T) Result[U]) Result[U] {
	if r.is_ok && r.value != none {
		return f(r.value)
	}
	return err[U](r.error)
}

// Get error or none
pub fn (r Result[T]) error() ?AppError {
	return r.error
}

// ============================================================================
// Error Builder
// ============================================================================

// Create a new error
pub fn create_error(code ErrorCode, message string, operation string) AppError {
	return AppError{
		code: code
		message: message
		operation: operation
		timestamp: time.now().custom_format('YYYY-MM-DD HH:mm:ss')
		recoverable: is_recoverable(code)
		context: map[string]string{}
	}
}

// Add context to error
pub fn (mut e AppError) with_context(key string, value string) &AppError {
	e.context[key] = value
	return &e
}

// Add details to error
pub fn (mut e AppError) with_details(details string) &AppError {
	e.details = details
	return &e
}

// Mark error as recoverable
pub fn (mut e AppError) recoverable() &AppError {
	e.recoverable = true
	return &e
}

// ============================================================================
// Helper Functions
// ============================================================================

// Check if error code is recoverable
fn is_recoverable(code ErrorCode) bool {
	match code {
		.timeout, .network_error, .connection_failed { return true }
		else { return false }
	}
}

// Get error message for code
pub fn error_message(code ErrorCode) string {
	match code {
		.unknown { return 'Unknown error' }
		.internal_error { return 'Internal error occurred' }
		.timeout { return 'Operation timed out' }
		.invalid_operation { return 'Invalid operation' }
		.validation_failed { return 'Validation failed' }
		.missing_required_field { return 'Missing required field' }
		.invalid_field_value { return 'Invalid field value' }
		.file_not_found { return 'File not found' }
		.file_read_failed { return 'Failed to read file' }
		.file_write_failed { return 'Failed to write file' }
		.file_access_denied { return 'File access denied' }
		.path_traversal_detected { return 'Path traversal detected' }
		.database_error { return 'Database error' }
		.record_not_found { return 'Record not found' }
		.duplicate_record { return 'Duplicate record' }
		.network_error { return 'Network error' }
		.connection_failed { return 'Connection failed' }
		.request_failed { return 'Request failed' }
		.authentication_failed { return 'Authentication failed' }
		.authorization_failed { return 'Authorization failed' }
		.invalid_token { return 'Invalid token' }
		.token_expired { return 'Token expired' }
		.user_not_found { return 'User not found' }
		.user_already_exists { return 'User already exists' }
		.invalid_credentials { return 'Invalid credentials' }
		else { return 'Unknown error' }
	}
}

// Convert error to JSON string
pub fn error_to_json(e AppError) string {
	context_json := '{}'
	if e.context.len > 0 {
		mut parts := []string{cap: e.context.len}
		for key, value in e.context {
			parts << '"${key}":"${value}"'
		}
		context_json = '{${parts.join(",")}}'
	}
	
	return '{"code":"${e.code}","message":"${e.message}","details":"${e.details}","operation":"${e.operation}","timestamp":"${e.timestamp}","recoverable":${e.recoverable},"context":${context_json}}'
}

// Convert result to JSON string
pub fn result_to_json[T](r Result[T], value_to_json fn (T) string) string {
	if r.is_ok {
		if r.value != none {
			return '{"success":true,"data":${value_to_json(r.value)}}'
		}
		return '{"success":true}'
	} else {
		return '{"success":false,"error":${error_to_json(r.error)}}'
	}
}
