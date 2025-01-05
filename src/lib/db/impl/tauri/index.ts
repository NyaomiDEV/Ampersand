import * as path from '@tauri-apps/api/path';
import * as fs from '@tauri-apps/plugin-fs';
import { Typeson } from "typeson";
import { blob, file, filelist, map, typedArrays, undef, set as Tset, imagebitmap, imagedata } from "typeson-registry";
import { BoardMessage, Chat, ChatMessage, FrontingEntry, JournalPost, Member, Reminder, System, Tag, UUIDable } from '../../entities';
import { decode, encode } from '@msgpack/msgpack';

class ShittyTable<T extends UUIDable> {
	name: string;
	path: string;
	index?: string[];

	constructor(name: string, path: string) {
		this.name = name;
		this.path = path;
	}

	async makeInMemoryIndex() {
		const dir = await this.walkDir();

		if(!dir){
			this.index = [];
			return;
		}

		this.index = dir?.map(x => x.name);
	}

	async get(uuid: string): Promise<T | undefined> {
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
			const dir = await fs.readDir(this.path);
			return dir;
		} catch (e) {
			console.error(e);
		}

		return undefined;
	}

	async countDir() {
		return (await this.walkDir())?.length;
	}

	async walk() {
		if(!this.index)
			await this.makeInMemoryIndex();

		return this.index;
	}

	async count() {
		if (!this.index)
			await this.makeInMemoryIndex();

		return this.index!.length;
	}

	async toArray(): Promise<T[]> {
		const arr: T[] = [];
		if (!this.index)
			await this.makeInMemoryIndex();

		for (const x of this.index!) {
			const data = await this.get(x);
			if (data) arr.push(data);
		}

		return arr;
	}

	async write(uuid: string, data: T) {
		const _path = await path.resolve(this.path, uuid);
		try{
			await fs.writeFile(_path, encode(await typeson.encapsulate(data)));
			return true;
		}catch(e){
			console.error(e);
		}
		return false;
	}

	async exists(uuid: string) {
		if (!this.index)
			await this.makeInMemoryIndex();

		return this.index!.includes(uuid);
	}

	async existsInFs(uuid: string) {
		const _path = await path.resolve(this.path, uuid);
		return fs.exists(_path);
	}

	async add(uuid: string, data: T) {
		if (!await this.exists(uuid)) {
			await this.write(uuid, data);
			this.index?.push(uuid);
			return true;
		}
		return false;
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
			if (this.index)
				this.index = this.index.filter(x => x !== uuid);
			return true;
		}catch(e){
			console.error(e);
		}
		return false;
	}

	async clear() {
		const dir = await this.walkDir();
		if(dir){
			for (const file of dir)
				await fs.remove(await path.resolve(this.path, file.name));
			if (this.index)
				this.index = [];
			return true;
		}
		return false;
	}

	async bulkAdd(contents: T[]) {
		for (const content of contents) {
			const res = await this.add(content.uuid, content);
			if(!res) return res;
		}
		return true;
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

async function makeTable<T extends UUIDable>(tableName: string) {
	const _path = await path.resolve(await path.appDataDir(), 'database', tableName);
	await fs.mkdir(_path, { recursive: true });

	return new ShittyTable<T>(tableName, _path);
}

export function getTables(): ShittyTable<any>[] {
	return Object.values(db);
}

export const db = {
	boardMessages: await makeTable<BoardMessage>("boardMessages"),
	chats: await makeTable<Chat>("chats"),
	chatMessages: await makeTable<ChatMessage>("chatMessages"),
	frontingEntries: await makeTable<FrontingEntry>("frontingEntries"),
	journalPosts: await makeTable<JournalPost>("journalPosts"),
	members: await makeTable<Member>("members"),
	reminders: await makeTable<Reminder>("reminders"),
	system: await makeTable<System>("system"),
	tags: await makeTable<Tag>("tags"),
}

