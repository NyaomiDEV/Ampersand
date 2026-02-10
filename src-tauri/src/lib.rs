mod commands;
mod db;
mod error;
pub use error::{Error, Result};

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
	tauri::Builder::default()
		.plugin(tauri_plugin_fs::init())
		.plugin(tauri_plugin_http::init())
		.plugin(tauri_plugin_os::init())
		.plugin(tauri_plugin_store::Builder::new().build())
		.plugin(tauri_plugin_opener::init())
		.plugin(tauri_plugin_dialog::init())
		.plugin(tauri_plugin_ampersand::init())
		.plugin(tauri_plugin_process::init())
		.invoke_handler(tauri::generate_handler![
			commands::get_webkit_version,
			// DB commands
			db::commands::general::db_test,
			db::commands::general::db_run_migrations,
			db::commands::general::db_migrate_old,
			db::commands::general::db_get,
			db::commands::general::db_get_many,
			db::commands::general::db_count,
			db::commands::general::db_drop,
			db::commands::general::db_write,
			db::commands::general::db_update
		])
		.setup(|app: &mut tauri::App| {
			#[cfg(mobile)]
			app.handle()
				.plugin(tauri_plugin_biometric::init())
				.expect("error while running Ampersand");

			#[cfg(target_os = "android")]
			app.handle()
				.plugin(tauri_plugin_m3::init())
				.expect("error while running Ampersand");

			// Database initialization
			std::fs::create_dir_all(app.path().app_data_dir()?)?;
			db::init(app);
			Ok(())
		})
		.run(tauri::generate_context!())
		.expect("error while running Ampersand");
}
