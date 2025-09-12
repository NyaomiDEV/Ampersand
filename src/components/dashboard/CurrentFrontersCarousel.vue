<script setup lang="ts">
	import { IonCard, IonCardContent, IonLabel, IonListHeader } from "@ionic/vue";
	import MemberAvatar from "../member/MemberAvatar.vue";
	import { h, onBeforeMount, onUnmounted, ref, shallowRef } from "vue";
	import type { FrontingEntryComplete } from "../../lib/db/entities.d.ts";
	import { getFronting } from "../../lib/db/tables/frontingEntries";
	import { formatWrittenTime } from "../../lib/util/misc";
	import FrontingEntryEdit from "../../modals/FrontingEntryEdit.vue";
	import { DatabaseEvents, DatabaseEvent } from "../../lib/db/events";
	import { addModal, removeModal } from "../../lib/modals.ts";

	const frontingEntries = shallowRef<FrontingEntryComplete[]>([]);

	const now = ref(new Date());

	let interval: number;

	async function updateFrontingEntries() {
		frontingEntries.value = await getFronting();
	}

	const listener = (event: Event) => {
		if(["members", "frontingEntries"].includes((event as DatabaseEvent).data.table))
			void updateFrontingEntries();
	};

	onBeforeMount(async () => {
		interval = setInterval(() => now.value = new Date(), 1000);
		DatabaseEvents.addEventListener("updated", listener);
		await updateFrontingEntries();
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
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
		await (modal.el as any).present();
	}
</script>

<template>
	<IonListHeader v-if="frontingEntries.length">
		<IonLabel>{{ $t("dashboard:nowFronting") }}</IonLabel>
	</IonListHeader>
	<div v-if="frontingEntries.length" class="carousel">
		<IonCard
			v-for="fronting in frontingEntries"
			:key="fronting.uuid"
			button
			:class="{outlined: !fronting.isMainFronter, elevated: fronting.isMainFronter}"
			@click="showModal(fronting)"
		>
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
						{{ fronting.customStatus }}
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