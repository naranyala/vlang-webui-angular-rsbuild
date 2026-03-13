// Desktop Notification Utility - Simplified for V 0.5.1

module utils

// NotificationPriority represents notification urgency
pub enum NotificationPriority {
	low
	normal
	critical
}

// NotificationResult holds the result of sending a notification
pub struct NotificationResult {
	success bool
	id      int
	error   string
	method  string
}

// NotificationCapabilities holds capabilities of the notification system
pub struct NotificationCapabilities {
	available       bool
	method          string
	supports_icon   bool
	supports_urgency bool
	supports_timeout bool
	server_name     string
	server_version  string
}

// Send a desktop notification
pub fn send_notification(title string, message string) NotificationResult {
	return send_notification_advanced(title, message, '', NotificationPriority.normal, 5000)
}

// Send an advanced desktop notification with options
pub fn send_notification_advanced(title string, message string, icon string, priority NotificationPriority, timeout_ms int) NotificationResult {
	mut result := NotificationResult{
		success: false
		id: -1
	}

	// Check capabilities
	caps := get_notification_capabilities()
	if !caps.available {
		result.error = 'No notification system available'
		result.method = 'none'
		return result
	}

	result.method = caps.method
	result.success = true
	result.id = 0
	
	// Note: Actual notification sending would require os.exec or similar
	// This is a placeholder for V 0.5.1
	println('Notification: ${title} - ${message}')
	
	return result
}

// Get notification system capabilities
pub fn get_notification_capabilities() NotificationCapabilities {
	mut caps := NotificationCapabilities{
		available: false
		method: 'none'
	}

	// Check for notify-send
	notify_check := run_command('which notify-send 2>/dev/null')
	if notify_check.trim_space().len > 0 {
		caps.available = true
		caps.method = 'notify-send'
		caps.supports_icon = true
		caps.supports_urgency = true
		caps.supports_timeout = true
		caps.server_name = 'notify-osd'
		return caps
	}

	// Check for zenity (GNOME fallback)
	zenity_check := run_command('which zenity 2>/dev/null')
	if zenity_check.trim_space().len > 0 {
		caps.available = true
		caps.method = 'zenity'
		caps.supports_icon = false
		caps.supports_urgency = false
		caps.supports_timeout = false
		caps.server_name = 'zenity'
		return caps
	}

	// Check for kdialog (KDE fallback)
	kdialog_check := run_command('which kdialog 2>/dev/null')
	if kdialog_check.trim_space().len > 0 {
		caps.available = true
		caps.method = 'kdialog'
		caps.supports_icon = false
		caps.supports_urgency = false
		caps.supports_timeout = false
		caps.server_name = 'kdialog'
		return caps
	}

	return caps
}

// Send info notification
pub fn send_info(title string, message string) NotificationResult {
	return send_notification_advanced(title, message, 'dialog-information', NotificationPriority.low, 5000)
}

// Send success notification
pub fn send_success(title string, message string) NotificationResult {
	return send_notification_advanced(title, message, 'dialog-ok', NotificationPriority.normal, 5000)
}

// Send warning notification
pub fn send_warning(title string, message string) NotificationResult {
	return send_notification_advanced(title, message, 'dialog-warning', NotificationPriority.normal, 10000)
}

// Send error notification
pub fn send_error(title string, message string) NotificationResult {
	return send_notification_advanced(title, message, 'dialog-error', NotificationPriority.critical, 15000)
}

// Helper function to run command
fn run_command(cmd string) string {
	// Note: V 0.5.1 doesn't have os.exec that returns output
	// This is a placeholder
	return ''
}
