module services

import time
import os
import json
import models


// ============================================================================
// Database Service (File-based JSON storage for persistence)
// ============================================================================

@[heap]
pub struct DatabaseService {
mut:
	db_path       string
	initialized   bool
	users         []models.User
}

// Initialize initializes the database connection
pub fn (mut db_service DatabaseService) initialize() ! {
	if db_service.initialized {
		return
	}

	db_service.db_path = 'users.db.json'
	println('Initializing database: ${db_service.db_path}')

	// Load users from file
	db_service.load_users()

	// Insert demo data if empty
	if db_service.users.len == 0 {
		db_service.insert_demo_data()
	}

	db_service.initialized = true
	println('Database initialized successfully with ${db_service.users.len} users')
}

// load_users loads users from JSON file
fn (mut db_service DatabaseService) load_users() {
	data := os.read_file(db_service.db_path) or {
		return
	}

	if data.len == 0 {
		return
	}

	db_service.users = json.decode([]models.User, data) or {
		println('Failed to parse users JSON')
		return
	}
}

// save_users saves users to JSON file
fn (mut db_service DatabaseService) save_users() ! {
	json_data := json.encode(db_service.users)
	os.write_file(db_service.db_path, json_data) or {
		return error('Failed to write database: ${err}')
	}
}

// insert_demo_data inserts demo users
fn (mut db_service DatabaseService) insert_demo_data() {
	now := time.now().custom_format('YYYY-MM-DD HH:mm:ss')
	
	db_service.users = [
		models.User{
			id: 1
			name: 'John Doe'
			email: 'john@example.com'
			role: 'admin'
			status: 'active'
			password_hash: 'demo123'
			created_at: now
			updated_at: now
		},
		models.User{
			id: 2
			name: 'Jane Smith'
			email: 'jane@example.com'
			role: 'user'
			status: 'active'
			password_hash: 'demo123'
			created_at: now
			updated_at: now
		},
		models.User{
			id: 3
			name: 'Bob Wilson'
			email: 'bob@example.com'
			role: 'moderator'
			status: 'inactive'
			password_hash: 'demo123'
			created_at: now
			updated_at: now
		},
		models.User{
			id: 4
			name: 'Alice Brown'
			email: 'alice@example.com'
			role: 'user'
			status: 'active'
			password_hash: 'demo123'
			created_at: now
			updated_at: now
		},
		models.User{
			id: 5
			name: 'Charlie Davis'
			email: 'charlie@example.com'
			role: 'user'
			status: 'active'
			password_hash: 'demo123'
			created_at: now
			updated_at: now
		},
	]

	db_service.save_users() or {
		println('Failed to save demo data: ${err}')
		return
	}
	println('Demo data inserted successfully')
}

// Shutdown shuts down the database service
pub fn (mut db_service DatabaseService) shutdown() {
	// Save any pending changes
	if db_service.users.len > 0 {
		db_service.save_users() or {
			println('Failed to save on shutdown: ${err}')
		}
	}
	db_service.initialized = false
}

// ============================================================================
// CRUD Operations
// ============================================================================

// get_all_users returns all users
pub fn (mut db_service DatabaseService) get_all_users() []models.User {
	mut result := []models.User{}
	for u in db_service.users {
		result << u
	}
	return result
}

// get_user_by_id returns a user by ID
pub fn (mut db_service DatabaseService) get_user_by_id(id int) ?models.User {
	for user in db_service.users {
		if user.id == id {
			return user
		}
	}
	return none
}

// get_user_by_email returns a user by email
pub fn (mut db_service DatabaseService) get_user_by_email(email string) ?models.User {
	for user in db_service.users {
		if user.email == email {
			return user
		}
	}
	return none
}

// create_user creates a new user
pub fn (mut db_service DatabaseService) create_user(user models.User) !models.User {
	// Check if email already exists
	for u in db_service.users {
		if u.email == user.email {
			return error('Email already exists: ${user.email}')
		}
	}

	// Generate new ID
	mut max_id := 0
	for u in db_service.users {
		if u.id > max_id {
			max_id = u.id
		}
	}
	
	mut new_user := user
	new_user.id = max_id + 1

	// Set timestamps
	if new_user.created_at == '' {
		new_user.created_at = time.now().custom_format('YYYY-MM-DD HH:mm:ss')
	}
	if new_user.updated_at == '' {
		new_user.updated_at = new_user.created_at
	}

	db_service.users << new_user
	db_service.save_users() or {
		return error('Failed to save user: ${err}')
	}

	return new_user
}

// update_user updates an existing user
pub fn (mut db_service DatabaseService) update_user(id int, user models.User) !models.User {
	mut found_index := -1
	for i, u in db_service.users {
		if u.id == id {
			found_index = i
			break
		}
	}

	if found_index == -1 {
		return error('User not found with ID: ${id}')
	}

	// Check if email is being changed to an existing one
	for u in db_service.users {
		if u.email == user.email && u.id != id {
			return error('Email already exists: ${user.email}')
		}
	}

	mut updated_user := user
	// Preserve original created_at
	updated_user.created_at = db_service.users[found_index].created_at
	updated_user.updated_at = time.now().custom_format('YYYY-MM-DD HH:mm:ss')

	// If password is empty, keep the old one
	if updated_user.password_hash == '' {
		updated_user.password_hash = db_service.users[found_index].password_hash
	}

	db_service.users[found_index] = updated_user
	db_service.save_users() or {
		return error('Failed to update user: ${err}')
	}

	return updated_user
}

// delete_user deletes a user by ID
pub fn (mut db_service DatabaseService) delete_user(id int) ! {
	mut found := false
	mut new_users := []models.User{}
	for u in db_service.users {
		if u.id == id {
			found = true
		} else {
			new_users << u
		}
	}

	if !found {
		return error('User not found with ID: ${id}')
	}

	db_service.users = new_users
	db_service.save_users() or {
		return error('Failed to delete user: ${err}')
	}
}

// search_users searches users by name or email
pub fn (mut db_service DatabaseService) search_users(query string) []models.User {
	mut results := []models.User{}
	query_lower := query.to_lower()
	for user in db_service.users {
		if user.name.to_lower().contains(query_lower) || user.email.to_lower().contains(query_lower) {
			results << user
		}
	}
	return results
}

// get_users_by_status returns users filtered by status
pub fn (mut db_service DatabaseService) get_users_by_status(status string) []models.User {
	mut results := []models.User{}
	for user in db_service.users {
		if user.status == status {
			results << user
		}
	}
	return results
}

// get_stats returns user statistics
pub fn (mut db_service DatabaseService) get_stats() map[string]int {
	mut stats := map[string]int{}
	stats['total'] = db_service.users.len
	
	mut active := 0
	mut inactive := 0
	for user in db_service.users {
		if user.status == 'active' {
			active++
		} else if user.status == 'inactive' {
			inactive++
		}
	}
	stats['active'] = active
	stats['inactive'] = inactive
	
	return stats
}
