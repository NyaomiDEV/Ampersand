use serde::de::DeserializeOwned;
use serde::{Serialize, Deserialize};
use tauri::{
  plugin::{PluginApi, PluginHandle},
  AppHandle, Runtime,
};

#[cfg(target_os = "android")]
const PLUGIN_IDENTIFIER: &str = "moe.ampersand.app.plugin";

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_ampersand);

// initializes the Kotlin or Swift plugin classes
pub fn init<R: Runtime, C: DeserializeOwned>(
  _app: &AppHandle<R>,
  api: PluginApi<R, C>,
) -> crate::Result<Ampersand<R>> {
  #[cfg(target_os = "android")]
  let handle = api.register_android_plugin(PLUGIN_IDENTIFIER, "AmpersandPlugin")?;
  #[cfg(target_os = "ios")]
  let handle = api.register_ios_plugin(init_plugin_ampersand)?;
  Ok(Ampersand(handle))
}

/// Structs to pass to the mobile APIs

#[derive(Serialize)]
struct OpenFile {
  path: String
}

#[derive(Serialize)]
struct BroadcastEvent {
  payload: String
}

#[derive(Serialize)]
struct GetResourceFileDescriptor {
  path: String,
  mode: String
}

#[derive(Serialize)]
struct ListAssets {
  path: String
}

#[derive(Deserialize)]
struct WebkitVersion {
  version: String
}

#[derive(Deserialize)]
struct ResourceFileDescriptor {
  fd: Option<i32>,
}

#[derive(Deserialize)]
struct ListAssetsResponse {
  files: Vec<String>
}

/// Access to the ampersand APIs.
pub struct Ampersand<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> Ampersand<R> {

  pub fn dismiss_splash(&self) -> crate::Result<()> {
    self
      .0
      .run_mobile_plugin("dismissSplash", ())
      .map_err(Into::into)
  }

  pub fn open_file(&self, path: String) -> crate::Result<()> {
    self
      .0
      .run_mobile_plugin("openFile", OpenFile { path })
      .map_err(Into::into)
  }

  pub fn get_webkit_version(&self) -> crate::Result<String> {
    self
      .0
      .run_mobile_plugin::<WebkitVersion>("getWebkitVersion", ())
      .map(|x| x.version)
      .map_err(Into::into)
  }

  pub fn broadcast_event(&self, payload: String) -> crate::Result<()> {
    self
      .0
      .run_mobile_plugin("broadcastEvent", BroadcastEvent { payload })
      .map_err(Into::into)
  }

  pub fn get_resource_file_descriptor(&self, path: String, mode: String) -> crate::Result<std::fs::File> {
    let result = self
      .0
      .run_mobile_plugin::<ResourceFileDescriptor>("getResourceFileDescriptor", GetResourceFileDescriptor { path, mode })?;

    if let Some(fd) = result.fd {
      Ok(unsafe {
        use std::os::fd::FromRawFd;
        std::fs::File::from_raw_fd(fd)
      })
    } else {
      Err(crate::Error::Other("couldn't get fd".to_owned()))
    }
  }

  pub fn list_assets(&self, path: String) -> crate::Result<Vec<String>> {
    self
      .0
      .run_mobile_plugin::<ListAssetsResponse>("listAssets", ListAssets { path })
      .map(|x| x.files)
      .map_err(Into::into)
  }
}
