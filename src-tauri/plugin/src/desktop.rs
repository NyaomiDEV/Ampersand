use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Manager, Runtime};
use tauri_plugin_opener::OpenerExt;

pub fn init<R: Runtime, C: DeserializeOwned>(
	app: &AppHandle<R>,
	_api: PluginApi<R, C>,
) -> crate::Result<Ampersand<R>> {
	Ok(Ampersand(app.clone()))
}

/// Access to the ampersand APIs.
pub struct Ampersand<R: Runtime>(AppHandle<R>);

impl<R: Runtime> Ampersand<R> {
	pub fn dismiss_splash(&self) -> crate::Result<()> {
		Ok(())
	}

	pub fn open_file(&self, path: String) -> crate::Result<()> {
		Ok(self.0.opener().open_path(path, None::<&str>)?)
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
