module services_test

import services
import models
import os
import json
import time

// ============================================================================
// DatabaseService Tests
// ============================================================================

fn test_database_initialization() {
	println('Testing DatabaseService initialization...')

	mut db := services.DatabaseService{}

	// Initialize database
	db.initialize() or {
		println('FAIL: Failed to initialize database: ${err}')
		return
	}

	// Check initialization
	assert db.initialized == true
	assert db.db_path.len > 0

	// Cleanup
	os.rm(db.db_path)

	println('PASS: DatabaseService initialization')
}

fn test_database_demo_data() {
	println('Testing DatabaseService demo data...')

	mut db := services.DatabaseService{}
	db.initialize() or {
		println('FAIL: Failed to initialize: ${err}')
		return
	}

	// Check demo data loaded
	users := db.get_all_users()
	assert users.len == 5, 'Expected 5 demo users, got ${users.len}'

	// Check first user
	assert users[0].name == 'John Doe'
	assert users[0].email == 'john@example.com'
	assert users[0].role == 'admin'

	// Cleanup
	os.rm(db.db_path)

	println('PASS: DatabaseService demo data')
}

fn test_database_create_user() {
	println('Testing DatabaseService create_user...')

	mut db := services.DatabaseService{}
	db.initialize() or {
		println('FAIL: Failed to initialize: ${err}')
		return
	}

	// Clear demo data
	db.users = []

	// Create new user
	mut user := models.new_user('Test User', 'test@example.com')
	user.role = 'user'
	user.status = 'active'

	created := db.create_user(user) or {
		println('FAIL: Failed to create user: ${err}')
		return
	}

	// Verify created user
	assert created.id > 0, 'User ID should be set'
	assert created.name == 'Test User'
	assert created.email == 'test@example.com'

	// Verify in database
	users := db.get_all_users()
	assert users.len == 1

	// Cleanup
	os.rm(db.db_path)

	println('PASS: DatabaseService create_user')
}

fn test_database_create_user_duplicate_email() {
	println('Testing DatabaseService create_user duplicate email...')

	mut db := services.DatabaseService{}
	db.initialize() or {
		println('FAIL: Failed to initialize: ${err}')
		return
	}

	db.users = []

	// Create first user
	user1 := models.new_user('User 1', 'duplicate@example.com')
	db.create_user(user1) or {
		println('FAIL: Failed to create first user')
		return
	}

	// Try to create duplicate
	user2 := models.new_user('User 2', 'duplicate@example.com')
	result := db.create_user(user2)

	// Should fail
	assert result.is_err(), 'Should fail with duplicate email'

	// Cleanup
	os.rm(db.db_path)

	println('PASS: DatabaseService create_user duplicate email')
}

fn test_database_get_user_by_id() {
	println('Testing DatabaseService get_user_by_id...')

	mut db := services.DatabaseService{}
	db.initialize() or {
		println('FAIL: Failed to initialize: ${err}')
		return
	}

	db.users = []

	// Create user
	user := models.new_user('Get Test', 'get@example.com')
	created := db.create_user(user) or {
		println('FAIL: Failed to create: ${err}')
		return
	}

	// Get by ID
	found := db.get_user_by_id(created.id) or {
		println('FAIL: User not found')
		return
	}

	assert found.id == created.id
	assert found.name == 'Get Test'

	// Get non-existent
	not_found := db.get_user_by_id(9999)
	assert not_found.is_none()

	// Cleanup
	os.rm(db.db_path)

	println('PASS: DatabaseService get_user_by_id')
}

fn test_database_update_user() {
	println('Testing DatabaseService update_user...')

	mut db := services.DatabaseService{}
	db.initialize() or {
		println('FAIL: Failed to initialize: ${err}')
		return
	}

	db.users = []

	// Create user
	user := models.new_user('Update Test', 'update@example.com')
	created := db.create_user(user) or {
		println('FAIL: Failed to create: ${err}')
		return
	}

	// Update user
	mut updated_user := created
	updated_user.name = 'Updated Name'
	updated_user.role = 'admin'

	result := db.update_user(created.id, updated_user) or {
		println('FAIL: Failed to update: ${err}')
		return
	}

	assert result.name == 'Updated Name'
	assert result.role == 'admin'

	// Verify preserved created_at
	assert result.created_at == created.created_at

	// Cleanup
	os.rm(db.db_path)

	println('PASS: DatabaseService update_user')
}

fn test_database_delete_user() {
	println('Testing DatabaseService delete_user...')

	mut db := services.DatabaseService{}
	db.initialize() or {
		println('FAIL: Failed to initialize: ${err}')
		return
	}

	db.users = []

	// Create user
	user := models.new_user('Delete Test', 'delete@example.com')
	created := db.create_user(user) or {
		println('FAIL: Failed to create: ${err}')
		return
	}

	// Delete user
	db.delete_user(created.id) or {
		println('FAIL: Failed to delete: ${err}')
		return
	}

	// Verify deleted
	users := db.get_all_users()
	assert users.len == 0

	// Try to delete non-existent
	result := db.delete_user(9999)
	assert result.is_err()

	// Cleanup
	os.rm(db.db_path)

	println('PASS: DatabaseService delete_user')
}

