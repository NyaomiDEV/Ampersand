const impl = await import('./impl/dexie');

export function getTables() {
	return impl.getTables();
}