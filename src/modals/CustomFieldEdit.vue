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

	import saveMD from "@material-symbols/svg-600/outlined/save.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";

	import { CustomField } from "../lib/db/entities";
	import { newCustomField, updateCustomField, deleteCustomField } from "../lib/db/tables/customFields";
	import { ref, toRaw } from "vue";

	import { PartialBy } from "../lib/types";
	import { useTranslation } from "i18next-vue";


	const i18next = useTranslation();

	const props = defineProps<{
		customField?: PartialBy<CustomField, "uuid">
	}>();

	const emptyCustomField: PartialBy<CustomField, "uuid"> = {
		name: "",
		priority: 1
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
		}catch(_){ /* empty */ }
		// catch an error because the type might get changed, causing the parent to be removed from DOM
		// however it's safe for us to ignore
	}

	function promptDeletion(): Promise<boolean> {
		return new Promise((resolve) => {
			void (async () => {
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
			})();
		});
	}

	async function removeCustomField(){
		if(await promptDeletion()){
			await deleteCustomField(customField.value.uuid!);
			try{
				await modalController.dismiss(undefined, "deleted");
			}catch(_){ /* empty */ }
		}
	}
</script>

<template>
	<IonModal class="custom-field-edit-modal" :breakpoints="[0,1]" initial-breakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ !customField.uuid ? $t("customFields:edit.headerAdd") : $t("customFields:edit.header") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList inset>
				<IonItem>
					<IonInput
						v-model="customField.name"
						fill="outline"
						:label="$t('customFields:edit.name')"
						label-placement="floating"
					/>
				</IonItem>
				<IonItem button :detail="false">
					<IonToggle v-model="customField.default">
						<IonLabel>
							<h3>{{ $t("customFields:edit.default.title") }}</h3>
							<p>{{ $t("customFields:edit.default.desc") }}</p>
						</IonLabel>
					</IonToggle>
				</IonItem>
				<IonItem
					v-if="customField.uuid"
					button
					:detail="false"
					@click="removeCustomField"
				>
					<IonIcon
						slot="start"
						:icon="trashMD"
						aria-hidden="true"
						color="danger"
					/>
					<IonLabel color="danger">
						<h3>{{ $t("customFields:edit.delete.title") }}</h3>
						<p>{{ $t("other:genericDeleteDesc") }}</p>
					</IonLabel>
				</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="save">
					<IonIcon :icon="saveMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonModal>
</template>
