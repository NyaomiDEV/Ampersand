//! Datatypes for passing data between the Rust and TypeScript layers

use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use time::OffsetDateTime;
use uuid::Uuid;

use super::sql::File;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BoardMessage {
	pub member: Option<Uuid>,
	pub title: String,
	pub body: String,
	pub date: OffsetDateTime,
	pub is_pinned: Option<bool>,
	pub is_archived: bool,
	pub poll: Option<Poll>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Poll {
	pub entries: Vec<PollEntry>,
	pub multiple_choice: bool,
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
pub struct FrontingEntry {
	pub member: Uuid,
	pub start_time: OffsetDateTime,
	pub end_time: Option<OffsetDateTime>,
	pub is_main_fronter: bool,
	pub is_locked: bool,
	pub custom_status: Option<String>,
	pub influencing: Option<Uuid>,
	pub presence: Option<HashMap<OffsetDateTime, u8>>,
	pub comment: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct JournalPost {
	pub member: Option<Uuid>,
	pub date: OffsetDateTime,
	pub title: String,
	pub subtitle: Option<String>,
	pub body: String,
	pub cover: Option<File>,
	pub tags: Vec<Uuid>,
	pub is_pinned: bool,
	pub is_private: bool,
	pub content_warning: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Member {
	pub name: String,
	pub pronouns: Option<String>,
	pub description: Option<String>,
	pub role: Option<String>,
	pub image: Option<File>,
	pub cover: Option<File>,
	pub color: Option<String>,
	pub custom_fields: Option<HashMap<Uuid, String>>,
	pub is_pinned: Option<bool>,
	pub is_archived: bool,
	pub is_custom_front: bool,
	pub tags: Vec<Uuid>,
	pub date_created: OffsetDateTime,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct System {
	pub name: String,
	pub description: Option<String>,
	pub image: Option<File>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Tag {
	pub name: String,
	pub description: Option<String>,
	pub r#type: TagType,
	pub color: Option<String>,
	pub view_in_lists: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum TagType {
	Member,
	Journal,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Asset {
	pub file: File,
	pub friendly_name: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CustomField {
	pub name: String,
	pub priority: i8,
	pub default: Option<bool>,
}
