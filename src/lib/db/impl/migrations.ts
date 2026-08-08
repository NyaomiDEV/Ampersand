/* eslint-disable no-fallthrough */
import { decodeAsync } from "@msgpack/msgpack";
import type { ShittyTable } from "./shittytable";
import { appConfig } from "../../config";
import { nilUid } from "../../util/consts";
import { Asset, BoardMessage, CustomField, FilterQuery, FrontingEntry, JournalPost, Member, Note, Reminder, System, Tag, UUID, UUIDable } from "../entities";
import { Serialized } from "../../serialization";
import { extractFrontmatter } from "../../markdown";
import { dump } from "js-yaml";
import { stat } from "@tauri-apps/plugin-fs";
import { sep } from "@tauri-apps/api/path";

async function _addDateCreated(table: ShittyTable<UUIDable>){
	try{
		for (const x of table.index) {
			const obj = await table.get(x.uuid);
			if (!obj.dateCreated) {
				const fstat = await stat(table.path + sep() + obj.uuid);
				await table.update({
					uuid: obj.uuid,
					dateCreated: fstat.birthtime || new Date()
				}, false);
			}
		}

		await table.saveIndexToDisk();
		await table.saveHashesToDisk();
	}catch(_e){
		console.error(_e);
		return false;
	}

	return true;
}

export async function systems(table: ShittyTable<System>, version: number) {
	async function oneToTwo() {
		for (const systemIndex of table.index) {
			if (typeof systemIndex.isPinned === "undefined" || typeof systemIndex.isArchived === "undefined") {
				if (!await table.update({
					uuid: systemIndex.uuid,
					isArchived: systemIndex.isArchived || false,
					isPinned: systemIndex.isPinned || false
				})) return false;
			}
		}

		return true;
	}

	async function twoToThree() {
		// old serialization -> new serialization
		const uuids = table.index.map(x => x.uuid);

		for (const uuid of uuids) {
			try {
				const decoded = await decodeAsync(table.getRawStream(uuid)) as Serialized<System>;
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

	function fourToFive() {
		return _addDateCreated(table as unknown as ShittyTable<UUIDable>);
	}

	switch (version) {
		case 0:
		// @ts-expect-error fallthrough
		case 1:
			if (!await oneToTwo()) return 1;
		// @ts-expect-error fallthrough
		case 2:
			if (!await twoToThree()) return 2;
		// @ts-expect-error fallthrough
		case 3:
			if (!await threeToFour()) return 3;
		case 4:
			if (!await fourToFive()) return 4;
	}

	return 5;
}

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
		try {
			for (const uuid of uuids) {
				const obj = await table.get(uuid) as MThree;
				const dissociativeState = obj.isCustomFront;
				
				// @ts-expect-error we're deleting a required argument but it's not required anywhere anymore
				delete obj.isCustomFront;

				await table.write(
					{
						...obj,
						isDissociativeState: dissociativeState
					}, false
				);
			}

			await table.saveIndexToDisk();
			await table.saveHashesToDisk();
		} catch (_e) {
			console.error(_e);
			return false;
		}

		return true;
	}

	function fourToFive(){
		return _addDateCreated(table as unknown as ShittyTable<UUIDable>);
	}

	switch(version){
		case 0:
		// @ts-expect-error fallthrough
		case 1:
			if (!await fromZeroToTwo()) return 0;
		// @ts-expect-error fallthrough
		case 2:
			if (!await twoToThree()) return 2;
		// @ts-expect-error fallthrough
		case 3:
			if (!await threeToFour()) return 3;
		case 4:
			if (!await fourToFive()) return 4;
	}

	return 5;
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
						}, false
					);
				}

				await table.saveIndexToDisk();
				await table.saveHashesToDisk();
			} catch (_e) {
				console.error(_e);
				return false;
			}
		}

		return true;
	}

	function oneToTwo() {
		return _addDateCreated(table as unknown as ShittyTable<UUIDable>);
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

export async function frontingEntries(table: ShittyTable<FrontingEntry>, version: number) {

	interface FEZero extends FrontingEntry {
		customStatus?: string,
		comment?: string
	}

	type FEOne = Omit<FrontingEntry, "influencing"> & { influencing?: string };

	async function zeroToOne() {
		// move custom status to fronter's summary frontmatter
		// and also migrate comment => summary
		try {
			for (const frontingEntryIndex of table.index) {
			
				const obj = await table.get(frontingEntryIndex.uuid) as FEZero;

				if (obj.customStatus || obj.comment) {
					const commentParts = extractFrontmatter(obj.comment || "");
					if (!commentParts.frontmatter)
						commentParts.frontmatter = {};

					if(obj.customStatus)
						commentParts.frontmatter.customStatus = obj.customStatus;

					delete obj.customStatus;
					delete obj.comment;

					let summary = "";

					if(Object.keys(commentParts.frontmatter).length)
						summary += `---\n${dump(commentParts.frontmatter)}---\n\n`;
					
					if(commentParts.body.length)
						summary += commentParts.body;

					await table.write({
						...obj,
						summary: summary.length ? summary : undefined
					}, false);
				}
			}

			await table.saveIndexToDisk();
			await table.saveHashesToDisk();
		} catch (_e) {
			console.error(_e);
			return false;
		}
		return true;
	}

	async function oneToTwo(){
		// influencing became an array
		try {
			for (const uuid of table.index.map(x => x.uuid)) {
				const obj = await table.get(uuid) as FEOne;

				if (obj.influencing && typeof obj.influencing === "string") {
					await table.update({
						uuid,
						influencing: [obj.influencing]
					}, false);
				}
			}

			await table.saveIndexToDisk();
			await table.saveHashesToDisk();
		} catch (_e) {
			console.error(_e);
			return false;
		}

		return true;
	}

	function twoToThree() {
		return _addDateCreated(table as unknown as ShittyTable<UUIDable>);
	}

	async function threeToFour(){
		// with recent changes, we need to make absolutely sure that there aren't spurious locked entries in the past
		try {
			for (const uuid of table.index.map(x => x.uuid)) {
				const obj = await table.get(uuid);

				if (obj.endTime && obj.isLocked) {
					await table.update({
						uuid,
						isLocked: false
					}, false);
				}
			}

			await table.saveIndexToDisk();
			await table.saveHashesToDisk();
		} catch (_e) {
			console.error(_e);
			return false;
		}

		return true;
	}

	switch (version) {
		// @ts-expect-error fallthrough
		case 0:
			if (!await zeroToOne()) return 0;
		// @ts-expect-error fallthrough
		case 1:
			if (!await oneToTwo()) return 1;
		// @ts-expect-error fallthrough
		case 2:
			if (!await twoToThree()) return 2;
		case 3:
			if (!await threeToFour()) return 3;
	}

	return 4;
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

		try {
			for (const uuid of uuids) {
				const obj = await table.get(uuid) as JPOne;
				if(!obj.members){
					const members = typeof obj.member === "string" ? [obj.member] : [];
					if (obj.member) delete obj.member;
					await table.write(
						{
							...obj,
							members
						}, false
					);
				}
			}

			await table.saveIndexToDisk();
			await table.saveHashesToDisk();
		} catch (_e) {
			console.error(_e);
			return false;
		}

		return true;
	}

	function twoToThree() {
		return _addDateCreated(table as unknown as ShittyTable<UUIDable>);
	}

	switch (version) {
		// @ts-expect-error fallthrough
		case 0:
			if (!await zeroToOne()) return 0;
		// @ts-expect-error fallthrough
		case 1:
			if (!await oneToTwo()) return 1;
		case 2:
			if (!await twoToThree()) return 2;
	}

	return 3;
}

