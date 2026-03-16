module services_test

import services

// ============================================================================
// ConfigService Tests
// ============================================================================

fn test_config_service_initialization() {
	println('Testing ConfigService initialization...')

	mut config := services.ConfigService{}
	result := config.initialize()

	assert result == true, 'Initialization should succeed'
	assert config.name() == 'ConfigService', 'Name should be ConfigService'

	println('✓ PASS: ConfigService initialization')
}

fn test_config_service_set_default_string() {
	println('Testing ConfigService set_default_string...')

	mut config := services.ConfigService{}
	config.initialize()

	config.set_default_string('app.name', 'Test App')
	assert config.get_string('app.name') == 'Test App'

	config.set_default_string('app.name', 'Other App')
	assert config.get_string('app.name') == 'Test App', 'Default should not be overridden'

	println('✓ PASS: ConfigService set_default_string')
}

fn test_config_service_set_default_int() {
	println('Testing ConfigService set_default_int...')

	mut config := services.ConfigService{}
	config.initialize()

	config.set_default_int('server.port', 8080)
	assert config.get_int('server.port') == 8080

	config.set_default_int('server.port', 9090)
	assert config.get_int('server.port') == 8080

	println('✓ PASS: ConfigService set_default_int')
}

fn test_config_service_set_default_bool() {
	println('Testing ConfigService set_default_bool...')

	mut config := services.ConfigService{}
	config.initialize()

	config.set_default_bool('debug.enabled', true)
	assert config.get_bool('debug.enabled') == true

	config.set_default_bool('debug.enabled', false)
	assert config.get_bool('debug.enabled') == true

	println('✓ PASS: ConfigService set_default_bool')
}

fn test_config_service_get_string() {
	println('Testing ConfigService get_string...')

	mut config := services.ConfigService{}
	config.initialize()

	config.set_default_string('test.key', 'test value')
	assert config.get_string('test.key') == 'test value'
	assert config.get_string('nonexistent') == ''

	println('✓ PASS: ConfigService get_string')
}

fn test_config_service_get_int() {
	println('Testing ConfigService get_int...')

	mut config := services.ConfigService{}
	config.initialize()

	config.set_default_int('test.number', 42)
	assert config.get_int('test.number') == 42
	assert config.get_int('nonexistent') == 0

	println('✓ PASS: ConfigService get_int')
}

fn test_config_service_get_bool() {
	println('Testing ConfigService get_bool...')

	mut config := services.ConfigService{}
	config.initialize()

	config.set_default_string('bool.true', 'true')
	config.set_default_string('bool.false', 'false')

	assert config.get_bool('bool.true') == true
	assert config.get_bool('bool.false') == false
	assert config.get_bool('nonexistent') == false

	println('✓ PASS: ConfigService get_bool')
}

fn test_config_service_get_app_config() {
	println('Testing ConfigService get_app_config...')

	mut config := services.ConfigService{}
	config.initialize()

	config.set_default_string('app.name', 'My Application')
	config.set_default_string('app.version', '2.0.0')
	config.set_default_bool('app.debug_mode', true)

	// Just verify get_app_config returns without error
	config.get_app_config()

	println('✓ PASS: ConfigService get_app_config')
}

fn test_config_service_multiple_types() {
	println('Testing ConfigService multiple types...')

	mut config := services.ConfigService{}
	config.initialize()

	config.set_default_string('string.key', 'string value')
	config.set_default_int('int.key', 123)
	config.set_default_bool('bool.key', true)

	assert config.get_string('string.key') == 'string value'
	assert config.get_int('int.key') == 123
	assert config.get_bool('bool.key') == true

	println('✓ PASS: ConfigService multiple types')
}

fn test_config_service_empty_values() {
	println('Testing ConfigService empty values...')

	mut config := services.ConfigService{}
	config.initialize()

	assert config.get_string('empty') == ''
	assert config.get_int('empty') == 0
	assert config.get_bool('empty') == false

	println('✓ PASS: ConfigService empty values')
}

// ============================================================================
// Test Runner
// ============================================================================

fn run_all_tests() {
	println('')
	println('========================================')
	println('  ConfigService Test Suite')
	println('========================================')
	println('')

	test_config_service_initialization()
	test_config_service_set_default_string()
	test_config_service_set_default_int()
	test_config_service_set_default_bool()
	test_config_service_get_string()
	test_config_service_get_int()
	test_config_service_get_bool()
	test_config_service_get_app_config()
	test_config_service_multiple_types()
	test_config_service_empty_values()

	println('')
	println('========================================')
	println('  All ConfigService tests passed! ✅')
	println('========================================')
	println('')
}

fn main() {
	run_all_tests()
}
