<script setup lang="ts">
	import {
		IonChip,
		IonLabel,
	} from "@ionic/vue";

	import { System } from "../../lib/db/entities";

	import Avatar from "../Avatar.vue";
	import accountCircle from "@material-symbols/svg-600/outlined/supervised_user_circle.svg";

	const props = defineProps<{
		system: System,
		clickable?: boolean
	}>();

	const routerLink = props.clickable ? `/options/systems/edit?uuid=${props.system.uuid}` : undefined;
</script>

<template>
	<IonChip :router-link @click="(e) => e.stopPropagation()">
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
		margin-right: 8px;
	}
</style>