const COMMANDS: &[&str] = &["exit_app", "open_file"];

fn main() {
  tauri_plugin::Builder::new(COMMANDS)
    .android_path("android")
    .ios_path("ios")
    .build();
}
