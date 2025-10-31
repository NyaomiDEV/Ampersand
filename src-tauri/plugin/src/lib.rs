use rusqlite::Connection;
use std::sync::Mutex;
use tauri::{
	plugin::{Builder, TauriPlugin},
	Manager, Runtime,
};

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
pub use error::{Error, Result};
mod db;

#[cfg(desktop)]
use desktop::Ampersand;
#[cfg(mobile)]
use mobile::Ampersand;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the ampersand APIs.
pub trait AmpersandExt<R: Runtime> {
	fn ampersand(&self) -> &Ampersand<R>;
}

impl<R: Runtime, T: Manager<R>> crate::AmpersandExt<R> for T {
	fn ampersand(&self) -> &Ampersand<R> {
		self.state::<Ampersand<R>>().inner()
	}
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
	Builder::new("ampersand")
		.invoke_handler(tauri::generate_handler![
			commands::exit_app,
			commands::set_can_go_back,
			commands::open_file,
			commands::test_db,
			commands::run_db_migrations,
			commands::get_webkit_version,
			commands::broadcast_event,
			commands::list_assets
		])
		.setup(|app, api: tauri::plugin::PluginApi<R, ()>| {
			let db_path = app
				.path()
				.app_data_dir()
				.map_err(Into::<tauri_plugin_opener::Error>::into)?
				.join("db.sqlite");
			let db = Connection::open(db_path)?;

			#[cfg(mobile)]
			let ampersand = mobile::init(app, Mutex::new(db), api)?;
			#[cfg(desktop)]
			let ampersand = desktop::init(app, Mutex::new(db), api)?;
			app.manage(ampersand);
			Ok(())
		})
		.build()
}
