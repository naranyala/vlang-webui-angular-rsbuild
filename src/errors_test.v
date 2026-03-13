module main

import testing

// ============================================================================
// Error Code Tests
// ============================================================================

fn test_error_code_string() {
    // Test system errors
    assert error_code_string(.system_error) == 'SYSTEM_ERROR'
    assert error_code_string(.invalid_state) == 'INVALID_STATE'
    assert error_code_string(.resource_exhausted) == 'RESOURCE_EXHAUSTED'

    // Test file system errors
    assert error_code_string(.file_not_found) == 'FILE_NOT_FOUND'
    assert error_code_string(.file_access_denied) == 'FILE_ACCESS_DENIED'
    assert error_code_string(.file_read_failed) == 'FILE_READ_FAILED'
    assert error_code_string(.file_write_failed) == 'FILE_WRITE_FAILED'
    assert error_code_string(.directory_not_found) == 'DIRECTORY_NOT_FOUND'
    assert error_code_string(.directory_list_failed) == 'DIRECTORY_LIST_FAILED'

    // Test memory errors
    assert error_code_string(.memory_read_failed) == 'MEMORY_READ_FAILED'
    assert error_code_string(.memory_parse_failed) == 'MEMORY_PARSE_FAILED'
    assert error_code_string(.invalid_memory_data) == 'INVALID_MEMORY_DATA'

    // Test process errors
    assert error_code_string(.process_list_failed) == 'PROCESS_LIST_FAILED'
    assert error_code_string(.process_access_denied) == 'PROCESS_ACCESS_DENIED'
    assert error_code_string(.invalid_process_data) == 'INVALID_PROCESS_DATA'

    // Test network errors
    assert error_code_string(.network_unavailable) == 'NETWORK_UNAVAILABLE'
    assert error_code_string(.connection_failed) == 'CONNECTION_FAILED'
    assert error_code_string(.timeout) == 'TIMEOUT'

    // Test UI errors
    assert error_code_string(.ui_init_failed) == 'UI_INIT_FAILED'
    assert error_code_string(.ui_window_failed) == 'UI_WINDOW_FAILED'
    assert error_code_string(.ui_binding_failed) == 'UI_BINDING_FAILED'
    assert error_code_string(.ui_render_failed) == 'UI_RENDER_FAILED'

    // Test validation errors
    assert error_code_string(.validation_failed) == 'VALIDATION_FAILED'
    assert error_code_string(.invalid_parameter) == 'INVALID_PARAMETER'
    assert error_code_string(.missing_parameter) == 'MISSING_PARAMETER'

    // Test serialization errors
    assert error_code_string(.serialization_failed) == 'SERIALIZATION_FAILED'

    // Test unknown error
    assert error_code_string(.unknown) == 'UNKNOWN'
}

fn test_get_user_message() {
    // Test with custom message
    msg := get_user_message(.file_not_found, 'Custom error')
    assert msg.contains('File not found')
    assert msg.contains('Custom error')

    // Test without custom message
    msg = get_user_message(.file_not_found, '')
    assert msg == 'File not found'

    // Test system error
    msg = get_user_message(.system_error, '')
    assert msg == 'A system error occurred'

    // Test timeout
    msg = get_user_message(.timeout, '')
    assert msg == 'Operation timed out'

    // Test unknown
    msg = get_user_message(.unknown, '')
    assert msg == 'An unknown error occurred'
}

// ============================================================================
// Error Creation Tests
// ============================================================================

fn test_create_error() {
    err := create_error(.file_not_found, 'File missing', 'read_file')

    assert err.code == .file_not_found
    assert err.message == 'File missing'
    assert err.operation == 'read_file'
    assert err.details == ''
    assert err.timestamp != ''
    assert err.recoverable == false
}

fn test_create_error_with_details() {
    err := create_error_with_details(.file_read_failed, 'Read failed', 'Permission denied', 'read')

    assert err.code == .file_read_failed
    assert err.message == 'Read failed'
    assert err.details == 'Permission denied'
    assert err.operation == 'read'
}

fn test_is_recoverable() {
    // Test recoverable errors
    assert is_recoverable(.timeout) == true
    assert is_recoverable(.network_unavailable) == true
    assert is_recoverable(.file_read_failed) == true
    assert is_recoverable(.memory_read_failed) == true

    // Test non-recoverable errors
    assert is_recoverable(.file_not_found) == false
    assert is_recoverable(.validation_failed) == false
    assert is_recoverable(.unknown) == false
}

// ============================================================================
// Error Registry Tests
// ============================================================================

fn test_new_error_registry() {
    registry := new_error_registry()

    assert registry.errors.len == 0
    assert registry.critical_count == 0
    assert registry.warning_count == 0
    assert registry.last_error.is_none()
    assert registry.recovery_actions.len > 0
}

fn test_registry_has_recovery_actions() {
    registry := new_error_registry()

    // Check some recovery actions exist
    assert registry.recovery_actions['file_not_found'].len > 0
    assert registry.recovery_actions['ui_init_failed'].len > 0
    assert registry.recovery_actions['timeout'].len > 0
}

