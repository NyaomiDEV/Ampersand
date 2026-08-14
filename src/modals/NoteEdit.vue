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
	import fileMD from "@material-symbols/svg-600/rounded/attachment.svg";
	import imageMD from "@material-symbols/svg-600/rounded/image.svg";

	import MemberSelect from "./MemberSelect.vue";

	import { Member, Note, UUIDable } from "../lib/db/entities";
	import { newNote, updateNote, deleteNote } from "../lib/db/tables/notes";
	import { onMounted, ref, toRaw, useTemplateRef } from "vue";

	import { PartialBy } from "../lib/types";
	import { useTranslation } from "i18next-vue";
	import { formatDate, getCustomName, promptOkCancel, toast } from "../lib/util/misc";

	import ContentEditable from "../components/ContentEditable.vue";
	import Loading from "./Loading.vue";
	import { getFrontingAtIndex } from "../lib/db/tables/frontingEntries.ts";
	import { defaultMember, getMember } from "../lib/db/tables/members.ts";
	import { quickAddAsset } from "../lib/db/tables/assets.ts";

	const i18next = useTranslation();

	const props = defineProps<{
		note?: PartialBy<Note, keyof UUIDable>
	}>();

	const emptyNote: PartialBy<Note, keyof UUIDable> = {
		title: "",
		content: "",
		priority: 1,
		isArchived: false
	};

	const note = ref({ ...(props.note || emptyNote) });

	const memberTagModal = useTemplateRef("memberTagModal");
	const loadingModal = useTemplateRef("loadingModal");

	const contentTextarea = useTemplateRef("contentTextarea");

	const frontingAtCreationDate = ref<string>();

	async function save(){
		const uuid = note.value?.uuid;
		const _note = toRaw(note.value);

		try{
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.present();

			if(!uuid) {
				const result = await newNote({
					..._note
				});
				if(!result.success) throw new Error(`E: ${result.err || "failed"}`);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				await loadingModal.value?.$el.dismiss();

				await modalController.dismiss(null, "added");
				return;
			}

			const result = await updateNote(_note as Note);
			if(!result.success) throw new Error(`E: ${result.err || "failed"}`);
	
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.dismiss();

			await modalController.dismiss(null, "modified").catch(() => false);
		}catch(e){
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.dismiss();

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
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				await loadingModal.value?.$el.present();

				const result = await deleteNote(note.value.uuid!);
				if(!result.success) throw new Error(`E: ${result.err || "failed"}`);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				await loadingModal.value?.$el.dismiss();

				await modalController.dismiss(undefined, "deleted").catch(() => false);
			}
		}catch(e){
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.dismiss();

			await toast((e as Error).message);
		}
	}

	async function addTimestampInContent(){
		try {
			const htmlEl = contentTextarea.value?.textarea?.$el as globalThis.HTMLIonTextareaElement;
			const input = await htmlEl.getInputElement();

			const start = input.selectionStart;
			const end = input.selectionEnd;

			const before = note.value.content?.slice(0, start) || "";
			const after = note.value.content?.slice(end) || "";

			note.value.content = `${before}<t:${Math.floor(Date.now() / 1000)}:f>${after}`;
		}catch(e){
			await toast((e as Error).message);
		}
	}

	async function tagMemberInContent(member: Member){
		try {
			const htmlEl = contentTextarea.value?.textarea?.$el as globalThis.HTMLIonTextareaElement;
			const input = await htmlEl.getInputElement();

			const start = input.selectionStart;
			const end = input.selectionEnd;

			const before = note.value.content?.slice(0, start) || "";
			const after = note.value.content?.slice(end) || "";

			note.value.content = `${before}@<m:${member.uuid}>${after}`;
		}catch(e){
			await toast((e as Error).message);
		}
	}

	async function addAssetInContent(type: "image" | "file"){
		try {
			const asset = await quickAddAsset(type);
			if(!asset.success) throw new Error(`E: ${asset.err || "failed"}`);

			const htmlEl = contentTextarea.value?.textarea?.$el as globalThis.HTMLIonTextareaElement;
			const input = await htmlEl.getInputElement();

			const start = input.selectionStart;
			const end = input.selectionEnd;

			const before = note.value.content?.slice(0, start) || "";
			const after = note.value.content?.slice(end) || "";

			note.value.content = `${before}${type === "image" ? "!" : ""}[](@${asset.detail.friendlyName})${after}`;
		}catch(e){
			await toast((e as Error).message);
		}
	}

	async function getPeopleFrontingAtCreation(){
		if(!note.value?.dateCreated) return;

		const frontingIndex = getFrontingAtIndex(note.value.dateCreated);
		const memberUUIDs = new Set(frontingIndex.map(x => x.member!));

		frontingAtCreationDate.value = (await Promise.all(
			memberUUIDs.values()
				.map(x => getMember(x).catch(_ => defaultMember(x)))
		))
			.map(x => getCustomName(x))
			.join(", ");
	}

	onMounted(getPeopleFrontingAtCreation);
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
					<ContentEditable
						ref="contentTextarea"
						v-model="note.content"
						fill="solid"
						:label="$t('notes:edit.content')"
					/>
				</IonItem>

				<IonItem>
					<IonButton fill="clear" @click="addTimestampInContent">
						{{ $t("other:addTimestamp") }}
					</IonButton>
					<IonButton fill="clear" @click="memberTagModal?.$el.present()">
						{{ $t("other:memberMention") }}
					</IonButton>
					<IonButton fill="clear" @click="addAssetInContent('file')">
						<IonIcon slot="icon-only" :icon="fileMD" />
					</IonButton>
					<IonButton fill="clear" @click="addAssetInContent('image')">
						<IonIcon slot="icon-only" :icon="imageMD" />
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
				<IonItem v-if="note.dateCreated" :detail="false">
					<IonLabel>
						<p>
							{{ $t("other:creation.dateCreated", { dateCreated: formatDate(note.dateCreated, "expanded") }) }}
						</p>
						<p v-if="frontingAtCreationDate?.length">
							{{ $t("other:creation.frontingAtCreationDate", { frontingAtCreationDate }) }}
						</p>
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
				@update:model-value="(e) => { if(e[0]) void tagMemberInContent(e[0]) }"
			/>

			<Loading ref="loadingModal" />

		</IonContent>
	</IonModal>
</template>
