import { ShittyTable } from ".";
import { appConfig } from "../../config";
import { nilUid } from "../../util/consts";
import { Member } from "../entities";

export async function members(table: ShittyTable<Member>, version: number){
	async function fromOneToTwo(){
		const systemId = appConfig.defaultSystem;
		if (systemId === nilUid) return;

		for (const memberIndex of table.index) {
			if (!memberIndex.system || memberIndex.system === nilUid) {
				await table.update(memberIndex.uuid, {
					system: systemId
				});
			}
		}
	}

	switch(version){
		case 0:
			await fromOneToTwo();
			break;
		case 1:
			await fromOneToTwo();
			break;
	}

	return 2;
}