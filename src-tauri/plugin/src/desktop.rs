use rusqlite::Connection;
use serde::de::DeserializeOwned;
use std::sync::Mutex;
use tauri::{plugin::PluginApi, AppHandle, Manager, Runtime};
use tauri_plugin_opener::OpenerExt;

use crate::db;

pub fn init<R: Runtime, C: DeserializeOwned>(
	app: &AppHandle<R>,
	connection: Mutex<Connection>,
	_api: PluginApi<R, C>,
) -> crate::Result<Ampersand<R>> {
	Ok(Ampersand(app.clone(), connection))
}

/// Access to the ampersand APIs.
pub struct Ampersand<R: Runtime>(AppHandle<R>, Mutex<Connection>);

impl<R: Runtime> Ampersand<R> {
	pub fn exit_app(&self) -> crate::Result<()> {
		self.0.exit(0);
		Ok(())
	}

	pub fn set_can_go_back(&self, _can_go_back: bool) -> crate::Result<()> {
		Ok(())
	}

	pub fn open_file(&self, path: String) -> crate::Result<()> {
		Ok(self.0.opener().open_path(path, None::<&str>)?)
	}

	pub fn test_db(&self) -> crate::Result<String> {
		db::test_db(&self.1)
	}

	pub fn run_db_migrations(&self) -> crate::Result<()> {
		db::run_db_migrations(&self.1, &self.0)
	}

	pub fn get_webkit_version(&self) -> crate::Result<String> {
		tauri::webview_version().map_err(|e| crate::Error::Other(e.to_string()))
	}

	pub fn broadcast_event(&self, _payload: String) -> crate::Result<()> {
		Ok(()) // af_unix someday?
	}

	pub fn list_assets(&self, path: String) -> crate::Result<Vec<String>> {
		Ok(self
			.0
			.path()
			.resource_dir()?
			.join(path)
			.read_dir()?
			.filter_map(|result| {
				result
					.ok()
					.filter(|entry| entry.path().is_file())
					.map(|entry| entry.file_name().to_string_lossy().to_string())
			})
			.collect())
	}
}
