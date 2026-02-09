use tauri::{command, AppHandle, Runtime};

use crate::AmpersandExt;
use crate::Result;

// Platform dependent commands and code goes here.
// We interface with the native (eg. mobile) device stuff here.
// Commands that can be done independent of platform
// go into src-tauri/src/commands.rs

#[command]
pub(crate) fn open_file<R: Runtime>(app: AppHandle<R>, path: String) -> Result<()> {
	app.ampersand().open_file(path)
}

#[command]
pub(crate) fn db_test<R: Runtime>(app: AppHandle<R>) -> Result<String> {
	app.ampersand().db_test()
}

#[command]
pub(crate) fn db_run_migrations<R: Runtime>(app: AppHandle<R>) -> Result<()> {
	app.ampersand().db_run_migrations()
}

#[command]
pub(crate) fn db_migrate_old<R: Runtime>(app: AppHandle<R>) -> Result<()> {
	app.ampersand().db_migrate_old()
}

#[command]
pub(crate) fn broadcast_event<R: Runtime>(app: AppHandle<R>, payload: String) -> Result<()> {
	app.ampersand().broadcast_event(payload)
}

#[command]
pub(crate) fn list_assets<R: Runtime>(app: AppHandle<R>, path: String) -> Result<Vec<String>> {
	app.ampersand().list_assets(path)
}

#[command]
pub(crate) fn dismiss_splash<R: Runtime>(app: AppHandle<R>) -> Result<()> {
	app.ampersand().dismiss_splash()
}
