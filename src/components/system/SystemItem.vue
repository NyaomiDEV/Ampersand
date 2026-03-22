<script setup lang="ts">
	import { IonItem, IonIcon, IonCheckbox } from "@ionic/vue";
	import Avatar from "../Avatar.vue";
	import SystemLabel from "./SystemLabel.vue";
	import { System } from "../../lib/db/entities";
	import { useBlob } from "../../lib/util/blob";
	import { appConfig, accessibilityConfig } from "../../lib/config";

	import systemCircle from "@material-symbols/svg-600/outlined/supervised_user_circle.svg";
	import defaultMD from "@material-symbols/svg-600/outlined/bookmark_star.svg";
	import pinMD from "@material-symbols/svg-600/outlined/keep.svg";
	import archivedMD from "@material-symbols/svg-600/outlined/archive.svg";

	const props = withDefaults(defineProps<{
		system: System,
		showIcons?: boolean,
		hasToggle?: "checkbox",
		toggleValue?: string,
		toggleChecked?: boolean,
		showCover?: boolean,
		showEffects?: boolean,
		button?: boolean,
		showBorderColor?: boolean
	}>(), {
		showIcons: false,
		showCover: true,
		showEffects: false,
		showBorderColor: true
	});

	const emit = defineEmits<{
		"toggleUpdate": [boolean],
	}>();

	const { getObjectURL } = useBlob();

	function getStyle(){
		const style: Record<string, string> = {};

		if(props.system.cover)
			style["--data-cover"] = `url(${getObjectURL(props.system.cover)})`;

		if(props.system.color)
			style["--data-color"] = props.system.color;

		return style;
	}
</script>

<template>
	<IonItem
		:button="props.button"
		:class="{
			archived: props.showEffects && props.system.isArchived,
			'with-cover': props.showCover && !accessibilityConfig.disableCovers,
			'with-border-color': props.showBorderColor && accessibilityConfig.colorIndicatorPosition === 'list-item',
			'default-system': props.showEffects && system.uuid === appConfig.defaultSystem
		}"
		:style="getStyle()"
	>
		<Avatar
			slot="start"
			:image="system.image"
			:clip-shape="system.imageClip"
			:color="system.color"
			:icon="systemCircle"
		/>
		<IonCheckbox
			v-if="props.hasToggle === 'checkbox'"
			:value="props.toggleValue"
			:checked="props.toggleChecked"
			@update:model-value="value => emit('toggleUpdate', value as boolean)"
		>
			<SystemLabel :system="props.system">
				<template #before>
					<slot name="before" />
				</template>
				<slot />
			</SystemLabel>
		</IonCheckbox>
		<SystemLabel v-else :system="props.system">
			<template #before>
				<slot name="before" />
			</template>
			<slot />
		</SystemLabel>
		<template v-if="props.showIcons">
			<IonIcon v-if="appConfig.defaultSystem === system.uuid" slot="end" :icon="defaultMD" />
			<IonIcon v-if="system.isPinned" slot="end" :icon="pinMD" />
			<IonIcon v-if="system.isArchived" slot="end" :icon="archivedMD" />
		</template>
		<slot name="end" />
	</IonItem>
</template>

<style scoped>
	ion-item.archived > * {
		opacity: 0.5;
	}

	ion-item.default-system {
		--background: var(--ion-background-color-step-150);
	}

	ion-item.with-cover::part(native)::before {
		content: '\A';
		background-image: var(--data-cover);
		background-position: center;
		background-size: cover;
		width: 100%;
		height: 100%;
		display: block;
		position: absolute;
		z-index: -1;
		left: 0;
		opacity: .25;
		mask-image: radial-gradient(circle at 10% 100%, black, transparent 100%);
	}

	ion-item.with-border-color::part(native) {
		border-inline-start: 4px solid var(--data-color, transparent);
	}
</style>