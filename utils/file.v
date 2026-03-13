// File Operations Utility - Simplified for V 0.5.1

module utils

import os

// FileInfo holds information about a file or directory
pub struct FileInfo {
	name        string
	path        string
	is_dir      bool
	is_file     bool
	size        i64
	size_human  string
	extension   string
}

// DirectoryListing holds directory contents
pub struct DirectoryListing {
	path        string
	files       []FileInfo
	total_files int
	total_dirs  int
	total_size  i64
	error       string
}

// Browse a directory and list its contents
pub fn browse_directory(path string) DirectoryListing {
	mut files := []FileInfo{cap: 64}
	mut total_files := 0
	mut total_dirs := 0
	mut total_size := i64(0)

	// Check if path exists
	if !os.is_dir(path) && !os.is_file(path) {
		return DirectoryListing{
			path: path
			files: files
			error: 'Path does not exist: ${path}'
		}
	}

	// If it's a file, return just that file
	if os.is_file(path) {
		if info := get_file_info(path) {
			files << info
			total_files = 1
		}
		return DirectoryListing{
			path: path
			files: files
			total_files: total_files
		}
	}

	// List directory contents
	entries := os.ls(path) or {
		return DirectoryListing{
			path: path
			files: files
			error: 'Failed to list directory'
		}
	}

	for entry in entries {
		full_path := os.join_path(path, entry)
		if info := get_file_info(full_path) {
			files << info
			if info.is_dir {
				total_dirs++
			} else {
				total_files++
				total_size += info.size
			}
		}
	}

	return DirectoryListing{
		path: path
		files: files
		total_files: total_files
		total_dirs: total_dirs
		total_size: total_size
	}
}

// Get detailed file information
pub fn get_file_info(path string) ?FileInfo {
	// Check if exists
	if !os.exists(path) {
		return error('File does not exist')
	}

	is_dir := os.is_dir(path)
	is_file := os.is_file(path)

	// Get file size
	size := os.file_size(path)

	// Get extension
	extension := os.ext(path)

	return FileInfo{
		name: os.base(path)
		path: path
		is_dir: is_dir
		is_file: is_file
		size: size
		size_human: format_size(size)
		extension: if extension.starts_with('.') { extension[1..] } else { extension }
	}
}

// Read file content
pub fn read_file(path string) !FileContent {
	if !os.is_file(path) {
		return error('Not a file')
	}

	content := os.read_file(path) or {
		return error('Failed to read file')
	}

	size := os.file_size(path)
	lines := content.split_into_lines().len

	return FileContent{
		path: path
		content: content
		size: size
		lines: lines
		encoding: 'utf-8'
	}
}

// FileContent holds file content with metadata
pub struct FileContent {
	path     string
	content  string
	size     i64
	lines    int
	encoding string
}

// Write content to file
pub fn write_file(path string, content string) ! {
	// Create parent directories if they don't exist
	dir := os.dir(path)
	if !os.is_dir(dir) {
		os.mkdir_all(dir) or {
			return error('Failed to create directory')
		}
	}

	os.write_file(path, content) or {
		return error('Failed to write file')
	}
}

// Delete a file or directory
pub fn delete_path(path string, recursive bool) ! {
	if !os.exists(path) {
		return error('Path does not exist')
	}

	if os.is_file(path) {
		os.rm(path) or {
			return error('Failed to delete file')
		}
	} else if os.is_dir(path) {
		if recursive {
			os.rmdir_all(path) or {
				return error('Failed to delete directory')
			}
		} else {
			os.rmdir(path) or {
				return error('Directory not empty')
			}
		}
	}
}

// Check if path exists
pub fn path_exists(path string) bool {
	return os.exists(path)
}

// Get the parent directory of a path
pub fn get_parent_dir(path string) string {
	return os.dir(path)
}

// Format size in human readable format
fn format_size(bytes i64) string {
	if bytes < 0 {
		return '0 B'
	}
	if bytes < 1024 {
		return '${bytes} B'
	}
	if bytes < 1024 * 1024 {
		return '${bytes / 1024} KB'
	}
	if bytes < 1024 * 1024 * 1024 {
		return '${bytes / 1024 / 1024} MB'
	}
	return '${bytes / 1024 / 1024 / 1024} GB'
}
