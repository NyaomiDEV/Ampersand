<script setup lang="ts">
	import {
		IonLabel,
	} from "@ionic/vue";

	import { Member, Tag, System } from "../../lib/db/entities";
	import TagChip from "../tag/TagChip.vue";
	import { isReactive, onBeforeMount, shallowRef, watch, WatchStopHandle } from "vue";
	import { getTag, getTagsIndex } from "../../lib/db/tables/tags";
	import SystemChip from "../system/SystemChip.vue";
	import { getSystem } from "../../lib/db/tables/system";
	import { appConfig } from "../../lib/config";
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

	const system = shallowRef<System>({ name: "", uuid: props.member.system, isPinned: false, isArchived: false });
	const tags = shallowRef<Tag[]>();

	function shouldShowChips(){
		return props.showChips && (
			props.member.tags.filter(x => {
				const tagIndex = getTagsIndex().find(y => y.uuid === x);
				return !tagIndex?.isArchived && tagIndex?.viewInLists;
			}).length > 0 || 
			system.value.uuid !== appConfig.defaultSystem ||
			appConfig.showDefaultSystemInMemberList
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

	async function updateSystem(){
		const _sys = await getSystem(props.member.system);
		if (_sys) system.value = _sys;
	}

	let watchHandle: WatchStopHandle | undefined;
	watch(props, () => {
		if(isReactive(props.member)){
			watchHandle = watch(props.member, async () => {
				await updateSystem();
				await updateTags();
			});
		} else if(watchHandle){
			watchHandle();
			watchHandle = undefined;
		}
	});

	onBeforeMount(async () => {
		await updateSystem();
		await updateTags();
	});
</script>

<template>
	<IonLabel class="nowrap">
		<slot name="before" />
		<p v-if="props.showRole">
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
			<SystemChip v-if="system.uuid !== appConfig.defaultSystem || appConfig.showDefaultSystemInMemberList" :system />
			<div v-if="tags?.length" class="tag-chips">
				<TagChip v-for="tag in tags" :key="tag.uuid" :tag="tag" />
			</div>
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
	}

	div.tag-chips {
		display: inline-block;
		border-left: 1px solid var(--ion-text-color-step-400);
		margin: 4px 0;
	}

	div.chips > div.tag-chips:first-child {
		border-left: none;
	}

	div.tag-chips > ion-chip {
		margin: 0 4px;
	}
</style>