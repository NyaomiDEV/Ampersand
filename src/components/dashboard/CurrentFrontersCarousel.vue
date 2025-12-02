<script setup lang="ts">
	import { IonCard, IonCardContent, IonLabel, IonListHeader, IonIcon } from "@ionic/vue";
	import MemberAvatar from "../member/MemberAvatar.vue";
	import { h, onBeforeMount, onUnmounted, ref, shallowRef } from "vue";
	import type { FrontingEntry } from "../../lib/db/entities.d.ts";
	import { getFronting, newFrontingEntry, sendFrontingChangedEvent } from "../../lib/db/tables/frontingEntries";
	import { formatWrittenTime } from "../../lib/util/misc";
	import FrontingEntryEdit from "../../modals/FrontingEntryEdit.vue";
	import { DatabaseEvents, DatabaseEvent } from "../../lib/db/events";
	import { addModal, removeModal } from "../../lib/modals.ts";
	import { appConfig } from "../../lib/config/index.ts";
	import MemberSelect from "../../modals/MemberSelect.vue";

	import addMD from "@material-symbols/svg-600/outlined/add.svg";

	const frontingEntries = shallowRef<FrontingEntry[]>([]);

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

	async function showModal(clickedFrontingEntry: FrontingEntry){
		const vnode = h(FrontingEntryEdit, {
			frontingEntry: clickedFrontingEntry,
			onDidDismiss: () => removeModal(vnode)
		});

		const modal = await addModal(vnode);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
		await (modal.el as any).present();
	}

	async function showModalFronting(){
		const vnode = h(MemberSelect, {
			onlyOne: true,
			hideCheckboxes: true,
			discardOnSelect: true,
			modelValue: [],
			"onUpdate:modelValue": async (members) => {
				await newFrontingEntry({
					member: members[0],
					startTime: new Date(),
					isMainFronter: false,
					isLocked: false
				});
				void sendFrontingChangedEvent();
			}
		});

		const modal = await addModal(vnode);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
		await (modal.el as any).present();
	}
</script>

<template>
	<IonListHeader>
		<IonLabel>{{ $t("dashboard:nowFronting") }}</IonLabel>
	</IonListHeader>
	<div class="carousel">
		<IonCard
			v-for="fronting in frontingEntries"
			:key="fronting.id"
			button
			:class="{
				influenced: frontingEntries.findIndex(x => x.influencing?.id === fronting.member.id) > 0,
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
						{{ $t("dashboard:fronterInfluencing", { influencedMember: fronting.influencing.name }) }}
					</p>
					<p v-if="fronting.customStatus">
						{{ fronting.customStatus }}
					</p>
				</IonLabel>
			</IonCardContent>
		</IonCard>
		<IonCard
			button
			class="outlined add-fronting"
			@click="showModalFronting"
		>
			<IonCardContent>
				<IonIcon :icon="addMD" />
				<IonLabel>
					{{ $t("dashboard:addToFront") }}
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
		padding-left: calc(8px + var(--ion-safe-area-left, 0px));
		padding-right: calc(8px + var(--ion-safe-area-right, 0px));
	}

	html:is(.plt-tablet, .plt-desktop) div {
		padding-left: 8px;
	}

	ion-card {
		width: 160px;
		flex: none;
	}

	ion-card ion-avatar, ion-card ion-icon {
		display: block;
		margin: 16px auto;
	}

	ion-card ion-icon {
		width: 48px;
		height: 48px;
	}

	ion-card ion-card-content {
		text-align: center;
	}

	ion-card.add-fronting {
		opacity: .5;
		outline-width: 0px;
	}

	ion-card.influencing {
		opacity: .5;
	}

	ion-card.influenced {
		outline: 2px solid var(--ion-color-primary) !important;
	}
</style>