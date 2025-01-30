<script setup lang="ts">
	import { IonList, IonItem, IonListHeader, IonLabel } from '@ionic/vue';
	import { h, inject, onBeforeMount, onUnmounted, ShallowRef, shallowRef } from 'vue';
	import MemberAvatar from "../member/MemberAvatar.vue";
	import FrontingEntryLabel from "../frontingEntry/FrontingEntryLabel.vue";
	import type { FrontingEntryComplete } from '../../lib/db/entities.d.ts';
	import { getFrontingEntries, toFrontingEntryComplete } from '../../lib/db/tables/frontingEntries';
	import FrontingEntryEdit from "../../modals/FrontingEntryEdit.vue";
	import dayjs from 'dayjs';
	import { DatabaseEvents, DatabaseEvent } from '../../lib/db/events';
	import { addModal, removeModal } from '../../lib/modals.ts';

	const isIOS = inject<boolean>("isIOS");

	const frontingEntries: ShallowRef<FrontingEntryComplete[]> = shallowRef([]);

	const listener = async (event: Event) => {
		if(["members", "frontingEntries"].includes((event as DatabaseEvent).data.table)){
			frontingEntries.value = await Promise.all(
				(await getFrontingEntries())
					.filter(x => !!x.endTime && dayjs.duration(dayjs().diff(x.endTime)).asHours() < 48)
					.sort((a, b) => b.endTime!.getTime() - a.endTime!.getTime())
					.map(x => toFrontingEntryComplete(x))
			);
		}
	}

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		frontingEntries.value = await Promise.all(
			(await getFrontingEntries())
				.filter(x => !!x.endTime && dayjs.duration(dayjs().diff(x.endTime)).asHours() < 48)
				.sort((a, b) => b.endTime!.getTime() - a.endTime!.getTime())
				.map(x => toFrontingEntryComplete(x))
		);
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
		<IonItem button v-for="entry in frontingEntries" :key="JSON.stringify(entry)" @click="showModal(entry)">
			<MemberAvatar slot="start" :member="entry.member" />
			<FrontingEntryLabel :entry />
		</IonItem>
	</IonList>
</template>
