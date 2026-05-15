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
		IonButton,
	} from "@ionic/vue";

	import saveMD from "@material-symbols/svg-600/rounded/save.svg";
	import trashMD from "@material-symbols/svg-600/rounded/delete.svg";
	import MemberSelect from "./MemberSelect.vue";

	import { Note } from "../lib/db/entities";
	import { newNote, updateNote, deleteNote } from "../lib/db/tables/notes";
	import { ref, toRaw, useTemplateRef } from "vue";

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

	const memberTagModal = useTemplateRef("memberTagModal");

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

				<IonItem>
					<IonButton fill="clear" @click="note.content = `${note.content || ''}<t:${Math.floor(Date.now() / 1000)}:f>`">
						{{ $t("other:addTimestamp") }}
					</IonButton>
					<IonButton fill="clear" @click="memberTagModal?.$el.present()">
						{{ $t("other:memberMention") }}
					</IonButton>
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

			<MemberSelect
				ref="memberTagModal"
				:only-one="true"
				:discard-on-select="true"
				:hide-checkboxes="true"
				:always-emit="true"
				:model-value="[]"
				@update:model-value="(e) => { if(e[0]) note.content = `${note.content || ''}@<m:${e[0].uuid}>` }"
			/>
		</IonContent>
	</IonModal>
</template>