fn test_get_recovery_suggestion() {
    registry := new_error_registry()

    suggestion := get_recovery_suggestion(&registry, .file_not_found)
    assert suggestion.len > 0
    assert !suggestion.contains('No automatic recovery')

    suggestion = get_recovery_suggestion(&registry, .unknown)
    assert suggestion.contains('No automatic recovery')
}

fn test_error_registry_to_json() {
    mut registry := new_error_registry()

    // Add some errors
    err1 := create_error(.file_not_found, 'File 1', 'op1')
    err2 := create_error(.ui_init_failed, 'UI error', 'op2')
    
    registry = registry_register_error(registry, err1)
    registry = registry_register_error(registry, err2)

    json_str := registry.to_json()

    assert json_str.contains('"total_errors":2')
    assert json_str.contains('"critical":1')
    assert json_str.contains('"warnings":1')
    assert json_str.contains('"errors":[')
    assert json_str.starts_with('{')
    assert json_str.ends_with('}')
}

fn test_registry_register_error() {
    mut registry := new_error_registry()

    // Register a warning error
    err1 := create_error(.file_not_found, 'Warning', 'op')
    registry = registry_register_error(registry, err1)

    assert registry.errors.len == 1
    assert registry.warning_count == 1
    assert registry.critical_count == 0
    assert registry.last_error.is_some()

    // Register a critical error
    err2 := create_error(.ui_init_failed, 'Critical', 'op')
    registry = registry_register_error(registry, err2)

    assert registry.errors.len == 2
    assert registry.warning_count == 1
    assert registry.critical_count == 1
}

fn test_registry_clear() {
    mut registry := new_error_registry()

    // Add errors
    err := create_error(.file_not_found, 'Test', 'op')
    registry = registry_register_error(registry, err)

    assert registry.errors.len == 1

    // Clear
    registry = registry_clear(registry)

    assert registry.errors.len == 0
    assert registry.critical_count == 0
    assert registry.warning_count == 0
    assert registry.last_error.is_none()
}

// ============================================================================
// Result Type Tests
// ============================================================================

fn test_ok_str() {
    result := ok_str('success')

    assert result.is_ok()
    assert !result.is_err()
    assert result.unwrap_or('default') == 'success'
}

fn test_err_str() {
    err := create_error(.unknown, 'Error message', 'op')
    result := err_str(err)

    assert !result.is_ok()
    assert result.is_err()
    assert result.unwrap_or('default') == 'default'
    assert result.error_msg().is_some()
}

fn test_ok_int() {
    result := ok_int(42)

    assert result.is_ok()
    assert !result.is_err()
    assert result.unwrap_or(0) == 42
}

fn test_err_int() {
    err := create_error(.unknown, 'Error', 'op')
    result := err_int(err)

    assert !result.is_ok()
    assert result.is_err()
    assert result.unwrap_or(0) == 0
}

fn test_string_result_error_msg() {
    // Test with error
    err := create_error(.unknown, 'Test error', 'op')
    result := err_str(err)
    
    msg := result.error_msg()
    assert msg.is_some()
    assert msg.unwrap() == 'Test error'

    // Test without error
    result = ok_str('success')
    assert result.error_msg().is_none()
}

// ============================================================================
// Safe Operation Tests
// ============================================================================

fn test_safe_json_parse_valid() {
    // Test valid JSON object
    result := safe_json_parse('{"key": "value"}')
    assert result.is_ok()

    // Test valid JSON array
    result = safe_json_parse('[1, 2, 3]')
    assert result.is_ok()

    // Test valid JSON with whitespace
    result = safe_json_parse('  { "key": "value" }  ')
    assert result.is_ok()
}

fn test_safe_json_parse_invalid() {
    // Test invalid JSON
    result := safe_json_parse('not json')
    assert result.is_err()
    assert result.error_msg().is_some()

    // Test empty string
    result = safe_json_parse('')
    assert result.is_err()
}

fn test_safe_int_parse_valid() {
    result := safe_int_parse('42')
    assert result.is_ok()
    assert result.unwrap_or(0) == 42

    result = safe_int_parse('-100')
    assert result.is_ok()
    assert result.unwrap_or(0) == -100
}

fn test_safe_int_parse_invalid() {
    result := safe_int_parse('not a number')
    assert result.is_err()
    assert result.error_msg().is_some()

    result = safe_int_parse('')
    assert result.is_err()
}

// ============================================================================
// App State Tests
// ============================================================================

fn test_app_state_initialization() {
    state := AppState{}

    assert !state.window_created
    assert !state.handlers_bound
    assert !state.root_folder_set
    assert !state.window_opened
}

fn test_app_state_transitions() {
    mut state := AppState{}

    // Simulate state transitions
    state.window_created = true
    assert state.window_created

    state.handlers_bound = true
    assert state.handlers_bound

    state.root_folder_set = true
    assert state.root_folder_set

    state.window_opened = true
    assert state.window_opened
}
