import { Asset, UUIDable, UUID } from '../entities';
import * as impl from '../impl/tauri/assets';

export function getAssets(){
	return impl.getAssets();
}

export function newAsset(asset: Omit<Asset, keyof UUIDable>) {
	return impl.newAsset(asset);
}

export function getAsset(uuid: UUID){
	return impl.getAsset(uuid);
}

export function deleteAsset(uuid: UUID) {
	return impl.deleteAsset(uuid);
}

export function updateAsset(uuid: UUID, newContent: Partial<Asset>) {
	return impl.updateAsset(uuid, newContent);
}