fn test_database_search_users() {
	println('Testing DatabaseService search_users...')

	mut db := services.DatabaseService{}
	db.initialize() or {
		println('FAIL: Failed to initialize: ${err}')
		return
	}

	db.users = []

	// Create test users
	db.create_user(models.new_user('John Doe', 'john@example.com')) or { return }
	db.create_user(models.new_user('Jane Smith', 'jane@example.com')) or { return }
	db.create_user(models.new_user('Bob Johnson', 'bob@example.com')) or { return }

	// Search by name
	results := db.search_users('john')
	assert results.len == 2, 'Expected 2 results for "john", got ${results.len}'

	// Search by email
	results = db.search_users('jane')
	assert results.len == 1

	// Search with no results
	results = db.search_users('nonexistent')
	assert results.len == 0

	// Cleanup
	os.rm(db.db_path)

	println('PASS: DatabaseService search_users')
}

fn test_database_get_users_by_status() {
	println('Testing DatabaseService get_users_by_status...')

	mut db := services.DatabaseService{}
	db.initialize() or {
		println('FAIL: Failed to initialize: ${err}')
		return
	}

	db.users = []

	// Create users with different statuses
	mut user1 := models.new_user('Active User', 'active@example.com')
	user1.status = 'active'
	db.create_user(user1) or { return }

	mut user2 := models.new_user('Inactive User', 'inactive@example.com')
	user2.status = 'inactive'
	db.create_user(user2) or { return }

	// Get active users
	active := db.get_users_by_status('active')
	assert active.len == 1
	assert active[0].name == 'Active User'

	// Get inactive users
	inactive := db.get_users_by_status('inactive')
	assert inactive.len == 1

	// Cleanup
	os.rm(db.db_path)

	println('PASS: DatabaseService get_users_by_status')
}

fn test_database_get_stats() {
	println('Testing DatabaseService get_stats...')

	mut db := services.DatabaseService{}
	db.initialize() or {
		println('FAIL: Failed to initialize: ${err}')
		return
	}

	db.users = []

	// Create users
	for i in 0..10 {
		mut user := models.new_user('User ${i}', 'user${i}@example.com')
		user.status = if i < 7 { 'active' } else { 'inactive' }
		db.create_user(user) or { return }
	}

	// Get stats
	stats := db.get_stats()

	assert stats['total'] == 10
	assert stats['active'] == 7
	assert stats['inactive'] == 3

	// Cleanup
	os.rm(db.db_path)

	println('PASS: DatabaseService get_stats')
}

fn test_database_persistence() {
	println('Testing DatabaseService persistence...')

	mut db1 := services.DatabaseService{}
	db1.initialize() or { return }

	db1.users = []

	// Create user
	db1.create_user(models.new_user('Persist Test', 'persist@example.com')) or { return }

	// Get file path
	file_path := db1.db_path

	// Verify file exists
	assert os.file_exists(file_path), 'Database file should exist'

	// Create new instance and load
	mut db2 := services.DatabaseService{}
	db2.db_path = file_path
	db2.load_users()

	// Verify data persisted
	users := db2.get_all_users()
	assert users.len == 1
	assert users[0].name == 'Persist Test'

	// Cleanup
	os.rm(file_path)

	println('PASS: DatabaseService persistence')
}

fn test_user_model_helpers() {
	println('Testing User model helpers...')

	// Test new_user
	user := models.new_user('Test', 'test@example.com')
	assert user.name == 'Test'
	assert user.email == 'test@example.com'
	assert user.role == 'user'
	assert user.status == 'active'
	assert user.id == 0

	// Test is_valid
	assert user.is_valid() == true

	mut invalid_user := models.User{}
	assert invalid_user.is_valid() == false

	// Test is_active
	assert user.is_active() == true

	user.status = 'inactive'
	assert user.is_active() == false

	println('PASS: User model helpers')
}

// ============================================================================
// Test Runner
// ============================================================================

fn run_all_tests() {
	println('')
	println('========================================')
	println('  DatabaseService Test Suite')
	println('========================================')
	println('')

	test_user_model_helpers()
	test_database_initialization()
	test_database_demo_data()
	test_database_create_user()
	test_database_create_user_duplicate_email()
	test_database_get_user_by_id()
	test_database_update_user()
	test_database_delete_user()
	test_database_search_users()
	test_database_get_users_by_status()
	test_database_get_stats()
	test_database_persistence()

	println('')
	println('========================================')
	println('  All tests completed!')
	println('========================================')
	println('')
}

fn main() {
	run_all_tests()
}
