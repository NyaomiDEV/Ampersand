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
	} from "@ionic/vue";

	import saveMD from "@material-symbols/svg-600/outlined/save.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";

	import { CustomField } from "../lib/db/entities";
	import { deleteCustomField, saveCustomField } from "../lib/db/tables/customFields";
	import { ref, toRaw } from "vue";

	import { PartialBy } from "../lib/types";
	import { useTranslation } from "i18next-vue";
	import { promptOkCancel } from "../lib/util/misc";


	const i18next = useTranslation();

	const props = defineProps<{
		customField?: PartialBy<CustomField, "id">
	}>();

	const emptyCustomField: PartialBy<CustomField, "id"> = {
		name: "",
		priority: 1,
		default: false
	};

	const customField = ref({ ...(props.customField || emptyCustomField) });

	async function save(){
		try{
			await saveCustomField(toRaw(customField.value));
			await modalController.dismiss(null);
		}catch(_){
			// error handling here
		}
	}

	async function removeCustomField(){
		if (await promptOkCancel(
			i18next.t("customFields:edit.delete.title"),
			i18next.t("customFields:edit.delete.confirm")
		)){
			await deleteCustomField(customField.value.id!);
			try{
				await modalController.dismiss(undefined);
			}catch(_){ /* empty */ }
		}
	}
</script>

<template>
	<IonModal class="custom-field-edit-modal" :breakpoints="[0,1]" initial-breakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ !customField.id ? $t("customFields:edit.headerAdd") : $t("customFields:edit.header") }}</IonTitle>
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
					v-if="customField.id"
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
				<IonFabButton :disabled="!customField.name.length" @click="save">
					<IonIcon :icon="saveMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonModal>
</template>
