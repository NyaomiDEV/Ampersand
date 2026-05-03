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

	import { Note } from "../lib/db/entities";
	import { newNote, updateNote, deleteNote } from "../lib/db/tables/notes";
	import { ref, toRaw } from "vue";

	import { PartialBy } from "../lib/types";
	import { useTranslation } from "i18next-vue";
	import { promptOkCancel, toast } from "../lib/util/misc";

	import ContentEditable from "../components/ContentEditable.vue";


	const i18next = useTranslation();

	const props = defineProps<{
		note?: PartialBy<Note, "uuid">
	}>();

	const emptyNote: PartialBy<Note, "uuid"> = {
		title: "",
		content: "",
		priority: 1,
		isArchived: false
	};

	const note = ref({ ...(props.note || emptyNote) });

	async function save(){
		const uuid = note.value?.uuid;
		const _note = toRaw(note.value);

		try{
			if(!uuid) {
				const result = await newNote({ ..._note });
				if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

				await modalController.dismiss(null, "added");
				return;
			}

			const result = await updateNote(_note as Note);
			if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);
	
			await modalController.dismiss(null, "modified").catch(() => false);
		}catch(e){
			await toast((e as Error).message);
		}
	}

	async function removeNote(){
		try{
			if (await promptOkCancel(
				i18next.t("notes:edit.delete.title"),
				undefined,
				i18next.t("notes:edit.delete.confirm")
			)){
				const result = await deleteNote(note.value.uuid!);
				if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

				await modalController.dismiss(undefined, "deleted").catch(() => false);
			}
		}catch(e){
			await toast((e as Error).message);
		}
	}
</script>

<template>
	<IonModal class="note-edit-modal" :breakpoints="[0,1]" initial-breakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ !note.uuid ? $t("notes:edit.headerAdd") : $t("notes:edit.header") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList class="surface">
				<IonItem>
					<IonInput
						v-model="note.title"
						fill="solid"
						:label="$t('notes:edit.title')"
						label-placement="floating"
					/>
				</IonItem>

				<IonItem>
					<ContentEditable v-model="note.content" fill="solid" :label="$t('notes:edit.content')" />
				</IonItem>
			</IonList>
			<IonList>
				<IonItem button :detail="false">
					<IonToggle v-model="note.isArchived">
						<IonLabel>
							{{ $t("notes:edit.isArchived") }}
						</IonLabel>
					</IonToggle>
				</IonItem>
				<IonItem
					v-if="note.uuid"
					button
					:detail="false"
					@click="removeNote"
				>
					<IonIcon
						slot="start"
						:icon="trashMD"
						aria-hidden="true"
						color="danger"
					/>
					<IonLabel color="danger">
						<h3>{{ $t("notes:edit.delete.title") }}</h3>
						<p>{{ $t("other:genericDeleteDesc") }}</p>
					</IonLabel>
				</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton :disabled="!note.title.replace(/^[\u200B-\u200F\uFEFF]/, '').trim().length" @click="save">
					<IonIcon :icon="saveMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonModal>
</template>
