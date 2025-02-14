use tauri::{command, AppHandle, Runtime};

use crate::Result;
use crate::AmpersandExt;

#[command]
pub(crate) fn exit_app<R: Runtime>(app: AppHandle<R>) -> Result<()> {
    app.ampersand().exit_app()
}

#[command]
pub(crate) fn open_file<R: Runtime>(app: AppHandle<R>, path: String) -> Result<()> {
	app.ampersand().open_file(path)
}