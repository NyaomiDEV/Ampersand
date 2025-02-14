<script setup lang="ts">
	import { IonList, IonItem, IonListHeader, IonLabel } from '@ionic/vue';
	import { h, inject, onBeforeMount, onUnmounted, ShallowRef, shallowRef } from 'vue';
	import MemberAvatar from "../member/MemberAvatar.vue";
	import FrontingEntryLabel from "../frontingEntry/FrontingEntryLabel.vue";
	import type { FrontingEntryComplete } from '../../lib/db/entities.d.ts';
	import { getFrontingEntries, toFrontingEntryComplete } from '../../lib/db/tables/frontingEntries';
	import FrontingEntryEdit from "../../modals/FrontingEntryEdit.vue";
	import { DatabaseEvents, DatabaseEvent } from '../../lib/db/events';
	import { addModal, removeModal } from '../../lib/modals.ts';

	const isIOS = inject<boolean>("isIOS");

	const frontingEntries: ShallowRef<FrontingEntryComplete[]> = shallowRef([]);

	async function updateFrontingEntries(){
		frontingEntries.value = await Promise.all(
			(await getFrontingEntries())
				.filter(x => x.endTime && Date.now() - x.endTime.getTime() <= 48 * 60 * 60 * 1000)
				.sort((a, b) => b.endTime!.getTime() - a.endTime!.getTime())
				.map(x => toFrontingEntryComplete(x))
		);
	}

	const listener = async (event: Event) => {
		if(["members", "frontingEntries"].includes((event as DatabaseEvent).data.table))
			await updateFrontingEntries();
	}

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
		await (modal.el as any).present();
	}
</script>

<template>
	<IonListHeader v-if="frontingEntries.length > 0">
		<IonLabel>{{ $t("dashboard:recentFrontingHistory") }}</IonLabel>
	</IonListHeader>

	<IonList :inset="isIOS" v-if="frontingEntries.length > 0">
		<IonItem button v-for="entry in frontingEntries" :key="entry.uuid" @click="showModal(entry)">
			<MemberAvatar slot="start" :member="entry.member" />
			<FrontingEntryLabel :entry />
		</IonItem>
	</IonList>
</template>
