<script setup lang="ts">
	import { IonCard, IonCardContent, IonLabel, IonListHeader } from '@ionic/vue';
	import FrontingEntryAvatar from '../frontingEntry/FrontingEntryAvatar.vue';
	import { onMounted, onUnmounted, ref, shallowRef, watch, WatchStopHandle } from 'vue';
	import { PartialBy } from '../../lib/db/types';
	import { FrontingEntryComplete, getFrontingEntriesTable, toFrontingEntryComplete } from '../../lib/db/entities/frontingEntries';
	import { from, useObservable } from '@vueuse/rxjs';
	import { liveQuery } from 'dexie';
	import { getMembersTable } from '../../lib/db/entities/members';
	import { formatWrittenTime } from "../../lib/util/misc";
	import FrontingEntryEdit from '../../modals/FrontingEntryEdit.vue';


	const frontingEntryModal = ref();
	const emptyFrontingEntry: PartialBy<FrontingEntryComplete, "uuid" | "member"> = {
		isMainFronter: false,
		startTime: new Date(),
		endTime: new Date(),
	};

	const frontingEntry = shallowRef({...emptyFrontingEntry});
	const frontingEntries = shallowRef<FrontingEntryComplete[]>([]);

	const now = ref(new Date());

	let handle: WatchStopHandle;
	let interval: NodeJS.Timeout;

	onMounted(async () => {
		interval = setInterval(() => now.value = new Date(), 1000);
		handle = watch([
			useObservable(from(liveQuery(() => getFrontingEntriesTable().toArray()))),
			useObservable(from(liveQuery(() => getMembersTable().toArray())))
		], async () => {
			frontingEntries.value = await Promise.all(
				(await getFrontingEntriesTable()
					.filter(x => !x.endTime)
					.toArray()
				)
				.sort((a, b) => b.isMainFronter ? 1 : b.startTime.getTime() - a.startTime.getTime())
				.map(x => toFrontingEntryComplete(x))
			);
		}, { immediate: true });
		frontingEntry.value = { ...frontingEntries.value[0] };
	});

	onUnmounted(async () => {
		clearInterval(interval);
		handle();
	});

	async function showModal(clickedFrontingEntry: FrontingEntryComplete){
		frontingEntry.value = {...clickedFrontingEntry};
		await frontingEntryModal.value.$el.present();
	}
</script>

<template>
	<IonListHeader v-if="frontingEntries.length">
		<IonLabel>{{ $t("dashboard:nowFronting") }}</IonLabel>
	</IonListHeader>
	<div class="carousel" v-if="frontingEntries.length">
		<IonCard button :class="{outlined: !fronting.isMainFronter, elevated: fronting.isMainFronter}" @click="showModal(fronting)" v-for="fronting in frontingEntries" :key="JSON.stringify(fronting)">
			<IonCardContent>
				<FrontingEntryAvatar :entry="fronting" />
				<IonLabel>
					<h2>
						{{ fronting.member.name }}
					</h2>
					<p>
						{{ formatWrittenTime(now, fronting.startTime) }}
					</p>
					<p v-if="fronting.customStatus">
						{{  fronting.customStatus }}
					</p>
				</IonLabel>
			</IonCardContent>
		</IonCard>
	</div>
	<FrontingEntryEdit v-if="frontingEntries.length" ref="frontingEntryModal" :frontingEntry />
</template>

<style scoped>
	div {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		overflow-x: scroll;
	}

	ion-card {
		width: 160px;
		flex: none;
	}

	ion-card ion-avatar {
		margin: 16px auto;
	}

	ion-card ion-card-content {
		text-align: center;
	}
</style>