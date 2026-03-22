<script setup lang="ts">
	import { IonCard, IonCardHeader, IonCardContent, IonCardTitle, IonIcon } from "@ionic/vue";
	import { openUrl } from "@tauri-apps/plugin-opener";

	import forwardMD from "@material-symbols/svg-600/outlined/arrow_forward.svg";

	const props = defineProps<{
		url: string,
		icon: string,
		title: string,
		description: string
	}>();
</script>

<template>
	<IonCard button @click="openUrl(props.url)">
		<IonCardHeader>
			<IonCardTitle>
				<IonIcon :icon="$props.icon" />
				{{ props.title }}
			</IonCardTitle>
			<IonIcon :icon="forwardMD" flip-rtl />
		</IonCardHeader>
		<IonCardContent>
			{{ description }}
		</IonCardContent>
	</IonCard>
</template>

<style scoped>
	ion-card-header {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;

		> ion-icon {
			width: 20px;
			height: 20px;
		}
	}

	ion-card-title > ion-icon {
		margin-inline-end: 8px;
		width: 1.25em;
		height: 1.25em;
		vertical-align: text-bottom;
	} 
</style>