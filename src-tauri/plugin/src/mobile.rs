use rusqlite::Connection;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{
	plugin::{PluginApi, PluginHandle},
	AppHandle, Runtime,
};

#[cfg(target_os = "android")]
const PLUGIN_IDENTIFIER: &str = "moe.ampersand.app.plugin";

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_ampersand);

// initializes the Kotlin or Swift plugin classes
pub fn init<R: Runtime, C: DeserializeOwned>(
	_app: &AppHandle<R>,
	connection: Mutex<Connection>,
	api: PluginApi<R, C>,
) -> crate::Result<Ampersand<R>> {
	#[cfg(target_os = "android")]
	let handle = api.register_android_plugin(PLUGIN_IDENTIFIER, "AmpersandPlugin")?;
	#[cfg(target_os = "ios")]
	let handle = api.register_ios_plugin(init_plugin_ampersand)?;
	Ok(Ampersand(handle, connection))
}

/// Structs to pass to the mobile APIs

#[derive(Serialize)]
struct OpenFile {
	path: String,
}

#[derive(Serialize)]
struct BroadcastEvent {
	payload: String,
}

#[derive(Serialize)]
struct GetResourceFileDescriptor {
	path: String,
	mode: String,
}

#[derive(Serialize)]
struct ListAssets {
	path: String,
}

#[derive(Deserialize)]
struct ResourceFileDescriptor {
	fd: Option<i32>,
}

#[derive(Deserialize)]
struct ListAssetsResponse {
	files: Vec<String>,
}

/// Access to the ampersand APIs.
pub struct Ampersand<R: Runtime>(PluginHandle<R>, Mutex<Connection>);

impl<R: Runtime> Ampersand<R> {
	pub fn dismiss_splash(&self) -> crate::Result<()> {
		Ok(self.0.run_mobile_plugin("dismissSplash", ())?)
	}

	pub fn open_file(&self, path: String) -> crate::Result<()> {
		Ok(self.0.run_mobile_plugin("openFile", OpenFile { path })?)
	}

	pub fn db_test(&self) -> crate::Result<String> {
		db::db_test(&self.1)
	}

	pub fn db_run_migrations(&self) -> crate::Result<()> {
		db::db_run_migrations(&self.1, &self.0.app())
	}

	pub fn db_migrate_old(&self) -> crate::Result<()> {
		db::db_migrate_old(&self.1, &self.0.app())
	}

	pub fn broadcast_event(&self, payload: String) -> crate::Result<()> {
		Ok(self
			.0
			.run_mobile_plugin("broadcastEvent", BroadcastEvent { payload })?)
	}

	pub fn get_resource_file_descriptor(
		&self,
		path: String,
		mode: String,
	) -> crate::Result<std::fs::File> {
		let result = self.0.run_mobile_plugin::<ResourceFileDescriptor>(
			"getResourceFileDescriptor",
			GetResourceFileDescriptor { path, mode },
		)?;

		if let Some(fd) = result.fd {
			Ok(unsafe {
				use std::os::fd::FromRawFd;
				std::fs::File::from_raw_fd(fd)
			})
		} else {
			Err(crate::Error::Other("couldn't get fd".to_owned()))
		}
	}

	pub fn list_assets(&self, path: String) -> crate::Result<Vec<String>> {
		Ok(self
			.0
			.run_mobile_plugin::<ListAssetsResponse>("listAssets", ListAssets { path })
			.map(|x| x.files)?)
	}
}
