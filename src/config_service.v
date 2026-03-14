module main

import time as _


// ConfigService provides configuration management
pub struct ConfigService {
mut:
	status      ServiceStatus
	initialized bool
	name_value  string
	values      map[string]string
}

pub fn (mut s ConfigService) initialize() bool {
	s.name_value = 'ConfigService'
	s.status = .ready
	s.initialized = true
	s.values = map[string]string{}
	return true
}

pub fn (mut s ConfigService) shutdown() { s.status = .stopped }
pub fn (s ConfigService) name() string { return s.name_value }

pub fn (mut s ConfigService) set_default_string(key string, value string) {
	if s.values[key] == '' {
		s.values[key] = value
	}
}

pub fn (mut s ConfigService) set_default_int(key string, value int) {
	if s.values[key] == '' {
		s.values[key] = value.str()
	}
}

pub fn (mut s ConfigService) set_default_bool(key string, value bool) {
	if s.values[key] == '' {
		s.values[key] = if value { 'true' } else { 'false' }
	}
}

pub fn (mut s ConfigService) get_string(key string) string {
	return s.values[key] or { '' }
}

pub fn (mut s ConfigService) get_int(key string) int {
	value := s.values[key] or { return 0 }
	return value.int()
}

pub fn (mut s ConfigService) get_bool(key string) bool {
	value := s.values[key] or { return false }
	return value.to_lower() == 'true' || value == '1'
}

pub fn (mut s ConfigService) get_app_config() AppConfig {
	return AppConfig{
		app_name: s.get_string('app.name')
		app_version: s.get_string('app.version')
		debug_mode: s.get_bool('app.debug_mode')
	}
}

pub struct AppConfig {
	app_name      string
	app_version   string
	debug_mode    bool
}
