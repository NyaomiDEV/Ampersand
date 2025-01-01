const impl = await ("isTauri" in window ? import('./impl/tauri') : import('./impl/dexie'));

export function getTables() {
	return impl.getTables();
}
