import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, Asset } from "../entities";
import { filterAsset } from "../../search";
import { TransactionStatus } from "../types";

export function getAssets(){
	return db.assets.iterate();
}

export async function* getFilteredAssets(query: string){
	for await (const asset of getAssets()){
		if (filterAsset(query, asset))
			yield asset;
	}
}

export async function newAsset(asset: Omit<Asset, keyof UUIDable>): Promise<TransactionStatus<string>> {
	try{
		const uuid = window.crypto.randomUUID();
		const result = await db.assets.add(uuid, {
			...asset,
			uuid
		});

		if(!result) throw new Error("already exists in database");

		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "assets",
			event: "new",
			uuid,
			newData: asset
		}));
		return {
			success: true,
			detail: uuid
		};
	}catch(_e){
		console.error(_e);
		return {
			success: false,
			err: _e
		};
	}
}

export function getAsset(uuid: UUID){
	return db.assets.get(uuid);
}

export async function deleteAsset(uuid: UUID): Promise<TransactionStatus<void>> {
	try {
		await db.assets.delete(uuid);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "assets",
			event: "deleted",
			uuid,
			delta: {}
		}));
		return { success: true };
	} catch (_e) {
		console.error(_e);
		return {
			success: false,
			err: _e
		};
	}
}

export async function updateAsset(uuid: UUID, newContent: Partial<Asset>): Promise<TransactionStatus<{ oldData: Asset, newData: Asset }>> {
	try{
		const updated = await db.assets.update(uuid, newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "assets",
				event: "modified",
				uuid,
				delta: newContent,
				oldData: updated.oldData,
				newData: updated.newData
			}));
			return { success: true, detail: updated };
		}
		throw new Error("not updated, did not exist in db");
	}catch(_e){
		console.error(_e);
		return {
			success: false,
			err: _e
		};
	}
}