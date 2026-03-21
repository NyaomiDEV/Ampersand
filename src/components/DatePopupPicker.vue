<script setup lang="ts">
	import { IonModal } from "@ionic/vue";
	import { ref, watch } from "vue";
	import DatetimeUtc from "./DatetimeUtc.vue";

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
	const innerModel = ref(model.value);
	watch(innerModel, () => model.value = innerModel.value);
</script>

<template>
	<IonModal :keep-contents-mounted="true">
		<DatetimeUtc
			v-model="innerModel"
			:presentation="props.presentation"
			:show-default-buttons="props.showDefaultButtons"
			:min="props.min"
			:max="props.max"
			:highlighted-dates="props.highlightedDates"
		>
			<span v-if="props.title" slot="title">{{ props.title }}</span>
			<span slot="time-label">{{ $t("other:time") }}</span>
		</DatetimeUtc>
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