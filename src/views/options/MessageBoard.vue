<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonFab, IonFabButton, IonIcon, IonSearchbar, IonLabel, IonItemDivider, IonButtons, IonButton, IonDatetime } from '@ionic/vue';
	import { h, inject, onBeforeMount, onUnmounted, ref, shallowRef, watch } from 'vue';
	import type { BoardMessage, BoardMessageComplete } from '../../lib/db/entities.d.ts';
	import { getBoardMessagesDays, getBoardMessagesOfDay, getBoardMessagesOffset } from '../../lib/db/tables/boardMessages';
	import BoardMessageEdit from "../../modals/BoardMessageEdit.vue";
	import SpinnerFullscreen from '../../components/SpinnerFullscreen.vue';
	import InfiniteScroll from '../../components/InfiniteScroll.vue';

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import calendarMD from "@material-symbols/svg-600/outlined/calendar_month.svg";
	import listMD from "@material-symbols/svg-600/outlined/list.svg";
	import addMD from "@material-symbols/svg-600/outlined/add.svg";

	import dayjs from 'dayjs';

	import { appConfig } from '../../lib/config';
	import { getFilteredBoardMessages } from '../../lib/search.ts';
	import MessageBoardCard from '../../components/MessageBoardCard.vue';
	import { DatabaseEvents, DatabaseEvent } from '../../lib/db/events';
	import { useRoute } from 'vue-router';
	import { addModal, removeModal } from '../../lib/modals.ts';

	const route = useRoute();

	const firstWeekOfDayIsSunday = appConfig.locale.firstWeekOfDayIsSunday;
	const isIOS = inject<boolean>("isIOS");

	const search = ref(route.query.q as string || "");

	const boardMessages = shallowRef<BoardMessage[]>();
	const filteredBoardMessages = shallowRef<BoardMessageComplete[]>();

	const boardMessagesDays = shallowRef<{date: string, backgroundColor: string}[]>();

	const isCalendarView = ref(false);
	const date = ref(dayjs().toISOString());
	const eol = ref(false);

	const listener = async (event: Event) => {
		if(["members", "boardMessages"].includes((event as DatabaseEvent).data.table)){
			await resetEntries();
			await populateHighlightedDays();
		}
	}

	watch(route, () => {
		search.value = route.query.q as string || "";
	});

	watch([search, boardMessages], async () => {
		filteredBoardMessages.value = await getFilteredBoardMessages(search.value, boardMessages.value);
	}, { immediate: true });

	watch([isCalendarView, date], async () => {
		await resetEntries();
	});

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await resetEntries();
		await populateHighlightedDays();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	let offset = 0;
	async function getEntries(_date?: Date){
		if(_date){
			const dateEntries = await getBoardMessagesOfDay(_date);
			boardMessages.value = dateEntries;
			eol.value = true;
			return;
		}

		const newEntries = await getBoardMessagesOffset(offset, 20);

		if (!newEntries.length)
			eol.value = true;

		offset += newEntries.length;
		if (!boardMessages.value)
			boardMessages.value = newEntries;
		else
			boardMessages.value = [...boardMessages.value, ...newEntries];
	}

	async function resetEntries(_date?: Date){
		offset = 0;
		boardMessages.value = undefined;
		eol.value = false;
		await getEntries(isCalendarView.value
			? dayjs(date.value).toDate()
			: undefined
		);
	}

	function getGrouped(entries: BoardMessageComplete[]){
		const map = new Map<string, BoardMessageComplete[]>();

		for(const entry of entries.sort((a, b) => b.date.getTime() - a.date.getTime())){
			const key = dayjs(entry.date).startOf('day').toISOString();
			
			const collection = map.get(key);
			if(!collection)
				map.set(key, [entry])
			else
				collection.push(entry)
		}

		return [...map.entries()].sort((a, b) => dayjs(b[0]).valueOf() - dayjs(a[0]).valueOf());
	}

	async function populateHighlightedDays() {
		boardMessagesDays.value = (await getBoardMessagesDays()).map(x => ({
			date: dayjs(x).format("YYYY-MM-DD"),
			backgroundColor: "var(--ion-background-color-step-200)"
		}));
	}

	async function showModal(clickedBoardMessage?: BoardMessageComplete){
		const vnode = h(BoardMessageEdit, {
			boardMessage: clickedBoardMessage,
			onDidDismiss: () => removeModal(vnode)
		});

		const modal = await addModal(vnode);
		await (modal.el as any).present();
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" :text="isIOS ? $t('other:back') : undefined" :icon="!isIOS ? backMD : undefined" defaultHref="/options/" />
				<IonTitle>
					{{ $t("messageBoard:header") }}
				</IonTitle>
				<IonButtons slot="secondary">
					<IonButton @click="isCalendarView = !isCalendarView">
						<IonIcon slot="icon-only" :icon="isCalendarView ? listMD : calendarMD" />
					</IonButton>
				</IonButtons>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar :animated="true" :placeholder="$t('messageBoard:searchPlaceholder')"
					showCancelButton="focus" showClearButton="focus" :spellcheck="false" v-model="search" />
			</IonToolbar>
			<div class="container" v-if="isCalendarView">
				<IonDatetime
				presentation="date"
				:firstDayOfWeek="firstWeekOfDayIsSunday ? 0 : 1"
				v-model="date"
				:locale="appConfig.locale.language || 'en'"
				:highlightedDates="boardMessagesDays"
				:datetime="dayjs().format('YYYY-MM-DDTHH:mm:ss')"/>
			</div>
		</IonHeader>

		<SpinnerFullscreen v-if="!filteredBoardMessages && !boardMessages" />
		<IonContent v-else>
			<IonList :inset="isIOS">
				<template v-for="tuple in getGrouped(filteredBoardMessages || [])" :key="tuple[0]">
					<IonItemDivider sticky>
						<IonLabel>{{ dayjs(tuple[0]).format("LL") }}</IonLabel>
					</IonItemDivider>
					<MessageBoardCard :boardMessage v-for="boardMessage in tuple[1]" :key="boardMessage.uuid" @click="showModal(boardMessage)" />
				</template>
			</IonList>
			<InfiniteScroll v-if="!eol" :callback="getEntries" />

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="showModal()">
					<IonIcon :icon="addMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>

<style scoped>
	.container {
		background-color: var(--ion-toolbar-background);
		z-index: 1;
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