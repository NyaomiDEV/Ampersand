const COMMANDS: &[&str] = &["open_file", "get_webkit_version", "broadcast_event", "list_assets", "dismiss_splash", "register_listener", "test_db", "run_db_migrations"];

fn main() {
  tauri_plugin::Builder::new(COMMANDS)
    .android_path("android")
    .ios_path("ios")
    .build();
}
