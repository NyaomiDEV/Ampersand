import { sep } from "@tauri-apps/api/path";
import * as fs from "@tauri-apps/plugin-fs";
import type { Asset, JournalPost, Member, System, Tag, UUIDable, UUID, BoardMessage } from "../entities";
import { decode, encode } from "@msgpack/msgpack";
import type { MigrationsMapping } from "../types";
import { deleteNull, replace, revive, walk, walkAsync } from "../../serialization";
import { assets, boardMessages, journalPosts, members, systems, tags } from "./migrations";
import { PartialBy } from "../../types";
import type { SecondaryKey, IndexEntry } from "./types";
import { sha256 } from "../../util/misc";

export class ShittyTable<T extends UUIDable> {
	name: string;
	path: string;
	secondaryKeys: SecondaryKey<T>[];
	index: IndexEntry<T>[];
	hashes: Record<UUID, string>;

	constructor(name: string, path: string, secondaryKeys: SecondaryKey<T>[]) {
		this.name = name;
		this.path = path;
		this.secondaryKeys = secondaryKeys;
		this.index = [];
		this.hashes = {};
	}

	async getIndexFromDisk() {
		const _path = `${this.path + sep()}.index`;
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const obj: any = decode(await fs.readFile(_path));
			if (typeof obj !== "undefined" && obj !== null)
				return walk(obj, revive) as IndexEntry<T>[];
		} catch (_e) {
			// nothing
		}
		return undefined;
	}

	async saveIndexToDisk() {
		const _path = `${this.path + sep()}.index`;
		if(this.index.length)
			await fs.writeFile(_path, encode(await walkAsync(this.index, replace)));
		else
			if(await fs.exists(_path)) await fs.remove(_path);
	}

	async updateIndexWithData(data: T, saveAfterwards: boolean = true) {
		const indexEntry: IndexEntry<T> = { uuid: data.uuid } as IndexEntry<T>;
		for (const key of this.secondaryKeys)
			indexEntry[key] = data[key];


		const _index = this.index.findIndex(x => data.uuid === x.uuid);
		if (_index > -1)
			this.index[_index] = indexEntry;
		else
			this.index.push(indexEntry);


		if (saveAfterwards)
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

		if (diskIndex && diskIndex.length) {
			this.index = diskIndex;

			for (const entry of this.index) {
				if (!dir.find(x => x.name === entry.uuid)) {
					this.index = this.index.filter(x => x.uuid !== entry.uuid);
					continue;
				}

				for (const key of this.secondaryKeys) {
					if (!Object.keys(entry).includes(key as string)) {
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

	async getHashesFromDisk() {
		const _path = `${this.path + sep()}.hashes`;
		try {
			return decode(await fs.readFile(_path)) as Record<UUID, string>;
		} catch (_e) {
			// nothing
		}
		return undefined;
	}

	async saveHashesToDisk() {
		const _path = `${this.path + sep()}.hashes`;
		if(Object.keys(this.hashes).length)
			await fs.writeFile(_path, encode(this.hashes));
		else
			if (await fs.exists(_path)) await fs.remove(_path);
	}

	async updateHashesWithData(fileName: string, data: Uint8Array<ArrayBuffer>, saveAfterwards: boolean = true) {
		this.hashes[fileName] = await sha256(data);
		if (saveAfterwards)
			await this.saveHashesToDisk();
	}

	async removeHash(fileName: string) {
		if(!this.hashes[fileName]) return;

		delete this.hashes[fileName];
		await this.saveHashesToDisk();
	}

	async initializeHashes() {
		const dir = await this.walkDir();
		if (!dir) return;

		const diskHashes = await this.getHashesFromDisk();

		if (diskHashes) {
			this.hashes = diskHashes;

			for (const fileName of Object.keys(this.hashes)) {
				if (!dir.find(x => x.name === fileName)) {
					delete this.hashes[fileName];
					continue;
				}
			}
		}

		for (const file of dir) {
			if (!this.hashes[file.name]) 
				await this.updateHashesWithData(file.name, await this.getRaw(file.name), false);
		}

		await this.saveHashesToDisk();
	}

	async getRaw(uuid: string) {
		const _path = this.path + sep() + uuid;
		return await fs.readFile(_path);
	}

	async get(uuid: string) {
		const obj = decode(await this.getRaw(uuid));
		return walk(obj as object, revive) as T;
	}

	async walkDir() {
		return (await fs.readDir(this.path))
			.filter(
				x => ![".index", ".hashes", ".migrations"].includes(x.name)
			);
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
			const chunk: Promise<T>[] = [];
			for (let i = offset; i < offset + maxIter; i++) {
				if (uuids[i]) {
					const data = this.get(uuids[i]);
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

	async refresh() {
		for (const data of this.index)
			await this.update({ uuid: data.uuid } as UUIDable & Partial<T>);
	}

	async write(data: T, saveIndexAndHashesAfterwards: boolean) {
		const { uuid } = data;
		const _path = this.path + sep() + uuid;
		const _data = encode(deleteNull(await walkAsync(data, replace)));
		await fs.writeFile(_path, _data);
		await this.updateHashesWithData(uuid, _data, saveIndexAndHashesAfterwards);
		await this.updateIndexWithData(data, saveIndexAndHashesAfterwards);
	}

	exists(uuid: string) {
		return !!this.index.find(x => uuid === x.uuid);
	}

	async add(data: PartialBy<T, keyof UUIDable>, saveIndexAndHashesAfterwards = true) {
		data.uuid = data.uuid || window.crypto.randomUUID();
		if (!this.exists(data.uuid)) {
			await this.write(data as T, saveIndexAndHashesAfterwards);
			return data.uuid;
		}
		return false;
	}

	async bulkAdd(contents: T[]) {
		const returnValues = await Promise.all(
			contents.map(x => this.add(x, false))
		);

		await this.saveIndexToDisk();
		await this.saveHashesToDisk();

		return returnValues;
	}

	async update(newData: UUIDable & Partial<T>, saveIndexAndHashesAfterwards = true) {
		const { uuid } = newData;
		const oldData = await this.get(uuid);

		if (oldData) {
			const data = { ...oldData, ...newData };
			await this.write(data, saveIndexAndHashesAfterwards);
			return { oldData, newData: data };
		}

		return false;
	}

	async bulkUpdate(contents: (UUIDable & Partial<T>)[]) {
		const returnValues = await Promise.all(
			contents.map(x => this.update(x, false))
		);

		await this.saveIndexToDisk();
		await this.saveHashesToDisk();

		return returnValues;
	}

	async delete(uuid: UUID) {
		const _path = this.path + sep() + uuid;
		await fs.remove(_path);
		await this.removeIndex(uuid);
		await this.removeHash(uuid);
	}

	async bulkDelete(uuids: UUID[]){
		await Promise.all(uuids.map(x => this.delete(x)));
	}

	async clear() {
		const _dir = await this.walkDir();
		if (!_dir) throw new Error("no directory to clear");

		for (const file of _dir) {
			await fs.remove(this.path + sep() + file.name);
			this.index = this.index.filter(x => x.uuid !== file.name);
		}

		if (await fs.exists(`${this.path + sep()}.migrations`))
			await fs.remove(`${this.path + sep()}.migrations`);

		await this.saveIndexToDisk();
		await this.saveHashesToDisk();
	}

	async getMigrationVersion() {
		const _path = `${this.path + sep()}.migrations`;
		try {
			const migrations = decode(await fs.readFile(_path)) as MigrationsMapping;
			return migrations.version;
		} catch (e) {
			console.error(e);
			return 0;
		}
	}

	async saveMigrationVersion(version: number) {
		const _path = `${this.path + sep()}.migrations`;
		await fs.writeFile(_path, encode({ version }));
	}

	async migrate(versionOverride?: number) {
		let version = versionOverride !== undefined ? versionOverride : (await this.getMigrationVersion() || 0);
		switch (this.name) {
			case "members":
				version = await members(this as unknown as ShittyTable<Member>, version);
				break;
			case "system":
				version = await systems(this as unknown as ShittyTable<System>, version);
				break;
			case "boardMessages":
				version = await boardMessages(this as unknown as ShittyTable<BoardMessage>, version);
				break;
			case "journalPosts":
				version = await journalPosts(this as unknown as ShittyTable<JournalPost>, version);
				break;
			case "assets":
				version = await assets(this as unknown as ShittyTable<Asset>, version);
				break;
			case "tags":
				version = await tags(this as unknown as ShittyTable<Tag>, version);
				break;
		}
		await this.saveMigrationVersion(version);
	}
}
