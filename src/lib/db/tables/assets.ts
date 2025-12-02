import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, Asset } from "../entities";
import { filterAsset } from "../search";
import { PartialBy } from "../../types";

export function getAssets(){
	return db.assets.iterate();
}

export async function* getFilteredAssets(query: string){
	for await (const asset of getAssets()){
		if (filterAsset(query, asset))
			yield asset;
	}
}

export async function newAsset(asset: Omit<Asset, keyof UUIDable>) {
	try{
		const id = window.crypto.randomUUID();
		await db.assets.add(id, {
			...asset,
			id
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "assets",
			event: "new",
			id,
			newData: asset
		}));
		return {
			...asset,
			id
		};
	}catch(_error){
		return;
	}
}

export function getAsset(id: UUID){
	return db.assets.get(id);
}

export async function deleteAsset(asset: Asset | UUID) {
	const id = typeof asset === "string" ? asset : asset.id;
	try {
		await db.assets.delete(id);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "assets",
			event: "deleted",
			id,
			delta: {}
		}));
		return true;
	} catch (_error) {
		return false;
	}
}

export async function updateAsset(id: UUID, newContent: Partial<Asset>) {
	try{
		const updated = await db.assets.update(id, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "assets",
				event: "modified",
				id,
				delta: newContent,
				oldData: updated.oldData,
				newData: updated.newData
			}));
			return true;
		}
		return false;
	}catch(_error){
		return false;
	}
}

export async function saveAsset(asset: PartialBy<Asset, keyof UUIDable>){
	if (asset.id){
		await updateAsset(asset.id, { ...asset });
		return asset as Asset;
	}
	return await newAsset({ ...asset });
}