<script setup lang="ts">
	import { IonList, IonItem, IonListHeader, IonLabel } from '@ionic/vue';
	import { inject, onMounted, onUnmounted, ref, ShallowRef, shallowRef, watch, WatchStopHandle } from 'vue';
	import FrontingEntryAvatar from "../frontingEntry/FrontingEntryAvatar.vue";
	import FrontingEntryLabel from "../frontingEntry/FrontingEntryLabel.vue";
	import { FrontingEntryComplete, getFrontingEntriesTable, toFrontingEntryComplete } from '../../lib/db/entities/frontingEntries';
	import FrontingEntryEdit from "../../modals/FrontingEntryEdit.vue";
	import dayjs from 'dayjs';

	import { from, useObservable } from '@vueuse/rxjs';
	import { liveQuery } from 'dexie';
	import { getMembersTable } from '../../lib/db/entities/members';
	import { PartialBy } from '../../lib/db/types';

	const isIOS = inject<boolean>("isIOS");

	const frontingEntryModal = ref();
	const emptyFrontingEntry: PartialBy<FrontingEntryComplete, "uuid" | "member"> = {
		isMainFronter: false,
		startTime: new Date(),
		endTime: new Date(),
	};

	const frontingEntry = shallowRef({...emptyFrontingEntry});
	const frontingEntries: ShallowRef<FrontingEntryComplete[]> = shallowRef([]);

	let handle: WatchStopHandle;

	onMounted(() => {
		handle = watch([
			useObservable(from(liveQuery(() => getFrontingEntriesTable().toArray()))),
			useObservable(from(liveQuery(() => getMembersTable().toArray()))),
		], async () => {
			frontingEntries.value = await Promise.all(
				(
					await getFrontingEntriesTable()
						.filter(x => !!x.endTime && dayjs.duration(dayjs().diff(x.endTime)).asHours() < 48)
						.toArray()
				)
				.sort((a, b) => b.endTime!.getTime() - a.endTime!.getTime())
				.map(x => toFrontingEntryComplete(x))
			);
		}, { immediate: true });
	});

	onUnmounted(async () => {
		handle();
	});

	async function showModal(clickedFrontingEntry: FrontingEntryComplete){
		frontingEntry.value = {...clickedFrontingEntry};
		await frontingEntryModal.value.$el.present();
	}
</script>

<template>
	<IonListHeader>
		<IonLabel>{{ $t("dashboard:recentFrontingHistory") }}</IonLabel>
	</IonListHeader>

	<IonList :inset="isIOS">
		<IonItem button v-for="entry in frontingEntries" :key="JSON.stringify(entry)" @click="showModal(entry)">
			<FrontingEntryAvatar slot="start" :entry />
			<FrontingEntryLabel :entry />
		</IonItem>
	</IonList>

	<FrontingEntryEdit :frontingEntry ref="frontingEntryModal" />
</template>
