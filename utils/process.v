// Process Management Utility - Simplified for V 0.5.1

module utils

import os

// ProcessInfo holds information about a running process
pub struct ProcessInfo {
	pid       int
	ppid      int
	name      string
	status    string
	memory_mb int
	threads   int
}

// ProcessStats holds system-wide process statistics
pub struct ProcessStats {
	total_processes int
	running         int
	sleeping        int
}

// List all running processes
pub fn list_processes() []ProcessInfo {
	mut processes := []ProcessInfo{cap: 128}

	// Read /proc directory for process information
	proc_entries := os.ls('/proc') or { return processes }

	for entry in proc_entries {
		// Check if entry is a number (PID)
		pid := entry.int() or { continue }

		if proc := get_process_info(pid) {
			processes << proc
		}
	}

	return processes
}

// Get detailed information about a specific process
pub fn get_process_info(pid int) ?ProcessInfo {
	proc_path := '/proc/${pid}'

	// Check if process exists
	if !os.is_dir(proc_path) {
		return error('Process not found')
	}

	mut proc := ProcessInfo{
		pid: pid
	}

	// Read process name from comm
	comm_path := '${proc_path}/comm'
	comm := os.read_file(comm_path) or { '' }
	proc.name = comm.trim_space()

	// Read process status
	status_path := '${proc_path}/status'
	status := os.read_file(status_path) or { '' }
	if status.len > 0 {
		for line in status.split_into_lines() {
			parts := line.split(':')
			if parts.len != 2 {
				continue
			}
			key := parts[0].trim_space()
			value := parts[1].trim_space()

			if key == 'PPid' {
				proc.ppid = value.int() or { 0 }
			} else if key == 'State' {
				state_char := value[0]
				proc.status = match state_char {
					`R` { 'Running' }
					`S` { 'Sleeping' }
					`D` { 'Disk Sleep' }
					`Z` { 'Zombie' }
					`T` { 'Stopped' }
					`I` { 'Idle' }
					else { 'Unknown' }
				}
			} else if key == 'Threads' {
				proc.threads = value.int() or { 1 }
			} else if key == 'VmRSS' {
				// Memory in kB, convert to MB
				kb_str := value.split(' ')[0].trim_space()
				kb := kb_str.int() or { 0 }
				proc.memory_mb = kb / 1024
			}
		}
	}

	return proc
}

// Kill a process
pub fn kill_process(pid int, signal string) ! {
	if !os.is_dir('/proc/${pid}') {
		return error('Process not found')
	}

	// Use syscall to kill process
	sig := match signal {
		'SIGKILL', 'kill', '9' { 9 }
		'SIGTERM', 'term', '15' { 15 }
		else { 15 }
	}
	
	// Note: Actual kill would require syscall or os.kill which may not be available
	// This is a placeholder
	println('Would kill process ${pid} with signal ${sig}')
}

// Get process statistics
pub fn get_process_stats() ProcessStats {
	mut stats := ProcessStats{}

	processes := list_processes()
	stats.total_processes = processes.len

	// Count by state
	for proc in processes {
		if proc.status == 'Running' {
			stats.running++
		} else if proc.status == 'Sleeping' || proc.status == 'Disk Sleep' || proc.status == 'Idle' {
			stats.sleeping++
		}
	}

	return stats
}

// Search for processes by name
pub fn search_processes(name_pattern string) []ProcessInfo {
	mut results := []ProcessInfo{}

	processes := list_processes()
	pattern_lower := name_pattern.to_lower()

	for proc in processes {
		if proc.name.to_lower().contains(pattern_lower) {
			results << proc
		}
	}

	return results
}

// Check if a process is running
pub fn is_process_running(pid int) bool {
	return os.is_dir('/proc/${pid}')
}
