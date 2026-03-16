module di

import time

// ============================================================================
// Service Lifetime Scopes (matching Angular)
// ============================================================================

// ServiceScope defines how services are instantiated
pub enum ServiceScope {
	// Singleton: Single instance for entire application (like @Injectable({providedIn: 'root'})
	singleton = 0
	
	// Transient: New instance every time (like not provided in root)
	transient = 1
	
	// Scoped: Single instance per scope/request (like providedIn: 'platform')
	scoped = 2
}

// ============================================================================
// Service Metadata (like @Injectable decorator)
// ============================================================================

// ServiceMetadata holds information about a service
pub struct ServiceMetadata {
pub mut:
	name            string
	scope           ServiceScope
	instance        voidptr
	initialized     bool
	dependencies    []string
	created_at      string
}

// ============================================================================
// Injection Token (like Angular's InjectionToken)
// ============================================================================

// InjectionToken provides type-safe dependency identification
pub struct InjectionToken[T] {
pub:
	name string
}

// Create new injection token
pub fn create_token[T](name string) InjectionToken[T] {
	return InjectionToken[T]{
		name: name
	}
}

// ============================================================================
// Service Provider (like Angular's Provider)
// ============================================================================

// ServiceProvider defines how to create a service
pub struct ServiceProvider {
pub mut:
	name           string
	provider_type  ProviderType
	factory        fn () voidptr
	existing       voidptr
	value          voidptr
	scope          ServiceScope
}

// ProviderType specifies the provider strategy
pub enum ProviderType {
	class_provider = 0       // Use class constructor
	factory_provider = 1     // Use factory function
	existing_provider = 2    // Alias to another service
	value_provider = 3       // Use constant value
}

// Create class provider
pub fn provide_class[T](name string, scope ServiceScope) ServiceProvider {
	return ServiceProvider{
		name: name
		provider_type: .class_provider
		factory: fn () voidptr {
			// Will be overridden
			return nil
		}
		scope: scope
	}
}

// Create factory provider
pub fn provide_factory[T](name string, factory fn () T, scope ServiceScope) ServiceProvider {
	mut sp := ServiceProvider{
		name: name
		provider_type: .factory_provider
		scope: scope
	}
	
	// Type-erased factory wrapper
	sp.factory = fn () voidptr {
		result := factory()
		return unsafe { &result }
	}
	
	return sp
}

// Create existing provider (alias)
pub fn provide_existing(name string, existing_name string, scope ServiceScope) ServiceProvider {
	return ServiceProvider{
		name: name
		provider_type: .existing_provider
		existing: unsafe { &existing_name }
		scope: scope
	}
}

// Create value provider
pub fn provide_value[T](name string, value T, scope ServiceScope) ServiceProvider {
	mut sp := ServiceProvider{
		name: name
		provider_type: .value_provider
		scope: scope
	}
	
	sp.value = unsafe { &value }
	
	return sp
}

// ============================================================================
// Injector (like Angular's Injector)
// ============================================================================

// Injector manages service creation and resolution
@[heap]
pub struct Injector {
mut:
	parent              ?&Injector
	providers           map[string]ServiceProvider
	services            map[string]ServiceMetadata
	scoped_services     map[string]map[string]voidptr
	scope_stack         []string
	is_destroyed        bool
	creation_stack      string
}

// Create root injector
pub fn create_root_injector() Injector {
	return Injector{
		parent: none
		providers: map[string]ServiceProvider{}
		services: map[string]ServiceMetadata{}
		scoped_services: map[string]map[string]voidptr{}
		scope_stack: []string{}
		is_destroyed: false
		creation_stack: 'Root Injector'
	}
}

// Create child injector (for hierarchical DI)
pub fn (mut injector Injector) create_child() Injector {
	return Injector{
		parent: &injector
		providers: map[string]ServiceProvider{}
		services: map[string]ServiceMetadata{}
		scoped_services: map[string]map[string]voidptr{}
		scope_stack: injector.scope_stack.clone()
		is_destroyed: false
		creation_stack: 'Child Injector'
	}
}

// Register providers (like NgModule.providers)
pub fn (mut injector Injector) register(providers []ServiceProvider) {
	for provider in providers {
		injector.providers[provider.name] = provider
	}
}

// Get service (like inject() or constructor injection)
pub fn (mut injector Injector) get[T](name string) ?T {
	// Check if injector is destroyed
	if injector.is_destroyed {
		println('Injector is destroyed, cannot get service: ${name}')
		return none
	}
	
	// Try to get from current injector
	if name in injector.services {
		mut metadata := injector.services[name]
		
		// Check scope
		if metadata.scope == .scoped && injector.scope_stack.len > 0 {
			current_scope := injector.scope_stack[injector.scope_stack.len - 1]
			if current_scope in injector.scoped_services {
				if name in injector.scoped_services[current_scope] {
					instance := injector.scoped_services[current_scope][name]
					return unsafe { *(&instance as &T) }
				}
			}
		}
		
		if metadata.instance != nil {
			return unsafe { *(&metadata.instance as &T) }
		}
	}
	
	// Try parent injector
	if injector.parent != none {
		return injector.parent.get[T](name)
	}
	
	// Create service if provider exists
	if name in injector.providers {
		provider := injector.providers[name]
		instance := injector.create_service(provider)
		
		if instance != nil {
			return unsafe { *(&instance as &T) }
		}
	}
	
	// Service not found
	println('Service not found: ${name}')
	return none
}

