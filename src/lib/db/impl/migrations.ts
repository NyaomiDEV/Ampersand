/* eslint-disable no-fallthrough */
import { decodeAsync } from "@msgpack/msgpack";
import type { ShittyTable } from "./shittytable";
import { appConfig } from "../../config";
import { nilUid } from "../../util/consts";
import { Asset, BoardMessage, FrontingEntry, JournalPost, Member, System, Tag, UUID } from "../entities";
import { Serialized } from "../../serialization";
import { extractFrontmatter } from "../../markdown";
import { dump } from "js-yaml";

export async function members(table: ShittyTable<Member>, version: number){
	const systemId = appConfig.defaultSystem;

	interface MThree extends Member {
		isCustomFront: boolean,
		isDissociativeState: never
	}

	async function fromZeroToTwo(){
		if (systemId === nilUid) return false;

		for (const memberIndex of table.index) {
			if (!memberIndex.system) {
				await table.update({
					uuid: memberIndex.uuid,
					system: systemId
				});
			}
		}
		return true;
	}

	async function twoToThree() {
		// old serialization -> new serialization
		const uuids = table.index.map(x => x.uuid);

		for (const uuid of uuids) {
			try {
				const decoded = await decodeAsync(table.getRawStream(uuid)) as Serialized<Member>;
				if (typeof decoded.image?.value === "string" || typeof decoded.cover?.value === "string") {
					await table.refresh();
					break;
				}
			} catch (_e) {
				console.error(_e);
				return false;
			}
		}

		return true;
	}

	async function threeToFour() {
		// isCustomFront -> isDissociativeState
		const uuids = table.index.map(x => x.uuid);

		for (const uuid of uuids) {
			try {
				const obj = await table.get(uuid) as MThree;
				const dissociativeState = obj.isCustomFront;
				
				// @ts-expect-error we're deleting a required argument but it's not required anywhere anymore
				delete obj.isCustomFront;

				await table.write(
					{
						...obj,
						isDissociativeState: dissociativeState
					}, true
				);
			} catch (_e) {
				console.error(_e);
				return false;
			}
		}

		return true;
	}

	switch(version){
		case 0:
		// @ts-expect-error fallthrough
		case 1:
			if (!await fromZeroToTwo()) return 0;
		// @ts-expect-error fallthrough
		case 2:
			if (!await twoToThree()) return 2;
		case 3:
			if (!await threeToFour()) return 3;
	}

	return 4;
}

export async function systems(table: ShittyTable<System>, version: number){
	async function oneToTwo() {
		for (const systemIndex of table.index) {
			if (typeof systemIndex.isPinned === "undefined" || typeof systemIndex.isArchived === "undefined") {
				if(!await table.update({
					uuid: systemIndex.uuid,
					isArchived: systemIndex.isArchived || false,
					isPinned: systemIndex.isPinned || false
				})) return false;
			}
		}

		return true;
	}

	async function twoToThree(){
		// old serialization -> new serialization
		const uuids = table.index.map(x => x.uuid);

		for(const uuid of uuids){
			try{
				const decoded = await decodeAsync(table.getRawStream(uuid)) as Serialized<System>;
				if (typeof decoded.image?.value === "string" || typeof decoded.cover?.value === "string"){
					await table.refresh();
					break;
				}
			}catch(_e){
				console.error(_e);
				return false;				
			}
		}

		return true;
	}

	async function threeToFour() {
		for (const systemIndex of table.index) {
			if (typeof systemIndex.viewInLists === "undefined") {
				if (!await table.update({
					uuid: systemIndex.uuid,
					viewInLists: systemIndex.uuid !== appConfig.defaultSystem
				})) return false;
			}
		}

		return true;
	}

	switch(version){
		case 0:
		// @ts-expect-error fallthrough
		case 1:
			if(!await oneToTwo()) return 1;
		// @ts-expect-error fallthrough
		case 2:
			if(!await twoToThree()) return 2;
		case 3:
			if(!await threeToFour()) return 3;
	}

	return 4;
}

export async function assets(table: ShittyTable<Asset>, version: number) {
	async function zeroToOne() {
		// old serialization -> new serialization
		const uuids = table.index.map(x => x.uuid);

		for (const uuid of uuids) {
			try {
				const decoded = await decodeAsync(table.getRawStream(uuid)) as Serialized<Asset>;
				if (typeof decoded.file?.value === "string" || typeof decoded.file?.value === "string") {
					await table.refresh();
					break;
				}
			} catch (_e) {
				console.error(_e);
				return false;
			}
		}

		return true;
	}

	async function oneToTwo() {
		// add tags
		const index = table.index.map(x => x.uuid);

		for (const uuid of index) {
			try {
				// This is slow but I know no other way
				const asset = await table.get(uuid);
				if(!asset.tags)
					await table.update({ uuid, tags: [] }, false);
			} catch (_e) {
				console.error(_e);
				return false;
			}
		}

		await table.saveIndexToDisk();
		await table.saveHashesToDisk();

		return true;
	}

	switch (version) {
		// @ts-expect-error fallthrough
		case 0:
			if (!await zeroToOne()) return 0;
		case 1:
			if (!await oneToTwo()) return 1;
	}

	return 2;
}

