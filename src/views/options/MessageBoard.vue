<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonFab, IonFabButton, IonIcon, IonSearchbar, IonLabel, IonItemDivider, IonDatetime } from "@ionic/vue";
	import { h, onBeforeMount, onUnmounted, ref, shallowRef, watch } from "vue";
	import type { BoardMessage } from "../../lib/db/entities.d.ts";
	import { getBoardMessagesDays, getBoardMessagesOfDay } from "../../lib/db/tables/boardMessages";
	import BoardMessageEdit from "../../modals/BoardMessageEdit.vue";
	import Spinner from "../../components/Spinner.vue";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import addMD from "@material-symbols/svg-600/outlined/add.svg";

	import dayjs from "dayjs";

	import { appConfig } from "../../lib/config";
	import MessageBoardCard from "../../components/MessageBoardCard.vue";
	import { DatabaseEvents, DatabaseEvent } from "../../lib/db/events";
	import { useRoute } from "vue-router";
	import { addModal, removeModal } from "../../lib/modals.ts";

	const route = useRoute();

	const firstWeekOfDayIsSunday = appConfig.locale.firstWeekOfDayIsSunday;

	const search = ref(route.query.q as string || "");

	const boardMessages = shallowRef<BoardMessage[]>();
	const boardMessagesDays = shallowRef<{ date: string, backgroundColor: string }[]>();

	const date = ref(dayjs().toISOString());

	const listener = (event: Event) => {
		if(["members", "boardMessages"].includes((event as DatabaseEvent).data.table))
			void resetEntries().then(() => populateHighlightedDays());
	};

	watch(route, () => {
		if(route.query.q)
			search.value = route.query.q as string;
	});

	watch(search, () => {
		void populateHighlightedDays();
	});

	watch([date, search], async () => {
		await resetEntries();
	});

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await resetEntries();
		void populateHighlightedDays();
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
		await getEntries(dayjs(date.value).toDate());
	}

	function getGrouped(entries: BoardMessage[]){
		const map = new Map<string, BoardMessage[]>();

		for(const entry of entries.sort((a, b) => b.date.getTime() - a.date.getTime())){
			const key = dayjs(entry.date).startOf("day").toISOString();
			
			const collection = map.get(key);
			if(!collection)
				map.set(key, [entry]);
			else
				collection.push(entry);
		}

		return [...map.entries()].sort((a, b) => dayjs(b[0]).valueOf() - dayjs(a[0]).valueOf());
	}

	async function populateHighlightedDays() {
		const days = await getBoardMessagesDays(search.value);

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

	async function showModal(clickedBoardMessage?: BoardMessage){
		const vnode = h(BoardMessageEdit, {
			boardMessage: clickedBoardMessage,
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
					:icon="backMD"
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
			<IonDatetime
				v-model="date"
				presentation="date"
				:first-day-of-week="firstWeekOfDayIsSunday ? 0 : 1"
				:locale="appConfig.locale.language || 'en'"
				:highlighted-dates="boardMessagesDays"
				:datetime="dayjs().format('YYYY-MM-DDTHH:mm:ss')"
			/>
			<div v-if="boardMessages === undefined" class="spinner-container">
				<Spinner size="72px" />
			</div>
			<IonList v-else>
				<template v-for="tuple in getGrouped(boardMessages)" :key="tuple[0]">
					<IonItemDivider sticky>
						<IonLabel>{{ dayjs(tuple[0]).format("LL") }}</IonLabel>
					</IonItemDivider>
					<MessageBoardCard
						v-for="boardMessage in tuple[1]"
						:key="boardMessage.id"
						:board-message
						:hide-poll="boardMessage.isArchived"
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
		margin: auto;
		--background: var(--ion-toolbar-background);
	}

	.ios ion-item-divider {
		background-color: transparent;
	}

	.ios ion-list {
		background-color: transparent;
	}
</style>