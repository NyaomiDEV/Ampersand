<script setup lang="ts">
	import { IonBackButton, IonContent, IonHeader, IonSearchbar, IonList, IonIcon, IonPage, IonTitle, IonToolbar, IonFab, IonFabButton, IonItem, IonLabel, IonReorderGroup, IonReorder, IonButtons, IonButton } from "@ionic/vue";
	import { h, onBeforeMount, onUnmounted, ref, shallowRef, watch } from "vue";
	import { CustomField } from "../../lib/db/entities";
	import { getFilteredCustomFields, updateCustomField } from "../../lib/db/tables/customFields";
	import { DatabaseEvent, DatabaseEvents } from "../../lib/db/events";
	import { useRoute } from "vue-router";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import CustomFieldEdit from "../../modals/CustomFieldEdit.vue";
	import { addModal, removeModal } from "../../lib/modals";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import addMD from "@material-symbols/svg-600/outlined/add.svg";
	import reorderMD from "@material-symbols/svg-600/outlined/swap_vert.svg";
	import doneMD from "@material-symbols/svg-600/outlined/done_all.svg";
	import dragMD from "@material-symbols/svg-600/outlined/drag_handle.svg";

	const route = useRoute();

	const search = ref(route.query.q as string || "");
	watch(route, () => {
		if(route.query.q)
			search.value = route.query.q as string;
	});

	const customFields = shallowRef<CustomField[]>();

	const isReordering = ref(false);

	watch(search, async () => {
		await getCustomFields();
	});

	const listener = (event: Event) => {
		if(["customFields"].includes((event as DatabaseEvent).data.table))
			void getCustomFields();
	};

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await getCustomFields();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	async function getCustomFields(){
		customFields.value = (await Array.fromAsync(getFilteredCustomFields(search.value))).sort((a, b) => a.priority - b.priority);
	}

	async function showModal(clickedCustomField?: CustomField){
		const vnode = h(CustomFieldEdit, {
			customField: clickedCustomField,
			onDidDismiss: () => removeModal(vnode)
		});

		const modal = await addModal(vnode);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
		await (modal.el as any).present();
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async function handleReorder(e: any){
		// remove the database listener to commit crimes against humanity
		DatabaseEvents.removeEventListener("updated", listener);

		// actual reorder code
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		e.detail.complete();
		if(!customFields.value) return;
		if(e.detail.from === e.detail.to) return;

		const _customFields = [...customFields.value.map(x => x.uuid)];
		const element = _customFields[e.detail.from];
		_customFields.splice(e.detail.from, 1);
		_customFields.splice(e.detail.to, 0, element);

		for(const field of customFields.value){
			const oldPriority = field.priority;
			const newPriority = _customFields.findIndex(x => x === field.uuid);
			if(oldPriority === newPriority) continue;
			await updateCustomField(field.uuid, { priority: newPriority });
		}

		// now that we committed crimes against humanity, register the listener again
		DatabaseEvents.addEventListener("updated", listener);
		// and grab ordered list
		await getCustomFields();
	}

</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton
					slot="start"
					:icon="backMD"
					default-href="/options/"
				/>
				<IonTitle>
					{{ $t("customFields:header") }}
				</IonTitle>
				<IonButtons slot="secondary">
					<IonButton @click="isReordering = !isReordering">
						<IonIcon slot="icon-only" :icon="isReordering ? doneMD : reorderMD" />
					</IonButton>
				</IonButtons>
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
				<IonReorderGroup :disabled="!isReordering" @ion-reorder-end="handleReorder">
					<IonItem
						v-for="customField in customFields"
						:key="customField.uuid"
						button
						:class="{ 'default': customField.default }"
						@click="() => { if(!isReordering) void showModal(customField); }"
					>
						<IonLabel>{{ customField.name }}</IonLabel>
						<IonReorder slot="end">
							<IonIcon :icon="dragMD" />
						</IonReorder>
					</IonItem>
				</IonReorderGroup>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="void showModal()">
					<IonIcon :icon="addMD" />
				</IonFabButton>
			</IonFab>

		</IonContent>
	</IonPage>
</template>

<style scoped>
ion-reorder > ion-icon {
	width: 24px;
	height: 24px;
	color: rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.54);
}

ion-item.default {
	--background: var(--ion-background-color-step-150);
}
</style>