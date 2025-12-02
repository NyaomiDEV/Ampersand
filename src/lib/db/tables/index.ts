import { 
	CustomFieldDatum,
	JournalPostTag,
	MemberTag,
	PollEntry,
	PresenceEntry,
	Vote,
	Asset,
	BoardMessage,
	CustomField,
	FrontingEntry,
	JournalPost,
	Member,
	Poll,
	System,
	Tag,
	UUIDable,
	SQLFile
} from "../entities";
import { TableIter } from "../types";
import { invoke } from "@tauri-apps/api/core";

export class DecentTable<T extends UUIDable> {
	name: string;

	constructor(name: string) {
		this.name = name;
	}

	async get(id: string) {
		return invoke<T>("db_get", {
			table: this.name,
			id
		});
	}

	async update(id: string, newData: Partial<T>) {
		const oldData = await this.get(id);

		if (oldData) {
			if (await invoke<number>("db_update", {
				table: this.name,
				id,
				data: newData
			}) > 0)
				return { oldData, newData: { ...oldData, ...newData } };
		}

		return false;
	}

	async delete(id: string) {
		return await invoke<number>("db_delete", {
			table: this.name,
			id,
		}) > 0;
	}

	async clear() {
		return invoke<boolean>("db_drop", {
			table: this.name
		});
	}

	async count() {
		return invoke<number>("db_count", {
			table: this.name
		});
	}

	async* iterate() {
		let offset = 0;
		const length = 10;
		for(;;){
			const result = await invoke<TableIter<T>>("db_get_many", {
				offset,
				length,
				table: this.name
			});
			offset += length;
			for (const r of result.result) yield r;
			if (result.result.length < length)
				return;
		}
	}

	async write(data: T) {
		return invoke<number>("db_write", {
			table: this.name,
			// do we need to use the id?
			data
		});
	}

	async exists(id: string) {
		return !!await invoke<number>("db_get", {
			table: this.name,
			id
		});
	}

	async add(id: string, data: T) {
		if (!await this.exists(id)) 
			return await this.write(data);
		return undefined;
	}

	async bulkAdd(contents: T[]) {
		let res = true;
		for (const content of contents) {
			if (!await this.exists(content.id))
				res = !!await this.write(content); // should work, right?
		}
		return res;
	}
}
export function getTables() {
	return { ...db };
}

export const db = {
	assets: new DecentTable<Asset>("assets"),
	boardMessages: new DecentTable<BoardMessage>("board_messages"),
	customFieldData: new DecentTable<CustomFieldDatum>("custom_field_data"),
	customFields: new DecentTable<CustomField>("custom_fields"),
	files: new DecentTable<SQLFile>("files"),
	frontingEntries: new DecentTable<FrontingEntry>("fronting_entries"),
	journalPosts: new DecentTable<JournalPost>("journal_posts"),
	journalPostTags: new DecentTable<JournalPostTag>("journal_post_tags"),
	members: new DecentTable<Member>("members"),
	memberTags: new DecentTable<MemberTag>("member_tags"),
	polls: new DecentTable<Poll>("polls"),
	pollEntries: new DecentTable<PollEntry>("poll_entries"),
	presenceEntries: new DecentTable<PresenceEntry>("presence_entries"),
	systems: new DecentTable<System>("systems"),
	tags: new DecentTable<Tag>("tags"),
	votes: new DecentTable<Vote>("votes"),
};
