<script setup lang="ts">
	import {
		IonLabel,
	} from "@ionic/vue";

	import { Member, Tag } from '../../lib/db/entities';
	import TagChip from "../tag/TagChip.vue";
	import { onBeforeMount, shallowRef } from "vue";
	import { getTag } from "../../lib/db/tables/tags";

	const props = defineProps<{
		member: Member,
		showTagChips?: boolean
	}>();

	const tags = shallowRef<Tag[]>();

	onBeforeMount(async () => {
		if(props.showTagChips)
			tags.value = (await Promise.all(props.member.tags.map(async x => await getTag(x)))).filter(x => x?.viewInLists) as Tag[];
	})
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
		<div v-if="props.showTagChips" class="tags">
			<TagChip v-for="tag in tags" :tag="tag" />
		</div>
	</IonLabel>
</template>

<style scoped>
	div.tags {
		overflow-x: scroll;
		overflow-y: hidden;
		scrollbar-width: none;
	}
</style>