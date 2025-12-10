use tauri::command;
use tauri_plugin_ampersand::Result;

// Platform independent commands and code goes here. Here we shill pure Rust or almost that.
// Commands that have to ALSO or EXCLUSIVELY interface with NATIVE INTERFACES (Android/iOS)
// go into src-tauri/plugin/src/{commands.rs,mobile.rs,desktop.rs}

#[command]
pub fn get_webkit_version() -> Result<String> {
	tauri::webview_version().map_err(|e| tauri_plugin_ampersand::Error::Other(e.to_string()))
}
