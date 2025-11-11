import { ShittyTable } from ".";
import { appConfig } from "../../config";
import { Member } from "../entities";

export async function members(table: ShittyTable<Member>, version: number){
	switch(version){
		case 0:
			const systemId = appConfig.defaultSystem;
			for(const memberIndex of table.index){
				if(!memberIndex.system){
					await table.update(memberIndex.uuid, {
						system: systemId
					});
				}
			}
	}

	return 1;
}