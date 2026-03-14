module main

import time as _
import os


// FileService provides file operations
pub struct FileService {
mut:
	status      ServiceStatus
	initialized bool
	name_value  string
	config      FileServiceConfig
}

pub struct FileServiceConfig {
mut:
	deny_write bool
}

pub fn default_file_service_config() FileServiceConfig {
	return FileServiceConfig{deny_write: true}
}

pub fn (mut s FileService) initialize() bool {
	s.name_value = 'FileService'
	s.status = .ready
	s.initialized = true
	s.config = default_file_service_config()
	return true
}

pub fn (mut s FileService) shutdown() { s.status = .stopped }
pub fn (s FileService) name() string { return s.name_value }
pub fn (mut s FileService) set_deny_write(deny bool) { s.config.deny_write = deny }

pub fn (mut s FileService) read_file(path string) string {
	return os.read_file(path) or { '' }
}

pub fn (mut s FileService) read_file_json(path string) string {
	content := s.read_file(path)
	escaped := content.replace('\n', '\\n').replace('"', '\\"')
	return '{"success":true,"path":"${path}","content":"${escaped}"}'
}

pub fn (mut s FileService) browse_directory(path string) string {
	mut current_path := path
	if current_path.len == 0 { current_path = '/' }
	if !os.is_dir(current_path) { return '{"error":"Not a directory"}' }
	mut files := []string{}
	entries := os.ls(current_path) or { return '[]' }
	for entry in entries {
		full_path := os.join_path(current_path, entry)
		is_dir := os.is_dir(full_path)
		files << '{"name":"${entry}","is_dir":${if is_dir { 'true' } else { 'false' }}}'
	}
	return '{"path":"${current_path}","files":[${files.join(',')}],"status":"ok"}'
}

pub fn (mut s FileService) list_directory(path string) string {
	return s.browse_directory(path)
}

pub fn (mut s FileService) create_directory_json(path string) string {
	os.mkdir(path) or { return '{"error":"Failed"}' }
	return '{"success":true}'
}

pub fn (mut s FileService) delete_file_or_directory_json(path string) string {
	if os.is_dir(path) {
		os.rmdir(path) or { return '{"error":"Failed"}' }
	} else {
		os.rm(path) or { return '{"error":"Failed"}' }
	}
	return '{"success":true}'
}
