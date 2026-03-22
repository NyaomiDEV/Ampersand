<script setup lang="ts">
	import { IonItem, IonIcon, IonCheckbox } from "@ionic/vue";
	import Avatar from "../Avatar.vue";
	import MemberLabel from "./MemberLabel.vue";
	import { FrontingEntryComplete, Member } from "../../lib/db/entities";
	import { useBlob } from "../../lib/util/blob";
	import { accessibilityConfig } from "../../lib/config";

	import accountCircle from "@material-symbols/svg-600/outlined/account_circle-fill.svg";
	import pinMD from "@material-symbols/svg-600/outlined/keep.svg";
	import archivedMD from "@material-symbols/svg-600/outlined/archive.svg";
	import mainFronterMD from "@material-symbols/svg-600/outlined/account_circle-fill.svg";

	const props = withDefaults(defineProps<{
		member: Member,
		associatedFrontingEntry?: FrontingEntryComplete,
		showChips?: boolean,
		showRole?: boolean,
		showPronouns?: boolean,
		showIcons?: boolean,
		hasToggle?: "checkbox",
		toggleValue?: string,
		toggleChecked?: boolean,
		showCover?: boolean,
		showArchived?: boolean,
		button?: boolean
	}>(), { showChips: false, showIcons: false, showCover: true, showPronouns: true, showRole: true, showArchived: false });

	const emit = defineEmits<{
		"toggleUpdate": [boolean],
	}>();

	const { getObjectURL } = useBlob();

	function getStyle(){
		const style: Record<string, string> = {};

		if(props.associatedFrontingEntry){
			if(props.associatedFrontingEntry.isMainFronter)
				style["--background"] = "var(--ion-background-color-step-200)";
			else
				style["--background"] = "var(--ion-background-color-step-150)";
		}

		if(props.member.cover)
			style["--data-cover"] = `url(${getObjectURL(props.member.cover)})`;

		return style;
	}
</script>

<template>
	<IonItem
		:button="props.button"
		:class="{
			archived: props.showArchived && props.member.isArchived,
			'with-cover': props.showCover && !accessibilityConfig.disableCovers
		}"
		:style="getStyle()"
	>
		<Avatar
			slot="start"
			:image="member.image"
			:clip-shape="member.imageClip"
			:color="member.color"
			:icon="accountCircle"
		/>
		<IonCheckbox
			v-if="props.hasToggle === 'checkbox'"
			:value="props.toggleValue"
			:checked="props.toggleChecked"
			@update:model-value="value => emit('toggleUpdate', value as boolean)"
		>
			<MemberLabel
				:member="member"
				:show-chips="props.showChips"
				:show-role="props.showRole"
				:show-pronouns="props.showPronouns"
			>
				<template #before>
					<slot name="before" />
				</template>
				<slot />
			</MemberLabel>
		</IonCheckbox>
		<MemberLabel
			v-else
			:member="member"
			:show-chips="props.showChips"
			:show-role="props.showRole"
			:show-pronouns="props.showPronouns"
		>
			<template #before>
				<slot name="before" />
			</template>
			<slot />
		</MemberLabel>
		<template v-if="props.showIcons">
			<IonIcon v-if="member.isPinned" slot="end" :icon="pinMD" />
			<IonIcon v-if="member.isArchived" slot="end" :icon="archivedMD" />
			<IonIcon v-if="associatedFrontingEntry?.isMainFronter" slot="end" :icon="mainFronterMD" />
		</template>
		<slot name="button" />
	</IonItem>
</template>

<style scoped>
	ion-item.archived > * {
		opacity: 0.5;
	}

	ion-item.with-cover::part(native)::before {
		content: '\A';
		background-image: var(--data-cover);
		background-position: center;
		background-size: cover;
		width: calc(100% + 16px);
		height: 100%;
		display: block;
		position: absolute;
		z-index: -1;
		left: -16px;
		opacity: .25;
		mask-image: radial-gradient(circle at 10% 100%, black, transparent 100%);
	}
</style>