module main

// ============================================================================
// Service Provider Module
// ============================================================================
// 
// This module coordinates service creation and initialization.
// 
// Architecture Note:
// The application uses direct service instantiation rather than a DI container.
// Each service is created and initialized directly in the App struct constructor.
//
// This approach was chosen for simplicity and because the application doesn't
// require complex service lifetime management at this stage.
//
// Services are created in: src/app.v (new_app function)
// ============================================================================

/**
 * Initialize all application services.
 * 
 * Note: Services are created directly in the App struct constructor.
 * This function is kept for backward compatibility but is no longer used.
 * 
 * @deprecated Services are now created in new_app() in src/app.v
 */
pub fn create_and_initialize_services() App {
	mut logging := LoggingService{}
	logging.initialize()
	logging.set_min_level('debug')

	mut system_info := SystemInfoService{}
	system_info.initialize()

	mut file := FileService{}
	file.initialize()
	file.set_deny_write(true)

	mut network := NetworkService{}
	network.initialize()

	mut config := ConfigService{}
	config.initialize()

	mut app := App{
		logging:      logging
		system_info:  system_info
		file:         file
		network:      network
		config:       config
		app_name:     'Desktop App'
		app_version:  '1.0.0'
	}
	
	app.initialize()
	return app
}

/**
 * Shutdown all services gracefully.
 * 
 * Note: Call app.shutdown() instead, which handles service shutdown.
 * 
 * @deprecated Use app.shutdown() method instead
 */
pub fn shutdown_all_services(mut app App) {
	app.shutdown()
}
