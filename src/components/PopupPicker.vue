<script setup lang="ts">
	import { IonModal, IonPicker, IonPickerColumn, IonPickerColumnOption } from '@ionic/vue';
	import { onMounted, Reactive, reactive, ref, watch } from 'vue';

	const self = ref();

	type ColumnContent = {
		name: string,
		values: PickerValue[],
		prefix?: string,
		suffix?: string
	}

	type PickerValue = {
		name: string,
		value: string|number|undefined,
		default?: boolean,
		disabled?: boolean,
		color?: string
	}

	const props = defineProps<{
		content: ColumnContent[],
		modelValue?: Reactive<Map<string, string | number | undefined>>
	}>();

	const emit = defineEmits<{
		'update:modelValue': [Reactive<Map<string, string | number | undefined>>],
	}>();

	const values = props.modelValue || reactive(new Map<string, string | number | undefined>());

	watch(values, () => {
		emit("update:modelValue", values);
	});

	onMounted(() => {
		for(const column of props.content)
			values.set(column.name, column.values.find(x => x.default)?.value || undefined);
	});

</script>

<template>
	<IonModal class="popup-picker" ref="self">
		<IonPicker>
			<IonPickerColumn
				v-for="column in props.content"
				@ionChange="(e) => { values.set(column.name, e.detail.value) }"
				:value="values.get(column.name) || column.values.find(x => x.default)?.value || undefined"
			>
				<div slot="prefix" v-if="column.prefix">{{ column.prefix }}</div>
				<IonPickerColumnOption v-for="option in column.values" :value="option.value" :color="option.color" :disabled="option.disabled">
					{{ option.name }}
				</IonPickerColumnOption>
				<div slot="suffix" v-if="column.suffix">{{ column.suffix }}</div>
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