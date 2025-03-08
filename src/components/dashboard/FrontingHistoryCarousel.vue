<script setup lang="ts">
	import { IonList, IonItem, IonListHeader, IonLabel } from '@ionic/vue';
	import { h, inject, onBeforeMount, onUnmounted, shallowRef } from 'vue';
	import MemberAvatar from "../member/MemberAvatar.vue";
	import FrontingEntryLabel from "../frontingEntry/FrontingEntryLabel.vue";
	import type { FrontingEntryComplete } from '../../lib/db/entities.d.ts';
	import { getRecentlyFronted } from '../../lib/db/tables/frontingEntries';
	import FrontingEntryEdit from "../../modals/FrontingEntryEdit.vue";
	import { DatabaseEvents, DatabaseEvent } from '../../lib/db/events';
	import { addModal, removeModal } from '../../lib/modals.ts';

	const isIOS = inject<boolean>("isIOS");

	const frontingEntries = shallowRef<FrontingEntryComplete[]>();

	async function updateFrontingEntries(){
		frontingEntries.value = await getRecentlyFronted();
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
	<IonListHeader v-if="frontingEntries && frontingEntries.length">
		<IonLabel>{{ $t("dashboard:recentFrontingHistory") }}</IonLabel>
	</IonListHeader>

	<IonList :inset="isIOS" v-if="frontingEntries">
		<IonItem button v-for="entry in frontingEntries" :key="entry.uuid" @click="showModal(entry)">
			<MemberAvatar slot="start" :member="entry.member" />
			<FrontingEntryLabel :entry />
		</IonItem>
	</IonList>
</template>
