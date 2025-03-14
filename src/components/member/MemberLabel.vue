<script setup lang="ts">
	import {
		IonLabel,
	} from "@ionic/vue";

	import { Member, Tag } from '../../lib/db/entities';
	import TagChip from "../tag/TagChip.vue";
	import { isReactive, onBeforeMount, shallowRef, watch, WatchStopHandle } from "vue";
	import { getTag } from "../../lib/db/tables/tags";

	const props = defineProps<{
		member: Member,
		showTagChips?: boolean
	}>();

	const tags = shallowRef<Tag[]>();

	async function updateTags(){
		if(props.showTagChips)
			tags.value = (await Promise.all(props.member.tags.map(async x => await getTag(x)))).filter(x => x?.viewInLists) as Tag[];
	}

	onBeforeMount(async () => {
		await updateTags();
	});

	let watchHandle: WatchStopHandle | undefined;
	watch(props, () => {
		updateTags();
		if(isReactive(props.member))
			watchHandle = watch(props.member, updateTags);
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
		<div v-if="props.showTagChips" class="tags">
			<TagChip v-for="tag in tags" :tag="tag" />
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