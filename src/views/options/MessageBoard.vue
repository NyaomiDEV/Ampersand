<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonFab, IonFabButton, IonIcon, IonSearchbar, IonLabel, IonItemDivider, IonButtons, IonButton, IonDatetime } from '@ionic/vue';
	import { h, inject, onBeforeMount, onUnmounted, ref, shallowRef, watch } from 'vue';
	import type { BoardMessage, BoardMessageComplete } from '../../lib/db/entities.d.ts';
	import { getBoardMessages } from '../../lib/db/tables/boardMessages';
	import BoardMessageEdit from "../../modals/BoardMessageEdit.vue";
	import SpinnerFullscreen from '../../components/SpinnerFullscreen.vue';

	import {
		calendarOutline as calendarIOS,
		listOutline as listIOS,
		addOutline as addIOS
	} from "ionicons/icons";

	import calendarMD from "@material-symbols/svg-600/outlined/calendar_month.svg";
	import listMD from "@material-symbols/svg-600/outlined/list.svg";
	import addMD from "@material-symbols/svg-600/outlined/add.svg";

	import dayjs from 'dayjs';
	import LocalizedFormat from "dayjs/plugin/localizedFormat";
	dayjs.extend(LocalizedFormat);

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
	watch(route, () => {
		search.value = route.query.q as string || "";
	});

	const boardMessages = shallowRef<BoardMessage[]>();
	const filteredBoardMessages = shallowRef<BoardMessageComplete[]>();
	watch([boardMessages, search], async () => {
		filteredBoardMessages.value = await getFilteredBoardMessages(search.value, boardMessages.value);
	}, { immediate: true });

	const isCalendarView = ref(false);
	const date = ref(dayjs().toISOString());
	const calendarDate = ref(dayjs().format("YYYY-MM-DDTHH:mm:ss"));

	const listener = async (event: Event) => {
		if(["members", "boardMessages"].includes((event as DatabaseEvent).data.table)){
			boardMessages.value = await getBoardMessages();
		}
	}

	onBeforeMount(async () => {
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
		if(filteredBoardMessages.value && filteredBoardMessages.value.filter(x => dayjs(x.date).startOf('day').valueOf() === date.valueOf()).length > 0){
			return {
				backgroundColor: "var(--ion-background-color-step-200)"
			};
		}

		return undefined;
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
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>
					{{ $t("messageBoard:header") }}
				</IonTitle>
				<IonButtons slot="secondary">
					<IonButton @click="isCalendarView = !isCalendarView">
						<IonIcon slot="icon-only" :ios="isCalendarView ? listIOS : calendarIOS"
							:md="isCalendarView ? listMD : calendarMD" />
					</IonButton>
				</IonButtons>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar :animated="true" :placeholder="$t('messageBoard:searchPlaceholder')"
					showCancelButton="focus" showClearButton="focus" :spellcheck="false" v-model="search" />
			</IonToolbar>
			<div class="container" v-if="isCalendarView">
				<IonDatetime presentation="date" :firstDayOfWeek="firstWeekOfDayIsSunday ? 0 : 1" :highlightedDates="highlightInCalendar" v-model="date" :locale="appConfig.locale.language || 'en'" :datetime="calendarDate"/>
			</div>
		</IonHeader>

		<SpinnerFullscreen v-if="!boardMessages" />
		<IonContent v-else>
			<IonList :inset="isIOS">
				<template v-for="tuple in (isCalendarView ? getAtDate(date) : getGrouped(filteredBoardMessages || []))" :key="tuple[0]">
					<IonItemDivider sticky>
						<IonLabel>{{ dayjs(tuple[0]).format("LL") }}</IonLabel>
					</IonItemDivider>
					<MessageBoardCard :boardMessage v-for="boardMessage in tuple[1]" :key="boardMessage.uuid" @click="showModal(boardMessage)" />
				</template>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="showModal()">
					<IonIcon :ios="addIOS" :md="addMD" />
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