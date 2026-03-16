module services_test

import services

// ============================================================================
// DevToolsService Tests
// ============================================================================

fn test_devtools_initialization() {
	println('Testing DevToolsService initialization...')

	mut devtools := services.DevToolsService{}
	devtools.initialize()

	assert devtools.get_system_info_json().len > 0

	println('✓ PASS: DevToolsService initialization')
}

fn test_devtools_add_event() {
	println('Testing DevToolsService add_event...')

	mut devtools := services.DevToolsService{}
	devtools.initialize()

	devtools.add_event('test', 'Test event message')
	events := devtools.get_events_json()

	assert events.len > 0
	assert events.contains('test')

	println('✓ PASS: DevToolsService add_event')
}

fn test_devtools_add_log() {
	println('Testing DevToolsService add_log...')

	mut devtools := services.DevToolsService{}
	devtools.initialize()

	devtools.add_log('info', 'Info message')
	devtools.add_log('error', 'Error message')
	logs := devtools.get_logs_json()

	assert logs.len > 0
	assert logs.contains('info')
	assert logs.contains('error')

	println('✓ PASS: DevToolsService add_log')
}

fn test_devtools_get_system_info() {
	println('Testing DevToolsService get_system_info_json...')

	mut devtools := services.DevToolsService{}
	devtools.initialize()

	info := devtools.get_system_info_json()
	assert info.len > 0
	assert info.contains('hostname')

	println('✓ PASS: DevToolsService get_system_info_json')
}

fn test_devtools_get_memory_info() {
	println('Testing DevToolsService get_memory_info_json...')

	mut devtools := services.DevToolsService{}
	devtools.initialize()

	info := devtools.get_memory_info_json()
	assert info.len > 0
	assert info.contains('total_mb')

	println('✓ PASS: DevToolsService get_memory_info_json')
}

fn test_devtools_get_process_info() {
	println('Testing DevToolsService get_process_info_json...')

	mut devtools := services.DevToolsService{}
	devtools.initialize()

	info := devtools.get_process_info_json()
	assert info.len > 0
	assert info.contains('pid')

	println('✓ PASS: DevToolsService get_process_info_json')
}

fn test_devtools_get_network_info() {
	println('Testing DevToolsService get_network_info_json...')

	mut devtools := services.DevToolsService{}
	devtools.initialize()

	info := devtools.get_network_info_json()
	assert info.len > 0
	assert info.contains('interfaces')

	println('✓ PASS: DevToolsService get_network_info_json')
}

fn test_devtools_get_database_info() {
	println('Testing DevToolsService get_database_info_json...')

	mut devtools := services.DevToolsService{}
	devtools.initialize()

	info := devtools.get_database_info_json('/tmp/test.db')
	assert info.len > 0
	assert info.contains('path')

	println('✓ PASS: DevToolsService get_database_info_json')
}

fn test_devtools_get_config_info() {
	println('Testing DevToolsService get_config_info_json...')

	mut devtools := services.DevToolsService{}
	devtools.initialize()

	info := devtools.get_config_info_json()
	assert info.len > 0
	assert info.contains('app_name')

	println('✓ PASS: DevToolsService get_config_info_json')
}

fn test_devtools_get_performance_metrics() {
	println('Testing DevToolsService get_performance_metrics_json...')

	mut devtools := services.DevToolsService{}
	devtools.initialize()

	info := devtools.get_performance_metrics_json()
	assert info.len > 0
	assert info.contains('fps')

	println('✓ PASS: DevToolsService get_performance_metrics_json')
}

fn test_devtools_get_bindings() {
	println('Testing DevToolsService get_bindings_json...')

	mut devtools := services.DevToolsService{}
	devtools.initialize()

	bindings := devtools.get_bindings_json()
	assert bindings.len > 0
	assert bindings.contains('name')

	println('✓ PASS: DevToolsService get_bindings_json')
}

fn test_devtools_clear_events() {
	println('Testing DevToolsService clear_events...')

	mut devtools := services.DevToolsService{}
	devtools.initialize()

	devtools.add_event('test', 'Message')
	devtools.clear_events()

	events := devtools.get_events_json()
	assert events == '[]'

	println('✓ PASS: DevToolsService clear_events')
}

fn test_devtools_clear_logs() {
	println('Testing DevToolsService clear_logs...')

	mut devtools := services.DevToolsService{}
	devtools.initialize()

	devtools.add_log('info', 'Message')
	devtools.clear_logs()

	logs := devtools.get_logs_json()
	assert logs == '[]'

	println('✓ PASS: DevToolsService clear_logs')
}

fn test_devtools_shutdown() {
	println('Testing DevToolsService shutdown...')

	mut devtools := services.DevToolsService{}
	devtools.initialize()
	devtools.shutdown()

	println('✓ PASS: DevToolsService shutdown')
}

fn test_devtools_multiple_events() {
	println('Testing DevToolsService multiple events...')

	mut devtools := services.DevToolsService{}
	devtools.initialize()

	for i in 0..10 {
		devtools.add_event('event_${i}', 'Message ${i}')
	}

	events := devtools.get_events_json()
	assert events.contains('event_0')
	assert events.contains('event_9')

	println('✓ PASS: DevToolsService multiple events')
}

// ============================================================================
// Test Runner
// ============================================================================

fn run_all_tests() {
	println('')
	println('========================================')
	println('  DevToolsService Test Suite')
	println('========================================')
	println('')

	test_devtools_initialization()
	test_devtools_add_event()
	test_devtools_add_log()
	test_devtools_get_system_info()
	test_devtools_get_memory_info()
	test_devtools_get_process_info()
	test_devtools_get_network_info()
	test_devtools_get_database_info()
	test_devtools_get_config_info()
	test_devtools_get_performance_metrics()
	test_devtools_get_bindings()
	test_devtools_clear_events()
	test_devtools_clear_logs()
	test_devtools_shutdown()
	test_devtools_multiple_events()

	println('')
	println('========================================')
	println('  All DevToolsService tests passed! ✅')
	println('========================================')
	println('')
}

fn main() {
	run_all_tests()
}
