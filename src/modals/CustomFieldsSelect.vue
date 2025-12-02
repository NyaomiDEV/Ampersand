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

	import { onBeforeMount, reactive, ref, shallowRef, toRaw, watch } from "vue";
	import { CustomField } from "../lib/db/entities";
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";
	import { getFilteredCustomFields } from "../lib/db/tables/customFields";

	const props = defineProps<{
		customTitle?: string,
		modelValue?: CustomField[]
	}>();

	const emit = defineEmits<{
		"update:modelValue": [CustomField[]],
	}>();

	const selectedCustomFields = reactive<CustomField[]>([...props.modelValue || []]);
	const search = ref("");
	const customFields = shallowRef<CustomField[]>();

	watch(selectedCustomFields, () => {
		emit("update:modelValue",  [...toRaw(selectedCustomFields)]);
	});

	watch(search, async () => {
		await getCustomFields();
	});

	onBeforeMount(async () => {
		await getCustomFields();
	});

	async function getCustomFields(){
		customFields.value = (await Array.fromAsync(getFilteredCustomFields(search.value))).sort((a, b) => a.priority - b.priority);
	}

	function check(customField: CustomField, checked: boolean){
		if(checked)
			selectedCustomFields.push(customField);
		else {
			const index = selectedCustomFields.findIndex(x => x.id === customField.id);
			if(index > -1)
				selectedCustomFields.splice(index, 1);
		}
	}
</script>

<template>
	<IonModal class="custom-fields-select-modal" :breakpoints="[0,0.75,1]" initial-breakpoint="0.75">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ props.customTitle ?? $t("customFields:select") }}</IonTitle>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar
					:animated="true"
					:placeholder="$t('customFields:searchPlaceholder')"
					show-cancel-button="focus"
					show-clear-button="focus"
					:spellcheck="false"
					@ion-change="e => search = e.detail.value || ''"
				/>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="!customFields" />
		<IonContent v-else>
			<IonList>
				<IonItem v-for="customField in customFields" :key="customField.id" button>
					<IonCheckbox
						:disabled="customField.default"
						:value="customField.id"
						:checked="!!selectedCustomFields.find(x => x.id === customField.id)"
						@update:model-value="value => check(customField, value)"
					>
						<IonLabel>{{ customField.name }}</IonLabel>
					</IonCheckbox>
				</IonItem>
			</IonList>
		</IonContent>
	</IonModal>
</template>
