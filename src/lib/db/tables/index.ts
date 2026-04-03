import { appDataDir, sep } from "@tauri-apps/api/path";
import * as fs from "@tauri-apps/plugin-fs";
import type { Asset, BoardMessage, CustomField, FrontingEntry, JournalPost, Member, Reminder, System, Tag, UUIDable } from "../entities";
import { decode, encode } from "@msgpack/msgpack";
import type { AmpersandEntityMapping, MigrationsMapping } from "../types";
import { deleteNull, replace, revive, walk, walkAsync } from "../../serialization";
import { assets, journalPosts, members, systems } from "./migrations";

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
		try{
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const obj: any = decode(await fs.readFile(_path));
			if (typeof obj !== "undefined" && obj !== null)
				return walk(obj, revive) as IndexEntry<T>[];
		}catch(_e){
			// nothing
		}
		return undefined;
	}

	async saveIndexToDisk() {
		const _path = `${this.path + sep()}.index`;
		await fs.writeFile(_path, encode(await walkAsync(this.index, replace)));
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

	async getRaw(uuid: string){
		const _path = this.path + sep() + uuid;
		return await fs.readFile(_path);
	}

	async get(uuid: string) {
		const obj = decode(await this.getRaw(uuid));
		return walk(obj as object, revive) as T;
	}

	async walkDir() {
		const dir = (await fs.readDir(this.path)).filter(x => x.name !== ".index" && x.name !== ".migrations");
		return dir;
	}

	count() {
		return this.index.length;
	}

	/**
	 * IMPORTANT:
	 * This method here is just a convenient "polyfill" and
	 * it should preferably not be used as-is, as we might
	 * want to do preliminary sorting of indices or stuff
	 * like that instead.
	 **/
	async* iterate(maxIter: number) {
		const uuids = this.index.map(x => x.uuid);

		const f = (offset: number, maxIter: number) => {
			const chunk: Promise<T | undefined>[] = [];
			for(let i = offset; i < offset + maxIter; i++){
				if(uuids[i]){
					const data = this.get(uuids[i]);
					chunk.push(data);
				}
			}
			return chunk;
		};

		let offset = 0;
		while(offset < uuids.length) {
			const promises = f(offset, maxIter);
			offset += maxIter;
			for (const promise of promises) {
				const data = await promise;
				if (data) yield data;
			}
		};
	}

	async refresh(){
		for(const data of this.index)
			await this.update(data.uuid, {});
	}

	async write(uuid: string, data: T) {
		const _path = this.path + sep() + uuid;
		await fs.writeFile(_path, encode(deleteNull(await walkAsync(data, replace))));
		await this.updateIndexWithData(data);
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
		for (const content of contents) {
			// copy of add routine but just because we suck
			if(!this.exists(content.uuid)) {
				const _path = this.path + sep() + content.uuid;
				await fs.writeFile(_path, encode(deleteNull(await walkAsync(content, replace))));
				await this.updateIndexWithData(content, false);
			}
		}

		await this.saveIndexToDisk();
	}

	async update(uuid: string, newData: Partial<T>) {
		const oldData = await this.get(uuid);

		if (oldData) {
			const data = { ...oldData, ...newData } as T;
			await this.write(uuid, data);
			return { oldData, newData: data };
		}

		return false;
	}

	async delete(uuid: string) {
		const _path = this.path + sep() + uuid;
		await fs.remove(_path);
		await this.removeIndex(uuid);
	}

	async clear() {
		const _dir = await this.walkDir();
		if(!_dir) throw new Error("no directory to clear");

		for (const file of _dir){
			await fs.remove(this.path + sep() + file.name);
			this.index = this.index.filter(x => x.uuid !== file.name);
		}

		await this.saveIndexToDisk();
	}

	async getMigrationVersion(){
		const _path = `${this.path + sep()}.migrations`;
		try {
			const migrations = decode(await fs.readFile(_path)) as MigrationsMapping;
			return migrations.version;
		} catch (e) {
			console.error(e);
			return 0;
		}
	}

	async saveMigrationVersion(version: number){
		const _path = `${this.path + sep()}.migrations`;
		await fs.writeFile(_path, encode({ version }));
	}

	async migrate(){
		let version = await this.getMigrationVersion() || 0;
		switch (this.name) {
			case "members":
				version = await members(this as unknown as ShittyTable<Member>, version);
				break;
			case "system":
				version = await systems(this as unknown as ShittyTable<System>, version);
				break;
			case "journalPosts":
				version = await journalPosts(this as unknown as ShittyTable<JournalPost>, version);
				break;
			case "assets":
				version = await assets(this as unknown as ShittyTable<Asset>, version);
				break;
		}
		await this.saveMigrationVersion(version);
	}
}

async function makeTable<T extends UUIDable>(tableName: string, secondaryKeys: SecondaryKey<T>[]) {
	const _path = `${await appDataDir() + sep()}database${sep() + tableName}`;
	await fs.mkdir(_path, { recursive: true });

	const table = new ShittyTable<T>(tableName, _path, secondaryKeys);
	await table.initializeIndex();
	await table.migrate();

	return table;
}

type GetTableTauriExport = { [T in keyof AmpersandEntityMapping]: ShittyTable<AmpersandEntityMapping[T]> };
export function getTables(): GetTableTauriExport {
	return { ...db };
}

export const db = {
	systems: await makeTable<System>("system", ["name", "parent", "isPinned", "isArchived"]),
	members: await makeTable<Member>("members", ["name", "system", "isPinned", "isArchived", "isCustomFront"]),
	boardMessages: await makeTable<BoardMessage>("boardMessages", ["member", "date", "isPinned", "isArchived"]),
	frontingEntries: await makeTable<FrontingEntry>("frontingEntries", ["member", "startTime", "endTime", "isLocked", "isMainFronter"]),
	journalPosts: await makeTable<JournalPost>("journalPosts", ["member", "date", "isPinned"]),
	reminders: await makeTable<Reminder>("reminders", []),
	tags: await makeTable<Tag>("tags", ["name"]),
	assets: await makeTable<Asset>("assets", ["friendlyName"]),
	customFields: await makeTable<CustomField>("customFields", ["name", "priority"])
};
