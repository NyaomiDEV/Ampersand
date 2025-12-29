use tauri::{
  plugin::{Builder, TauriPlugin},
  Manager, Runtime,
};

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::Ampersand;
#[cfg(mobile)]
use mobile::Ampersand;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the ampersand APIs.
pub trait AmpersandExt<R: Runtime> {
  fn ampersand(&self) -> &Ampersand<R>;
}

impl<R: Runtime, T: Manager<R>> crate::AmpersandExt<R> for T {
  fn ampersand(&self) -> &Ampersand<R> {
    self.state::<Ampersand<R>>().inner()
  }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
  Builder::new("ampersand")
  .invoke_handler(tauri::generate_handler![
    commands::exit_app,
    commands::open_file,
    commands::get_webkit_version,
    commands::broadcast_event,
    commands::list_assets,
    commands::dismiss_splash
  ])
    .setup(|app, api: tauri::plugin::PluginApi<R, ()>| {
      #[cfg(mobile)]
      let ampersand = mobile::init(app, api)?;
      #[cfg(desktop)]
      let ampersand = desktop::init(app, api)?;
      app.manage(ampersand);
      Ok(())
    })
    .build()
}
