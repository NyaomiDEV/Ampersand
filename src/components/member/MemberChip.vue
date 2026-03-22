<script setup lang="ts">
	import {
		IonChip,
		IonLabel,

	} from "@ionic/vue";

	import { Member } from "../../lib/db/entities";
	import { accessibilityConfig } from "../../lib/config";

	import Avatar from "../Avatar.vue";

	import accountCircle from "@material-symbols/svg-600/outlined/account_circle-fill.svg";

	const props = withDefaults(defineProps<{
		member: Member,
		clickable?: boolean,
		showBorderColor?: boolean
	}>(), {
		showBorderColor: true
	});

	const routerLink = props.clickable ? `/members/edit?uuid=${props.member.uuid}` : undefined;

	function getStyle(){
		const style: Record<string, string> = {};

		if(props.member.color)
			style["--data-color"] = props.member.color;

		return style;
	}
</script>

<template>
	<IonChip
		:class="{
			'with-border-color': props.showBorderColor && accessibilityConfig.colorIndicatorPosition === 'list-item'
		}"
		:style="getStyle()"
		:router-link
		@click="(e) => e.stopPropagation()"
	>
		<Avatar
			:image="props.member.image"
			:clip-shape="props.member.imageClip"
			:color="props.member.color"
			:icon="accountCircle"
		/>
		<IonLabel class="nowrap">
			{{ props.member.name }}
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