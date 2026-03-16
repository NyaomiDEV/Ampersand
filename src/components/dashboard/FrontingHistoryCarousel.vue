<script setup lang="ts">
	import { IonList, IonItem, IonListHeader, IonLabel } from "@ionic/vue";
	import { h, onBeforeMount, onUnmounted, shallowRef } from "vue";
	import Avatar from "../Avatar.vue";
	import FrontingEntryLabel from "../frontingEntry/FrontingEntryLabel.vue";
	import type { FrontingEntryComplete } from "../../lib/db/entities.d.ts";
	import { getRecentlyFronted } from "../../lib/db/tables/frontingEntries";
	import FrontingEntryEdit from "../../modals/FrontingEntryEdit.vue";
	import { DatabaseEvents, DatabaseEvent } from "../../lib/db/events";
	import { addModal, removeModal } from "../../lib/modals.ts";

	import accountCircle from "@material-symbols/svg-600/outlined/account_circle-fill.svg";

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
		<IonItem
			v-for="entry in frontingEntries"
			:key="entry.uuid"
			button
			@click="showModal(entry)"
		>
			<Avatar
				slot="start"
				:image="entry.member.image"
				:clip-shape="entry.member.imageClip"
				:color="entry.member.color"
				:icon="accountCircle"
			/>
			<FrontingEntryLabel :entry />
		</IonItem>
	</IonList>
</template>
