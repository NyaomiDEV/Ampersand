<script setup lang="ts">
	import {
		IonLabel,
	} from "@ionic/vue";

	import { Member, Tag, System } from "../../lib/db/entities";
	import TagChip from "../tag/TagChip.vue";
	import { isReactive, onBeforeMount, shallowRef, watch, WatchStopHandle } from "vue";
	import { getTag } from "../../lib/db/tables/tags";
	import SystemChip from "../SystemChip.vue";
	import { getSystem } from "../../lib/db/tables/system";

	const props = defineProps<{
		member: Member,
		showTagChips?: boolean
	}>();

	const system = shallowRef<System>({ name: "", uuid: props.member.system });
	const tags = shallowRef<Tag[]>();

	async function updateTags(){
		if(props.showTagChips){
			tags.value = (await Promise.all(props.member.tags.map(async x => await getTag(x))))
				.filter(x => x!.viewInLists)
				.sort((a, b) => a!.name.localeCompare(b!.name)) as Tag[];
		}
	}

	onBeforeMount(async () => {
		await updateTags();
	});

	let watchHandle: WatchStopHandle | undefined;
	watch(props, async () => {
		const _sys = await getSystem(props.member.system);
		if (_sys) system.value = _sys;
		await updateTags();
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
		<div
			v-if="props.showTagChips"
			class="chips"
			@pointerdown="(e) => e.stopPropagation()"
			@touchstart="(e) => e.stopPropagation()"
		>
			<SystemChip :system />
			<div v-if="tags?.length" class="tag-chips">
				<TagChip v-for="tag in tags" :key="tag.uuid" :tag="tag" />
			</div>
		</div>
	</IonLabel>
</template>

<style scoped>
	div.chips {
		display: flex;
		white-space: nowrap;
	}

	div.chips > ion-chip:first {
		flex: 2 0;
	}

	div.tag-chips {
		display: block;
		flex: 1 1;
		border-left: 1px solid var(--ion-text-color-step-400);
		margin: 4px 0;
		white-space: nowrap;
		overflow-x: scroll;
		overflow-y: hidden;
		scrollbar-width: none;
	}

	div.tag-chips > ion-chip {
		margin: 0 4px;
	}
</style>