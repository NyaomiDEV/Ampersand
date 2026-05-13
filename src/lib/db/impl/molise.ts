/* eslint-disable class-methods-use-this */
import { PartialBy } from "../../types";
import { UUID, UUIDable } from "../entities";
import { IndexEntry, Table, Update } from "../types";

export class Molise<T extends UUIDable> implements Table<T> {
	name: string;
	index: IndexEntry<T>[] = [];
	constructor(name: string){
		this.name = name;
	}

	getIndexFromDisk(): Promise<IndexEntry<T>[] | undefined> {
		throw new Error("Can't have shit in Molise");
	}

	saveIndexToDisk(): Promise<void> {
		throw new Error("Can't have shit in Molise");
	}

	updateIndexWithData(_data: T, _saveAfterwards: boolean): Promise<void> {
		throw new Error("Can't have shit in Molise");
	}

	removeIndex(_uuid: string): Promise<void> {
		throw new Error("Can't have shit in Molise");
	}

	initializeIndex(): Promise<void> {
		throw new Error("Can't have shit in Molise");
	}

	get(_uuid: string): Promise<T> {
		throw new Error("Can't have shit in Molise");
	}

	getRaw(_uuid: string): Promise<Uint8Array<ArrayBuffer>> {
		throw new Error("Can't have shit in Molise");
	}

	count(): number {
		throw new Error("Can't have shit in Molise");
	}

	iterate(_maxIter: number): AsyncGenerator<T, void, unknown> {
		throw new Error("Can't have shit in Molise");
	}

	refresh(): Promise<void> {
		throw new Error("Can't have shit in Molise");
	}

	write(_data: T, _saveIndexAndHashesAfterwards: boolean): Promise<void> {
		throw new Error("Can't have shit in Molise");
	}

	exists(_uuid: string): boolean {
		throw new Error("Can't have shit in Molise");
	}

	add(_data: PartialBy<T, keyof UUIDable>, _saveIndexAndHashesAfterwards?: boolean): Promise<false | T["uuid"]> {
		throw new Error("Can't have shit in Molise");
	}

	bulkAdd(_contents: T[]): Promise<(false | T["uuid"])[]> {
		throw new Error("Can't have shit in Molise");
	}

	update(_newData: UUIDable & Partial<T>, _saveIndexAndHashesAfterwards?: boolean): Promise<false | Update<T>> {
		throw new Error("Can't have shit in Molise");
	}

	bulkUpdate(_contents: (UUIDable & Partial<T>)[]): Promise<(false | Update<T>)[]> {
		throw new Error("Can't have shit in Molise");
	}
	
	delete(_uuid: UUID): Promise<void> {
		throw new Error("Can't have shit in Molise");
	}

	bulkDelete(_uuids: UUID[]): Promise<void> {
		throw new Error("Can't have shit in Molise");
	}

	clear(): Promise<void> {
		throw new Error("Can't have shit in Molise");
	}

	migrate(_versionOverride?: number): Promise<void> {
		throw new Error("Can't have shit in Molise");
	}
}