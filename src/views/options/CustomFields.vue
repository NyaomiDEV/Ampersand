<script setup lang="ts">
	import { IonBackButton, IonContent, IonHeader, IonSearchbar, IonList, IonIcon, IonPage, IonTitle, IonToolbar, IonFab, IonFabButton, IonItem, IonLabel } from '@ionic/vue';
	import { h, inject, onBeforeMount, onUnmounted, ref, shallowRef, watch } from 'vue';
	import { CustomField } from '../../lib/db/entities';
	import { getCustomFields } from '../../lib/db/tables/customFields';
	import { DatabaseEvent, DatabaseEvents } from '../../lib/db/events';
	import { useRoute } from 'vue-router';
	import { getFilteredCustomFields } from '../../lib/search';
	import SpinnerFullscreen from '../../components/SpinnerFullscreen.vue';
	import CustomFieldEdit from '../../modals/CustomFieldEdit.vue';
	import { addModal, removeModal } from '../../lib/modals';

	import addMD from "@material-symbols/svg-600/outlined/add.svg";

	const route = useRoute();

	const isIOS = inject<boolean>("isIOS");

	const search = ref(route.query.q as string || "");
	watch(route, () => {
		search.value = route.query.q as string || "";
	});

	const customFields = shallowRef<CustomField[]>();
	const filteredCustomFields = shallowRef<CustomField[]>();
	watch([customFields, search], () => {
		filteredCustomFields.value = getFilteredCustomFields(search.value, customFields.value);
	}, { immediate: true });

	const listener = async (event: Event) => {
		if(["customFields"].includes((event as DatabaseEvent).data.table)){
			customFields.value = await getCustomFields();
		}
	}

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		customFields.value = await getCustomFields();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	async function showModal(clickedCustomField?: CustomField){
		const vnode = h(CustomFieldEdit, {
			customField: clickedCustomField,
			onDidDismiss: () => removeModal(vnode)
		});

		const modal = await addModal(vnode);
		await (modal.el as any).present();
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>
					{{ $t("customFields:header") }}
				</IonTitle>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar
					:animated="true"
					:placeholder="$t('customFields:searchPlaceholder')"
					showCancelButton="focus"
					showClearButton="focus"
					:spellcheck="false"
					v-model="search"
				/>
			</IonToolbar>
		</IonHeader>
		
		<SpinnerFullscreen v-if="!customFields" />
		<IonContent v-else>
			<IonList :inset="isIOS">
				<IonItem button v-for="customField in customFields" :key="customField.uuid" @click="showModal(customField)">
					<IonLabel>{{ customField.name }}</IonLabel>
				</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="showModal()">
					<IonIcon :icon="addMD" />
				</IonFabButton>
			</IonFab>

		</IonContent>
	</IonPage>
</template>