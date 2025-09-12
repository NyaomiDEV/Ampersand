<script setup lang="ts">
	import { IonModal, IonDatetime } from "@ionic/vue";
	import { appConfig } from "../lib/config";
	import { ref, watch } from "vue";
	import dayjs from "dayjs";

	// copied from ionic because they dont export it (??)
	type DatetimePresentation = "date-time" | "time-date" | "date" | "time" | "month" | "year" | "month-year";
	type DatetimeHighlight = {
		date: string;
	} & DatetimeHighlightStyle;
	type DatetimeHighlightCallback = (dateIsoString: string) => DatetimeHighlightStyle | undefined;
	type DatetimeHighlightStyle = {
		textColor?: string;
		backgroundColor?: string;
		border?: string;
	} & ({
		textColor: string;
	} | {
		backgroundColor: string;
	} | {
		border: string;
	});

	const props = defineProps<{
		presentation?: DatetimePresentation,
		showDefaultButtons?: boolean,
		highlightedDates?: DatetimeHighlight[] | DatetimeHighlightCallback,
		min?: Date,
		max?: Date,
		title?: string
	}>();

	const model = defineModel<Date>();
	const innerModel = ref<string | undefined>(dayjs(model.value).format());
	watch(innerModel, () => model.value = dayjs(innerModel.value).toDate());
</script>

<template>
	<IonModal :keep-contents-mounted="true">
		<IonDatetime
			v-model="innerModel"
			:presentation="props.presentation"
			:show-default-buttons="props.showDefaultButtons"
			:hour-cycle="appConfig.locale.twelveHourClock ? 'h12' : 'h23'"
			:first-day-of-week="appConfig.locale.twelveHourClock ? 0 : 1"
			:locale="appConfig.locale.language || 'en'"
			:min="props.min ? dayjs(props.min).format() : undefined"
			:max="props.max ? dayjs(props.max).format() : undefined"
			:highlighted-dates="props.highlightedDates"
			:done-text="$t('other:alerts.ok')"
			:cancel-text="$t('other:alerts.cancel')"
		>
			<span v-if="props.title" slot="title">{{ props.title }}</span>
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