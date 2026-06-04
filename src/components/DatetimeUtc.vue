<script setup lang="ts">
	import { IonDatetime } from "@ionic/vue";
	import { getLocaleInfo } from "../lib/i18n";
	import { appConfig } from "../lib/config";
	import { ComponentPublicInstance, useTemplateRef, watch } from "vue";
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

	export type DatetimeParts = {
		ampm: "am" | "pm"
		day: number
		hour: number
		minute: number
		month: number
		year: number
	};

	const props = defineProps<{
		modelValue: Date,
		presentation?: DatetimePresentation,
		showDefaultButtons?: boolean,
		dayValues?: number | number[] | string,
		disabled?: boolean,
		highlightedDates?: DatetimeHighlight[] | DatetimeHighlightCallback,
		preferWheel?: boolean,
		min?: Date,
		max?: Date,
	}>();

	const emit = defineEmits<{
		"update:modelValue": [Date]
		"ref": [Element | ComponentPublicInstance | null]
		"parts": [DatetimeParts]
	}>();

	// we're patching ion-datetime's internal `this.setWorkingParts()` function with this helper
	const patchFunction = (originalFunction: (parts: DatetimeParts) => void) => (
		function setWorkingParts(parts: DatetimeParts){
			originalFunction(parts);
			emit("parts", parts);
		}
	);

	const localeInfo = getLocaleInfo();

	const datetime = useTemplateRef("datetime");

	watch(datetime, () => {
		if(datetime.value){
			emit("ref", datetime.value);

			// patching happens here
			const el = datetime.value.$el;
			el.setWorkingParts = patchFunction(el.setWorkingParts);
		}
	});
</script>

<template>
	<IonDatetime
		ref="datetime"
		:presentation="props.presentation"
		:show-default-buttons="props.showDefaultButtons"
		:first-day-of-week="localeInfo.firstDayOfWeek"
		:hour-cycle="localeInfo.hourCycle"
		:locale="appConfig.locale.language || 'en'"
		:highlighted-dates="props.highlightedDates"
		:cancel-text="$t('other:alerts.cancel')"
		:clear-text="$t('other:alerts.clear')"
		:done-text="$t('other:alerts.ok')"
		:min="props.min ? dayjs(props.min).local().format() : undefined"
		:max="props.max ? dayjs(props.max).local().format() : undefined"
		:prefer-wheel="props.preferWheel"
		:day-values="props.dayValues"
		:disabled="props.disabled"
		:value="dayjs(props.modelValue).local().format()"
		@ion-change="console.log(emit('update:modelValue', dayjs($event.detail.value as string).local().utc().toDate()))"
	>
		<slot />
	</IonDatetime>
</template>