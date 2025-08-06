use std::fs;

use tauri::command;
use tauri_plugin_ampersand::Result;

#[command]
pub fn our_temp_dir() -> Result<String> {
    let mut temp_path = std::env::temp_dir();
    temp_path.push("ampersandTemp");
    fs::create_dir_all(dbg!(temp_path.as_path()))
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