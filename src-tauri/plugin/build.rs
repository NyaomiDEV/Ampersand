const COMMANDS: &[&str] = &[
	"exit_app",
	"open_file",
	"test_db",
	"set_can_go_back",
	"get_webkit_version",
	"broadcast_event",
	"list_assets",
	"registerListener",
];

fn main() {
	tauri_plugin::Builder::new(COMMANDS)
		.android_path("android")
		.ios_path("ios")
		.build();
}
