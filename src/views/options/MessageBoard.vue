<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonFab, IonFabButton, IonIcon, IonSearchbar, IonLabel, IonItemDivider, IonButtons, IonButton, IonDatetime } from '@ionic/vue';
	import { h, inject, onBeforeMount, onUnmounted, ref, shallowRef, watch } from 'vue';
	import type { BoardMessageComplete } from '../../lib/db/entities.d.ts';
	import { getBoardMessagesDays, getBoardMessagesOfDay } from '../../lib/db/tables/boardMessages';
	import BoardMessageEdit from "../../modals/BoardMessageEdit.vue";
	import SpinnerFullscreen from '../../components/SpinnerFullscreen.vue';

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import calendarMD from "@material-symbols/svg-600/outlined/calendar_month.svg";
	import listMD from "@material-symbols/svg-600/outlined/list.svg";
	import addMD from "@material-symbols/svg-600/outlined/add.svg";

	import dayjs from 'dayjs';

	import { appConfig } from '../../lib/config';
	import MessageBoardCard from '../../components/MessageBoardCard.vue';
	import { DatabaseEvents, DatabaseEvent } from '../../lib/db/events';
	import { useRoute } from 'vue-router';
	import { addModal, removeModal } from '../../lib/modals.ts';

	const route = useRoute();

	const firstWeekOfDayIsSunday = appConfig.locale.firstWeekOfDayIsSunday;
	const isIOS = inject<boolean>("isIOS");

	const search = ref(route.query.q as string || "");

	const boardMessages = shallowRef<BoardMessageComplete[]>();
	const boardMessagesDays = shallowRef<{date: string, backgroundColor: string}[]>();

	const isCalendarView = ref(true);
	const date = ref(dayjs().toISOString());

	const listener = async (event: Event) => {
		if(["members", "boardMessages"].includes((event as DatabaseEvent).data.table)){
			await resetEntries();
			await populateHighlightedDays();
		}
	}

	watch(route, () => {
		search.value = route.query.q as string || "";
	});

	watch(search, async () => {
		await populateHighlightedDays();
	}, { immediate: true });

	watch([date, search], async () => {
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

	async function getEntries(_date: Date){
		boardMessages.value = await Array.fromAsync(getBoardMessagesOfDay(_date, search.value));
		return;
	}

	async function resetEntries(){
		boardMessages.value = undefined;
		await getEntries(dayjs(date.value).toDate())
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
		const days = getBoardMessagesDays(search.value);

		boardMessagesDays.value = Array.from(days.entries()).map(([date, occurrences]) => {
			let step = "200";

			if(occurrences >= 7) {
				step = "350";
			} else if(occurrences >= 5) {
				step = "300";
			} else if(occurrences >= 3) {
				step = "250";
			}

			return {
				date: dayjs(date).format("YYYY-MM-DD"),
				backgroundColor: `var(--ion-background-color-step-${step})`
			}
		});
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

		<SpinnerFullscreen v-if="boardMessages === undefined" />
		<IonContent v-else>
			<IonList :inset="isIOS">
				<template v-for="tuple in getGrouped(boardMessages)" :key="tuple[0]">
					<IonItemDivider sticky>
						<IonLabel>{{ dayjs(tuple[0]).format("LL") }}</IonLabel>
					</IonItemDivider>
					<MessageBoardCard :boardMessage v-for="boardMessage in tuple[1]" :key="boardMessage.uuid" @click="showModal(boardMessage)" />
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