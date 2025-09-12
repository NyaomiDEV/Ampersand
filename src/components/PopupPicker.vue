<script setup lang="ts">
	import { IonModal, IonPicker, IonPickerColumn, IonPickerColumnOption } from "@ionic/vue";
	import { onMounted, reactive, watch } from "vue";

	type ColumnContent = {
		name: string,
		values: PickerValue[],
		prefix?: string,
		suffix?: string
	};

	type PickerValue = {
		name: string,
		value: string|number|undefined,
		default?: boolean,
		disabled?: boolean,
		color?: string
	};

	const props = defineProps<{
		content: ColumnContent[],
		modelValue?: Map<string, string | number | undefined>
	}>();

	const emit = defineEmits<{
		"update:modelValue": [Map<string, string | number | undefined>],
	}>();

	const values = reactive(new Map<string, string | number | undefined>(props.modelValue));

	watch(values, () => {
		emit("update:modelValue", new Map(values));
	});

	onMounted(() => {
		for(const column of props.content)
			values.set(column.name, column.values.find(x => x.default)?.value || undefined);
	});
</script>

<template>
	<IonModal class="popup-picker">
		<IonPicker>
			<IonPickerColumn
				v-for="column in props.content"
				:key="column.name"
				:value="values.get(column.name) || column.values.find(x => x.default)?.value || undefined"
				@ion-change="(e) => { values.set(column.name, e.detail.value) }"
			>
				<div v-if="column.prefix" slot="prefix">{{ column.prefix }}</div>
				<IonPickerColumnOption
					v-for="option in column.values"
					:key="option.value"
					:value="option.value"
					:color="option.color"
					:disabled="option.disabled"
				>
					{{ option.name }}
				</IonPickerColumnOption>
				<div v-if="column.suffix" slot="suffix">{{ column.suffix }}</div>
			</IonPickerColumn>
		</IonPicker>
	</IonModal>
</template>

<style scoped>
	ion-modal.popup-picker {
		--backdrop-opacity: var(--ion-backdrop-opacity, 0.32) !important;
		--border-radius: 16px;
		--width: unset;
		--height: unset;
	}
</style>