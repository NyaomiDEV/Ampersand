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
	import { appConfig } from "../../lib/config/index.ts";

	const frontingEntries = shallowRef<FrontingEntryComplete[]>([]);

	const now = ref(new Date());

	let interval: number;

	async function updateFrontingEntries() {
		frontingEntries.value = (await getFronting()).sort((a, b) => {
			if(a.isMainFronter && !b.isMainFronter) return -1;
			if(!a.isMainFronter && b.isMainFronter) return 1;

			if(a.influencing && !b.influencing) return 1;
			if(!a.influencing && b.influencing) return -1;

			return a.member.name.localeCompare(b.member.name);
		});
	}

	const listener = (event: Event) => {
		if(["members", "frontingEntries"].includes((event as DatabaseEvent).data.table))
			void updateFrontingEntries();
	};

	onBeforeMount(async () => {
		if(!appConfig.hideFrontingTimer)
			interval = setInterval(() => now.value = new Date(), 1000);

		DatabaseEvents.addEventListener("updated", listener);
		await updateFrontingEntries();
	});

	onUnmounted(() => {
		if(!appConfig.hideFrontingTimer)
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
			:class="{
				influenced: frontingEntries.findIndex(x => x.influencing?.uuid === fronting.member.uuid) > 0,
				outlined: !fronting.isMainFronter,
				elevated: fronting.isMainFronter,
				influencing: !!fronting.influencing,
			}"
			@click="showModal(fronting)"
		>
			<IonCardContent>
				<MemberAvatar :member="fronting.member" />
				<IonLabel>
					<h2>
						{{ fronting.member.name }}
					</h2>
					<p v-if="!appConfig.hideFrontingTimer">
						{{ formatWrittenTime(now, fronting.startTime) }}
					</p>
					<p v-if="fronting.influencing">
						{{ $t("dashboard:fronterInfluencing", {influencedMember: fronting.influencing.name}) }}
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
		overflow-x: auto;
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

	ion-card.influencing {
		opacity: .5;
	}

	ion-card.influenced {
		outline: 2px solid rgb(var(--md3-primary)) !important;
	}
</style>