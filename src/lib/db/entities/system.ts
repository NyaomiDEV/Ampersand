import { AppNamespace, makeUUIDv5 } from "../../util/uuid"
import { UUIDable } from "../types"

export type System = UUIDable & {
	name: string,
	image: Blob
}

export function computeSystemUUID(name: string) {
	return makeUUIDv5(AppNamespace, name);
}