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
	import { newCustomField, updateCustomField, deleteCustomField } from "../lib/db/tables/customFields";
	import { ref, toRaw } from "vue";

	import { PartialBy } from "../lib/types";
	import { useTranslation } from "i18next-vue";
	import { promptOkCancel, toast } from "../lib/util/misc";


	const i18next = useTranslation();

	const props = defineProps<{
		customField?: PartialBy<CustomField, "uuid">
	}>();

	const emptyCustomField: PartialBy<CustomField, "uuid"> = {
		name: "",
		priority: 1,
		default: false
	};

	const customField = ref({ ...(props.customField || emptyCustomField) });

	async function save(){
		const uuid = customField.value?.uuid;
		const _customField = toRaw(customField.value);

		try{
			if(!uuid) {
				const result = await newCustomField({ ..._customField });
				if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

				await modalController.dismiss(null, "added");
				return;
			}

			const result = await updateCustomField(_customField as CustomField);
			if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);
	
			await modalController.dismiss(null, "modified").catch(() => false);
		}catch(e){
			await toast((e as Error).message);
		}
	}

	async function removeCustomField(){
		try{
			if (await promptOkCancel(
				i18next.t("customFields:edit.delete.title"),
				undefined,
				i18next.t("customFields:edit.delete.confirm")
			)){
				const result = await deleteCustomField(customField.value.uuid!);
				if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

				await modalController.dismiss(undefined, "deleted").catch(() => false);
			}
		}catch(e){
			await toast((e as Error).message);
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
			<IonList class="surface">
				<IonItem>
					<IonInput
						v-model="customField.name"
						fill="solid"
						:label="$t('customFields:edit.name')"
						label-placement="floating"
					/>
				</IonItem>
			</IonList>
			<IonList>
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
				<IonFabButton :disabled="!customField.name.replace(/^[\u200B-\u200F\uFEFF]/, '').length" @click="save">
					<IonIcon :icon="saveMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonModal>
</template>
