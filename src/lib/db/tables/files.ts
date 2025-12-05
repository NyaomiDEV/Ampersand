import { db } from ".";
import { DatabaseEvents, DatabaseEvent } from "../events";
import { UUID, SQLFile } from "../entities";
import { openFile } from "../../native/plugin";
import { readFile, remove, writeFile } from "@tauri-apps/plugin-fs";
import { appDataDir, sep } from "@tauri-apps/api/path";
import { showFileModal } from "../../util/misc";
import { resizeImage } from "../../util/image";

const filePath = `${await appDataDir() + sep()}files${sep()}`;

export function getFiles(){
	return db.files.iterate();
}

export async function fileToJSFile(file: SQLFile){
	const data = await readFile(`${filePath}${file.id}`);
	return new File([data], file.friendlyName);
}

export async function openSQLFile(file: SQLFile | UUID) {
	const id = typeof file === "string" ? file : file.id;
	return openFile(`${filePath}${id}`);
}

export async function newFile(name: string, data: Uint8Array | ReadableStream<Uint8Array>) {
	try{
		const id = window.crypto.randomUUID();
		await writeFile(`${filePath}${id}`, data);
		await db.files.add(id, {
			path: `files${sep()}${id}`,
			friendlyName: name,
			id
		});
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "files",
			event: "new",
			id,
			newData: {
				path: `${filePath}${id}`,
				friendlyName: name,
				id
			}
		}));
		return {
			path: `${filePath}${id}`,
			friendlyName: name,
			id
		};
	}catch(_error){
		return;
	}
}

export function getFile(id: UUID){
	return db.files.get(id);
}

export async function deleteFile(file: SQLFile | UUID) {
	const id = typeof file === "string" ? file : file.id;
	try {
		await remove(`${filePath}${id}`);
		await db.files.delete(id);
		DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
			table: "files",
			event: "deleted",
			id,
			delta: {}
		}));
		return true;
	} catch (_error) {
		return false;
	}
}

export async function updateFile(id: UUID, friendlyName?: string, data?: Uint8Array | ReadableStream<Uint8Array>) {
	try{
		if(data)
			await writeFile(`${filePath}${id}`, data);
		if(friendlyName){
			const updated = await db.assets.update(id, { friendlyName });
			if (!updated) return false;

			DatabaseEvents.dispatchEvent(new DatabaseEvent("updated", {
				table: "files",
				event: "modified",
				id,
				delta: friendlyName ? { friendlyName } : {},
				oldData: updated.oldData,
				newData: updated.newData
			}));
		}
		return true;
	}catch(_error){
		return false;
	}
}

export async function uploadImage(maxDimension = 512){
	const files = await showFileModal();

	if(!files[0]) throw new Error("file not chosen");

	return await newFile(
		files[0].name,
		(await resizeImage(files[0], maxDimension)).stream()
	);
}

export async function uploadFile(){
	const files = await showFileModal();

	if (!files[0]) throw new Error("file not chosen");

	return await newFile(
		files[0].name,
		files[0].stream()
	);
}