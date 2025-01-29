<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonFab, IonFabButton, IonIcon, IonSearchbar, IonLabel, IonItemDivider, IonButtons, IonButton, IonDatetime } from '@ionic/vue';
	import { inject, onMounted, onUnmounted, ref, shallowRef } from 'vue';
	import type { BoardMessage, BoardMessageComplete } from '../../lib/db/entities.d.ts';
	import { getBoardMessages } from '../../lib/db/tables/boardMessages';
	import BoardMessageEdit from "../../modals/BoardMessageEdit.vue";
	import Spinner from "../../components/Spinner.vue";
	import { getFronting, getMainFronter } from '../../lib/db/tables/frontingEntries';
	import { PartialBy } from '../../lib/types';

	import {
		calendarOutline as calendarIOS,
		listOutline as listIOS,
		addOutline as addIOS
	} from "ionicons/icons";

	import calendarMD from "@material-design-icons/svg/outlined/calendar_month.svg";
	import listMD from "@material-design-icons/svg/outlined/list.svg";
	import addMD from "@material-design-icons/svg/outlined/add.svg";

	import dayjs from 'dayjs';
	import LocalizedFormat from "dayjs/plugin/localizedFormat";
	dayjs.extend(LocalizedFormat);

	import { appConfig } from '../../lib/config';
	import { getFilteredBoardMessages } from '../../lib/db/search';
	import MessageBoardCard from '../../components/MessageBoardCard.vue';
	import { DatabaseEvents, DatabaseEvent } from '../../lib/db/events';
	import { useRoute } from 'vue-router';

	const route = useRoute();

	const isIOS = inject<boolean>("isIOS");
	
	const emptyBoardMessage: PartialBy<BoardMessageComplete, "uuid" | "member"> = {
		title: "",
		body: "",
		date: new Date()
	}
	const boardMessage = shallowRef<PartialBy<BoardMessageComplete, "uuid" | "member">>({...emptyBoardMessage});
	const boardMessageEditModal = ref();

	const boardMessages = shallowRef<BoardMessage[]>();
	const search = ref(route.query.q as string || "");
	const filteredBoardMessages = getFilteredBoardMessages(search, boardMessages);

	const firstWeekOfDayIsSunday = appConfig.locale.firstWeekOfDayIsSunday;

	const isCalendarView = ref(false);
	const date = ref(dayjs().toISOString());
	const calendarDate = ref(dayjs().format("YYYY-MM-DDTHH:mm:ss"));

	const listener = async (event: Event) => {
		if(["members", "boardMessages"].includes((event as DatabaseEvent).data.table)){
			boardMessages.value = await getBoardMessages();
		}
	}

	onMounted(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		boardMessages.value = await getBoardMessages();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});


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

	function getAtDate(_date: string){
		const date = dayjs(_date).startOf("day");
		const map = new Map<string, BoardMessageComplete[]>();
		const key = date.toISOString();

		map.set(key, filteredBoardMessages.value?.filter(x => dayjs(x.date).startOf('day').valueOf() === date.valueOf()) || []);

		return [...map.entries()].sort((a, b) => dayjs(b[0]).valueOf() - dayjs(a[0]).valueOf());
	}

	function highlightInCalendar(_date: string){
		const date = dayjs(_date).startOf("day");
		if(filteredBoardMessages.value?.filter(x => dayjs(x.date).startOf('day').valueOf() === date.valueOf()).length > 0){
			return {
				backgroundColor: "var(--ion-background-color-step-200)"
			};
		}

		return undefined;
	}

	async function showModal(_boardMessage?: BoardMessageComplete){
		if(_boardMessage)
			boardMessage.value = {..._boardMessage};
		else {
			boardMessage.value = {
				...emptyBoardMessage,
				date: new Date(),
				member: await getMainFronter() || (await getFronting())[0]
			};
		}
		await boardMessageEditModal.value.$el.present();
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>
					{{ $t("options:messageBoard.header") }}
				</IonTitle>
				<IonButtons slot="secondary">
					<IonButton @click="isCalendarView = !isCalendarView">
						<IonIcon slot="icon-only" :ios="isCalendarView ? listIOS : calendarIOS"
							:md="isCalendarView ? listMD : calendarMD" />
					</IonButton>
				</IonButtons>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar :animated="true" :placeholder="$t('options:messageBoard.searchPlaceholder')"
					showCancelButton="focus" showClearButton="focus" :spellcheck="false" v-model="search" />
			</IonToolbar>
			<div class="container" v-if="isCalendarView">
				<IonDatetime presentation="date" :firstDayOfWeek="firstWeekOfDayIsSunday ? 0 : 1" :highlightedDates="highlightInCalendar" v-model="date" :locale="appConfig.locale.language || 'en'" :datetime="calendarDate"/>
			</div>
		</IonHeader>

		<div v-if="!boardMessages" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; --spinner-size: 72px; --spinner-width: 5px">
			<Spinner />
		</div>
		<IonContent v-else>
			<IonList :inset="isIOS" v-if="isCalendarView">
				<template v-for="tuple in getAtDate(date)">
					<IonItemDivider sticky>
						<IonLabel>{{ dayjs(tuple[0]).format("LL") }}</IonLabel>
					</IonItemDivider>
					<MessageBoardCard :boardMessage v-for="boardMessage in tuple[1]" :key="JSON.stringify(boardMessage)" @click="showModal(boardMessage)" />
				</template>
			</IonList>

			<IonList :inset="isIOS" v-if="!isCalendarView">
				<template v-for="tuple in getGrouped(filteredBoardMessages || [])">
					<IonItemDivider sticky>
						<IonLabel>{{ dayjs(tuple[0]).format("LL") }}</IonLabel>
					</IonItemDivider>
					<MessageBoardCard :boardMessage v-for="boardMessage in tuple[1]" :key="JSON.stringify(boardMessage)" @click="showModal(boardMessage)" />
				</template>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="showModal()">
					<IonIcon :ios="addIOS" :md="addMD" />
				</IonFabButton>
			</IonFab>

			<BoardMessageEdit :boardMessage ref="boardMessageEditModal" />
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