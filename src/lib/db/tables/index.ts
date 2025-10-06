import { appDataDir, sep } from "@tauri-apps/api/path";
import * as fs from "@tauri-apps/plugin-fs";
import { Typeson } from "typeson";
import { file, map, undef } from "typeson-registry";
import { Asset, BoardMessage, CustomField, FrontingEntry, JournalPost, Member, Reminder, System, Tag, UUIDable } from "../entities";
import { decode, encode } from "@msgpack/msgpack";
import { AmpersandEntityMapping } from "../types";
import { deleteNull, replace, revive, walk } from "../../json";

export type IndexEntry<T> = UUIDable & Partial<T>;
type SecondaryKey<T> = (Exclude<keyof T, keyof UUIDable>);

export class ShittyTable<T extends UUIDable> {
	name: string;
	path: string;
	secondaryKeys: SecondaryKey<T>[];
	index: IndexEntry<T>[];

	constructor(name: string, path: string, secondaryKeys: SecondaryKey<T>[]) {
		this.name = name;
		this.path = path;
		this.secondaryKeys = secondaryKeys;
		this.index = [];
	}

	async getIndexFromDisk(){
		const _path = `${this.path + sep()}.index`;
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const obj: any = decode(await fs.readFile(_path));
			if (typeof obj !== "undefined" && obj !== null){
				if(obj.$types)
					return await typeson.revive(obj) as IndexEntry<T>[];
				else 
					return walk(obj, revive) as IndexEntry<T>[];
			}
			
		} catch (e) {
			console.error(e);
		}

