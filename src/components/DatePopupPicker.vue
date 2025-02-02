<script setup lang="ts">
	import { IonModal, IonDatetime } from '@ionic/vue';
	import { appConfig } from '../lib/config';
	import { ref, watch } from 'vue';
	import dayjs from "dayjs";

	const props = defineProps<{
		presentation?: string,
		showDefaultButtons?: boolean,
		min?: Date,
		max?: Date,
		title?: string
	}>();

	const model = defineModel<Date>();
	const innerModel = ref<string | undefined>(dayjs(model.value).format());
	watch(innerModel, () => model.value = dayjs(innerModel.value).toDate());
</script>

<template>
	<IonModal>
		<IonDatetime
			:presentation="props.presentation"
			:showDefaultButtons="props.showDefaultButtons"
			:hourCycle="appConfig.locale.twelveHourClock ? 'h12' : 'h23'"
			:firstDayOfWeek="appConfig.locale.twelveHourClock ? 0 : 1"
			:locale="appConfig.locale.language || 'en'"
			:min="props.min ? dayjs(props.min).format() : undefined"
			:max="props.max ? dayjs(props.max).format() : undefined"
			:doneText="$t('other:alerts.ok')"
			:cancelText="$t('other:alerts.cancel')"
			v-model="innerModel"
		>
			<span slot="title" v-if="props.title">{{ props.title }}</span>
			<span slot="time-label">{{ $t("other:time") }}</span>
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