#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_ampersand::init())
        .setup(|_app: &mut tauri::App| {
            #[cfg(mobile)]
            _app.handle()
                .plugin(tauri_plugin_biometric::init())
                .expect("error while running Ampersand");

            #[cfg(mobile)]
            _app.handle()
                .plugin(tauri_plugin_m3::init())
                .expect("error while running Ampersand");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Ampersand");
}
