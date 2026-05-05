<script setup lang="ts">
	import { IonIcon } from "@ionic/vue";
	import { FrontingEntryComplete, Member } from "../../lib/db/entities";
	import { appConfig } from "../../lib/config";
	import MemberItem from "../member/MemberItem.vue";
	import commentMD from "@material-symbols/svg-600/outlined/comment.svg";
	import FrontingEntryLabel from "./FrontingEntryLabel.vue";
	import FrontingEntryInterval from "./FrontingEntryInterval.vue";
	import { hexFromArgb } from "@material/material-color-utilities";
	import { getMaterialColors } from "../../lib/theme";
	import Color from "colorjs.io";

	const props = withDefaults(defineProps<{
		entry: FrontingEntryComplete,
		influencedBy?: Member[],
		button?: boolean,
		showCover?: boolean,
		showEffects?: boolean
	}>(), { showEffects: true });

	function getStyle(){
		const style: Record<string, string> = {};

		if(props.influencedBy?.length){
			const primaryColor = hexFromArgb(getMaterialColors().get("primary")!);

			const _colors = props.influencedBy.map(x => x.color);
			let color = new Color(_colors.pop() || primaryColor);

			while(_colors.length)
				color = color.range(_colors.pop() || primaryColor)(.5);

			style["--data-influencing-color"] = color.toString({ format: "hex" });
		}

		return style;
	}
</script>

<template>
	<MemberItem
		:button="props.button"
		:member="props.entry.member"
		:show-cover="props.showCover"
		:show-role="false"
		:show-pronouns="false"
		:class="{
			'main-fronter': props.showEffects && props.entry.isMainFronter,
			influencing: props.showEffects && !!props.entry.influencing,
			influenced: props.showEffects && props.influencedBy?.length,
		}"
		:style="getStyle()"
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
	ion-item {
		&.main-fronter {
			--background: var(--ion-background-color-step-200);
		}

		&.influencing {
			opacity: .5;
		}

		&.influenced::part(native) {
			background-color: color-mix(in srgb, transparent 85%, var(--data-influencing-color) 15%);
		}
	}
</style>