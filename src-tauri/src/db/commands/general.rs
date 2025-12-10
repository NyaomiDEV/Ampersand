use serde_json::Value;
use tauri::command;
use tauri::AppHandle;
use tauri::Runtime;
use tauri_plugin_ampersand::Result as PluginResult;
use tauri_plugin_ampersand::AmpersandExt;

// Database commands
#[command]
pub(crate) fn db_test<R: Runtime>(app: AppHandle<R>) -> PluginResult<String> {
	app.ampersand().db_test()
}

#[command]
pub(crate) fn db_run_migrations<R: Runtime>(app: AppHandle<R>) -> PluginResult<()> {
	app.ampersand().db_run_migrations()
}

#[command]
pub(crate) fn db_migrate_old<R: Runtime>(app: AppHandle<R>) -> PluginResult<()> {
	app.ampersand().db_migrate_old()
}

#[command]
pub(crate) fn db_get(_table: String, _id: String) -> Result<Value, String> {
	Err("unimplemented".to_owned())
}

#[command]
pub(crate) fn db_get_many(_table: String, _offset: u32, _length: u32) -> Result<Vec<Value>, String> {
	Err("unimplemented".to_owned())
}

#[command]
pub(crate) fn db_count(_table: String) -> Result<u32, String> {
	Err("unimplemented".to_owned())
}

#[command]
pub(crate) fn db_drop(_table: String) -> Result<(), String> {
	Err("unimplemented".to_owned())
}

#[command]
pub(crate) fn db_write(_table: String, _data: Value) -> Result<(), String> {
	Err("unimplemented".to_owned())
}

// QOTD: T is a JSON array which will have all partials, how would you make that typed?
#[command]
pub(crate) fn db_update(_table: String, _id: String, _data: Value) -> Result<(), String> {
	Err("unimplemented".to_owned())
}