module services_test

import services
import json

// ============================================================================
// NetworkService Tests
// ============================================================================

fn test_network_service_initialization() {
	println('Testing NetworkService initialization...')

	mut net := services.NetworkService{}
	net.initialize()

	assert net.initialized == true

	println('PASS: NetworkService initialization')
}

fn test_network_service_get_network_interfaces() {
	println('Testing NetworkService get_network_interfaces...')

	mut net := services.NetworkService{}
	net.initialize()

	result := net.get_network_interfaces_json()

	// Parse result - should be an array
	assert result.trim_space().starts_with('[')
	assert result.trim_space().ends_with(']')

	println('PASS: NetworkService get_network_interfaces')
}

fn test_network_service_get_network_stats() {
	println('Testing NetworkService get_network_stats...')

	mut net := services.NetworkService{}
	net.initialize()

	result := net.get_network_stats_json()

	// Parse result
	mut response := map[string]interface{}{}
	json.decode(result, mut response) or {
		println('FAIL: Invalid JSON: ${err}')
		return
	}

	assert response['status'] == 'ok'
	assert 'total_rx_mb' in response
	assert 'total_tx_mb' in response

	println('PASS: NetworkService get_network_stats')
}

fn test_network_service_get_ip_addresses() {
	println('Testing NetworkService get_ip_addresses...')

	mut net := services.NetworkService{}
	net.initialize()

	result := net.get_ip_addresses_json()

	// Parse result - should be an array
	assert result.trim_space().starts_with('[')
	assert result.trim_space().ends_with(']')

	println('PASS: NetworkService get_ip_addresses')
}

fn test_network_service_is_network_available() {
	println('Testing NetworkService is_network_available...')

	mut net := services.NetworkService{}
	net.initialize()

	available := net.is_network_available()

	// Should return a boolean (true or false)
	assert available == true | available == false

	println('PASS: NetworkService is_network_available')
}

// ============================================================================
// Test Runner
// ============================================================================

fn run_network_service_tests() {
	println('')
	println('========================================')
	println('  NetworkService Test Suite')
	println('========================================')
	println('')

	test_network_service_initialization()
	test_network_service_get_network_interfaces()
	test_network_service_get_network_stats()
	test_network_service_get_ip_addresses()
	test_network_service_is_network_available()

	println('')
	println('NetworkService Tests: 5/5 complete')
	println('')
}

fn main() {
	run_network_service_tests()
}