export async function reminders(table: ShittyTable<Reminder>, version: number){
	function zeroToOne(){
		return _addDateCreated(table as unknown as ShittyTable<UUIDable>);
	}

	switch(version){
		case 0:
			if (!await zeroToOne()) return 0;
	}

	return 1;
}

export async function tags(table: ShittyTable<Tag>, version: number) {
	async function zeroToOne() {
		// add isArchived
		try {
			for (const tagIndex of table.index) {
				if(typeof tagIndex.isArchived === "undefined")
					await table.update({ uuid: tagIndex.uuid, isArchived: false }, false);
			}

			await table.saveIndexToDisk();
			await table.saveHashesToDisk();
		} catch (_e) {
			console.error(_e);
			return false;
		}

		return true;
	}

	function oneToTwo() {
		return _addDateCreated(table as unknown as ShittyTable<UUIDable>);
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
				if (!asset.tags)
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

	function twoToThree() {
		return _addDateCreated(table as unknown as ShittyTable<UUIDable>);
	}

	switch (version) {
		// @ts-expect-error fallthrough
		case 0:
			if (!await zeroToOne()) return 0;
		// @ts-expect-error fallthrough
		case 1:
			if (!await oneToTwo()) return 1;
		case 2:
			if (!await twoToThree()) return 2;
	}

	return 3;
}

export async function customFields(table: ShittyTable<CustomField>, version: number) {
	function zeroToOne() {
		return _addDateCreated(table as unknown as ShittyTable<UUIDable>);
	}

	switch (version) {
		case 0:
			if (!await zeroToOne()) return 0;
	}

	return 1;
}

export async function notes(table: ShittyTable<Note>, version: number) {
	function zeroToOne() {
		return _addDateCreated(table as unknown as ShittyTable<UUIDable>);
	}

	switch (version) {
		case 0:
			if (!await zeroToOne()) return 0;
	}

	return 1;
}

export async function filterQueries(table: ShittyTable<FilterQuery>, version: number) {
	function zeroToOne() {
		return _addDateCreated(table as unknown as ShittyTable<UUIDable>);
	}

	switch (version) {
		case 0:
			if (!await zeroToOne()) return 0;
	}

	return 1;
}