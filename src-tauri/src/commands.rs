use std::fs;

use tauri::command;
use tauri_plugin_ampersand::Result;

// Platform independent commands and code goes here. Here we shill pure Rust or almost that.
// Commands that have to ALSO or EXCLUSIVELY interface with NATIVE INTERFACES (Android/iOS)
// go into src-tauri/plugin/src/{commands.rs,mobile.rs,desktop.rs}

#[command]
pub fn our_temp_dir() -> Result<String> {
    let mut temp_path = std::env::temp_dir();
    temp_path.push("ampersandTemp");
    fs::create_dir_all(temp_path.as_path())
        .map_err(Into::into)
        .and(Ok(temp_path))
        .map(|x| x.into_os_string().into_string().unwrap())
}

#[command]
pub fn clear_temp_dir() -> Result<()> {
    let temp_dir = our_temp_dir()?;
    for entry in fs::read_dir(temp_dir)? {
        let entry = entry?;
        let filetype = &entry.file_type()?;
        if filetype.is_dir() {
            std::fs::remove_dir_all(entry.path())?;
        }
        if filetype.is_file() {
            std::fs::remove_file(entry.path())?;
        }
    }

    Ok(())
}