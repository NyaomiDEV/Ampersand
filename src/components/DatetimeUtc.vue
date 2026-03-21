<script setup lang="ts">
	import { IonDatetime } from "@ionic/vue";
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
		dayValues?: number | number[] | string,
		disabled?: boolean,
		highlightedDates?: DatetimeHighlight[] | DatetimeHighlightCallback,
		preferWheel?: boolean,
		min?: Date,
		max?: Date
	}>();

	const model = defineModel<Date>();
	const innerModel = ref<string | undefined>(dayjs(model.value).local().format());
	watch(innerModel, () => model.value = dayjs(innerModel.value).utc().toDate());
</script>

<template>
	<IonDatetime
		:presentation="props.presentation"
		:show-default-buttons="props.showDefaultButtons"
		:first-day-of-week="appConfig.locale.firstWeekOfDayIsSunday ? 0 : 1"
		:hour-cycle="appConfig.locale.twelveHourClock ? 'h12' : 'h23'"
		:locale="appConfig.locale.language || 'en'"
		:highlighted-dates="props.highlightedDates"
		:cancel-text="$t('other:alerts.cancel')"
		:clear-text="$t('other:alerts.clear')"
		:done-text="$t('other:alerts.ok')"
		:min="props.min ? dayjs(props.min).format() : undefined"
		:max="props.max ? dayjs(props.max).format() : undefined"
		:prefer-wheel="props.preferWheel"
		:day-values="props.dayValues"
		:disabled="props.disabled"
		:value="dayjs(model).local().format()"
		@ion-change="model = dayjs($event.detail.value as string).local().toDate()"
	>
		<slot />
	</IonDatetime>
</template>