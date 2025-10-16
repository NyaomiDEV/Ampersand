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

    pub fn set_can_go_back(&self, _can_go_back: bool) -> crate::Result<()> {
        Ok(())
    }

    pub fn open_file(&self, path: String) -> crate::Result<()> {
        self.0
            .opener()
            .open_path(path, None::<&str>)
            .map_err(Into::into)
    }

    pub fn get_webkit_version(&self) -> crate::Result<String> {
        tauri::webview_version().map_err(|e| crate::Error::Other(e.to_string()))
    }

    pub fn broadcast_event(&self, _payload: String) -> crate::Result<()> {
        Ok(()) // af_unix someday?
    }

    pub fn list_assets(&self, _path: String) -> crate::Result<Vec<String>> {
        Err(crate::Error::Other("Unimplemented on Desktops".to_owned()))
    }
}
