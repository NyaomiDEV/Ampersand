import Dexie, { Table } from "dexie";
import { AmpersandEntityMapping } from "../../types";

export type AmpersandDexieDatabase = Dexie & {
	[T in keyof AmpersandEntityMapping]: Table<AmpersandEntityMapping[T]>
};

export type GetTableDexieExport = { [T in keyof AmpersandEntityMapping]: Table<AmpersandEntityMapping[T]> };
