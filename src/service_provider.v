module main

// ============================================================================
// Service Provider - Simplified without DI container
// ============================================================================
// This module provides helper functions for service registration.
// Services are now created directly without a container.
// ============================================================================

// RegisterServicesInContainer is deprecated - services are created directly
pub fn register_services_in_container(container voidptr) {
	// No-op for backward compatibility
}

// InitializeServices is deprecated - services initialize themselves
pub fn initialize_services(container voidptr) {
	// No-op for backward compatibility
}

// ShutdownServices is deprecated - services shutdown themselves
pub fn shutdown_services(container voidptr) {
	// No-op for backward compatibility
}

// CreateServiceContainer is deprecated - use direct service creation
pub fn create_service_container() voidptr {
	return unsafe { nil }
}
