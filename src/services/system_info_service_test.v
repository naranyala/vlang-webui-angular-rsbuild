module services_test

import services
import os
import json

// ============================================================================
// SystemInfoService Tests
// ============================================================================

fn test_system_info_service_initialization() {
	println('Testing SystemInfoService initialization...')

	mut sys := services.SystemInfoService{}
	sys.initialize()

	assert sys.initialized == true

	println('PASS: SystemInfoService initialization')
}

fn test_system_info_get_system_info() {
	println('Testing SystemInfoService get_system_info...')

	mut sys := services.SystemInfoService{}
	sys.initialize()

	result := sys.get_system_info_json()

	// Parse result
	mut response := map[string]interface{}{}
	json.decode(result, mut response) or {
		println('FAIL: Invalid JSON: ${err}')
		return
	}

	assert response['status'] == 'ok'
	assert 'hostname' in response

	println('PASS: SystemInfoService get_system_info')
}

fn test_system_info_get_memory_stats() {
	println('Testing SystemInfoService get_memory_stats...')

	mut sys := services.SystemInfoService{}
	sys.initialize()

	result := sys.get_memory_stats_json()

	// Parse result
	mut response := map[string]interface{}{}
	json.decode(result, mut response) or {
		println('FAIL: Invalid JSON: ${err}')
		return
	}

	assert response['status'] == 'ok'
	assert 'total_mb' in response
	assert 'used_mb' in response
	assert 'percent_used' in response

	// Values should be numeric strings
	assert response['total_mb'].string().len > 0

	println('PASS: SystemInfoService get_memory_stats')
}

fn test_system_info_get_cpu_info() {
	println('Testing SystemInfoService get_cpu_info...')

	mut sys := services.SystemInfoService{}
	sys.initialize()

	result := sys.get_cpu_info_json()

	// Parse result
	mut response := map[string]interface{}{}
	json.decode(result, mut response) or {
		println('FAIL: Invalid JSON: ${err}')
		return
	}

	assert response['status'] == 'ok'
	assert 'model' in response
	assert 'cores' in response

	println('PASS: SystemInfoService get_cpu_info')
}

fn test_system_info_get_cpu_usage() {
	println('Testing SystemInfoService get_cpu_usage...')

	mut sys := services.SystemInfoService{}
	sys.initialize()

	result := sys.get_cpu_usage_json()

	// Parse result
	mut response := map[string]interface{}{}
	json.decode(result, mut response) or {
		println('FAIL: Invalid JSON: ${err}')
		return
	}

	assert response['status'] == 'ok'
	assert 'usage_percent' in response

	println('PASS: SystemInfoService get_cpu_usage')
}

fn test_system_info_get_disk_usage() {
	println('Testing SystemInfoService get_disk_usage...')

	mut sys := services.SystemInfoService{}
	sys.initialize()

	result := sys.get_disk_usage_json()

	// Parse result
	mut response := map[string]interface{}{}
	json.decode(result, mut response) or {
		println('FAIL: Invalid JSON: ${err}')
		return
	}

	assert response['status'] == 'ok'
	assert 'total_gb' in response
	assert 'used_gb' in response

	println('PASS: SystemInfoService get_disk_usage')
}

fn test_system_info_get_disk_partitions() {
	println('Testing SystemInfoService get_disk_partitions...')

	mut sys := services.SystemInfoService{}
	sys.initialize()

	result := sys.get_disk_partitions_json()

	// Parse result - should be an array
	assert result.trim_space().starts_with('[')
	assert result.trim_space().ends_with(']')

	println('PASS: SystemInfoService get_disk_partitions')
}

fn test_system_info_get_network_interfaces() {
	println('Testing SystemInfoService get_network_interfaces...')

	mut sys := services.SystemInfoService{}
	sys.initialize()

	result := sys.get_network_interfaces_json()

	// Parse result - should be an array
	assert result.trim_space().starts_with('[')
	assert result.trim_space().ends_with(']')

	println('PASS: SystemInfoService get_network_interfaces')
}

