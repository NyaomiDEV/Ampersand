use rusqlite::Connection;
use serde::de::DeserializeOwned;
use std::sync::Mutex;
use tauri::{plugin::PluginApi, AppHandle, Runtime};
use tauri_plugin_opener::OpenerExt;

pub fn init<R: Runtime, C: DeserializeOwned>(
  app: &AppHandle<R>,
  connection: Mutex<Connection>,
  _api: PluginApi<R, C>,
) -> crate::Result<Ampersand<R>> {
  Ok(Ampersand(app.clone(), connection))
}

/// Access to the ampersand APIs.
pub struct Ampersand<R: Runtime>(AppHandle<R>, Mutex<Connection>);

impl<R: Runtime> Ampersand<R> {

  pub fn dismiss_splash(&self) -> crate::Result<()> {
    Ok(())
  }

  pub fn open_file(&self, path: String) -> crate::Result<()> {
    self.0.opener().open_path(path, None::<&str>).map_err(Into::into)
  }

  pub fn test_db(&self) -> crate::Result<String> {
      self.1
          .lock()
          .map_err(|_| crate::Error::Other(String::from("mutex lock failed")))?
          .query_one("SELECT sqlite_version();", (), |row| {
              row.get::<usize, String>(0)
          })
          .map_err(|_| crate::Error::Other(String::from("sql failed to execute")))
  }

  pub fn broadcast_event(&self, _payload: String) -> crate::Result<()> {
    Ok(()) // af_unix someday?
  }

  pub fn list_assets(&self, _path: String) -> crate::Result<Vec<String>> {
    Err(crate::Error::Other("Unimplemented on Desktops".to_owned()))
  }
}
