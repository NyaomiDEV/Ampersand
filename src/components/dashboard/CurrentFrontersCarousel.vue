<script setup lang="ts">
	import { IonCard, IonCardContent, IonLabel, IonListHeader } from '@ionic/vue';
	import MemberAvatar from '../member/MemberAvatar.vue';
	import { h, onBeforeMount, onUnmounted, ref, shallowRef } from 'vue';
	import type { FrontingEntryComplete } from '../../lib/db/entities.d.ts';
	import { getFrontingEntries, toFrontingEntryComplete } from '../../lib/db/tables/frontingEntries';
	import { formatWrittenTime } from "../../lib/util/misc";
	import FrontingEntryEdit from '../../modals/FrontingEntryEdit.vue';
	import { DatabaseEvents, DatabaseEvent } from '../../lib/db/events';
	import { addModal, removeModal } from '../../lib/modals.ts';

	const frontingEntries = shallowRef<FrontingEntryComplete[]>([]);

	const now = ref(new Date());

	let interval: number;

	const listener = async (event: Event) => {
		if(["members", "frontingEntries"].includes((event as DatabaseEvent).data.table)){
			frontingEntries.value = await Promise.all(
				(await getFrontingEntries())
					.filter(x => !x.endTime)
					.sort((a, b) => {
						if (a.isMainFronter) return -1;
						if (b.isMainFronter) return 1;
						return a.startTime.getTime() - b.startTime.getTime();
					})
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
					.sort((a, b) => {
						if(a.isMainFronter) return -1;
						if(b.isMainFronter) return 1;
						return a.startTime.getTime() - b.startTime.getTime();
					})
					.map(x => toFrontingEntryComplete(x))
			);
	});

	onUnmounted(() => {
		clearInterval(interval);
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
	<IonListHeader v-if="frontingEntries.length">
		<IonLabel>{{ $t("dashboard:nowFronting") }}</IonLabel>
	</IonListHeader>
	<div class="carousel" v-if="frontingEntries.length">
		<IonCard button :class="{outlined: !fronting.isMainFronter, elevated: fronting.isMainFronter}" @click="showModal(fronting)" v-for="fronting in frontingEntries" :key="fronting.uuid">
			<IonCardContent>
				<MemberAvatar :member="fronting.member" />
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