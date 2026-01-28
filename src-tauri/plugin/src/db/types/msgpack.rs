//! Datatypes for retreiving data from the encoded msgpack files

use std::{
	collections::HashMap,
	io::Write,
	ops::Deref,
	path::PathBuf,
	str::FromStr,
	sync::Mutex,
	time::{Duration, SystemTime},
};

use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use serde_bytes::ByteBuf;
use strum_macros::Display;
use time::{OffsetDateTime, UtcDateTime};
use uuid::Uuid;

use super::sql;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BoardMessage {
	pub uuid: String,
	pub member: Option<String>,
	pub title: Option<String>,
	pub body: String,
	pub date: ExtStruct,
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
	pub member: String,
	pub reason: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FrontingEntry {
	pub uuid: String,
	pub member: String,
	pub start_time: ExtStruct,
	pub end_time: Option<ExtStruct>,
	pub is_main_fronter: Option<bool>,
	pub is_locked: Option<bool>,
	pub custom_status: Option<String>,
	pub influencing: Option<String>,
	pub presence: Option<HashMap<ExtStruct, u8>>,
	pub comment: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct JournalPost {
	pub uuid: String,
	pub member: Option<String>,
	pub date: ExtStruct,
	pub title: String,
	pub subtitle: Option<String>,
	pub body: String,
	pub cover: Option<File>,
	pub tags: Vec<String>,
	pub is_pinned: Option<bool>,
	pub is_private: Option<bool>,
	pub content_warning: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct System {
	pub uuid: String,
	pub name: String,
	pub description: Option<String>,
	pub image: Option<File>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Tag {
	pub uuid: String,
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
	pub uuid: String,
	pub file: File,
	pub friendly_name: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CustomField {
	pub uuid: String,
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

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Member {
	pub uuid: String,
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
	pub tags: Vec<String>,
	pub date_created: ExtStruct,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CustomFieldsData {
	pub value: Vec<(String, String)>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq, Hash)]
#[serde(rename = "_ExtStruct")]
pub struct ExtStruct((i8, ByteBuf));

pub fn convert_datetime(data: ExtStruct) -> Result<UtcDateTime, Error> {
	let ExtStruct((ext, bytes)) = data;
	if ext != -1 {
		return Err(Error::ExtNotDateTime);
	}
	let bytes = bytes.into_vec();

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

pub fn convert_tag<D: Deref<Target = Connection>>(tag: Tag, conn: &D) -> Result<sql::Tag, Error> {
	let type_id = conn.query_one("INSERT INTO tag_types (label) VALUES (?1) WHERE NOT EXISTS ( SELECT * FROM tag_types WHERE label = ?1); SELECT id FROM tag_types WHERE label = ?1;", [tag.r#type.to_string()], |v| v.get::<usize, i32>(0))?;
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
	let data = file.value;
	let id = Uuid::new_v4();
	std::fs::create_dir_all(data_path.join("files"))?;
	let path = data_path.join("files").join(id.to_string());
	std::fs::File::create(path)?
		.write(&data.encode_utf16().map(|c| c as u8).collect::<Vec<u8>>())?;
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

pub fn convert_and_save_file<D: Deref<Target = Connection>>(
	file: File,
	data_path: &PathBuf,
	conn: &D,
) -> Result<Uuid, Error> {
	let new_file = convert_file(file, data_path)?;
	conn.execute(
		"INSERT INTO files (id, path, friendly_name) VALUES (?1, ?2, ?3);",
		(&new_file.id, &new_file.path, &new_file.friendly_name),
	)?;
	Ok(new_file.id)
}

pub fn convert_system<D: Deref<Target = Connection>>(
	system: System,
	data_path: &PathBuf,
	conn: &D,
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
		id: Uuid::from_str(&field.uuid)?,
		name: field.name,
		priority: field.priority,
		is_default: field.default.unwrap_or_default(),
	})
}

pub fn convert_member<D: Deref<Target = Connection>>(
	member: Member,
	system_id: Uuid,
	data_path: &PathBuf,
	conn: &D,
) -> Result<(sql::Member, Vec<sql::CustomFieldDatum>, Vec<sql::MemberTag>), Error> {
	Ok((
		sql::Member {
			id: Uuid::from_str(&member.uuid)?,
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
			.map(|(field, value)| {
				Ok(sql::CustomFieldDatum {
					id: Uuid::new_v4(),
					member: Uuid::from_str(&member.uuid)?,
					field: Uuid::from_str(&field)?,
					value,
				})
			})
			.collect::<Result<_, Error>>()?,
		member
			.tags
			.into_iter()
			.map(|tag| {
				Ok(sql::MemberTag {
					id: Uuid::new_v4(),
					member: Uuid::from_str(&member.uuid)?,
					tag: Uuid::from_str(&tag)?,
				})
			})
			.collect::<Result<_, Error>>()?,
	))
}

pub fn convert_asset<D: Deref<Target = Connection>>(
	asset: Asset,
	data_path: &PathBuf,
	conn: &D,
) -> Result<sql::Asset, Error> {
	Ok(sql::Asset {
		id: Uuid::from_str(&asset.uuid)?,
		file: convert_and_save_file(asset.file, data_path, conn)?,
		friendly_name: asset.friendly_name,
	})
}

pub fn convert_post<D: Deref<Target = Connection>>(
	post: JournalPost,
	data_path: &PathBuf,
	conn: &D,
) -> Result<(sql::JournalPost, Vec<sql::JournalPostTag>), Error> {
	Ok((
		sql::JournalPost {
			id: Uuid::from_str(&post.uuid)?,
			member: post
				.member
				.map(|member| Uuid::from_str(&member))
				.transpose()?,
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
		},
		post.tags
			.into_iter()
			.map(|tag| {
				Ok(sql::JournalPostTag {
					id: Uuid::new_v4(),
					post: Uuid::from_str(&post.uuid)?,
					tag: Uuid::from_str(&tag)?,
				})
			})
			.collect::<Result<Vec<sql::JournalPostTag>, Error>>()?,
	))
}

pub fn convert_fronting_entry(
	entry: FrontingEntry,
) -> Result<(sql::FrontingEntry, Vec<sql::PresenceEntry>), Error> {
	Ok((
		sql::FrontingEntry {
			id: Uuid::from_str(&entry.uuid)?,
			member: Uuid::from_str(&entry.member)?,
			start_time: convert_datetime(entry.start_time)?.into(),
			end_time: entry
				.end_time
				.map(|end_time| convert_datetime(end_time))
				.transpose()?
				.map(Into::into),
			is_main_fronter: entry.is_main_fronter.unwrap_or_default(),
			is_locked: entry.is_locked.unwrap_or_default(),
			custom_status: entry.custom_status,
			influencing: entry
				.influencing
				.map(|influencing| Uuid::from_str(&influencing))
				.transpose()?,
			comment: entry.comment,
		},
		entry
			.presence
			.unwrap_or_default()
			.into_iter()
			.map(|(k, v)| {
				Ok(sql::PresenceEntry {
					id: Uuid::new_v4(),
					fronting_entry: Uuid::from_str(&entry.uuid)?,
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
		id: Uuid::from_str(&message.uuid)?,
		member: message
			.member
			.map(|member| Uuid::from_str(&member))
			.transpose()?,
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
				votes.into_iter().map(move |vote| {
					Ok(sql::Vote {
						id: Uuid::new_v4(),
						entry: entry,
						member: Uuid::from_str(&vote.member)?,
						reason: vote.reason,
					})
				})
			})
			.collect::<Result<Vec<sql::Vote>, Error>>()?,
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
	FromUtf8(#[from] std::string::FromUtf8Error),
	#[error(transparent)]
	Uuid(#[from] uuid::Error),
}
impl<T> From<std::sync::PoisonError<T>> for Error {
	fn from(_: std::sync::PoisonError<T>) -> Self {
		Self::Poison
	}
}
