use rusqlite::ToSql;
use rusqlite::{params_from_iter, Connection};
use serde::{Deserialize, Serialize};
use std::ops::Deref;
use std::sync::Mutex;
use time::OffsetDateTime;
use uuid::Uuid;

use extruct::Fields;
use rusqlite_from_row::FromRow;

use crate::db::types::sql::*;

pub trait SqlTable {
	fn table_name() -> &'static str;
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum FieldType {
	Uuid(Uuid),
	OptionUuid(Option<Uuid>),
	String(String),
	OptionString(Option<String>),
	OffsetDateTime(OffsetDateTime),
	OptionOffsetDateTime(Option<OffsetDateTime>),
	Bool(bool),
	OptionBool(Option<bool>),
	U8(u8),
	I8(i8),
}
impl ToSql for FieldType {
	fn to_sql(&self) -> rusqlite::Result<rusqlite::types::ToSqlOutput<'_>> {
		match self {
			FieldType::Uuid(v) => v.to_sql(),
			FieldType::OptionUuid(v) => v.to_sql(),
			FieldType::String(v) => v.to_sql(),
			FieldType::OptionString(v) => v.to_sql(),
			FieldType::OffsetDateTime(v) => v.to_sql(),
			FieldType::OptionOffsetDateTime(v) => v.to_sql(),
			FieldType::Bool(v) => v.to_sql(),
			FieldType::OptionBool(v) => v.to_sql(),
			FieldType::U8(v) => v.to_sql(),
			FieldType::I8(v) => v.to_sql(),
		}
	}
}

pub trait FieldTypeable {
	fn to_field_type(&self) -> FieldType;
}
impl FieldTypeable for Uuid {
	fn to_field_type(&self) -> FieldType {
		FieldType::Uuid(self.clone())
	}
}
impl FieldTypeable for Option<Uuid> {
	fn to_field_type(&self) -> FieldType {
		FieldType::OptionUuid(self.clone())
	}
}
impl FieldTypeable for String {
	fn to_field_type(&self) -> FieldType {
		FieldType::String(self.clone())
	}
}
impl FieldTypeable for Option<String> {
	fn to_field_type(&self) -> FieldType {
		FieldType::OptionString(self.clone())
	}
}
impl FieldTypeable for OffsetDateTime {
	fn to_field_type(&self) -> FieldType {
		FieldType::OffsetDateTime(self.clone())
	}
}
impl FieldTypeable for Option<OffsetDateTime> {
	fn to_field_type(&self) -> FieldType {
		FieldType::OptionOffsetDateTime(self.clone())
	}
}
impl FieldTypeable for bool {
	fn to_field_type(&self) -> FieldType {
		FieldType::Bool(*self)
	}
}
impl FieldTypeable for Option<bool> {
	fn to_field_type(&self) -> FieldType {
		FieldType::OptionBool(*self)
	}
}
impl FieldTypeable for u8 {
	fn to_field_type(&self) -> FieldType {
		FieldType::U8(*self)
	}
}
impl FieldTypeable for i8 {
	fn to_field_type(&self) -> FieldType {
		FieldType::I8(*self)
	}
}

pub trait FieldArrayable {
	fn get_field_array(self) -> Vec<FieldType>;
}
pub fn get_field_array(values: &[&dyn FieldTypeable]) -> Vec<FieldType> {
	values.iter().map(|v| v.to_field_type()).collect()
}

pub trait Queryable {
	fn fields_as_statement(start_at: usize) -> String;
	fn field_numbers(start_at: usize) -> Vec<String>;
	fn select<D: Deref<Target = Connection>>(id: Uuid, conn: &D) -> crate::Result<Self>
	where
		Self: Sized;
	fn list<D: Deref<Target = Connection>>(conn: &D) -> crate::Result<Vec<Uuid>>;
	fn update<D: Deref<Target = Connection>>(self, conn: &D) -> crate::Result<()>;
	fn delete<D: Deref<Target = Connection>>(self, conn: &D) -> crate::Result<()>;
	fn insert<D: Deref<Target = Connection>>(self, conn: &D) -> crate::Result<()>;
}
impl<T: FromRow + Fields + SqlTable + FieldArrayable> Queryable for T {
	fn field_numbers(start_at: usize) -> Vec<String> {
		let mut i: usize = start_at;
		Self::fields()
			.iter()
			.map(|_| {
				let out = format!("?{i}");
				i += 1;
				out
			})
			.collect::<Vec<_>>()
	}
	fn fields_as_statement(start_at: usize) -> String {
		let mut i: usize = start_at;
		Self::fields()
			.into_iter()
			.map(|field| {
				let out = format!("{field} = ?{i}");
				i += 1;
				out
			})
			.collect::<Vec<_>>()
			.join(", ")
	}
	fn select<D: Deref<Target = Connection>>(id: Uuid, conn: &D) -> crate::Result<Self> {
		Ok(conn.query_row(
			&format!(
				"SELECT {} FROM {} WHERE id = ?1;",
				Self::fields().join(", "),
				Self::table_name()
			),
			[id],
			Self::try_from_row,
		)?)
	}
	fn list<D: Deref<Target = Connection>>(conn: &D) -> crate::Result<Vec<Uuid>> {
		Ok(conn
			.prepare(&format!("SELECT id FROM {};", Self::table_name()))?
			.query_map((), |row| row.get::<_, Uuid>(0))?
			.collect::<Result<Vec<_>, _>>()?)
	}
	fn update<D: Deref<Target = Connection>>(self, conn: &D) -> crate::Result<()> {
		conn.execute(
			&format!(
				"UPDATE {} SET {} WHERE id = ?1;",
				Self::table_name(),
				Self::fields_as_statement(2)
			),
			params_from_iter(self.get_field_array().into_iter()),
		)?;
		Ok(())
	}
	fn delete<D: Deref<Target = Connection>>(self, conn: &D) -> crate::Result<()> {
		conn.execute(
			&format!("DELETE FROM {} WHERE id = ?1;", Self::table_name()),
			[self.get_field_array()[0].clone()],
		)?;
		Ok(())
	}
	fn insert<D: Deref<Target = Connection>>(self, conn: &D) -> crate::Result<()> {
		conn.execute(
			&format!(
				"INSERT INTO {} ({}) VALUES ({});",
				Self::table_name(),
				Self::fields().join(", "),
				Self::field_numbers(1).join(", ")
			),
			params_from_iter(self.get_field_array().into_iter()),
		)?;
		Ok(())
	}
}

impl Asset {
	pub fn filter(filter: String, conn: &Mutex<Connection>) -> crate::Result<Vec<Uuid>> {
		Ok(conn
			.lock()?
			.prepare("SELECT id FROM assets WHERE friendly_name like '%?1%' escape '\\';")?
			.query_map([filter.replace("%", "\\%")], |row| row.get::<_, Uuid>(0))?
			.collect::<Result<Vec<_>, _>>()?)
	}
}

impl BoardMessage {}

impl CustomField {}

impl FrontingEntry {}

impl JournalPost {}

impl Member {}

impl Tag {}
