<script setup lang="ts">
	import { IonList, IonListHeader, IonLabel } from "@ionic/vue";
	import { h, onBeforeMount, onUnmounted, shallowRef } from "vue";
	import type { FrontingEntryComplete } from "../../lib/db/entities.d.ts";
	import { getRecentlyFronted } from "../../lib/db/tables/frontingEntries";
	import FrontingEntryEdit from "../../modals/FrontingEntryEdit.vue";
	import { DatabaseEvents, DatabaseEvent } from "../../lib/db/events";
	import { addModal, removeModal } from "../../lib/modals.ts";

	import FrontingEntryItem from "../frontingEntry/FrontingEntryItem.vue";

	const frontingEntries = shallowRef<FrontingEntryComplete[]>();

	async function updateFrontingEntries(){
		frontingEntries.value = await getRecentlyFronted();
	}

	const listener = (event: Event) => {
		if(["members", "frontingEntries"].includes((event as DatabaseEvent).data.table))
			void updateFrontingEntries();
	};

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await updateFrontingEntries();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	async function showModal(clickedFrontingEntry: FrontingEntryComplete){
		const vnode = h(FrontingEntryEdit, {
			frontingEntry: clickedFrontingEntry,
			onDidDismiss: () => removeModal(vnode)
		});

		const modal = await addModal(vnode);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
		await (modal.el as any).present();
	}
</script>

<template>
	<IonListHeader v-if="frontingEntries && frontingEntries.length">
		<IonLabel>{{ $t("dashboard:recentFrontingHistory") }}</IonLabel>
	</IonListHeader>

	<IonList v-if="frontingEntries">
		<FrontingEntryItem
			v-for="entry in frontingEntries"
			:key="entry.uuid"
			button
			:entry
			@click="showModal(entry)"
		/>
	</IonList>
</template>
