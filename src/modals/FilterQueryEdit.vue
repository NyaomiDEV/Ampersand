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
		IonInput,
		IonItem,
		modalController,
		IonModal,
		IonSelect,
		IonSelectOption,
	} from "@ionic/vue";

	import saveMD from "@material-symbols/svg-600/rounded/save.svg";
	import trashMD from "@material-symbols/svg-600/rounded/delete.svg";

	import { FilterQuery } from "../lib/db/entities";
	import { deleteFilterQuery, newFilterQuery, updateFilterQuery } from "../lib/db/tables/filterQueries";
	import { ref, toRaw } from "vue";

	import { PartialBy } from "../lib/types";
	import { useTranslation } from "i18next-vue";
	import { promptOkCancel, toast } from "../lib/util/misc";

	const i18next = useTranslation();

	const props = defineProps<{
		filterQuery?: PartialBy<FilterQuery, "uuid">
	}>();

	const emptyFilterQuery: PartialBy<FilterQuery, "uuid"> = {
		name: "",
		type: "members",
		query: ""
	};

	const filterQuery = ref({ ...(props.filterQuery || emptyFilterQuery) });

	async function save(){
		const uuid = filterQuery.value?.uuid;
		const _filterQuery = toRaw(filterQuery.value);

		try{
			if(!uuid) {
				const result = await newFilterQuery({ ..._filterQuery });
				if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

				await modalController.dismiss(null, "added");
				return;
			}

			const result = await updateFilterQuery(_filterQuery as FilterQuery);
			if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);
	
			await modalController.dismiss(null, "modified").catch(() => false);
		}catch(e){
			await toast((e as Error).message);
		}
	}

	async function removeFilterQuery(){
		try{
			if (await promptOkCancel(
				i18next.t("filterQueries:edit.delete.title"),
				undefined,
				i18next.t("filterQueries:edit.delete.confirm")
			)){
				const result = await deleteFilterQuery(filterQuery.value.uuid!);
				if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

				await modalController.dismiss(undefined, "deleted").catch(() => false);
			}
		}catch(e){
			await toast((e as Error).message);
		}
	}
</script>

<template>
	<IonModal class="filter-query-edit-modal" :breakpoints="[0,1]" initial-breakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ !filterQuery.uuid ? $t("filterQueries:edit.headerAdd") : $t("filterQueries:edit.header") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList class="surface">
				<IonItem>
					<IonInput
						v-model="filterQuery.name"
						fill="solid"
						:label="$t('filterQueries:edit.name')"
						label-placement="floating"
					/>
				</IonItem>

				<IonItem>
					<IonInput
						v-model="filterQuery.query"
						fill="solid"
						:label="$t('filterQueries:edit.query')"
						label-placement="floating"
					/>
				</IonItem>
			</IonList>
			<IonList>
				<IonItem>
					<IonSelect
						v-model="filterQuery.type"
						label-placement="floating"
						:label="$t('filterQueries:edit.type')"
						:cancel-text="$t('other:alerts.cancel')"
						interface="action-sheet"
					>
						<IonSelectOption value="members">
							<IonLabel>{{ $t("members:header") }}</IonLabel>
						</IonSelectOption>
						<IonSelectOption value="journal">
							<IonLabel>{{ $t("journal:header") }}</IonLabel>
						</IonSelectOption>
						<IonSelectOption value="frontHistory">
							<IonLabel>{{ $t("frontHistory:header") }}</IonLabel>
						</IonSelectOption>
						<IonSelectOption value="messageBoard">
							<IonLabel>{{ $t("messageBoard:header") }}</IonLabel>
						</IonSelectOption>
						<IonSelectOption value="systems">
							<IonLabel>{{ $t("systems:header") }}</IonLabel>
						</IonSelectOption>
						<IonSelectOption value="tagManagement">
							<IonLabel>{{ $t("tagManagement:header") }}</IonLabel>
						</IonSelectOption>
						<IonSelectOption value="assetManager">
							<IonLabel>{{ $t("assetManager:header") }}</IonLabel>
						</IonSelectOption>
						<IonSelectOption value="notes">
							<IonLabel>{{ $t("notes:header") }}</IonLabel>
						</IonSelectOption>
						<IonSelectOption value="customFields">
							<IonLabel>{{ $t("customFields:header") }}</IonLabel>
						</IonSelectOption>
					</IonSelect>
				</IonItem>

				<IonItem
					v-if="filterQuery.uuid"
					button
					:detail="false"
					@click="removeFilterQuery"
				>
					<IonIcon
						slot="start"
						:icon="trashMD"
						aria-hidden="true"
						color="danger"
					/>
					<IonLabel color="danger">
						<h3>{{ $t("filterQueries:edit.delete.title") }}</h3>
						<p>{{ $t("other:genericDeleteDesc") }}</p>
					</IonLabel>
				</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton :disabled="!filterQuery.name.replace(/^[\u200B-\u200F\uFEFF]/, '').trim().length" @click="save">
					<IonIcon :icon="saveMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonModal>
</template>
