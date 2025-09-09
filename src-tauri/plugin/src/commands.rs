use tauri::{command, AppHandle, Runtime};

use crate::Result;
use crate::AmpersandExt;

// Platform dependent commands and code goes here.
// We interface with the native (eg. mobile) device stuff here.
// Commands that can be done independent of platform
// go into src-tauri/src/commands.rs

#[command]
pub(crate) fn exit_app<R: Runtime>(app: AppHandle<R>) -> Result<()> {
    app.ampersand().exit_app()
}

#[command]
pub(crate) fn set_can_go_back<R: Runtime>(app: AppHandle<R>, can_go_back: bool) -> Result<()> {
	app.ampersand().set_can_go_back(can_go_back)
}

#[command]
pub(crate) fn open_file<R: Runtime>(app: AppHandle<R>, path: String) -> Result<()> {
	app.ampersand().open_file(path)
}

#[command]
pub(crate) fn get_webkit_version<R: Runtime>(app: AppHandle<R>) -> Result<String> {
	app.ampersand().get_webkit_version()
}