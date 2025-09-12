import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, Asset } from "../entities";
import { filterAsset } from "../../search";

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
		const uuid = window.crypto.randomUUID();
		await db.assets.add(uuid, {
			...asset,
			uuid
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "assets",
			event: "new",
			data: uuid
		}));
		return uuid;
	}catch(_error){
		return false;
	}
}

export function getAsset(uuid: UUID){
	return db.assets.get(uuid);
}

export async function deleteAsset(uuid: UUID) {
	try {
		await db.assets.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "assets",
			event: "deleted",
			data: uuid
		}));
		return true;
	} catch (_error) {
		return false;
	}
}

export async function updateAsset(uuid: UUID, newContent: Partial<Asset>) {
	try{
		const updated = await db.assets.update(uuid, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "assets",
				event: "modified",
				data: uuid
			}));
			return true;
		}
		return false;
	}catch(_error){
		return false;
	}
}