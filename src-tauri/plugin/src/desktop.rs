use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};
use tauri_plugin_opener::OpenerExt;

pub fn init<R: Runtime, C: DeserializeOwned>(
  app: &AppHandle<R>,
  _api: PluginApi<R, C>,
) -> crate::Result<Ampersand<R>> {
  Ok(Ampersand(app.clone()))
}

/// Access to the ampersand APIs.
pub struct Ampersand<R: Runtime>(AppHandle<R>);

impl<R: Runtime> Ampersand<R> {
  pub fn exit_app(&self) -> crate::Result<()> {
    self.0.exit(0);
    Ok(())
  }

  pub fn open_file(&self, path: String) -> crate::Result<()> {
    self.0.opener().open_path(path, None::<&str>).map_err(Into::into)
  }
}
