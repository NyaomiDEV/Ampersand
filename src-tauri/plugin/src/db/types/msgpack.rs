//! Datatypes for retreiving data from the encoded msgpack files

use std::{
	collections::HashMap,
	io::{Read, Write},
	path::PathBuf,
	sync::Mutex,
	time::{Duration, SystemTime},
};

use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use strum_macros::Display;
use time::{OffsetDateTime, UtcDateTime};
use uuid::Uuid;

use super::sql;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BoardMessage {
	pub uuid: Uuid,
	pub member: Option<Uuid>,
	pub title: Option<String>,
	pub body: String,
	pub date: DateTimeData,
	pub is_pinned: Option<bool>,
	pub is_archived: Option<bool>,
	pub poll: Option<Poll>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Poll {
	pub entries: Vec<PollEntry>,
	pub multiple_choice: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PollEntry {
	pub choice: String,
	pub votes: Vec<Vote>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Vote {
	pub member: Uuid,
	pub reason: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FrontingEntry {
	pub uuid: Uuid,
	pub member: Uuid,
	pub start_time: DateTimeData,
	pub end_time: Option<DateTimeData>,
	pub is_main_fronter: Option<bool>,
	pub is_locked: Option<bool>,
	pub custom_status: Option<String>,
	pub influencing: Option<Uuid>,
	pub presence: Option<HashMap<DateTimeData, u8>>,
	pub comment: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct JournalPost {
	pub uuid: Uuid,
	pub member: Option<Uuid>,
	pub date: DateTimeData,
	pub title: String,
	pub subtitle: Option<String>,
	pub body: String,
	pub cover: Option<File>,
	pub tags: Vec<Uuid>,
	pub is_pinned: Option<bool>,
	pub is_private: Option<bool>,
	pub content_warning: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct System {
	pub uuid: Uuid,
	pub name: String,
	pub description: Option<String>,
	pub image: Option<File>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Tag {
	pub uuid: Uuid,
	pub name: String,
	pub description: Option<String>,
	pub r#type: TagType,
	pub color: Option<String>,
	pub view_in_lists: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Display)]
#[serde(rename_all = "lowercase")]
#[strum(serialize_all = "lowercase")]
pub enum TagType {
	Member,
	Journal,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Asset {
	pub uuid: Uuid,
	pub file: File,
	pub friendly_name: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CustomField {
	pub uuid: Uuid,
	pub name: String,
	pub priority: i8,
	pub default: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct File {
	#[serde(rename = "_meta")]
	pub meta: FileMetadata,
	pub value: String,
}
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileMetadata {
	pub r#type: String,
	pub name: String,
	pub last_modified: u64,
	pub mime_type: String,
}

pub fn msgpack_to_json<R: Read>(r: R) -> Result<String, Error> {
	let mut buf = Vec::new();

	let mut de = rmp_serde::Deserializer::new(r);
	let mut se = serde_json::Serializer::pretty(&mut buf);
	serde_transcode::transcode(&mut de, &mut se)?;

	let string = String::from_utf8(buf)?;
	Ok(string)
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Member {
	pub uuid: Uuid,
	pub name: String,
	pub pronouns: Option<String>,
	pub description: Option<String>,
	pub role: Option<String>,
	pub image: Option<File>,
	pub cover: Option<File>,
	pub color: Option<String>,
	pub custom_fields: Option<CustomFieldsData>,
	pub is_pinned: Option<bool>,
	pub is_archived: Option<bool>,
	pub is_custom_front: Option<bool>,
	pub tags: Vec<Uuid>,
	pub date_created: DateTimeData,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CustomFieldsData {
	pub value: Vec<(Uuid, String)>,
}

pub type DateTimeData = Vec<DateTimeDatum>;

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash)]
#[serde(untagged)]
pub enum DateTimeDatum {
	Ext(i8),
	Val(Vec<u8>),
}

pub fn convert_datetime(data: DateTimeData) -> Result<UtcDateTime, Error> {
	let (ext, bytes) = data
		.into_iter()
		.fold((None, None), |(ext, bytes), datum| match datum {
			DateTimeDatum::Ext(v) => (Some(v), bytes),
			DateTimeDatum::Val(v) => (ext, Some(v)),
		});
	let ext = ext.ok_or(Error::NotExt)?;
	if ext != -1 {
		return Err(Error::ExtNotDateTime);
	}
	let bytes = bytes.ok_or(Error::InvalidLength)?;

	match bytes.len() {
		4 => {
			let s = i64::from(u32::from_be_bytes(
				bytes[0..4]
					.iter()
					.as_slice()
					.try_into()
					.map_err(|_| Error::InvalidLength)?,
			));
			UtcDateTime::from_unix_timestamp(s).map_err(|_| Error::OutOfRange)
		}
		8 => {
			let d = u64::from_be_bytes(
				bytes[0..8]
					.iter()
					.as_slice()
					.try_into()
					.map_err(|_| Error::InvalidLength)?,
			);
			let s = d & 0x00000003ffffffff;
			let n = d >> 34;
			let s_dur = Duration::from_secs(s);
			let n_dur = Duration::from_nanos(n);
			Ok(UtcDateTime::from(
				SystemTime::UNIX_EPOCH
					.checked_add(s_dur)
					.ok_or(Error::OutOfRange)?
					.checked_add(n_dur)
					.ok_or(Error::OutOfRange)?,
			))
		}
		12 => {
			let n = u32::from_be_bytes(
				bytes[0..4]
					.iter()
					.as_slice()
					.try_into()
					.map_err(|_| Error::InvalidLength)?,
			);
			let s = i64::from_be_bytes(
				bytes[5..12]
					.iter()
					.as_slice()
					.try_into()
					.map_err(|_| Error::InvalidLength)?,
			);
			let s_dur = Duration::from_secs(s.unsigned_abs());
			let n_dur = Duration::from_nanos(u64::from(n));
			let mut systime = SystemTime::UNIX_EPOCH
				.checked_add(n_dur)
				.ok_or(Error::OutOfRange)?;
			if s.is_negative() {
				systime = systime.checked_sub(s_dur).ok_or(Error::OutOfRange)?;
			} else {
				systime = systime.checked_add(s_dur).ok_or(Error::OutOfRange)?;
			}
			Ok(UtcDateTime::from(systime))
		}
		_ => Err(Error::InvalidLength),
	}
}

pub fn convert_tag(tag: Tag, conn: &Mutex<Connection>) -> Result<sql::Tag, Error> {
	let type_id = conn.lock()?.query_one("INSERT INTO tag_types (id, label) VALUES (?1, ?2) WHERE NOT EXISTS ( SELECT * FROM tag_types WHERE label = ?2); SELECT id FROM tag_types WHERE label = ?2;", (uuid::Uuid::new_v4(), tag.r#type.to_string()), |v| v.get::<usize, uuid::Uuid>(0))?;
	Ok(sql::Tag {
		id: Uuid::new_v4(),
		name: tag.name,
		description: tag.description,
		r#type: type_id,
		color: tag.color,
		view_in_lists: tag.view_in_lists.unwrap_or_default(),
	})
}

pub fn convert_file(file: File, data_path: &PathBuf) -> Result<sql::File, Error> {
	let data = file.value.as_bytes();
	let id = Uuid::new_v4();
	let path = data_path.join("files").join(id.to_string());
	std::fs::File::create(path)?.write(data)?;
	Ok(sql::File {
		id,
		path: PathBuf::from("files")
			.join(id.to_string())
			.to_str()
			.ok_or(Error::Unexpected)?
			.to_string(),
		friendly_name: file.meta.name,
	})
}

pub fn convert_and_save_file(
	file: File,
	data_path: &PathBuf,
	conn: &Mutex<Connection>,
) -> Result<Uuid, Error> {
	let new_file = convert_file(file, data_path)?;
	conn.lock()?.execute(
		"INSERT INTO files (id, path, friendly_name) VALUES (?1, ?2, ?3);",
		(&new_file.id, &new_file.path, &new_file.friendly_name),
	)?;
	Ok(new_file.id)
}

pub fn convert_system(
	system: System,
	data_path: &PathBuf,
	conn: &Mutex<Connection>,
) -> Result<sql::System, Error> {
	Ok(sql::System {
		id: Uuid::new_v4(),
		name: system.name,
		description: system.description,
		image: system
			.image
			.map(|file| convert_and_save_file(file, data_path, conn))
			.transpose()?,
	})
}

pub fn convert_custom_field(field: CustomField) -> Result<sql::CustomField, Error> {
	Ok(sql::CustomField {
		id: field.uuid,
		name: field.name,
		priority: field.priority,
		is_default: field.default.unwrap_or_default(),
	})
}

pub fn convert_member(
	member: Member,
	system_id: Uuid,
	data_path: &PathBuf,
	conn: &Mutex<Connection>,
) -> Result<(sql::Member, Vec<sql::CustomFieldDatum>), Error> {
	Ok((
		sql::Member {
			id: member.uuid,
			system: system_id,
			name: member.name,
			pronouns: member.pronouns,
			description: member.description,
			role: member.role,
			image: member
				.image
				.map(|file| convert_and_save_file(file, data_path, conn))
				.transpose()?,
			cover: member
				.cover
				.map(|file| convert_and_save_file(file, data_path, conn))
				.transpose()?,
			color: member.color,
			is_pinned: member.is_pinned.unwrap_or_default(),
			is_archived: member.is_archived.unwrap_or_default(),
			is_custom_front: member.is_custom_front.unwrap_or_default(),
			date_created: convert_datetime(member.date_created)?.into(),
		},
		member
			.custom_fields
			.map(|v| v.value)
			.unwrap_or_default()
			.into_iter()
			.map(|(field, value)| sql::CustomFieldDatum {
				id: Uuid::new_v4(),
				member: member.uuid,
				field,
				value,
			})
			.collect(),
	))
}

pub fn convert_asset(
	asset: Asset,
	data_path: &PathBuf,
	conn: &Mutex<Connection>,
) -> Result<sql::Asset, Error> {
	Ok(sql::Asset {
		id: asset.uuid,
		file: convert_and_save_file(asset.file, data_path, conn)?,
		friendly_name: asset.friendly_name,
	})
}

pub fn convert_post(
	post: JournalPost,
	data_path: &PathBuf,
	conn: &Mutex<Connection>,
) -> Result<sql::JournalPost, Error> {
	Ok(sql::JournalPost {
		id: post.uuid,
		member: post.member,
		date: convert_datetime(post.date)?.into(),
		title: post.title,
		subtitle: post.subtitle,
		body: post.body,
		cover: post
			.cover
			.map(|file| convert_and_save_file(file, data_path, conn))
			.transpose()?,
		is_pinned: post.is_pinned.unwrap_or_default(),
		is_private: post.is_private.unwrap_or_default(),
		content_warning: post.content_warning,
	})
}

pub fn convert_fronting_entry(
	entry: FrontingEntry,
	conn: &Mutex<Connection>,
) -> Result<(sql::FrontingEntry, Vec<sql::PresenceEntry>), Error> {
	Ok((
		sql::FrontingEntry {
			id: entry.uuid,
			member: entry.member,
			start_time: convert_datetime(entry.start_time)?.into(),
			end_time: entry
				.end_time
				.map(|end_time| convert_datetime(end_time))
				.transpose()?
				.map(Into::into),
			is_main_fronter: entry.is_main_fronter.unwrap_or_default(),
			is_locked: entry.is_locked.unwrap_or_default(),
			custom_status: entry.custom_status,
			influencing: entry.influencing,
			comment: entry.comment,
		},
		entry
			.presence
			.unwrap_or_default()
			.into_iter()
			.map(|(k, v)| {
				Ok(sql::PresenceEntry {
					id: Uuid::new_v4(),
					fronting_entry: entry.uuid,
					date: OffsetDateTime::from(convert_datetime(k)?),
					presence: v,
				})
			})
			.collect::<Result<Vec<sql::PresenceEntry>, Error>>()?,
	))
}

pub fn convert_message(
	message: BoardMessage,
	conn: &Mutex<Connection>,
) -> Result<sql::BoardMessage, Error> {
	Ok(sql::BoardMessage {
		id: message.uuid,
		member: message.member,
		title: message.title,
		body: message.body,
		date: convert_datetime(message.date)?.into(),
		is_pinned: message.is_pinned.unwrap_or_default(),
		is_archived: message.is_archived.unwrap_or_default(),
		poll: message
			.poll
			.map(|poll| convert_and_save_poll(poll, conn))
			.transpose()?,
	})
}

pub fn convert_poll(poll: Poll) -> Result<(sql::Poll, Vec<sql::PollEntry>, Vec<sql::Vote>), Error> {
	let id = Uuid::new_v4();
	let (entries, votes) = convert_poll_entries(poll.entries, id)?;
	Ok((
		sql::Poll {
			id,
			multiple_choice: poll.multiple_choice.unwrap_or_default(),
		},
		entries,
		votes,
	))
}

pub fn convert_poll_entries(
	entries: Vec<PollEntry>,
	poll: Uuid,
) -> Result<(Vec<sql::PollEntry>, Vec<sql::Vote>), Error> {
	let entries: Vec<(sql::PollEntry, Vec<Vote>)> = entries
		.into_iter()
		.map(|entry| {
			(
				sql::PollEntry {
					id: Uuid::new_v4(),
					poll,
					choice: entry.choice,
				},
				entry.votes,
			)
		})
		.collect();
	Ok((
		entries.iter().map(|entry| entry.0.clone()).collect(),
		entries
			.into_iter()
			.map(|(entry, votes)| (entry.id, votes))
			.flat_map(|(entry, votes)| {
				votes.into_iter().map(move |vote| sql::Vote {
					id: Uuid::new_v4(),
					entry: entry,
					member: vote.member,
					reason: vote.reason,
				})
			})
			.collect(),
	))
}

pub fn convert_and_save_poll(poll: Poll, conn: &Mutex<Connection>) -> Result<Uuid, Error> {
	let (poll, entries, votes) = convert_poll(poll)?;
	let id = poll.id;
	let mut lock = conn.lock()?;

	let transaction = lock.transaction()?;

	transaction.execute(
		"INSERT INTO polls (id, multiple_choice) VALUES (?1, ?2);",
		(poll.id, poll.multiple_choice),
	)?;

	for entry in entries {
		transaction.execute(
			"INSERT INTO poll_entries (id, poll, choice) VALUES (?1, ?2, ?3);",
			(entry.id, entry.poll, entry.choice),
		)?;
	}

	for vote in votes {
		transaction.execute(
			"INSERT INTO votes (id, poll_entry, member, reason) VALUES (?1, ?2, ?3, ?4);",
			(vote.id, vote.entry, vote.member, vote.reason),
		)?;
	}

	transaction.commit()?;

	Ok(id)
}

#[derive(Debug, thiserror::Error)]
pub enum Error {
	#[error("Value is not an Ext")]
	NotExt,
	#[error("Ext is not a Datetime")]
	ExtNotDateTime,
	#[error("Ext value is an invalid length for MessagePack Datetime")]
	InvalidLength,
	#[error("Ext value is out of range for UtcDateTime")]
	OutOfRange,
	#[error(transparent)]
	IoError(#[from] std::io::Error),
	#[error("Unexpected error occurred")]
	Unexpected,
	#[error("Mutex Lock Poisoned")]
	Poison,
	#[error(transparent)]
	Rusqlite(#[from] rusqlite::Error),
	#[error(transparent)]
	Json(#[from] serde_json::Error),
	#[error(transparent)]
	FromUtf8(#[from] std::string::FromUtf8Error),
}
impl<T> From<std::sync::PoisonError<T>> for Error {
	fn from(_: std::sync::PoisonError<T>) -> Self {
		Self::Poison
	}
}
