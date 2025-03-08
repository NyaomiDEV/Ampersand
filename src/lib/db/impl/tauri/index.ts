import * as path from '@tauri-apps/api/path';
import * as fs from '@tauri-apps/plugin-fs';
import { Typeson } from "typeson";
import { blob, file, filelist, map, typedArrays, undef, set as Tset, imagebitmap, imagedata } from "typeson-registry";
import { Asset, BoardMessage, Chat, ChatMessage, CustomField, FrontingEntry, JournalPost, Member, Reminder, System, Tag, UUIDable } from '../../entities';
import { decode, encode } from '@msgpack/msgpack';

type IndexEntry<T> = UUIDable & Partial<T>;
type SecondaryKey<T> = (Exclude<keyof T, keyof UUIDable>);

class ShittyTable<T extends UUIDable> {
	name: string;
	path: string;
	secondaryKeys: SecondaryKey<T>[];
	index: Array<IndexEntry<T>>;

	constructor(name: string, path: string, secondaryKeys: SecondaryKey<T>[]) {
		this.name = name;
		this.path = path;
		this.secondaryKeys = secondaryKeys;
		this.index = [];
	}

	async getIndexFromDisk(){
		const _path = await path.resolve(this.path, ".index");
		try {
			const obj = decode(await fs.readFile(_path));
			if (typeof obj !== "undefined") {
				return await typeson.revive(obj) as Array<IndexEntry<T>>;
			}
		} catch (e) {
			console.error(e);
		}

		return undefined;
	}

	async saveIndexToDisk() {
		const _path = await path.resolve(this.path, ".index");
		try {
			await fs.writeFile(_path, encode(await typeson.encapsulate(this.index)));
			return true;
		} catch (e) {
			console.error(e);
		}
		return false;
	}

	async updateIndexWithData(data: T, saveAfterwards: boolean = true){
		const indexEntry: any = {uuid: data.uuid};
		for(const key of this.secondaryKeys){
			indexEntry[key] = data[key];
		}

		const _index = this.index.findIndex(x => data.uuid === x.uuid);
		if(_index > -1){
			this.index[_index] = indexEntry;
		} else {
			this.index.push(indexEntry);
		}

		if(saveAfterwards)
			await this.saveIndexToDisk();
	}

	async removeIndex(uuid: string) {
		const _index = this.index.findIndex(x => uuid === x.uuid);
		if (_index == -1) return;

		this.index.splice(_index, 1);
		await this.saveIndexToDisk();
	}

	async initializeIndex() {		
		const dir = await this.walkDir();
		if (!dir) return;

		const diskIndex = await this.getIndexFromDisk();

		if (diskIndex && diskIndex.length && this.secondaryKeys.reduce((v, i) => { v = Object.keys(diskIndex[0]).includes(i as string); return v }, true)){
			this.index = diskIndex;

			for(const key of this.index.keys()){
				if(!dir.find(x => x.name === this.index[key].uuid)){
					this.index.splice(key, 1);
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
		const _path = await path.resolve(this.path, uuid);
		try {
			const obj = decode(await fs.readFile(_path));
			if (typeof obj !== "undefined") {
				return await typeson.revive(obj) as T;
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

	async toArray() {
		const arr: T[] = [];
		for (const x of this.index.map(x => x.uuid)) {
			const data = await this.get(x);
			if (data) arr.push(data);
		}

		return arr;
	}

	async write(uuid: string, data: T) {
		const _path = await path.resolve(this.path, uuid);
		try{
			await fs.writeFile(_path, encode(await typeson.encapsulate(data)));
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
				const _path = await path.resolve(this.path, content.uuid);
				try {
					await fs.writeFile(_path, encode(await typeson.encapsulate(content)));
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
			const data = {...oldData, ...newData};
			return await this.write(uuid, data);
		}

		return false;
	}

	async delete(uuid: string) {
		const _path = await path.resolve(this.path, uuid);
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
			for (const key of this.index.keys()){
				await fs.remove(await path.resolve(this.path, this.index[key].uuid));
				this.index.splice(key, 1);
			}
			return true;
		} catch(e) {
			console.log(e);
		}

		this.saveIndexToDisk();
		return false;
	}
}

const typeson = new Typeson().register([
	file,
	filelist,
	blob,
	typedArrays,
	undef,
	map,
	Tset,
	imagebitmap,
	imagedata
]);

async function makeTable<T extends UUIDable>(tableName: string, secondaryKeys: SecondaryKey<T>[]) {
	const _path = await path.resolve(await path.appDataDir(), 'database', tableName);
	await fs.mkdir(_path, { recursive: true });

	const table = new ShittyTable<T>(tableName, _path, secondaryKeys);
	await table.initializeIndex();

	return table;
}

export function getTables(): ShittyTable<any>[] {
	return Object.values(db);
}

export const db = {
	boardMessages: await makeTable<BoardMessage>("boardMessages", ["date"]),
	chats: await makeTable<Chat>("chats", ["name"]),
	chatMessages: await makeTable<ChatMessage>("chatMessages", ["chat", "date"]),
	frontingEntries: await makeTable<FrontingEntry>("frontingEntries", ["startTime", "endTime"]),
	journalPosts: await makeTable<JournalPost>("journalPosts", ["date"]),
	members: await makeTable<Member>("members", []),
	reminders: await makeTable<Reminder>("reminders", []),
	system: await makeTable<System>("system", []),
	tags: await makeTable<Tag>("tags", []),
	assets: await makeTable<Asset>("assets", []),
	customFields: await makeTable<CustomField>("customFields", [])
}

