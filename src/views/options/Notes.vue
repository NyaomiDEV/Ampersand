<script setup lang="ts">
	import { IonBackButton, IonContent, IonHeader, IonSearchbar, IonList, IonIcon, IonPage, IonTitle, IonToolbar, IonFab, IonFabButton, IonItem, IonLabel, IonReorderGroup, IonReorder, IonButtons, IonButton } from "@ionic/vue";
	import { h, onBeforeMount, onUnmounted, ref, shallowRef, watch } from "vue";
	import { Note } from "../../lib/db/entities";
	import { getFilteredNotes, updateNote } from "../../lib/db/tables/notes";
	import { DatabaseEvent, DatabaseEvents } from "../../lib/db/events";
	import { useRoute } from "vue-router";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import NoteEdit from "../../modals/NoteEdit.vue";
	import { addModal, removeModal } from "../../lib/modals";

	import addMD from "@material-symbols/svg-600/outlined/add.svg";
	import reorderMD from "@material-symbols/svg-600/outlined/swap_vert.svg";
	import doneMD from "@material-symbols/svg-600/outlined/done_all.svg";
	import dragMD from "@material-symbols/svg-600/outlined/drag_handle.svg";
	import archivedMD from "@material-symbols/svg-600/outlined/archive.svg";
	import TheresNothingHere from "../../components/TheresNothingHere.vue";

	const route = useRoute();

	const search = ref(route.query.q as string || "");
	watch(route, () => {
		if(route.name === "Notes" && route.query.q)
			search.value = route.query.q as string;
	});

	const notes = shallowRef<Note[]>();

	const isReordering = ref(false);

	watch(search, async () => {
		await getNotes();
	});

	const listener = (event: Event) => {
		if(["notes"].includes((event as DatabaseEvent).data.table))
			void getNotes();
	};

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await getNotes();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	async function getNotes(){
		notes.value = (await Array.fromAsync(getFilteredNotes(search.value)));
	}

	async function showModal(clickedNote?: Note){
		const vnode = h(NoteEdit, {
			note: clickedNote,
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
		if(!notes.value) return;
		if(e.detail.from === e.detail.to) return;

		const _notes = [...notes.value.map(x => x.uuid)];
		const element = _notes[e.detail.from];
		_notes.splice(e.detail.from, 1);
		_notes.splice(e.detail.to, 0, element);

		for(const field of notes.value){
			const oldPriority = field.priority;
			const newPriority = _notes.findIndex(x => x === field.uuid);
			if(oldPriority === newPriority) continue;
			await updateNote({ uuid: field.uuid, priority: newPriority });
		}

		// now that we committed crimes against humanity, register the listener again
		DatabaseEvents.addEventListener("updated", listener);
		// and grab ordered list
		await getNotes();
	}

</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton
					slot="start"
					default-href="/options/"
				/>
				<IonTitle>
					{{ $t("notes:header") }}
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
					:placeholder="$t('notes:searchPlaceholder')"
					show-cancel-button="focus"
					show-clear-button="focus"
					:spellcheck="false"
					:value="search"
					@ion-change="e => search = e.detail.value || ''"
				/>
			</IonToolbar>
		</IonHeader>
		
		<SpinnerFullscreen v-if="!notes" />
		<IonContent v-else>
			<TheresNothingHere v-if="!notes.length" />
			<IonList v-else>
				<IonReorderGroup :disabled="!isReordering" @ion-reorder-end="handleReorder">
					<IonItem
						v-for="note in notes"
						:key="note.uuid"
						button
						:class="{ 'archived': note.isArchived }"
						@click="() => { if(!isReordering) void showModal(note); }"
					>
						<IonLabel>{{ note.title }}</IonLabel>
						<IonIcon v-if="note.isArchived" slot="end" :icon="archivedMD" />
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

ion-reorder-group {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

ion-item.archived {
	opacity: 0.5;
}
</style>