export async function journalPosts(table: ShittyTable<JournalPost>, version: number) {
	
	interface JPOne extends JournalPost {
		member?: UUID,
		members: never
	}

	async function zeroToOne() {
		// old serialization -> new serialization
		const uuids = table.index.map(x => x.uuid);

		for (const uuid of uuids) {
			try {
				const decoded = await decodeAsync(table.getRawStream(uuid)) as Serialized<JournalPost>;
				if (typeof decoded.cover?.value === "string" || typeof decoded.cover?.value === "string") {
					await table.refresh();
					break;
				}
			} catch (_e) {
				console.error(_e);
				return false;
			}
		}

		return true;
	}

	async function oneToTwo(){
		// member -> members
		const uuids = table.index.map(x => x.uuid);

		for (const uuid of uuids) {
			try {
				const obj = await table.get(uuid) as JPOne;
				if(!obj.members){
					const members = typeof obj.member === "string" ? [obj.member] : [];
					if (obj.member) delete obj.member;
					await table.write(
						{
							...obj,
							members
						}, true
					);
				}
			} catch (_e) {
				console.error(_e);
				return false;
			}
		}

		return true;
	}

	switch (version) {
		// @ts-expect-error fallthrough
		case 0:
			if (!await zeroToOne()) return 0;
		case 1:
			if (!await oneToTwo()) return 1;
	}

	return 2;
}

export async function boardMessages(table: ShittyTable<BoardMessage>, version: number) {

	interface BMZero extends BoardMessage {
		member?: UUID,
		members: never;
	}

	async function zeroToOne() {
		// member -> members
		const uuids = table.index.map(x => x.uuid);

		for (const uuid of uuids) {
			try {
				const obj = await table.get(uuid) as BMZero;
				if(!obj.members){
					const members = typeof obj.member === "string" ? [obj.member] : [];
					if (obj.member) delete obj.member;
					await table.write(
						{
							...obj,
							members
						}, true
					);
				}
			} catch (_e) {
				console.error(_e);
				return false;
			}
		}

		return true;
	}

	switch (version) {
		case 0:
			if (!await zeroToOne()) return 0;
	}

	return 1;
}

export async function tags(table: ShittyTable<Tag>, version: number) {
	async function zeroToOne() {
		// add isArchived
		for (const tagIndex of table.index) {
			try {
				if(typeof tagIndex.isArchived === "undefined")
					await table.update({ uuid: tagIndex.uuid, isArchived: false });
			} catch (_e) {
				console.error(_e);
				return false;
			}
		}

		return true;
	}

	switch (version) {
		case 0:
			if (!await zeroToOne()) return 0;
	}

	return 1;
}

export async function frontingEntries(table: ShittyTable<FrontingEntry>, version: number) {

	interface FEZero extends FrontingEntry {
		customStatus?: string,
	}

	type FEOne = Omit<FrontingEntry, "influencing"> & { influencing?: string };

	async function zeroToOne() {
		// move custom status to fronter's comment frontmatter
		for (const frontingEntryIndex of table.index) {
			try {
				const obj = await table.get(frontingEntryIndex.uuid) as FEZero;

				if (obj.customStatus) {
					const commentParts = extractFrontmatter(obj.comment || "");
					if (!commentParts.frontmatter)
						commentParts.frontmatter = {};

					commentParts.frontmatter.customStatus = obj.customStatus;
					delete obj.customStatus;
					await table.write({
						...obj,
						comment: `---\n${dump(commentParts.frontmatter)}---\n\n${commentParts.body}`
					}, true);
				}
			} catch (_e) {
				console.error(_e);
				return false;
			}
		}

		return true;
	}

	async function oneToTwo(){
		// influencing became an array
		for (const uuid of table.index.map(x => x.uuid)) {
			try {
				const obj = await table.get(uuid) as FEOne;

				if (obj.influencing && typeof obj.influencing === "string") {
					await table.update({
						uuid,
						influencing: [obj.influencing]
					});
				}
			} catch (_e) {
				console.error(_e);
				return false;
			}
		}

		return true;
	}

	switch (version) {
		// @ts-expect-error fallthrough
		case 0:
			if (!await zeroToOne()) return 0;
		case 1:
			if (!await oneToTwo()) return 1;
	}

	return 2;
}
