module services_test

import services
import os
import json

// ============================================================================
// FileService Tests
// ============================================================================

fn test_file_service_initialization() {
	println('Testing FileService initialization...')

	mut file_service := services.FileService{}
	file_service.initialize()

	assert file_service.initialized == true

	println('PASS: FileService initialization')
}

fn test_file_service_set_deny_write() {
	println('Testing FileService set_deny_write...')

	mut file_service := services.FileService{}
	file_service.initialize()

	file_service.set_deny_write(true)
	assert file_service.deny_write == true

	file_service.set_deny_write(false)
	assert file_service.deny_write == false

	println('PASS: FileService set_deny_write')
}

fn test_file_service_is_path_safe_valid_paths() {
	println('Testing FileService is_path_safe with valid paths...')

	mut file_service := services.FileService{}
	file_service.initialize()

	// Valid paths should pass
	assert file_service.is_path_safe('/home/user/file.txt') == true
	assert file_service.is_path_safe('/tmp/test.txt') == true
	assert file_service.is_path_safe('relative/path.txt') == true

	println('PASS: FileService is_path_safe valid paths')
}

fn test_file_service_is_path_safe_invalid_paths() {
	println('Testing FileService is_path_safe with invalid paths...')

	mut file_service := services.FileService{}
	file_service.initialize()

	// Path traversal should be blocked
	assert file_service.is_path_safe('../../../etc/passwd') == false
	assert file_service.is_path_safe('/etc/shadow') == false
	assert file_service.is_path_safe('/etc/passwd') == false
	assert file_service.is_path_safe('/root/.ssh/id_rsa') == false

	println('PASS: FileService is_path_safe invalid paths')
}

fn test_file_service_browse_directory() {
	println('Testing FileService browse_directory...')

	mut file_service := services.FileService{}
	file_service.initialize()

	// Browse /tmp directory (should exist)
	result := file_service.browse_directory('/tmp')

	// Parse result
	mut response := map[string]interface{}{}
	json.decode(result, mut response) or {
		println('FAIL: Invalid JSON response: ${err}')
		return
	}

	assert response['status'] == 'success'
	assert 'path' in response
	assert 'files' in response

	println('PASS: FileService browse_directory')
}

fn test_file_service_browse_nonexistent_directory() {
	println('Testing FileService browse nonexistent directory...')

	mut file_service := services.FileService{}
	file_service.initialize()

	result := file_service.browse_directory('/nonexistent_directory_12345')

	mut response := map[string]interface{}{}
	json.decode(result, mut response) or { return }

	assert response['status'] == 'error'

	println('PASS: FileService browse nonexistent directory')
}

fn test_file_service_read_file_json() {
	println('Testing FileService read_file_json...')

	mut file_service := services.FileService{}
	file_service.initialize()

	// Create test file
	test_file := '/tmp/test_read_file.txt'
	test_content := 'Test file content for testing'
	os.write_file(test_file, test_content) or {
		println('FAIL: Could not create test file')
		return
	}

	// Read file
	result := file_service.read_file_json(test_file)

	// Parse result
	mut response := map[string]interface{}{}
	json.decode(result, mut response) or {
		println('FAIL: Invalid JSON response')
		return
	}

	assert response['status'] == 'success'
	assert response['content'] == test_content

	// Cleanup
	os.rm(test_file)

	println('PASS: FileService read_file_json')
}

fn test_file_service_read_nonexistent_file() {
	println('Testing FileService read nonexistent file...')

	mut file_service := services.FileService{}
	file_service.initialize()

	result := file_service.read_file_json('/nonexistent_file_12345.txt')

	mut response := map[string]interface{}{}
	json.decode(result, mut response) or { return }

	assert response['status'] == 'error'

	println('PASS: FileService read nonexistent file')
}

fn test_file_service_create_directory() {
	println('Testing FileService create_directory...')

	mut file_service := services.FileService{}
	file_service.initialize()

	test_dir := '/tmp/test_create_dir_12345'

	// Clean up if exists
	os.rm(test_dir)

	// Create directory
	result := file_service.create_directory(test_dir)

	// Parse result
	mut response := map[string]interface{}{}
	json.decode(result, mut response) or {
		println('FAIL: Invalid JSON response')
		return
	}

	assert response['status'] == 'success'
	assert os.is_dir(test_dir)

	// Cleanup
	os.rm(test_dir)

	println('PASS: FileService create_directory')
}

fn test_file_service_delete_file() {
	println('Testing FileService delete_file...')

	mut file_service := services.FileService{}
	file_service.initialize()

	test_file := '/tmp/test_delete_file_12345.txt'
	os.write_file(test_file, 'To delete') or {
		println('FAIL: Could not create test file')
		return
	}

	// Delete file
	result := file_service.delete_file_or_directory_json(test_file)

	// Parse result
	mut response := map[string]interface{}{}
	json.decode(result, mut response) or {
		println('FAIL: Invalid JSON response')
		return
	}

	assert response['status'] == 'success'
	assert !os.file_exists(test_file)

	println('PASS: FileService delete_file')
}

fn test_file_service_delete_directory() {
	println('Testing FileService delete_directory...')

	mut file_service := services.FileService{}
	file_service.initialize()

	test_dir := '/tmp/test_delete_dir_12345'
	os.mkdir(test_dir) or {
		println('FAIL: Could not create test directory')
		return
	}

	// Delete directory
	result := file_service.delete_file_or_directory_json(test_dir)

	// Parse result
	mut response := map[string]interface{}{}
	json.decode(result, mut response) or { return }

	assert response['status'] == 'success'
	assert !os.is_dir(test_dir)

	println('PASS: FileService delete_directory')
}

fn test_file_service_security_deny_write() {
	println('Testing FileService security (deny_write)...')

	mut file_service := services.FileService{}
	file_service.initialize()
	file_service.set_deny_write(true)

	// Try to delete (write operation should be disabled)
	result := file_service.delete_file_or_directory_json('/tmp/test')

	// Should indicate write is disabled
	assert result.contains('disabled') | result.contains('error')

	println('PASS: FileService security (deny_write)')
}

fn test_file_service_security_path_traversal() {
	println('Testing FileService security (path traversal)...')

	mut file_service := services.FileService{}
	file_service.initialize()

	// Try to read sensitive files
	result := file_service.read_file_json('../../../etc/passwd')

	mut response := map[string]interface{}{}
	json.decode(result, mut response) or { return }

	assert response['status'] == 'error'
	assert response['error'].string().contains('Invalid path') | 
		   response['error'].string().contains('not allowed') |
		   response['error'].string().contains('access')

	println('PASS: FileService security (path traversal)')
}

// ============================================================================
// Test Runner
// ============================================================================

fn run_file_service_tests() {
	println('')
	println('========================================')
	println('  FileService Test Suite')
	println('========================================')
	println('')

	test_file_service_initialization()
	test_file_service_set_deny_write()
	test_file_service_is_path_safe_valid_paths()
	test_file_service_is_path_safe_invalid_paths()
	test_file_service_browse_directory()
	test_file_service_browse_nonexistent_directory()
	test_file_service_read_file_json()
	test_file_service_read_nonexistent_file()
	test_file_service_create_directory()
	test_file_service_delete_file()
	test_file_service_delete_directory()
	test_file_service_security_deny_write()
	test_file_service_security_path_traversal()

	println('')
	println('FileService Tests: 13/13 complete')
	println('')
}

fn main() {
	run_file_service_tests()
}
