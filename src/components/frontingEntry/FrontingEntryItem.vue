<script setup lang="ts">
	import { IonIcon } from "@ionic/vue";
	import { FrontingEntryComplete } from "../../lib/db/entities";
	import { appConfig } from "../../lib/config";
	import MemberItem from "../member/MemberItem.vue";
	import commentMD from "@material-symbols/svg-600/outlined/comment.svg";
	import FrontingEntryLabel from "./FrontingEntryLabel.vue";
	import FrontingEntryInterval from "./FrontingEntryInterval.vue";

	const props = withDefaults(defineProps<{
		entry: FrontingEntryComplete,
		button?: boolean,
		showEffects?: boolean
	}>(), { showEffects: true });
</script>

<template>
	<MemberItem
		:button="props.button"
		:member="props.entry.member"
		:show-cover="false"
		:show-role="false"
		:show-pronouns="false"
		:class="{
			'main-fronter': props.showEffects && props.entry.isMainFronter,
			influencing: props.showEffects && !!props.entry.influencing
		}"
	>
		<template #before>
			<h3 v-if="!appConfig.hideFrontingTimer" :entry="props.entry" style="float: right">
				<FrontingEntryInterval v-slot="{ interval }" :entry="props.entry">
					{{ interval }}
				</FrontingEntryInterval>
			</h3>
		</template>
		<FrontingEntryLabel :entry="props.entry" />
		<template #end>
			<IonIcon v-if="props.entry.comment?.length" slot="end" :icon="commentMD" />
		</template>
	</MemberItem>
</template>

<style scoped>
	ion-item.main-fronter {
		--background: var(--ion-background-color-step-200);
	}

	ion-item.influencing {
		opacity: .5;
	}
</style>