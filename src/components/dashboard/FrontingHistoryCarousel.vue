<script setup lang="ts">
	import { IonList, IonItem, IonListHeader, IonLabel } from '@ionic/vue';
	import { inject, onBeforeMount, onUnmounted, ref, ShallowRef, shallowRef } from 'vue';
	import FrontingEntryAvatar from "../frontingEntry/FrontingEntryAvatar.vue";
	import FrontingEntryLabel from "../frontingEntry/FrontingEntryLabel.vue";
	import type { FrontingEntryComplete } from '../../lib/db/entities.d.ts';
	import { getFrontingEntries, toFrontingEntryComplete } from '../../lib/db/tables/frontingEntries';
	import FrontingEntryEdit from "../../modals/FrontingEntryEdit.vue";
	import dayjs from 'dayjs';
	import { PartialBy } from '../../lib/types';
	import { DatabaseEvents, DatabaseEvent } from '../../lib/db/events';

	const isIOS = inject<boolean>("isIOS");

	const frontingEntryModal = ref();
	const emptyFrontingEntry: PartialBy<FrontingEntryComplete, "uuid" | "member"> = {
		isMainFronter: false,
		startTime: new Date(),
		endTime: new Date(),
	};

	const frontingEntry = shallowRef({...emptyFrontingEntry});
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
		frontingEntry.value = {...clickedFrontingEntry};
		await frontingEntryModal.value.$el.present();
	}
</script>

<template>
	<IonListHeader v-if="frontingEntries.length > 0">
		<IonLabel>{{ $t("dashboard:recentFrontingHistory") }}</IonLabel>
	</IonListHeader>

	<IonList :inset="isIOS" v-if="frontingEntries.length > 0">
		<IonItem button v-for="entry in frontingEntries" :key="JSON.stringify(entry)" @click="showModal(entry)">
			<FrontingEntryAvatar slot="start" :entry />
			<FrontingEntryLabel :entry />
		</IonItem>
	</IonList>

	<FrontingEntryEdit :frontingEntry ref="frontingEntryModal" v-if="frontingEntries.length > 0" />
</template>
