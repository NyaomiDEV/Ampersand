<script setup lang="ts">
	import { IonBackButton, IonContent, IonHeader, IonSearchbar, IonList, IonIcon, IonPage, IonTitle, IonToolbar, IonFab, IonFabButton, IonItem, IonLabel } from "@ionic/vue";
	import { h, inject, onBeforeMount, onUnmounted, ref, shallowRef, watch } from "vue";
	import { CustomField } from "../../lib/db/entities";
	import { getFilteredCustomFields } from "../../lib/db/tables/customFields";
	import { DatabaseEvent, DatabaseEvents } from "../../lib/db/events";
	import { useRoute } from "vue-router";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import CustomFieldEdit from "../../modals/CustomFieldEdit.vue";
	import { addModal, removeModal } from "../../lib/modals";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import addMD from "@material-symbols/svg-600/outlined/add.svg";

	const route = useRoute();

	const isIOS = inject<boolean>("isIOS");

	const search = ref(route.query.q as string || "");
	watch(route, () => {
		if(route.query.q)
			search.value = route.query.q as string;
	});

	const customFields = shallowRef<CustomField[]>();

	watch(search, async () => {
		customFields.value = await Array.fromAsync(getFilteredCustomFields(search.value));
	});

	const listener = (event: Event) => {
		if(["customFields"].includes((event as DatabaseEvent).data.table))
			void Array.fromAsync(getFilteredCustomFields(search.value)).then(res => customFields.value = res);
		
	};

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		customFields.value = await Array.fromAsync(getFilteredCustomFields(search.value));
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
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
		await (modal.el as any).present();
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton
					slot="start"
					:text="isIOS ? $t('other:back') : undefined"
					:icon="!isIOS ? backMD : undefined"
					default-href="/options/"
				/>
				<IonTitle>
					{{ $t("customFields:header") }}
				</IonTitle>
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
			<IonList :inset="isIOS">
				<IonItem
					v-for="customField in customFields"
					:key="customField.uuid"
					button
					@click="showModal(customField)"
				>
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