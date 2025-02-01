<script setup lang="ts">
	import { IonModal, IonDatetime } from '@ionic/vue';
	import { appConfig } from '../lib/config';

	const props = defineProps<{
		presentation?: string,
		showDefaultButtons?: boolean,
		min?: Date,
		max?: Date,
		title?: string
	}>();

	const model = defineModel<string>();
</script>

<template>
	<IonModal>
		<IonDatetime
			:presentation="props.presentation"
			:showDefaultButtons="props.showDefaultButtons"
			:hourCycle="appConfig.locale.twelveHourClock ? 'h12' : 'h23'"
			:firstDayOfWeek="appConfig.locale.twelveHourClock ? 0 : 1"
			:locale="appConfig.locale.language || 'en'"
			:min="props.min?.toISOString()"
			:max="props.max?.toISOString()"
			v-model="model"
		>
			<span slot="title" v-if="props.title">{{ props.title }}</span>
		</IonDatetime>
	</IonModal>
</template>

<style scoped>
ion-modal {
	--backdrop-opacity: var(--ion-backdrop-opacity, 0.32) !important;
	--border-radius: 16px;
	--width: unset;
	--height: unset;
}
</style>