// Check if service is registered
pub fn (injector Injector) has(name string) bool {
	if name in injector.services {
		return true
	}
	
	if name in injector.providers {
		return true
	}
	
	if injector.parent != none {
		return injector.parent.has(name)
	}
	
	return false
}

// Create scoped context (like Angular's runInInjectionContext)
pub fn (mut injector Injector) run_in_scope(scope_name string, fn fn ()) {
	injector.scope_stack << scope_name
	
	if scope_name !in injector.scoped_services {
		injector.scoped_services[scope_name] = map[string]voidptr{}
	}
	
	fn()
	
	// Cleanup scoped services
	injector.scope_stack.pop()
}

// Create service instance
fn (mut injector Injector) create_service(provider ServiceProvider) voidptr {
	mut instance := voidptr(nil)
	
	match provider.provider_type {
		.class_provider {
			instance = provider.factory()
		}
		.factory_provider {
			instance = provider.factory()
		}
		.existing_provider {
			existing_name := unsafe { *(provider.existing as &string) }
			instance = injector.get[voidptr](existing_name) or {
				println('Existing service not found: ${existing_name}')
				return nil
			}
		}
		.value_provider {
			instance = provider.value
		}
	}
	
	if instance == nil {
		println('Failed to create service: ${provider.name}')
		return nil
	}
	
	// Store metadata
	metadata := ServiceMetadata{
		name: provider.name
		scope: provider.scope
		instance: instance
		initialized: true
		created_at: time.now().custom_format('YYYY-MM-DD HH:mm:ss.SSS')
	}
	
	injector.services[provider.name] = metadata
	
	// Store scoped service if needed
	if provider.scope == .scoped && injector.scope_stack.len > 0 {
		current_scope := injector.scope_stack[injector.scope_stack.len - 1]
		injector.scoped_services[current_scope][provider.name] = instance
	}
	
	return instance
}

// Destroy injector and cleanup services
pub fn (mut injector Injector) destroy() {
	if injector.is_destroyed {
		return
	}
	
	// Cleanup scoped services
	for scope, services in injector.scoped_services {
		for service_name in services.keys() {
			println('Destroying scoped service: ${scope}.${service_name}')
		}
		services.clear()
	}
	
	injector.scoped_services.clear()
	injector.services.clear()
	injector.is_destroyed = true
}

// Get injector statistics
pub fn (injector Injector) get_stats() map[string]int {
	mut stats := map[string]int{}
	stats['provider_count'] = injector.providers.len
	stats['service_count'] = injector.services.len
	stats['scoped_service_count'] = injector.scoped_services.len
	stats['scope_depth'] = injector.scope_stack.len
	return stats
}

// Get service metadata
pub fn (injector Injector) get_service_metadata(name string) ?ServiceMetadata {
	if name in injector.services {
		return injector.services[name]
	}
	
	if injector.parent != none {
		return injector.parent.get_service_metadata(name)
	}
	
	return none
}

// ============================================================================
// Module (like Angular's NgModule)
// ============================================================================

// DIModule represents a collection of providers
pub struct DIModule {
pub mut:
	name        string
	providers   []ServiceProvider
	imports     []DIModule
	exports     []string
}

// Create new module
pub fn create_module(name string) DIModule {
	return DIModule{
		name: name
		providers: []ServiceProvider{}
		imports: []DIModule{}
		exports: []string{}
	}
}

// Add provider to module
pub fn (mut module DIModule) add_provider(provider ServiceProvider) {
	module.providers << provider
}

// Import another module
pub fn (mut module DIModule) import(mut other_module DIModule) {
	module.imports << other_module
	
	// Re-export providers
	for provider in other_module.providers {
		if provider.name in other_module.exports || other_module.exports.len == 0 {
			module.providers << provider
		}
	}
}

// Export service names
pub fn (mut module DIModule) export(service_names []string) {
	module.exports = service_names
}

// Register module with injector
pub fn (mut module DIModule) register_with(mut injector Injector) {
	// Register imported modules first
	for mut import in module.imports {
		import.register_with(mut injector)
	}
	
	// Register providers
	injector.register(module.providers)
}

// ============================================================================
// Decorator Helpers (simulating @Injectable, @Inject)
// ============================================================================

// Injectable marks a struct as injectable service
// Usage: Call this in your service's init function
pub fn register_injectable[T](injector &Injector, name string, scope ServiceScope, factory fn () T) {
	provider := provide_factory[T](name, factory, scope)
	injector.register([provider]!)
}

// Inject helper for manual injection
pub fn inject[T](injector &Injector, name string) ?T {
	return injector.get[T](name)
}

// Optional injection (doesn't fail if not found)
pub fn inject_optional[T](injector &Injector, name string) ?T {
	return injector.get[T](name)
}

// ============================================================================
// Global Root Injector
// ============================================================================

// Global root injector instance
mut root_injector := create_root_injector()

// Get root injector
pub fn get_root_injector() mut &Injector {
	return mut &root_injector
}

// Set root injector (for testing)
pub fn set_root_injector(injector Injector) {
	root_injector = injector
}

// Global inject function (like Angular's inject())
pub fn global_inject[T](name string) ?T {
	return root_injector.get[T](name)
}

// Global register function
pub fn global_register(providers []ServiceProvider) {
	root_injector.register(providers)
}
