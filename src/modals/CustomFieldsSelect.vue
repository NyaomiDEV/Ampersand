<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonList,
		IonItem,
		IonModal,
		IonSearchbar,
		IonCheckbox,
		IonLabel,
	} from "@ionic/vue";

	import { inject, onBeforeMount, reactive, ref, shallowRef, toRaw, watch } from "vue";
	import { getFilteredCustomFields } from "../lib/search";
	import { CustomField } from "../lib/db/entities";
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";
	import { getCustomFields } from "../lib/db/tables/customFields";

	const isIOS = inject<boolean>("isIOS");

	const props = defineProps<{
		customTitle?: string,
		modelValue?: CustomField[]
	}>();

	const emit = defineEmits<{
		'update:modelValue': [CustomField[]],
	}>();

	const selectedCustomFields = reactive<CustomField[]>([...props.modelValue || []]);
	const search = ref("");
	const customFields = shallowRef<CustomField[]>();
	const filteredCustomFields = shallowRef<CustomField[]>();

	watch(selectedCustomFields, () => {
		emit("update:modelValue",  [...toRaw(selectedCustomFields)]);
	});

	watch([search, customFields], () => {
		filteredCustomFields.value = getFilteredCustomFields(search.value, customFields.value);
	}, { immediate: true })

	onBeforeMount(async () => {
		customFields.value = await getCustomFields();
	});

	function check(customField: CustomField, checked: boolean){
		if(checked)
			selectedCustomFields.push(customField);
		else {
			const index = selectedCustomFields.findIndex(x => x.uuid === customField.uuid);
			if(index > -1)
				selectedCustomFields.splice(index, 1);
		}
	}
</script>

<template>
	<IonModal class="custom-fields-select-modal" :breakpoints="[0,0.25,0.75,1]" initialBreakpoint="0.75">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ props.customTitle ?? $t("customFields:select") }}</IonTitle>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar :animated="true" :placeholder="$t('customFields:searchPlaceholder')"
					showCancelButton="focus" showClearButton="focus" :spellcheck="false" v-model="search" />
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="!customFields" />
		<IonContent v-else>
			<IonList :inset="isIOS">
				<IonItem button v-for="customField in filteredCustomFields" :key="customField.uuid">
					<IonCheckbox :disabled="customField.default" :value="customField.uuid" :checked="!!selectedCustomFields.find(x => x.uuid === customField.uuid)" @update:modelValue="value => check(customField, value)">
						<IonLabel>{{ customField.name }}</IonLabel>
					</IonCheckbox>
				</IonItem>
			</IonList>
		</IonContent>
	</IonModal>
</template>

<style scoped>
	ion-modal.custom-fields-select-modal {
		--height: 100dvh;
		--border-radius: 16px;
	}
</style>