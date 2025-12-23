import { ShittyTable } from ".";
import { appConfig } from "../../config";
import { nilUid } from "../../util/consts";
import { Member } from "../entities";

export async function members(table: ShittyTable<Member>, version: number){
	async function fromOneToTwo(){
		const systemId = appConfig.defaultSystem;
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

	switch(version){
		case 0:
		case 1:
			if (!await fromOneToTwo()) return 0;
			break;
	}

	return 2;
}