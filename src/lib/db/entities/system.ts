import { UUIDable } from "../types"

export type System = UUIDable & {
	name: string,
	image: Blob
}