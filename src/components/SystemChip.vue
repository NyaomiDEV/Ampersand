<script setup lang="ts">
	import {
		IonAvatar,
		IonChip,
		IonLabel,
		IonIcon
	} from "@ionic/vue";

	import { System } from "../lib/db/entities";
	import { getObjectURL } from "../lib/util/blob";
	import accountCircle from "@material-symbols/svg-600/outlined/supervised_user_circle.svg";

	const props = defineProps<{
		system: System,
		clickable?: boolean
	}>();

	const routerLink = props.clickable ? `/options/systems/edit?uuid=${props.system.uuid}` : undefined;
</script>

<template>
	<IonChip :router-link @click="(e) => e.stopPropagation()">
		<IonAvatar v-if="props.system.image">
			<img aria-hidden="true" :src="getObjectURL(props.system.image)" />
		</IonAvatar>
		<IonIcon v-else :icon="accountCircle" />
		<IonLabel class="nowrap">
			{{ props.system.name }}
		</IonLabel>
	</IonChip>
</template>

<style scoped>
	ion-chip ion-icon {
		color: var(--ion-color-primary)
	}
</style>