fn test_system_info_get_system_load() {
	println('Testing SystemInfoService get_system_load...')

	mut sys := services.SystemInfoService{}
	sys.initialize()

	result := sys.get_system_load_json()

	// Parse result
	mut response := map[string]interface{}{}
	json.decode(result, mut response) or {
		println('FAIL: Invalid JSON: ${err}')
		return
	}

	assert response['status'] == 'ok'
	assert 'load_1min' in response

	println('PASS: SystemInfoService get_system_load')
}

fn test_system_info_get_uptime() {
	println('Testing SystemInfoService get_uptime...')

	mut sys := services.SystemInfoService{}
	sys.initialize()

	result := sys.get_uptime_json()

	// Parse result
	mut response := map[string]interface{}{}
	json.decode(result, mut response) or {
		println('FAIL: Invalid JSON: ${err}')
		return
	}

	assert response['status'] == 'ok'
	assert 'seconds' in response

	println('PASS: SystemInfoService get_uptime')
}

fn test_system_info_get_hostname() {
	println('Testing SystemInfoService get_hostname...')

	mut sys := services.SystemInfoService{}
	sys.initialize()

	result := sys.get_hostname_info_json()

	// Parse result
	mut response := map[string]interface{}{}
	json.decode(result, mut response) or {
		println('FAIL: Invalid JSON: ${err}')
		return
	}

	assert response['status'] == 'ok'
	assert 'hostname' in response

	println('PASS: SystemInfoService get_hostname')
}

fn test_system_info_list_processes() {
	println('Testing SystemInfoService list_processes...')

	mut sys := services.SystemInfoService{}
	sys.initialize()

	result := sys.list_processes_json(10)

	// Parse result - should be an array
	assert result.trim_space().starts_with('[')
	assert result.trim_space().ends_with(']')

	println('PASS: SystemInfoService list_processes')
}

fn test_system_info_get_environment_variables() {
	println('Testing SystemInfoService get_environment_variables...')

	mut sys := services.SystemInfoService{}
	sys.initialize()

	result := sys.get_environment_variables_json()

	// Parse result - should be an array
	assert result.trim_space().starts_with('[')
	assert result.trim_space().ends_with(']')

	println('PASS: SystemInfoService get_environment_variables')
}

fn test_system_info_get_hardware_info() {
	println('Testing SystemInfoService get_hardware_info...')

	mut sys := services.SystemInfoService{}
	sys.initialize()

	result := sys.get_hardware_info_json()

	// Parse result
	mut response := map[string]interface{}{}
	json.decode(result, mut response) or {
		println('FAIL: Invalid JSON: ${err}')
		return
	}

	assert response['status'] == 'ok'
	assert 'cpu_model' in response
	assert 'cpu_cores' in response

	println('PASS: SystemInfoService get_hardware_info')
}

fn test_system_info_get_sensor_temperatures() {
	println('Testing SystemInfoService get_sensor_temperatures...')

	mut sys := services.SystemInfoService{}
	sys.initialize()

	result := sys.get_sensor_temperatures_json()

	// Parse result - should be an array
	assert result.trim_space().starts_with('[')
	assert result.trim_space().ends_with(']')

	println('PASS: SystemInfoService get_sensor_temperatures')
}

// ============================================================================
// Test Runner
// ============================================================================

fn run_system_info_service_tests() {
	println('')
	println('========================================')
	println('  SystemInfoService Test Suite')
	println('========================================')
	println('')

	test_system_info_service_initialization()
	test_system_info_get_system_info()
	test_system_info_get_memory_stats()
	test_system_info_get_cpu_info()
	test_system_info_get_cpu_usage()
	test_system_info_get_disk_usage()
	test_system_info_get_disk_partitions()
	test_system_info_get_network_interfaces()
	test_system_info_get_system_load()
	test_system_info_get_uptime()
	test_system_info_get_hostname()
	test_system_info_list_processes()
	test_system_info_get_environment_variables()
	test_system_info_get_hardware_info()
	test_system_info_get_sensor_temperatures()

	println('')
	println('SystemInfoService Tests: 15/15 complete')
	println('')
}

fn main() {
	run_system_info_service_tests()
}
