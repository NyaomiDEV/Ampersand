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
			if (!memberIndex.system) {
				await table.update(memberIndex.uuid, {
					system: systemId
				});
			}
		}
		return true;
	}

	switch(version){
		case 0:
		case 1:
			if (!await fromZeroToTwo()) return 0;
			break;
	}

	return 2;
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function systems(table: ShittyTable<System>, version: number){
	// enforce only one system for now
	function zeroToOne(){
		// set default system in app config
		if(appConfig.defaultSystem === nilUid){
			const maybeSystem = table.index[0];
			if(!maybeSystem) return false;
			appConfig.defaultSystem = maybeSystem.uuid;
		}

		return true;
	}

	switch(version){
		case 0:
			if(!zeroToOne()) return 0;
			break;
	}

	return 1;
}