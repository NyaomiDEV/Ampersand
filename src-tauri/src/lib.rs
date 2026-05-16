mod commands;

use tauri::{WebviewWindowBuilder, WebviewUrl};

#[cfg(desktop)]
use tauri::Manager;

#[cfg(target_os = "macos")]
use tauri::{
    utils::config::WindowEffectsConfig,
    window::{Effect, Color, EffectState}
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app.get_webview_window("main")
                       .expect("no main window")
                       .set_focus();
        }));
    }

    #[cfg(mobile)]
    {
        builder = builder.plugin(tauri_plugin_biometric::init());
    }

    #[cfg(target_os = "android")]
    {
        builder = builder.plugin(tauri_plugin_m3::init())
    }

    builder
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_ampersand::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notifications::init())
        .invoke_handler(tauri::generate_handler![
            commands::noop,
            commands::our_temp_dir,
            commands::clear_temp_dir,
            commands::get_webkit_version
        ])
        .setup(|app: &mut tauri::App| {
            let win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                .title("Ampersand");

            #[cfg(desktop)]
            let win_builder = win_builder
                .resizable(true)
                .inner_size(800.0, 600.0);

            #[cfg(target_os = "macos")]
            let win_builder = win_builder
                .background_color(Color(255, 255, 255, 0))
                .transparent(true)
                .effects(WindowEffectsConfig {
                    effects: Vec::from([
                        Effect::HudWindow
                    ]),
                    color: None,
                    radius: None,
                    state: Some(EffectState::FollowsWindowActiveState)
                });

            #[cfg(target_os = "macos")]
            let win_builder = win_builder
                .title_bar_style(tauri::TitleBarStyle::Overlay)
                .hidden_title(true);

            let _window = win_builder.build()
                .expect("cannot build window");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Ampersand");
}
