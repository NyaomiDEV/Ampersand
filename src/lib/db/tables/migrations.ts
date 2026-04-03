/* eslint-disable no-fallthrough */
import { decode } from "@msgpack/msgpack";
import { ShittyTable } from ".";
import { appConfig } from "../../config";
import { nilUid } from "../../util/consts";
import { Asset, JournalPost, Member, System } from "../entities";
import { Serialized } from "../../serialization";

export async function members(table: ShittyTable<Member>, version: number){
	const systemId = appConfig.defaultSystem;

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
				const raw = await table.getRaw(uuid);
				const decoded = decode(raw) as Serialized<Member>;
				if (typeof decoded.image?.value === "string" || typeof decoded.cover?.value === "string") {
					await table.refresh();
					break;
				}
			} catch (_e) {
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
		case 2:
			if (!await twoToThree()) return 2;
	}

	return 3;
}

export async function systems(table: ShittyTable<System>, version: number){
	function zeroToOne(){
		// set default system in app config
		if(appConfig.defaultSystem === nilUid){
			const maybeSystem = table.index[0];
			if(!maybeSystem) return false;
			appConfig.defaultSystem = maybeSystem.uuid;
		}

		return true;
	}

	async function oneToTwo() {
		for (const systemIndex of table.index) {
			if (!systemIndex.isPinned || !systemIndex.isArchived) {
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
				const raw = await table.getRaw(uuid);
				const decoded = decode(raw) as Serialized<System>;
				if (typeof decoded.image?.value === "string" || typeof decoded.cover?.value === "string"){
					await table.refresh();
					break;
				}
			}catch(_e){
				return false;				
			}
		}

		return true;
	}

	switch(version){
		// @ts-expect-error fallthrough
		case 0:
			if(!zeroToOne()) return 0;
		// @ts-expect-error fallthrough
		case 1:
			if(!await oneToTwo()) return 1;
		case 2:
			if(!await twoToThree()) return 2;
	}

	return 3;
}

export async function assets(table: ShittyTable<Asset>, version: number) {
	async function zeroToOne() {
		// old serialization -> new serialization
		const uuids = table.index.map(x => x.uuid);

		for (const uuid of uuids) {
			try {
				const raw = await table.getRaw(uuid);
				const decoded = decode(raw) as Serialized<Asset>;
				if (typeof decoded.file?.value === "string" || typeof decoded.file?.value === "string") {
					await table.refresh();
					break;
				}
			} catch (_e) {
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

export async function journalPosts(table: ShittyTable<JournalPost>, version: number) {
	async function zeroToOne() {
		// old serialization -> new serialization
		const uuids = table.index.map(x => x.uuid);

		for (const uuid of uuids) {
			try {
				const raw = await table.getRaw(uuid);
				const decoded = decode(raw) as Serialized<JournalPost>;
				if (typeof decoded.cover?.value === "string" || typeof decoded.cover?.value === "string") {
					await table.refresh();
					break;
				}
			} catch (_e) {
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