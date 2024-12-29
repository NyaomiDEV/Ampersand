import { UUID, UUIDable, Tag } from "../entities";

const impl = await import('../impl/dexie/tags');

export function getTagsTable() {
	return impl.getTagsTable();
}

export async function newTag(tag: Omit<Tag, keyof UUIDable>) {
	return impl.newTag(tag);
}

export async function removeTag(uuid: UUID){
	return impl.removeTag(uuid);
}

export async function getTagFromNameHashtag(name: string){
	return impl.getTagFromNameHashtag(name);
}
