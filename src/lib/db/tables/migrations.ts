import { ShittyTable } from ".";
import { appConfig } from "../../config";
import { nilUid } from "../../util/consts";
import { Member, System } from "../entities";

export async function members(table: ShittyTable<Member>, version: number){
	const systemId = appConfig.defaultSystem;

	// migration data now
	async function fromZeroToTwo(){
		if (systemId === nilUid) return false;

		for (const memberIndex of table.index) {
			if (!memberIndex.system || memberIndex.system === nilUid) {
				await table.update(memberIndex.uuid, {
					system: systemId
				});
			}
		}
		return true;
	}

	// HACK: Mark for migration if we find something disturbing
	if(table.index.find(x =>
		!x.system || x.system === nilUid || (x.system !== systemId && systemId !== nilUid)
	))
		version = 0;

	switch(version){
		case 0:
		case 1:
			if (!await fromZeroToTwo()) return 0;
			break;
	}

	return 2;
}

export async function systems(table: ShittyTable<System>, version: number){
	// enforce only one system for now
	async function zeroToOne(){
		// set default system in app config
		if(appConfig.defaultSystem === nilUid)
			appConfig.defaultSystem = table.index[0].uuid;

		for(const systemIndex of table.index){
			if(systemIndex.uuid !== appConfig.defaultSystem)
				await table.delete(systemIndex.uuid);
		}

		return true;
	}

	// HACK: Mark for migration if we find something disturbing
	if (table.index.length > 1)
		version = 0;

	switch(version){
		case 0:
			if(!await zeroToOne()) return 0;
			break;
	}

	return 1;
}