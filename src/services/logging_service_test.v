module services_test

import services
import json
import time

// ============================================================================
// LoggingService Tests
// ============================================================================

fn test_logging_service_initialization() {
	println('Testing LoggingService initialization...')

	mut logging := services.LoggingService{}
	logging.initialize()

	assert logging.initialized == true

	println('PASS: LoggingService initialization')
}

fn test_logging_service_set_min_level() {
	println('Testing LoggingService set_min_level...')

	mut logging := services.LoggingService{}
	logging.initialize()

	logging.set_min_level('debug')
	assert logging.min_level == 'debug'

	logging.set_min_level('info')
	assert logging.min_level == 'info'

	logging.set_min_level('warning')
	assert logging.min_level == 'warning'

	logging.set_min_level('error')
	assert logging.min_level == 'error'

	logging.set_min_level('critical')
	assert logging.min_level == 'critical'

	println('PASS: LoggingService set_min_level')
}

fn test_logging_service_info() {
	println('Testing LoggingService info...')

	mut logging := services.LoggingService{}
	logging.initialize()
	logging.set_min_level('debug')

	logging.info('Test info message')

	// Check that entry was added
	assert logging.entries.len > 0
	assert logging.entries[logging.entries.len - 1].level == 'info'

	println('PASS: LoggingService info')
}

fn test_logging_service_warning() {
	println('Testing LoggingService warning...')

	mut logging := services.LoggingService{}
	logging.initialize()
	logging.set_min_level('debug')

	logging.warning('Test warning message')

	assert logging.entries.len > 0
	assert logging.entries[logging.entries.len - 1].level == 'warning'

	println('PASS: LoggingService warning')
}

fn test_logging_service_error() {
	println('Testing LoggingService error...')

	mut logging := services.LoggingService{}
	logging.initialize()
	logging.set_min_level('debug')

	logging.error('Test error message')

	assert logging.entries.len > 0
	assert logging.entries[logging.entries.len - 1].level == 'error'

	println('PASS: LoggingService error')
}

fn test_logging_service_critical() {
	println('Testing LoggingService critical...')

	mut logging := services.LoggingService{}
	logging.initialize()
	logging.set_min_level('debug')

	logging.critical('Test critical message')

	assert logging.entries.len > 0
	assert logging.entries[logging.entries.len - 1].level == 'critical'

	println('PASS: LoggingService critical')
}

fn test_logging_service_debug_filtered() {
	println('Testing LoggingService debug filtered...')

	mut logging := services.LoggingService{}
	logging.initialize()
	logging.set_min_level('error')

	logging.debug('Test debug message')

	// Debug should be filtered when min_level is error
	entries_before := logging.entries.len
	logging.debug('Another debug')
	assert logging.entries.len == entries_before

	println('PASS: LoggingService debug filtered')
}

fn test_logging_service_export_logs() {
	println('Testing LoggingService export_logs...')

	mut logging := services.LoggingService{}
	logging.initialize()
	logging.set_min_level('debug')

	logging.info('Test message 1')
	logging.error('Test message 2')

	test_file := '/tmp/test_export_logs.txt'
	logging.export_logs(test_file) or {
		println('FAIL: Could not export logs')
		return
	}

	// Check file exists
	assert os.file_exists(test_file)

	// Read and verify content
	content := os.read_file(test_file) or {
		println('FAIL: Could not read exported file')
		return
	}

	assert content.len > 0
	assert content.contains('Test message')

	// Cleanup
	os.rm(test_file)

	println('PASS: LoggingService export_logs')
}

fn test_logging_service_get_entries() {
	println('Testing LoggingService get_entries...')

	mut logging := services.LoggingService{}
	logging.initialize()
	logging.set_min_level('debug')

	logging.info('Message 1')
	logging.warning('Message 2')
	logging.error('Message 3')

	entries := logging.get_entries()

	assert entries.len == 3

	println('PASS: LoggingService get_entries')
}

fn test_logging_service_clear_entries() {
	println('Testing LoggingService clear_entries...')

	mut logging := services.LoggingService{}
	logging.initialize()
	logging.set_min_level('debug')

	logging.info('Message 1')
	logging.info('Message 2')

	logging.clear_entries()

	assert logging.entries.len == 0

	println('PASS: LoggingService clear_entries')
}

fn test_logging_service_debug_source() {
	println('Testing LoggingService debug_source...')

	mut logging := services.LoggingService{}
	logging.initialize()
	logging.set_min_level('debug')

	logging.debug_source('Test message', 'TestSource')

	assert logging.entries.len > 0
	last_entry := logging.entries[logging.entries.len - 1]
	assert last_entry.level == 'debug'
	assert last_entry.source == 'TestSource'

	println('PASS: LoggingService debug_source')
}

fn test_logging_service_success() {
	println('Testing LoggingService success...')

	mut logging := services.LoggingService{}
	logging.initialize()
	logging.set_min_level('debug')

	logging.success('Test success message')

	assert logging.entries.len > 0
	assert logging.entries[logging.entries.len - 1].level == 'info'

	println('PASS: LoggingService success')
}

fn test_logging_service_timestamp_format() {
	println('Testing LoggingService timestamp format...')

	mut logging := services.LoggingService{}
	logging.initialize()
	logging.set_min_level('debug')

	logging.info('Test timestamp')

	last_entry := logging.entries[logging.entries.len - 1]
	assert last_entry.timestamp.len > 0
	// Should be in YYYY-MM-DD HH:mm:ss format
	assert last_entry.timestamp.contains('-')
	assert last_entry.timestamp.contains(':')

	println('PASS: LoggingService timestamp format')
}

// ============================================================================
// Test Runner
// ============================================================================

fn run_logging_service_tests() {
	println('')
	println('========================================')
	println('  LoggingService Test Suite')
	println('========================================')
	println('')

	test_logging_service_initialization()
	test_logging_service_set_min_level()
	test_logging_service_info()
	test_logging_service_warning()
	test_logging_service_error()
	test_logging_service_critical()
	test_logging_service_debug_filtered()
	test_logging_service_export_logs()
	test_logging_service_get_entries()
	test_logging_service_clear_entries()
	test_logging_service_debug_source()
	test_logging_service_success()
	test_logging_service_timestamp_format()

	println('')
	println('LoggingService Tests: 13/13 complete')
	println('')
}

fn main() {
	run_logging_service_tests()
}
