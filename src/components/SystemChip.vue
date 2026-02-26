<script setup lang="ts">
	import {
		IonAvatar,
		IonChip,
		IonLabel,
		IonIcon
	} from "@ionic/vue";

	import { SQLFile, System } from "../lib/db/entities";
	import { getObjectURL } from "../lib/util/blob";
	import accountCircle from "@material-symbols/svg-600/outlined/supervised_user_circle.svg";
	import { ref, watch } from "vue";

	const props = defineProps<{
		system: System,
		clickable?: boolean
	}>();

	const avatarUri = ref();

	async function updateAvatarUri() {
		if(props.system.image) avatarUri.value = await getObjectURL(props.system.image as SQLFile);
	}

	const routerLink = props.clickable ? `/options/systems/edit?uuid=${props.system.id}` : undefined;

	watch(props, async () => {
		await updateAvatarUri();
	}, { immediate: true });
</script>

<template>
	<IonChip :router-link @click="(e) => e.stopPropagation()">
		<IonAvatar>
			<img v-if="avatarUri" aria-hidden="true" :src="avatarUri" />
			<IonIcon v-else :icon="accountCircle" />
		</IonAvatar>
		<IonLabel class="nowrap">
			{{ props.system.name }}
		</IonLabel>
	</IonChip>
</template>

<style scoped>
	ion-icon {
		width: 100%;
		height: 100%;
		color: var(--ion-color-primary);
	}
</style>
