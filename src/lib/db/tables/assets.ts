import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, UUIDable, Asset } from "../entities";
import { filterAsset } from "../../search";
import { TransactionStatus } from "../types";
import { sortAssets } from "../../util/misc";

export async function* getAssets(maxIter = 10){
	const uuids = db.assets.index.sort(sortAssets).map(x => x.uuid);

	const f = (offset: number, maxIter: number) => {
		const chunk: Promise<Asset>[] = [];
		for (let i = offset; i < offset + maxIter; i++) {
			if (uuids[i]) {
				const data = db.assets.get(uuids[i]);
				chunk.push(data);
			}
		}
		return chunk;
	};

	let offset = 0;
	while (offset < uuids.length) {
		const promises = f(offset, maxIter);
		offset += maxIter;
		for (const promise of promises)
			yield await promise;
	};
}

export function getAssetsIndex(){
	return db.assets.index;
}

export async function* getFilteredAssets(query: string){
	for await (const asset of getAssets()){
		if (await filterAsset(query, asset))
			yield asset;
	}
}

export async function newAsset(asset: Omit<Asset, keyof UUIDable>): Promise<TransactionStatus<string>> {
	try{
		const uuid = await db.assets.add(asset);

		if(!uuid) throw new Error("already exists in database");

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

export async function updateAsset(newContent: UUIDable & Partial<Asset>): Promise<TransactionStatus<{ oldData: Asset, newData: Asset }>> {
	try{
		const updated = await db.assets.update(newContent);
		if(updated) {
			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "assets",
				event: "modified",
				uuid: newContent.uuid,
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