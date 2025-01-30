import { Asset, UUIDable, UUID } from '../entities';

const impl = await ("isTauri" in window ? import('../impl/tauri/assets') : import('../impl/dexie/assets'));

export function getAssets(){
	return impl.getAssets();
}

export function newAsset(asset: Omit<Asset, keyof UUIDable>) {
	return impl.newAsset(asset);
}

export function deleteAsset(uuid: UUID) {
	return impl.deleteAsset(uuid);
}

export function updateAsset(uuid: UUID, newContent: Partial<Asset>) {
	return impl.updateAsset(uuid, newContent);
}