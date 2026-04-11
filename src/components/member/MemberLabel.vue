<script setup lang="ts">
	import {
		IonLabel,
	} from "@ionic/vue";

	import { Member, Tag } from "../../lib/db/entities";
	import TagChip from "../tag/TagChip.vue";
	import { isReactive, onBeforeMount, shallowRef, watch, WatchStopHandle } from "vue";
	import { getTag, getTagsIndex } from "../../lib/db/tables/tags";
	import { sortName } from "../../lib/util/misc";

	const props = withDefaults(defineProps<{
		member: Member,
		showChips?: boolean,
		showRole?: boolean,
		showPronouns?: boolean
	}>(), {
		showPronouns: true,
		showRole: true
	});

	const tags = shallowRef<Tag[]>();

	function shouldShowChips(){
		return props.showChips && (
			props.member.tags.filter(x => {
				const tagIndex = getTagsIndex().find(y => y.uuid === x);
				return !tagIndex?.isArchived && tagIndex?.viewInLists;
			}).length > 0
		);
	}

	async function updateTags(){
		if(props.showChips){
			tags.value = (await Promise.all(props.member.tags
				.filter(x => {
					const tagIndex = getTagsIndex().find(y => y.uuid === x);
					return !tagIndex?.isArchived && tagIndex?.viewInLists;
				})
				.map(x => getTag(x))))
				.sort(sortName)
				.filter(x => x.viewInLists);
		}
	}

	let watchHandle: WatchStopHandle | undefined;
	watch(props, () => {
		if(isReactive(props.member)){
			watchHandle = watch(props.member, async () => {
				await updateTags();
			});
		} else if(watchHandle){
			watchHandle();
			watchHandle = undefined;
		}
	});

	onBeforeMount(async () => {
		await updateTags();
	});
</script>

<template>
	<IonLabel class="nowrap">
		<slot name="before" />
		<p v-if="props.showRole">
			{{ props.member.role }}
		</p>
		<h2>
			{{ props.member.name }}
		</h2>
		<h3 v-if="props.showPronouns">
			{{ props.member.pronouns }}
		</h3>
		<slot />
		<div
			v-if="shouldShowChips()"
			class="chips"
			@pointerdown="(e) => e.stopPropagation()"
			@touchstart="(e) => e.stopPropagation()"
		>
			<TagChip v-for="tag in tags" :key="tag.uuid" :tag="tag" />
		</div>
	</IonLabel>
</template>

<style scoped>
	div.chips {
		white-space: nowrap;
		overflow-x: scroll;
		overflow-y: hidden;
		scrollbar-width: none;
		height: 42px;
		
		> ion-chip {
			margin: 0 4px;
		}
	}
</style>