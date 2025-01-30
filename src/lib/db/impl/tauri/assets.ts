import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../../events";
import { makeUUIDv5 } from "../../../util/uuid";
import { UUID, UUIDable, Asset } from "../../entities";
import { getSystemUUID } from "./system";

export function getAssets(){
	return db.assets.toArray();
}

async function genid(name: string) {
	return makeUUIDv5((await getSystemUUID())!, `assets\0${name}\0${Date.now()}`);
}

export async function newAsset(asset: Omit<Asset, keyof UUIDable>) {
	try{
		const uuid = await genid(asset.file.name);
		await db.assets.add(uuid, {
			...asset,
			uuid
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "assets",
			event: "new",
			data: uuid
		}));
		return true;
	}catch(error){
		return false;
	}
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
	} catch (error) {
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
	}catch(error){
		return false;
	}
}