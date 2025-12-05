<script setup lang="ts">
	import {
		IonLabel,
	} from "@ionic/vue";

	import { Member, MemberTag, Tag } from "../../lib/db/entities";
	import TagChip from "../tag/TagChip.vue";
	import { isReactive, onBeforeMount, shallowRef, watch, WatchStopHandle } from "vue";
	import { getMemberTagsForMember } from "../../lib/db/tables/memberTags";

	const props = defineProps<{
		member: Member,
		showTagChips?: boolean
	}>();

	const tags = shallowRef<MemberTag[]>();

	async function updateTags(){
		if(props.showTagChips){
			tags.value = (await Array.fromAsync(getMemberTagsForMember(props.member)))
				.filter(x => x.tag.viewInLists)
				.sort((a, b) => (a.tag as Tag).name.localeCompare((b.tag as Tag).name));
		}
	}

	onBeforeMount(async () => {
		await updateTags();
	});

	let watchHandle: WatchStopHandle | undefined;
	watch(props, async () => {
		await updateTags();
		if(isReactive(props.member))
			watchHandle = watch(props.member, async () => await updateTags());
		else
			if(watchHandle){
				watchHandle();
				watchHandle = undefined;
			}
	}, { immediate: true });
</script>

<template>
	<IonLabel class="nowrap">
		<p>
			{{
				[
					props.member.isCustomFront ? $t("members:edit.customFront") : null,
					props.member.role,
				].filter(Boolean).join(" - ")
			}}
		</p>
		<h2>
			{{ props.member.name }}
		</h2>
		<h3>
			{{ props.member.pronouns }}
		</h3>
		<div
			v-if="props.showTagChips"
			class="tags"
			@pointerdown="(e) => e.stopPropagation()"
			@touchstart="(e) => e.stopPropagation()"
		>
			<TagChip v-for="tag in tags" :key="tag.tag.id" :tag="tag.tag as Tag" />
		</div>
	</IonLabel>
</template>

<style scoped>
	div.tags {
		white-space: nowrap;
		overflow-x: scroll;
		overflow-y: hidden;
		scrollbar-width: none;
	}
</style>