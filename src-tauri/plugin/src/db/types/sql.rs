//! Datatypes for passing data between Rust and Sqlite

use serde::{Deserialize, Serialize};
use time::OffsetDateTime;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BoardMessage {
	pub id: Uuid,
	pub member: Option<Uuid>,
	pub title: Option<String>,
	pub body: String,
	pub date: OffsetDateTime,
	pub is_pinned: bool,
	pub is_archived: bool,
	pub poll: Option<Uuid>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Poll {
	pub id: Uuid,
	pub multiple_choice: bool,
}
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PollEntry {
	pub id: Uuid,
	pub poll: Uuid,
	pub choice: String,
}
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Vote {
	pub id: Uuid,
	pub entry: Uuid,
	pub member: Uuid,
	pub reason: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FrontingEntry {
	pub id: Uuid,
	pub member: Uuid,
	pub start_time: OffsetDateTime,
	pub end_time: Option<OffsetDateTime>,
	pub is_main_fronter: bool,
	pub is_locked: bool,
	pub custom_status: Option<String>,
	pub influencing: Option<Uuid>,
	pub comment: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PresenceEntry {
	pub id: Uuid,
	pub fronting_entry: Uuid,
	pub date: OffsetDateTime,
	pub presence: u8,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct JournalPost {
	pub id: Uuid,
	pub member: Option<Uuid>,
	pub date: OffsetDateTime,
	pub title: String,
	pub subtitle: Option<String>,
	pub body: String,
	pub cover: Option<Uuid>,
	pub is_pinned: bool,
	pub is_private: bool,
	pub content_warning: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Member {
	pub id: Uuid,
	pub system: Uuid,
	pub name: String,
	pub pronouns: Option<String>,
	pub description: Option<String>,
	pub role: Option<String>,
	pub image: Option<Uuid>,
	pub cover: Option<Uuid>,
	pub color: Option<String>,
	pub is_pinned: bool,
	pub is_archived: bool,
	pub is_custom_front: bool,
	pub date_created: OffsetDateTime,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CustomField {
	pub id: Uuid,
	pub name: String,
	pub priority: i8,
	pub is_default: bool,
}
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CustomFieldDatum {
	pub id: Uuid,
	pub member: Uuid,
	pub field: Uuid,
	pub value: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct System {
	pub id: Uuid,
	pub name: String,
	pub description: Option<String>,
	pub image: Option<Uuid>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Tag {
	pub id: Uuid,
	pub name: String,
	pub description: Option<String>,
	pub r#type: Uuid,
	pub color: Option<String>,
	pub view_in_lists: bool,
}
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TagType {
	pub id: Uuid,
	pub label: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Asset {
	pub id: Uuid,
	pub file: Uuid,
	pub friendly_name: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct File {
	pub id: Uuid,
	pub path: String,
	pub friendly_name: String,
}
