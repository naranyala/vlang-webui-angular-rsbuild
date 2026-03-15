module services

import json
import models
import config

// ============================================================================
// User Service - Wrapper for DatabaseService with JSON serialization
// Uses centralized configuration
// ============================================================================

@[heap]
pub struct UserService {
mut:
	db            DatabaseService
	initialized   bool
}

// Initialize initializes the user service with configuration
pub fn (mut user_service UserService) initialize(cfg config.AppConfig) ! {
	if user_service.initialized {
		return
	}

	user_service.db.initialize(cfg) or {
		return error('Failed to initialize database: ${err}')
	}

	user_service.initialized = true
}

// Shutdown shuts down the user service
pub fn (mut user_service UserService) shutdown() {
	user_service.db.shutdown()
	user_service.initialized = false
}

// ============================================================================
// Public API Methods (called from handlers)
// ============================================================================

// get_users_json returns all users as JSON
pub fn (mut user_service UserService) get_users_json() string {
	users := user_service.db.get_all_users()
	return json.encode(users)
}

// get_user_json returns a user by ID as JSON
pub fn (mut user_service UserService) get_user_json(id int) string {
	user := user_service.db.get_user_by_id(id) or {
		return '{"error": "User not found", "status": "error"}'
	}
	return json.encode(user)
}

// create_user_json creates a user from JSON data
pub fn (mut user_service UserService) create_user_json(data string) string {
	mut user := json.decode(models.User, data) or {
		return '{"error": "Invalid user data", "status": "error"}'
	}

	// Validate required fields
	if user.name.trim_space() == "" {
		return '{"error": "Name is required", "status": "error"}'
	}
	if user.email.trim_space() == "" {
		return '{"error": "Email is required", "status": "error"}'
	}

	// Set defaults
	if user.role.trim_space() == "" {
		user.role = 'user'
	}
	if user.status.trim_space() == "" {
		user.status = 'active'
	}

	created_user := user_service.db.create_user(user) or {
		return '{"error": "${err}", "status": "error"}'
	}

	return json.encode(created_user)
}

// update_user_json updates a user from JSON data
pub fn (mut user_service UserService) update_user_json(id int, data string) string {
	// Check if user exists
	user_service.db.get_user_by_id(id) or {
		return '{"error": "User not found", "status": "error"}'
	}

	mut user := json.decode(models.User, data) or {
		return '{"error": "Invalid user data", "status": "error"}'
	}

	// Validate required fields
	if user.name.trim_space() == "" {
		return '{"error": "Name is required", "status": "error"}'
	}
	if user.email.trim_space() == "" {
		return '{"error": "Email is required", "status": "error"}'
	}

	// Set defaults if empty
	if user.role.trim_space() == "" {
		user.role = 'user'
	}
	if user.status.trim_space() == "" {
		user.status = 'active'
	}

	updated_user := user_service.db.update_user(id, user) or {
		return '{"error": "${err}", "status": "error"}'
	}

	return json.encode(updated_user)
}

// save_user_json creates or updates a user from JSON data
pub fn (mut user_service UserService) save_user_json(data string) string {
	mut user := json.decode(models.User, data) or {
		return '{"error": "Invalid user data", "status": "error"}'
	}

	// Validate required fields
	if user.name.trim_space() == "" {
		return '{"error": "Name is required", "status": "error"}'
	}
	if user.email.trim_space() == "" {
		return '{"error": "Email is required", "status": "error"}'
	}

	// Set defaults
	if user.role.trim_space() == "" {
		user.role = 'user'
	}
	if user.status.trim_space() == "" {
		user.status = 'active'
	}

	mut result_user := models.User{}

	if user.id != 0 {
		// Update existing user
		result_user = user_service.db.update_user(user.id, user) or {
			return '{"error": "${err}", "status": "error"}'
		}
	} else {
		// Create new user
		result_user = user_service.db.create_user(user) or {
			return '{"error": "${err}", "status": "error"}'
		}
	}

	return json.encode(result_user)
}

// delete_user_json deletes a user by ID
pub fn (mut user_service UserService) delete_user_json(id int) string {
	user_service.db.delete_user(id) or {
		return '{"error": "${err}", "status": "error"}'
	}
	return '{"message": "User deleted successfully", "status": "success"}'
}

// search_users_json searches users by query
pub fn (mut user_service UserService) search_users_json(query string) string {
	users := user_service.db.search_users(query)
	return json.encode(users)
}

// get_users_by_status_json returns users by status
pub fn (mut user_service UserService) get_users_by_status_json(status string) string {
	users := user_service.db.get_users_by_status(status)
	return json.encode(users)
}

// get_stats_json returns user statistics
pub fn (mut user_service UserService) get_stats_json() string {
	stats := user_service.db.get_stats()
	return json.encode(stats)
}
