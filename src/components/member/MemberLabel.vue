<script setup lang="ts">
	import {
		IonLabel,
	} from "@ionic/vue";

	import { Member, MemberTag, System, Tag } from "../../lib/db/entities";
	import TagChip from "../tag/TagChip.vue";
	import { isReactive, onBeforeMount, shallowRef, watch, WatchStopHandle } from "vue";
	import SystemChip from "../SystemChip.vue";
	import { getSystem } from "../../lib/db/tables/system";
	import { appConfig } from "../../lib/config";
	import { getMemberTagsForMember } from "../../lib/db/tables/memberTags";

	const props = defineProps<{
		member: Member,
		showTagChips?: boolean
	}>();

	const system = shallowRef<System>({ name: "", ...props.member.system });
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
		const _sys = await getSystem(props.member.system.id);
		if (_sys) system.value = _sys;
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
			class="chips"
			@pointerdown="(e) => e.stopPropagation()"
			@touchstart="(e) => e.stopPropagation()"
		>
			<SystemChip v-if="system.id !== appConfig.defaultSystem || appConfig.showDefaultSystemInMemberList" :system />
			<div v-if="tags?.length" class="tag-chips">
				<TagChip v-for="tag in tags" :key="tag.tag.id" :tag="tag.tag as Tag" />
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

	div.chips > div.tag-chips:first-child {
		border-left: none;
	}

	div.tag-chips > ion-chip {
		margin: 0 4px;
	}
</style>