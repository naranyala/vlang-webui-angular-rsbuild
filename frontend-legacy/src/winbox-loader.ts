// WinBox loads itself onto window.WinBox via side-effect import
import 'winbox';

// Verify WinBox is available on window
if (typeof window !== 'undefined' && (window as any).WinBox) {
  console.log('[WinBox] Loaded and available on window.WinBox');
} else {
  console.warn('[WinBox] Was imported but not found on window object');
}
