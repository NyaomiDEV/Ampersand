<script setup lang="ts">
	import {
		IonChip,
		IonLabel,
		useIonRouter,
	} from "@ionic/vue";

	import { System } from "../../lib/db/entities";
	import { accessibilityConfig } from "../../lib/config";

	import Avatar from "../Avatar.vue";
	import accountCircle from "@material-symbols/svg-600/outlined/supervised_user_circle.svg";

	const router = useIonRouter();

	const props = withDefaults(defineProps<{
		system: System,
		clickable?: boolean,
		showBorderColor?: boolean
	}>(), {
		showBorderColor: true
	});

	function click(e: Event){
		if(!props.clickable) return;
		e.stopPropagation();
		router.push(`/options/systems/edit?uuid=${props.system.uuid}`);
	}

	function getStyle(){
		const style: Record<string, string> = {};

		if(props.system.color)
			style["--data-color"] = props.system.color;

		return style;
	}
</script>

<template>
	<IonChip
		:class="{
			'with-border-color': props.showBorderColor && accessibilityConfig.colorIndicatorPosition === 'list-item'
		}"
		:style="getStyle()"
		@click="click"
	>
		<Avatar
			:image="system.image"
			:clip-shape="system.imageClip"
			:color="system.color"
			:icon="accountCircle"
		/>
		<IonLabel class="nowrap">
			{{ props.system.name }}
		</IonLabel>
	</IonChip>
</template>

<style scoped>
	.avatar {
		width: 24px;
		height: 24px;
		margin-inline-end: 8px;
	}

	ion-chip {
		position: relative;
		z-index: 0;

		&.with-border-color::before {
			content: "\A";
			position: absolute;
			width: 100%;
			height: 100%;
			z-index: -1;
			top: 0;
			left: 0;
			border-inline-start: 2px solid var(--data-color, transparent);
		}
	}
</style>