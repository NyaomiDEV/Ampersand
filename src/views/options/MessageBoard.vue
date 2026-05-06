<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonFab, IonFabButton, IonIcon, IonSearchbar, IonLabel, IonItemDivider } from "@ionic/vue";
	import { h, onBeforeMount, onUnmounted, ref, shallowRef, watch } from "vue";
	import type { BoardMessageComplete } from "../../lib/db/entities.d.ts";
	import { getBoardMessagesDays, getBoardMessagesOfDay } from "../../lib/db/tables/boardMessages";
	import BoardMessageEdit from "../../modals/BoardMessageEdit.vue";
	import Spinner from "../../components/Spinner.vue";

	import addMD from "@material-symbols/svg-600/outlined/add.svg";

	import dayjs from "dayjs";

	import MessageBoardCard from "../../components/MessageBoardCard.vue";
	import { DatabaseEvents, DatabaseEvent } from "../../lib/db/events";
	import { useRoute } from "vue-router";
	import { addModal, removeModal } from "../../lib/modals.ts";
	import DatetimeUtc, { DatetimeParts } from "../../components/DatetimeUtc.vue";
	import TheresNothingHere from "../../components/TheresNothingHere.vue";

	const route = useRoute();

	const search = ref(route.query.q as string || "");

	const parts = ref<DatetimeParts>();

	const boardMessages = shallowRef<BoardMessageComplete[]>();
	const boardMessagesDays = shallowRef<{ date: string, backgroundColor: string }[]>();

	const date = ref(new Date());

	const listener = (event: Event) => {
		if(["members", "boardMessages"].includes((event as DatabaseEvent).data.table))
			void resetEntries().then(() => populateHighlightedDays(parts.value));
	};

	watch(route, () => {
		if(route.name === "MessageBoard" && route.query.q)
			search.value = route.query.q as string;
	});

	watch([search, parts], async () => {
		await populateHighlightedDays(parts.value);
	});

	watch([date, search], async () => {
		await resetEntries();
	});

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await resetEntries();
		await populateHighlightedDays(parts.value);
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	async function getEntries(_date: Date){
		boardMessages.value = await Array.fromAsync(getBoardMessagesOfDay(_date, search.value));
		return;
	}

	async function resetEntries(){
		boardMessages.value = undefined;
		await getEntries(date.value);
	}

	function getGrouped(entries: BoardMessageComplete[]){
		const map = new Map<string, BoardMessageComplete[]>();

		for(const entry of entries){
			const key = dayjs(entry.date).startOf("day").toISOString();
			
			const collection = map.get(key);
			if(!collection)
				map.set(key, [entry]);
			else
				collection.push(entry);
		}

		return [...map.entries()].sort((a, b) => dayjs(b[0]).valueOf() - dayjs(a[0]).valueOf());
	}

	async function populateHighlightedDays(parts?: DatetimeParts) {
		let startDay = dayjs().startOf("month").startOf("day").toDate();
		let endDay = dayjs().endOf("month").startOf("day").toDate();
		if(parts){
			startDay = dayjs().year(parts.year).month(parts.month - 1).startOf("month").startOf("day").toDate();
			endDay = dayjs().year(parts.year).month(parts.month - 1).endOf("month").startOf("day").toDate();
		}

		const days = await getBoardMessagesDays(search.value, startDay, endDay);

		boardMessagesDays.value = Array.from(days.entries()).map(([date, occurrences]) => {
			let step = "200";

			if(occurrences >= 7) 
				step = "350";
			else if(occurrences >= 5) 
				step = "300";
			else if(occurrences >= 3) 
				step = "250";
			

			return {
				date: dayjs(date).format("YYYY-MM-DD"),
				backgroundColor: `var(--ion-background-color-step-${step})`
			};
		});
	}

	async function showModal(clickedBoardMessage?: BoardMessageComplete){
		const vnode = h(BoardMessageEdit, {
			boardMessage: clickedBoardMessage,
			dateOverride: date.value,
			onDidDismiss: () => removeModal(vnode)
		});

		const modal = await addModal(vnode);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
		await (modal.el as any).present();
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton
					slot="start"
					default-href="/options/"
				/>
				<IonTitle>
					{{ $t("messageBoard:header") }}
				</IonTitle>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar
					:animated="true"
					:placeholder="$t('messageBoard:searchPlaceholder')"
					show-cancel-button="focus"
					show-clear-button="focus"
					:spellcheck="false"
					:value="search"
					@ion-change="e => search = e.detail.value || ''"
				/>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<DatetimeUtc
				v-model="date"
				presentation="date"
				:highlighted-dates="boardMessagesDays"
				@parts="parts = $event"
			/>
			<div v-if="boardMessages === undefined" class="spinner-container">
				<Spinner size="72px" />
			</div>
			<TheresNothingHere v-else-if="!boardMessages.length" compress-vertical />
			<IonList v-else>
				<template v-for="tuple in getGrouped(boardMessages)" :key="tuple[0]">
					<IonItemDivider sticky>
						<IonLabel>{{ dayjs(tuple[0]).format("LL") }}</IonLabel>
					</IonItemDivider>
					<MessageBoardCard
						v-for="boardMessage in tuple[1]"
						:key="boardMessage.uuid"
						:board-message
						:hide-poll="boardMessage.isArchived"
						:show-date-in-date-time="false"
						@click="showModal(boardMessage)"
					/>
				</template>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="showModal()">
					<IonIcon :icon="addMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>

<style scoped>
	.spinner-container {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
	}

	ion-datetime {
		margin: 16px;
		--background: rgb(var(--md3-surface-container));
		--background-rgb: var(--md3-surface-container);
		--wheel-fade-background-rgb: var(--md3-surface-container);
	}
</style>