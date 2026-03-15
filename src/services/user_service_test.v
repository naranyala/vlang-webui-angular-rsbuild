module services_test

import services
import models
import os
import json

// ============================================================================
// UserService Tests
// ============================================================================

fn test_user_service_initialization() {
	println('Testing UserService initialization...')

	mut user_service := services.UserService{}

	// Initialize
	user_service.initialize() or {
		println('FAIL: Failed to initialize: ${err}')
		return
	}

	assert user_service.initialized == true

	// Cleanup
	os.rm(user_service.db.db_path)

	println('PASS: UserService initialization')
}

fn test_user_service_get_users_json() {
	println('Testing UserService get_users_json...')

	mut user_service := services.UserService{}
	user_service.initialize() or { return }

	// Get JSON
	json_str := user_service.get_users_json()

	// Should be valid JSON array
	mut users := []models.User{}
	json.decode(json_str, mut users) or {
		println('FAIL: Invalid JSON: ${err}')
		return
	}

	assert users.len == 5, 'Expected 5 demo users'

	// Cleanup
	os.rm(user_service.db.db_path)

	println('PASS: UserService get_users_json')
}

fn test_user_service_save_user_json_create() {
	println('Testing UserService save_user_json (create)...')

	mut user_service := services.UserService{}
	user_service.initialize() or { return }

	user_service.db.users = []

	// Create user JSON
	user_json := '{"name":"New User","email":"new@example.com","role":"user","status":"active"}'

	result := user_service.save_user_json(user_json)

	// Parse result
	mut created := models.User{}
	json.decode(result, mut created) or {
		println('FAIL: Invalid result JSON: ${err}')
		return
	}

	assert created.id > 0
	assert created.name == 'New User'
	assert created.email == 'new@example.com'

	// Cleanup
	os.rm(user_service.db.db_path)

	println('PASS: UserService save_user_json (create)')
}

fn test_user_service_save_user_json_update() {
	println('Testing UserService save_user_json (update)...')

	mut user_service := services.UserService{}
	user_service.initialize() or { return }

	user_service.db.users = []

	// Create user first
	create_json := '{"name":"Original","email":"original@example.com"}'
	user_service.save_user_json(create_json)

	// Update user
	update_json := '{"id":1,"name":"Updated","email":"updated@example.com"}'
	result := user_service.save_user_json(update_json)

	// Parse result
	mut updated := models.User{}
	json.decode(result, mut updated) or { return }

	assert updated.name == 'Updated'
	assert updated.id == 1

	// Cleanup
	os.rm(user_service.db.db_path)

	println('PASS: UserService save_user_json (update)')
}

fn test_user_service_save_user_json_validation() {
	println('Testing UserService save_user_json validation...')

	mut user_service := services.UserService{}
	user_service.initialize() or { return }

	// Missing name
	result := user_service.save_user_json('{"email":"test@example.com"}')
	assert result.contains('Name is required')

	// Missing email
	result = user_service.save_user_json('{"name":"Test"}')
	assert result.contains('Email is required')

	// Cleanup
	os.rm(user_service.db.db_path)

	println('PASS: UserService save_user_json validation')
}

fn test_user_service_delete_user_json() {
	println('Testing UserService delete_user_json...')

	mut user_service := services.UserService{}
	user_service.initialize() or { return }

	user_service.db.users = []

	// Create user
	user_service.save_user_json('{"name":"Delete Me","email":"delete@example.com"}')

	// Delete
	result := user_service.delete_user_json(1)
	assert result.contains('success')

	// Verify deleted
	users := user_service.db.get_all_users()
	assert users.len == 0

	// Try to delete non-existent
	result = user_service.delete_user_json(9999)
	assert result.contains('error')

	// Cleanup
	os.rm(user_service.db.db_path)

	println('PASS: UserService delete_user_json')
}

fn test_user_service_search_users_json() {
	println('Testing UserService search_users_json...')

	mut user_service := services.UserService{}
	user_service.initialize() or { return }

	user_service.db.users = []

	// Create test users
	user_service.save_user_json('{"name":"John Doe","email":"john@example.com"}')
	user_service.save_user_json('{"name":"Jane Smith","email":"jane@example.com"}')

	// Search
	result := user_service.search_users_json('john')

	// Parse result
	mut users := []models.User{}
	json.decode(result, mut users) or { return }

	assert users.len == 1
	assert users[0].name == 'John Doe'

	// Cleanup
	os.rm(user_service.db.db_path)

	println('PASS: UserService search_users_json')
}