		return undefined;
	}

	async saveIndexToDisk() {
		const _path = `${this.path + sep()}.index`;
		try {
			await fs.writeFile(_path, encode(walk(this.index, replace)));
			return true;
		} catch (e) {
			console.error(e);
		}
		return false;
	}

	async updateIndexWithData(data: T, saveAfterwards: boolean = true){
		const indexEntry: IndexEntry<T> = { uuid: data.uuid } as IndexEntry<T>;
		for(const key of this.secondaryKeys)
			indexEntry[key] = data[key];
		

		const _index = this.index.findIndex(x => data.uuid === x.uuid);
		if(_index > -1)
			this.index[_index] = indexEntry;
		else 
			this.index.push(indexEntry);
		

		if(saveAfterwards)
			await this.saveIndexToDisk();
	}

	async removeIndex(uuid: string) {
		const _entry = this.index.find(x => uuid === x.uuid);
		if (!_entry) return;

		this.index = this.index.filter(x => x !== _entry);
		await this.saveIndexToDisk();
	}

	async initializeIndex() {
		const dir = await this.walkDir();
		if (!dir) return;

		const diskIndex = await this.getIndexFromDisk();

		if (diskIndex && diskIndex.length){
			this.index = diskIndex;

			for(const entry of this.index){
				if(!dir.find(x => x.name === entry.uuid)){
					this.index = this.index.filter(x => x.uuid !== entry.uuid);
					continue;
				}

				for(const key of this.secondaryKeys){
					if (!Object.keys(entry).includes(key as string)){
						const contents = await this.get(entry.uuid);
						if (!contents) continue;
						await this.updateIndexWithData(contents, false);
					}
				}
			}
		}

		for (const file of dir) {
			if (!this.index.find(x => x.uuid === file.name)) {
				const contents = await this.get(file.name);
				if (!contents) continue;
				await this.updateIndexWithData(contents, false);
			}
		}

		await this.saveIndexToDisk();
	}

	async get(uuid: string) {
		const _path = this.path + sep() + uuid;
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const obj: any = decode(await fs.readFile(_path));
			if (typeof obj !== "undefined" && obj !== null){
				if(obj.$types){
					// subtle migration
					const data = await typeson.revive(obj) as T;
					await this.write(uuid, data);
					return data;
				} else
					return walk(obj, revive) as T;
			}
		} catch (e) {
			console.error(e);
		}

		return undefined;
	}

	async walkDir() {
		try {
			const dir = (await fs.readDir(this.path)).filter(x => x.name !== ".index");
			return dir;
		} catch (e) {
			console.error(e);
		}

		return undefined;
	}

	count() {
		return this.index.length;
	}

	async* iterate() {
		for (const x of this.index.map(x => x.uuid)) {
			const data = await this.get(x);
			if (data) yield data;
		}
	}

	async write(uuid: string, data: T) {
		const _path = this.path + sep() + uuid;
		try{
			await fs.writeFile(_path, encode(deleteNull(walk(data, replace))));
			await this.updateIndexWithData(data);
			return true;
		}catch(e){
			console.error(e);
		}
		return false;
	}

	exists(uuid: string) {
		return !!this.index.find(x => uuid === x.uuid);
	}

	async add(uuid: string, data: T) {
		if (!this.exists(uuid)) {
			await this.write(uuid, data);
			return true;
		}
		return false;
	}

	async bulkAdd(contents: T[]) {
		let res = true;
		for (const content of contents) {
			// copy of add routine but just because we suck
			if(!this.exists(content.uuid)) {
				const _path = this.path + sep() + content.uuid;
				try {
					await fs.writeFile(_path, encode(deleteNull(walk(content, replace))));
					await this.updateIndexWithData(content, false);
				} catch (e) {
					console.error(e);
					res = false;
					break;
				}
			}
		}

		await this.saveIndexToDisk();
		return res;
	}

	async update(uuid: string, newData: Partial<T>) {
		const oldData = await this.get(uuid);

		if (oldData) {
			const data = { ...oldData, ...newData } as T;
			if(await this.write(uuid, data))
				return { oldData, newData: data };
		}

		return false;
	}

	async delete(uuid: string) {
		const _path = this.path + sep() + uuid;
		try{
			await fs.remove(_path);
			await this.removeIndex(uuid);
			return true;
		}catch(e){
			console.error(e);
		}
		return false;
	}

	async clear() {
		try {
			const _dir = await this.walkDir();
			if(!_dir) return false;

			for (const file of _dir){
				await fs.remove(this.path + sep() + file.name);
				this.index = this.index.filter(x => x.uuid !== file.name);
			}
			return true;
		} catch(e) {
			console.error(e);
		}

		await this.saveIndexToDisk();
		return false;
	}

	async migrateAll(){
		const dir = await this.walkDir();
		if(!dir) return;
		for(const file of dir) await this.get(file.name);
	}
}

const typeson = new Typeson().register([
	file,
	undef,
	map
]);

async function makeTable<T extends UUIDable>(tableName: string, secondaryKeys: SecondaryKey<T>[]) {
	const _path = `${await appDataDir() + sep()}database${sep() + tableName}`;
	await fs.mkdir(_path, { recursive: true });

	const table = new ShittyTable<T>(tableName, _path, secondaryKeys);
	await table.initializeIndex();

	return table;
}

type GetTableTauriExport = { [T in keyof AmpersandEntityMapping]: ShittyTable<AmpersandEntityMapping[T]> };
export function getTables(): GetTableTauriExport {
	return { ...db };
}

export const db = {
	boardMessages: await makeTable<BoardMessage>("boardMessages", ["member", "date", "isPinned", "isArchived"]),
	frontingEntries: await makeTable<FrontingEntry>("frontingEntries", ["member", "startTime", "endTime", "isLocked"]),
	journalPosts: await makeTable<JournalPost>("journalPosts", ["member", "date", "isPinned"]),
	members: await makeTable<Member>("members", []),
	reminders: await makeTable<Reminder>("reminders", []),
	system: await makeTable<System>("system", []),
	tags: await makeTable<Tag>("tags", []),
	assets: await makeTable<Asset>("assets", []),
	customFields: await makeTable<CustomField>("customFields", [])
};
