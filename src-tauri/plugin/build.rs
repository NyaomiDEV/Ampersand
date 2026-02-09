const COMMANDS: &[&str] = &[
	"open_file",
	"get_webkit_version",
	"broadcast_event",
	"list_assets",
	"dismiss_splash",
	"register_listener",
	"db_test",
	"db_run_migrations",
	"db_migrate_old"
];

fn main() {
	tauri_plugin::Builder::new(COMMANDS)
		.android_path("android")
		.ios_path("ios")
		.build();
}
