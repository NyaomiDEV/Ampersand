<script setup lang="ts">
	import {
		IonLabel,
	} from "@ionic/vue";

	import { Member, Tag } from "../../lib/db/entities";
	import TagChip from "../tag/TagChip.vue";
	import { isReactive, onBeforeMount, shallowRef, watch, WatchStopHandle } from "vue";

	const props = defineProps<{
		member: Member,
		showTagChips?: boolean
	}>();

	const tags = shallowRef<Tag[]>();

	function updateTags(){
		if(props.showTagChips)
			tags.value = props.member.tags.filter(x => x.viewInLists).sort((a, b) => a.name.localeCompare(b.name));
	}

	onBeforeMount(() => {
		updateTags();
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
		<div
			v-if="props.showTagChips"
			class="tags"
			@pointerdown="(e) => e.stopPropagation()"
			@touchstart="(e) => e.stopPropagation()"
		>
			<TagChip v-for="tag in tags" :key="tag.id" :tag="tag" />
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