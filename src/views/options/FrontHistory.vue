<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonLabel, IonToolbar, IonBackButton, IonItem, IonItemDivider, IonDatetime, IonButtons, IonIcon, IonButton, IonSearchbar, IonFabButton, IonFab } from '@ionic/vue';
	import { inject, onMounted, onUnmounted, ref, ShallowRef, shallowRef, watch, WatchStopHandle } from 'vue';
	import FrontingEntryAvatar from "../../components/frontingEntry/FrontingEntryAvatar.vue";
	import FrontingEntryLabel from "../../components/frontingEntry/FrontingEntryLabel.vue";
	import { FrontingEntry, FrontingEntryComplete, getFronting, getFrontingEntriesTable, getMainFronter } from '../../lib/db/entities/frontingEntries';
	import { getFilteredFrontingEntries } from '../../lib/db/search';
	import FrontingEntryEdit from "../../modals/FrontingEntryEdit.vue";
	import dayjs from 'dayjs';
	import LocalizedFormat from "dayjs/plugin/localizedFormat";
	dayjs.extend(LocalizedFormat);

	import {
		calendarOutline as calendarIOS,
		listOutline as listIOS,
		addOutline as addIOS
	} from "ionicons/icons";

	import calendarMD from "@material-design-icons/svg/outlined/calendar_month.svg";
	import listMD from "@material-design-icons/svg/outlined/list.svg";
	import addMD from "@material-design-icons/svg/outlined/add.svg";

	import { appConfig } from '../../lib/config';
	import { from, useObservable } from '@vueuse/rxjs';
	import { liveQuery } from 'dexie';
	import { getMembersTable } from '../../lib/db/entities/members';
	import { PartialBy } from '../../lib/db/types';

	const props = defineProps<{
		q?: string
	}>();

	const isIOS = inject<boolean>("isIOS");

	const frontingEntryModal = ref();
	const emptyFrontingEntry: PartialBy<FrontingEntryComplete, "uuid" | "member"> = {
		isMainFronter: false,
		startTime: new Date(),
		endTime: new Date(),
	};

	const frontingEntry = shallowRef({...emptyFrontingEntry});

	const firstWeekOfDayIsSunday = appConfig.locale.firstWeekOfDayIsSunday;

	const isCalendarView = ref(false);
	const date = ref(dayjs().toISOString());

	const search = ref(props.q || "");
	const frontingEntries: ShallowRef<FrontingEntry[]> = shallowRef([]);
	const filteredFrontingEntries = getFilteredFrontingEntries(search, frontingEntries);

	let handle: WatchStopHandle;

	onMounted(async () => {
		handle = watch([
			useObservable(from(liveQuery(() => getFrontingEntriesTable().toArray()))),
			useObservable(from(liveQuery(() => getMembersTable().toArray())))
		], async () => {
			frontingEntries.value = await getFrontingEntriesTable().toArray();
		}, { immediate: true });
		frontingEntry.value = { ...filteredFrontingEntries.value[0] };
	});

	onUnmounted(async () => {
		handle();
	});

	async function showModal(clickedFrontingEntry?: FrontingEntryComplete){
		if(clickedFrontingEntry)
			frontingEntry.value = {...clickedFrontingEntry};
		else {
			frontingEntry.value = {
				...emptyFrontingEntry,
				startTime: new Date(),
				endTime: new Date(),
				member: await getMainFronter() || (await getFronting())[0]
			};
		}

		await frontingEntryModal.value.$el.present();
	}

	function getGrouped(entries: FrontingEntryComplete[]){
		const map = new Map<string, FrontingEntryComplete[]>();

		for(const entry of entries.filter(x => !x.endTime).sort((a, b) => b.startTime.getTime() - a.startTime.getTime())){
			const collection = map.get("currentlyFronting");
			if(!collection)
				map.set("currentlyFronting", [entry])
			else
				collection.push(entry)
		}

		for(const entry of entries.filter(x => x.endTime).sort((a, b) => b.startTime.getTime() - a.startTime.getTime())){
			const key = dayjs(entry.startTime).startOf('day').toISOString();
			
			const collection = map.get(key);
			if(!collection)
				map.set(key, [entry])
			else
				collection.push(entry)
		}

		return [...map.entries()].sort((a, b) => {
			if(a[0] === "currentlyFronting") return -1;
			return dayjs(b[0]).valueOf() - dayjs(a[0]).valueOf()
		});
	}

	function highlightInCalendar(_date: string){
		const date = dayjs(_date).startOf("day");
		if(filteredFrontingEntries.value?.filter(x => dayjs(x.startTime).startOf('day').valueOf() === date.valueOf()).length > 0){
			return {
				backgroundColor: "var(--ion-background-color-step-200)"
			};
		}

		return undefined;
	}

	function getAtDate(_date: string){
		const today = dayjs().startOf("day");
		const date = dayjs(_date).startOf("day");

		const map = new Map<string, FrontingEntryComplete[]>();

		if(date.valueOf() === today.valueOf())
			map.set("currentlyFronting", filteredFrontingEntries.value?.filter(x => !x.endTime) || []);

		const key = date.toISOString();

		map.set(key, filteredFrontingEntries.value?.filter(x => x.endTime && dayjs(x.startTime).startOf('day').valueOf() === date.valueOf()) || []);

		return [...map.entries()].sort((a, b) => {
			if(a[0] === "currentlyFronting") return -1;
			return dayjs(b[0]).valueOf() - dayjs(a[0]).valueOf()
		});
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>
					{{ $t("options:frontHistory.header") }}
				</IonTitle>
				<IonButtons slot="secondary">
					<IonButton @click="isCalendarView = !isCalendarView">
						<IonIcon slot="icon-only" :ios="isCalendarView ? listIOS : calendarIOS"
							:md="isCalendarView ? listMD : calendarMD" />
					</IonButton>
				</IonButtons>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar :animated="true" :placeholder="$t('options:frontHistory.searchPlaceholder')"
					showCancelButton="focus" showClearButton="focus" :spellcheck="false" v-model="search" />
			</IonToolbar>
			<div class="container" v-if="isCalendarView">
				<IonDatetime presentation="date" :firstDayOfWeek="firstWeekOfDayIsSunday ? 0 : 1" :highlightedDates="highlightInCalendar" v-model="date" />
			</div>
		</IonHeader>

		<IonContent>
			<IonList :inset="isIOS" v-if="isCalendarView">
				<template v-for="tuple in getAtDate(date)">
					<IonItemDivider sticky v-if="tuple[1].length">
						<IonLabel>{{
							tuple[0] === "currentlyFronting"
							? $t("options:frontHistory.currentlyFronting")
							: dayjs(tuple[0]).format("LL")
							}}</IonLabel>
					</IonItemDivider>
					<IonItem button v-for="entry in tuple[1]" :key="'calendarview'+JSON.stringify(entry)" @click="showModal(entry)">
						<FrontingEntryAvatar slot="start" :entry />
						<FrontingEntryLabel :entry />
					</IonItem>
				</template>
			</IonList>

			<IonList :inset="isIOS" v-if="!isCalendarView">
				<template v-for="tuple in getGrouped(filteredFrontingEntries || [])">
					<IonItemDivider sticky>
						<IonLabel>{{
							tuple[0] === "currentlyFronting"
							? $t("options:frontHistory.currentlyFronting")
							: dayjs(tuple[0]).format("LL")
							}}</IonLabel>
					</IonItemDivider>
					<IonItem button v-for="entry in tuple[1]" :key="JSON.stringify(entry)" @click="showModal(entry)">
						<FrontingEntryAvatar slot="start" :entry />
						<FrontingEntryLabel :entry />
					</IonItem>
				</template>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="showModal()">
					<IonIcon :ios="addIOS" :md="addMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>

		<FrontingEntryEdit :frontingEntry ref="frontingEntryModal" />
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
</style>