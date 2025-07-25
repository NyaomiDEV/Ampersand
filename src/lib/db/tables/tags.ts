import { UUID, UUIDable, Tag } from "../entities";

import * as impl from '../impl/tauri/tags';

export function getTags() {
	return impl.getTags();
}

export function newTag(tag: Omit<Tag, keyof UUIDable>) {
	return impl.newTag(tag);
}

export function getTag(uuid: UUID){
	return impl.getTag(uuid)
}

export function removeTag(uuid: UUID){
	return impl.removeTag(uuid);
}

export function updateTag(uuid: UUID, newContent: Partial<Tag>){
	return impl.updateTag(uuid, newContent);
}

export function getTagFromNameHashtag(name: string){
	return impl.getTagFromNameHashtag(name);
}
