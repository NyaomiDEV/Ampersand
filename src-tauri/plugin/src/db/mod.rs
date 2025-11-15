use rusqlite::Connection;
use std::{
	collections::HashMap,
	fs::{self, File},
	iter,
	sync::Mutex,
};
use tauri::{AppHandle, Manager, Runtime};
use tauri_plugin_fs::FsExt;
use uuid::Uuid;

use crate::{commands, db::types::msgpack};

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

pub fn migrate_old_db<R: Runtime>(
	conn: &Mutex<Connection>,
	handle: &AppHandle<R>,
) -> crate::Result<()> {
	let data_path = handle.path().app_data_dir()?;
	let mut lock = conn.lock()?;
	let transaction = lock.transaction()?;

	transaction.execute(
		"INSERT INTO tag_types (id, label) VALUES (?1, ?2), (?3, ?4);",
		(Uuid::new_v4(), "member", Uuid::new_v4(), "journal"),
	)?;

	let mut system_id: Option<Uuid> = None;

	for path in fs::read_dir(data_path.join("database").join("system"))?
		.filter_map(|result| result.ok())
		.filter(|entry| {
			entry
				.file_name()
				.to_str()
				.is_some_and(|name| !name.starts_with("."))
		})
		.map(|entry| entry.path())
	{
		let system: msgpack::System = rmp_serde::from_read(&mut File::open(&path)?)?;
		let system = msgpack::convert_system(system, &data_path, &transaction)?;
		system_id = Some(system.id);
		transaction.execute(
			"INSERT INTO systems (id, name, description, image) VALUES (?1, ?2, ?3, ?4);",
			(system.id, system.name, system.description, system.image),
		)?;
	}

	for path in fs::read_dir(data_path.join("database").join("customFields"))?
		.filter_map(|result| result.ok())
		.filter(|entry| {
			entry
				.file_name()
				.to_str()
				.is_some_and(|name| !name.starts_with("."))
		})
		.map(|entry| entry.path())
	{
		let custom_field: msgpack::CustomField = rmp_serde::from_read(&mut File::open(&path)?)?;
		let custom_field = msgpack::convert_custom_field(custom_field)?;
		transaction.execute(
			"INSERT INTO custom_fields (id, name, priority, is_default) VALUES (?1, ?2, ?3, ?4);",
			(
				custom_field.id,
				custom_field.name,
				custom_field.priority,
				custom_field.is_default,
			),
		)?;
	}

	for path in fs::read_dir(data_path.join("database").join("tags"))?
		.filter_map(|result| result.ok())
		.filter(|entry| {
			entry
				.file_name()
				.to_str()
				.is_some_and(|name| !name.starts_with("."))
		})
		.map(|entry| entry.path())
	{
		let tag: msgpack::Tag = rmp_serde::from_read(&mut File::open(&path)?)?;
		let tag = msgpack::convert_tag(tag, &transaction)?;
		transaction.execute(
				"INSERT INTO tags (id, name, description, type, color, view_in_lists) VALUES (?1, ?2, ?3, ?4, ?5, ?6);",
				(tag.id, tag.name, tag.description, tag.r#type, tag.color, tag.view_in_lists),
			)?;
	}

	for path in fs::read_dir(data_path.join("database").join("members"))?
		.filter_map(|result| result.ok())
		.filter(|entry| {
			entry
				.file_name()
				.to_str()
				.is_some_and(|name| !name.starts_with("."))
		})
		.map(|entry| entry.path())
	{
		let member: msgpack::Member = rmp_serde::from_read(&mut File::open(&path)?)?;
		let (member, custom_fields, tags) = msgpack::convert_member(
			member,
			system_id.ok_or(crate::Error::Other("No system found".to_string()))?,
			&data_path,
			&transaction,
		)?;

		transaction.execute(
				"INSERT INTO members (id, system, name, pronouns, description, role, image, cover, color, is_pinned, is_archived, is_custom_front, date_created) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13);",
				(member.id, member.system, member.name, member.pronouns, member.description, member.role, member.image, member.cover, member.color, member.is_pinned, member.is_archived, member.is_custom_front, member.date_created),
			)?;

		for field in custom_fields {
			transaction.execute(
				"INSERT INTO custom_field_data (id, member, field, value) VALUES (?1, ?2, ?3, ?4);",
				(field.id, field.member, field.field, field.value),
			)?;
		}

		for tag in tags {
			transaction.execute(
				"INSERT INTO member_tags (id, member, tag) VALUES (?1, ?2, ?3);",
				(tag.id, tag.member, tag.tag),
			)?;
		}
	}

	for path in fs::read_dir(data_path.join("database").join("frontingEntries"))?
		.filter_map(|result| result.ok())
		.filter(|entry| {
			entry
				.file_name()
				.to_str()
				.is_some_and(|name| !name.starts_with("."))
		})
		.map(|entry| entry.path())
	{
		let entry: msgpack::FrontingEntry = rmp_serde::from_read(&mut File::open(&path)?)?;
		let (entry, presence_entries) = msgpack::convert_fronting_entry(entry)?;

		transaction.execute(
				"INSERT INTO fronting_entries (id, member, start_time, end_time, is_main_fronter, is_locked, custom_status, influencing, comment) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9);",
				(entry.id, entry.member, entry.start_time, entry.end_time, entry.is_main_fronter, entry.is_locked, entry.custom_status, entry.influencing, entry.comment),
			)?;

		for presence in presence_entries {
			transaction.execute("INSERT INTO presence_entries (id, fronting_entry, date, presence) VALUES (?1, ?2, ?3, ?4);",
				(presence.id, presence.fronting_entry, presence.date, presence.presence))?;
		}
	}

	for path in fs::read_dir(data_path.join("database").join("boardMessages"))?
		.filter_map(|result| result.ok())
		.filter(|entry| {
			entry
				.file_name()
				.to_str()
				.is_some_and(|name| !name.starts_with("."))
		})
		.map(|entry| entry.path())
	{
		let message: msgpack::BoardMessage = rmp_serde::from_read(&mut File::open(&path)?)?;
		let message = msgpack::convert_message(message, conn)?;
		transaction.execute(
				"INSERT INTO board_messages (id, member, title, body, date, is_pinned, is_archived, poll) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8);",
				(message.id, message.member, message.title, message.body, message.date, message.is_pinned, message.is_archived, message.poll),
			)?;
	}

	for path in fs::read_dir(data_path.join("database").join("journalPosts"))?
		.filter_map(|result| result.ok())
		.filter(|entry| {
			entry
				.file_name()
				.to_str()
				.is_some_and(|name| !name.starts_with("."))
		})
		.map(|entry| entry.path())
	{
		let post: msgpack::JournalPost = rmp_serde::from_read(&mut File::open(&path)?)?;
		let (post, tags) = msgpack::convert_post(post, &data_path, &transaction)?;

		transaction.execute(
				"INSERT INTO journal_posts (id, member, date, title, subtitle, body, cover, is_pinned, is_private, content_warning) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10);",
				(post.id, post.member, post.date, post.title, post.subtitle, post.body, post.cover, post.is_pinned, post.is_private, post.content_warning),
			)?;

		for tag in tags {
			transaction.execute(
				"INSERT INTO journal_post_tags (id, post, tag) VALUES (?1, ?2, ?3);",
				(tag.id, tag.post, tag.tag),
			)?;
		}
	}

	for path in fs::read_dir(data_path.join("database").join("assets"))?
		.filter_map(|result| result.ok())
		.filter(|entry| {
			entry
				.file_name()
				.to_str()
				.is_some_and(|name| !name.starts_with("."))
		})
		.map(|entry| entry.path())
	{
		let tag: msgpack::Asset = rmp_serde::from_read(&mut File::open(&path)?)?;
		let tag = msgpack::convert_asset(tag, &data_path, &transaction)?;
		transaction.execute(
			"INSERT INTO assets (id, file, friendly_name) VALUES (?1, ?2, ?3);",
			(tag.id, tag.file, tag.friendly_name),
		)?;
	}

	transaction.commit()?;
	Ok(())
}
