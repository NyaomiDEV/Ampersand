<script setup lang="ts">
	import { IonCard, IonCardContent, IonLabel, IonListHeader } from '@ionic/vue';
	import FrontingEntryAvatar from '../frontingEntry/FrontingEntryAvatar.vue';
	import { onBeforeMount, onUnmounted, ref, shallowRef } from 'vue';
	import { PartialBy } from '../../lib/types';
	import type { FrontingEntryComplete } from '../../lib/db/entities.d.ts';
	import { getFrontingEntries, toFrontingEntryComplete } from '../../lib/db/tables/frontingEntries';
	import { formatWrittenTime } from "../../lib/util/misc";
	import FrontingEntryEdit from '../../modals/FrontingEntryEdit.vue';
	import { DatabaseEvents, DatabaseEvent } from '../../lib/db/events';

	const frontingEntryModal = ref();
	const emptyFrontingEntry: PartialBy<FrontingEntryComplete, "uuid" | "member"> = {
		isMainFronter: false,
		startTime: new Date(),
		endTime: new Date(),
	};

	const frontingEntry = shallowRef({...emptyFrontingEntry});
	const frontingEntries = shallowRef<FrontingEntryComplete[]>([]);

	const now = ref(new Date());

	let interval: NodeJS.Timeout;

	const listener = async (event: Event) => {
		if(["members", "frontingEntries"].includes((event as DatabaseEvent).data.table)){
			frontingEntries.value = await Promise.all(
				(await getFrontingEntries())
					.filter(x => !x.endTime)
					.sort((a, b) => b.isMainFronter ? 1 : b.startTime.getTime() - a.startTime.getTime())
					.map(x => toFrontingEntryComplete(x))
			);
		}
	}

	onBeforeMount(async () => {
		interval = setInterval(() => now.value = new Date(), 1000);
		DatabaseEvents.addEventListener("updated", listener);
		frontingEntries.value = await Promise.all(
				(await getFrontingEntries())
					.filter(x => !x.endTime)
					.sort((a, b) => b.isMainFronter ? 1 : b.startTime.getTime() - a.startTime.getTime())
					.map(x => toFrontingEntryComplete(x))
			);
		frontingEntry.value = { ...frontingEntries.value[0] };
	});

	onUnmounted(() => {
		clearInterval(interval);
		DatabaseEvents.removeEventListener("updated", listener);
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