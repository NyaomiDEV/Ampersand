use rusqlite::Connection;
use std::{collections::HashMap, iter, sync::Mutex};
use tauri::{AppHandle, Manager, Runtime};
use tauri_plugin_fs::FsExt;

use crate::commands;

pub mod types;

pub const MIGRATIONS_PATH: &str = "migrations";

pub fn test_db(conn: &Mutex<Connection>) -> crate::Result<String> {
	Ok(conn
		.lock()?
		.query_one("SELECT sqlite_version();", (), |row| {
			row.get::<usize, String>(0)
		})?)
}

pub fn run_db_migrations<R: Runtime>(
	conn: &Mutex<Connection>,
	handle: &AppHandle<R>,
) -> crate::Result<()> {
	let db_lock = conn.lock()?;
	let migrations_table_exists = db_lock.table_exists(None, "migrations").unwrap_or_default();

	let completed_migrations = if migrations_table_exists {
		db_lock
			.prepare("SELECT (filename) FROM migrations;")?
			.query_map([], |row| row.get::<usize, String>(0))?
			.filter_map(Result::ok)
			.collect::<Vec<_>>()
	} else {
		Vec::new()
	};

	let resources_path = handle.path().resource_dir()?.join(MIGRATIONS_PATH);
	let mut migrations = commands::list_assets(handle.clone(), MIGRATIONS_PATH.to_string())?;
	migrations.sort();
	let migrations: HashMap<String, String> = migrations
		.into_iter()
		.filter_map(|path| {
			if completed_migrations.contains(&path) {
				None
			} else {
				handle
					.fs()
					.read_to_string(resources_path.join(&path))
					.ok()
					.map(|value| (path, value))
			}
		})
		.collect();

	if !migrations.is_empty() {
		let migrations_query: String = iter::once("BEGIN;".to_string())
			.chain(migrations.values().cloned().collect::<Vec<_>>().into_iter())
			.chain(iter::once("COMMIT;".to_string()))
			.collect::<Vec<_>>()
			.join("\n");

		db_lock.execute_batch(&migrations_query)?;

		let migrations_log_query = format!(
			"INSERT INTO migrations (filename) VALUES {};",
			migrations
				.keys()
				.map(|key| {
					println!("executed migration: {key}");
					format!("(\"{key}\")")
				})
				.collect::<Vec<_>>()
				.join(", ")
		);

		db_lock.execute(&migrations_log_query, [])?;
	}

	Ok(())
}
