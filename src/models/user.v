module models

import time

// ============================================================================
// User Model
// ============================================================================

pub struct User {
pub mut:
	id            int
	name          string
	email         string
	role          string
	status        string
	password_hash string
	created_at    string
	updated_at    string
}

// Create a new User with defaults
pub fn new_user(name string, email string) User {
	now := time.now().custom_format('YYYY-MM-DD HH:mm:ss')
	return User{
		id: 0
		name: name
		email: email
		role: 'user'
		status: 'active'
		password_hash: ''
		created_at: now
		updated_at: now
	}
}

// Validate user data
pub fn (u User) is_valid() bool {
	return u.name.trim_space().len > 0 && u.email.trim_space().len > 0
}

// Check if user is active
pub fn (u User) is_active() bool {
	return u.status == 'active'
}
