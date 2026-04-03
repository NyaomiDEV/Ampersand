<script setup lang="ts">
	import { IonCard, IonCardContent, IonLabel, IonListHeader, IonIcon, IonButton } from "@ionic/vue";
	import { h, onMounted, onUnmounted, ref, shallowRef } from "vue";
	import type { FrontingEntryComplete } from "../../lib/db/entities.d.ts";
	import { getFronting, newFrontingEntry, sendFrontingChangedEvent, updateFrontingEntry } from "../../lib/db/tables/frontingEntries";
	import FrontingEntryEdit from "../../modals/FrontingEntryEdit.vue";
	import { DatabaseEvents, DatabaseEvent } from "../../lib/db/events";
	import { addModal, removeModal } from "../../lib/modals.ts";
	import MemberSelect from "../../modals/MemberSelect.vue";

	import addMD from "@material-symbols/svg-600/outlined/add.svg";
	import removeFromFrontMD from "@material-symbols/svg-600/outlined/person_remove.svg";
	import FrontingEntryCard from "../frontingEntry/FrontingEntryCard.vue";

	const frontingEntries = shallowRef<FrontingEntryComplete[]>([]);
	const quickDelete = ref(false);

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

	onMounted(async () => {
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
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
		await (modal.el as any).present();
	}

	async function quickRemoveFronter(clickedFrontingEntry: FrontingEntryComplete){
		await updateFrontingEntry({
			uuid: clickedFrontingEntry.uuid,
			endTime: new Date()
		});

		if(!frontingEntries.value.length)
			quickDelete.value = false;
	}

	async function showModalAddToFront(){
		const vnode = h(MemberSelect, {
			onlyOne: true,
			hideCheckboxes: true,
			discardOnSelect: true,
			modelValue: [],
			membersToExclude: frontingEntries.value.map(x => x.member),
			"onUpdate:modelValue": async (members) => {
				await newFrontingEntry({
					member: members[0].uuid,
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
		<IonButton
			v-if="frontingEntries.length"
			color="danger"
			size="small"
			shape="round"
			:fill="quickDelete ? 'solid' : 'outline'"
			@click="quickDelete = !quickDelete"
		>
			<IonIcon slot="icon-only" :icon="removeFromFrontMD" />
		</IonButton>
	</IonListHeader>
	<div class="carousel">
		<FrontingEntryCard
			v-for="entry in frontingEntries"
			:key="entry.uuid"
			:entry
			:influenced-by="frontingEntries.filter(x => x.influencing?.uuid === entry.member.uuid).map(x => x.member)"
			@click="quickDelete ? quickRemoveFronter(entry) : showModal(entry)"
		/>
		<IonCard
			v-if="!quickDelete"
			button
			class="add-fronting"
			@click="showModalAddToFront"
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
		scrollbar-width: none;
		gap: 8px;
		padding: 4px 16px;
	}

	ion-list-header ion-button {
		margin: 4px 8px;
	}

	ion-card.add-fronting {
		opacity: .5;
		background-color: transparent;
		box-shadow: none;
		flex: none;
		width: 160px;

		&::part(native){
			height: 100%;
		}

		ion-card-content {
			text-align: center;
			background-color: transparent;

			ion-icon {
				display: block;
				margin: 16px auto;
				width: 48px;
				height: 48px;
			}

			h2 {
				line-height: 1.5em;
			}
		}
	}
</style>