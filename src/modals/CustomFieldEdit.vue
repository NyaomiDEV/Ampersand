<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonIcon,
		IonList,
		IonFab,
		IonFabButton,
		IonLabel,
		IonToggle,
		IonInput,
		IonItem,
		modalController,
		IonModal,
		alertController
	} from "@ionic/vue";

	import {
		saveOutline as saveIOS,
		trashBinOutline as trashIOS
	} from "ionicons/icons";

	import saveMD from "@material-symbols/svg-600/outlined/save.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";

	import { CustomField } from "../lib/db/entities";
	import { newCustomField, updateCustomField, deleteCustomField } from '../lib/db/tables/customFields';
	import { inject, ref, toRaw } from "vue";

	import { PartialBy } from "../lib/types";
	import { useTranslation } from "i18next-vue";


	const i18next = useTranslation();
	const isIOS = inject<boolean>("isIOS");

	const props = defineProps<{
		customField?: PartialBy<CustomField, "uuid">
	}>();

	const emptyCustomField: PartialBy<CustomField, "uuid"> = {
		name: ""
	};

	const customField = ref({...(props.customField || emptyCustomField)});

	async function save(){
		const uuid = customField.value?.uuid;
		const _customField = toRaw(customField.value);

		if(!uuid) {
			await newCustomField({..._customField });

			await modalController.dismiss(null, "added");

			return;
		}

		await updateCustomField(uuid, { ..._customField });

		try{
			await modalController.dismiss(null, "modified");
		}catch(_){}
		// catch an error because the type might get changed, causing the parent to be removed from DOM
		// however it's safe for us to ignore
	}

	function promptDeletion(): Promise<boolean> {
		return new Promise(async (resolve) => {
			const alert = await alertController.create({
				header: i18next.t("customFields:edit.delete.title"),
				subHeader: i18next.t("customFields:edit.delete.confirm"),
				buttons: [
					{
						text: i18next.t("other:alerts.cancel"),
						role: "cancel",
						handler: () => resolve(false)
					},
					{
						text: i18next.t("other:alerts.ok"),
						role: "confirm",
						handler: () => resolve(true)
					}
				]
			});

			await alert.present();
		});
	}

	async function removeCustomField(){
		if(await promptDeletion()){
			await deleteCustomField(customField.value.uuid!);
			try{
				await modalController.dismiss(undefined, "deleted");
			}catch(_){}
		}
	}
</script>

<template>
	<IonModal class="custom-field-edit-modal" :breakpoints="[0,1]" initialBreakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("customFields:edit.header") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList inset>
					<IonItem>
						<IonInput :fill="!isIOS ? 'outline' : undefined" :label="$t('customFields:edit.name')" labelPlacement="floating" v-model="customField.name" />
					</IonItem>
					<IonItem button detail="false">
						<IonToggle v-model="customField.default">
							<IonLabel>
								{{ $t("customFields:edit.default") }}
							</IonLabel>
						</IonToggle>
					</IonItem>
					<IonItem button detail="false" v-if="customField.uuid" @click="removeCustomField">
						<IonIcon :ios="trashIOS" :md="trashMD" slot="start" aria-hidden="true" color="danger"/>
						<IonLabel color="danger">
							<h3>{{ $t("customFields:edit.delete.title") }}</h3>
							<p>{{ $t("other:genericDeleteDesc") }}</p>
						</IonLabel>
					</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="save">
					<IonIcon :ios="saveIOS" :md="saveMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonModal>
</template>

<style scoped>
	ion-modal.custom-field-edit-modal {
		--height: 50dvh;
		--min-height: 600px;
		--border-radius: 16px;
	}
</style>