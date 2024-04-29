import { UUIDable } from "../types";

export type Tag = UUIDable & {
	name: string,
	type: "member" | "journal",
	color: string
}