fn test_user_service_get_stats_json() {
	println('Testing UserService get_stats_json...')

	mut user_service := services.UserService{}
	user_service.initialize() or { return }

	result := user_service.get_stats_json()

	// Parse result
	mut stats := map[string]int{}
	json.decode(result, mut stats) or { return }

	assert stats['total'] == 5  // Demo data
	assert 'active' in stats
	assert 'inactive' in stats

	// Cleanup
	os.rm(user_service.db.db_path)

	println('PASS: UserService get_stats_json')
}

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

fn test_file_service_browse_directory() {
	println('Testing FileService browse_directory...')

	mut file_service := services.FileService{}
	file_service.initialize()

	// Browse root directory
	result := file_service.browse_directory('/')

	// Parse result
	mut response := map[string]interface{}{}
	json.decode(result, mut response) or {
		println('FAIL: Invalid JSON: ${err}')
		return
	}

	assert 'path' in response
	assert 'files' in response

	println('PASS: FileService browse_directory')
}

fn test_file_service_read_file_json() {
	println('Testing FileService read_file_json...')

	mut file_service := services.FileService{}
	file_service.initialize()

	// Create test file
	test_file := '/tmp/test_read.txt'
	os.write_file(test_file, 'Test content') or { return }

	// Read file
	result := file_service.read_file_json(test_file)

	// Parse result
	mut response := map[string]interface{}{}
	json.decode(result, mut response) or { return }

	assert response['status'] == 'success'
	assert response['content'] == 'Test content'

	// Cleanup
	os.rm(test_file)

	println('PASS: FileService read_file_json')
}

fn test_file_service_read_nonexistent_file() {
	println('Testing FileService read nonexistent file...')

	mut file_service := services.FileService{}
	file_service.initialize()

	result := file_service.read_file_json('/nonexistent/file.txt')

	// Parse result
	mut response := map[string]interface{}{}
	json.decode(result, mut response) or { return }

	assert response['status'] == 'error'

	println('PASS: FileService read nonexistent file')
}

fn test_file_service_create_directory() {
	println('Testing FileService create_directory...')

	mut file_service := services.FileService{}
	file_service.initialize()

	test_dir := '/tmp/test_create_dir'

	// Clean up if exists
	os.rm(test_dir)

	// Create directory
	result := file_service.create_directory(test_dir)

	// Parse result
	mut response := map[string]interface{}{}
	json.decode(result, mut response) or { return }

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

	test_file := '/tmp/test_delete.txt'
	os.write_file(test_file, 'To delete') or { return }

	// Delete file
	result := file_service.delete_file_or_directory_json(test_file)

	// Parse result
	mut response := map[string]interface{}{}
	json.decode(result, mut response) or { return }

	assert response['status'] == 'success'
	assert !os.file_exists(test_file)

	println('PASS: FileService delete_file')
}

fn test_file_service_security_deny_write() {
	println('Testing FileService security (deny_write)...')

	mut file_service := services.FileService{}
	file_service.initialize()
	file_service.set_deny_write(true)

	// Try to write (should be disabled)
	result := file_service.delete_file_or_directory_json('/tmp/test')

	// Should indicate write is disabled
	assert result.contains('disabled') | result.contains('error')

	println('PASS: FileService security (deny_write)')
}

// ============================================================================
// Test Runner
// ============================================================================

fn run_user_service_tests() {
	println('')
	println('========================================')
	println('  UserService Test Suite')
	println('========================================')
	println('')

	test_user_service_initialization()
	test_user_service_get_users_json()
	test_user_service_save_user_json_create()
	test_user_service_save_user_json_update()
	test_user_service_save_user_json_validation()
	test_user_service_delete_user_json()
	test_user_service_search_users_json()
	test_user_service_get_stats_json()

	println('')
}

fn run_file_service_tests() {
	println('')
	println('========================================')
	println('  FileService Test Suite')
	println('========================================')
	println('')

	test_file_service_initialization()
	test_file_service_set_deny_write()
	test_file_service_browse_directory()
	test_file_service_read_file_json()
	test_file_service_read_nonexistent_file()
	test_file_service_create_directory()
	test_file_service_delete_file()
	test_file_service_security_deny_write()

	println('')
}

fn main() {
	run_user_service_tests()
	run_file_service_tests()

	println('========================================')
	println('  All service tests completed!')
	println('========================================')
}
