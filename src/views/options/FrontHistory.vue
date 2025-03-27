<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonLabel, IonToolbar, IonBackButton, IonItem, IonItemDivider, IonDatetime, IonButtons, IonIcon, IonButton, IonSearchbar, IonFabButton, IonFab } from '@ionic/vue';
	import { h, inject, onBeforeMount, onUnmounted, ref, shallowRef, watch } from 'vue';
	import MemberAvatar from "../../components/member/MemberAvatar.vue";
	import FrontingEntryLabel from "../../components/frontingEntry/FrontingEntryLabel.vue";
	import type { FrontingEntry, FrontingEntryComplete } from '../../lib/db/entities.d.ts';
	import { getFrontingEntriesOfDay, getFrontingEntriesDays } from '../../lib/db/tables/frontingEntries';
	import { getFilteredFrontingEntries } from '../../lib/search.ts';
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import FrontingEntryEdit from "../../modals/FrontingEntryEdit.vue";
	import dayjs from 'dayjs';

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import calendarMD from "@material-symbols/svg-600/outlined/calendar_month.svg";
	import listMD from "@material-symbols/svg-600/outlined/list.svg";
	import addMD from "@material-symbols/svg-600/outlined/add.svg";

	import { appConfig } from '../../lib/config';
	import { DatabaseEvents, DatabaseEvent } from '../../lib/db/events';
	import { addModal, removeModal } from '../../lib/modals.ts';
	import { useRoute } from 'vue-router';

	const route = useRoute();

	const firstWeekOfDayIsSunday = appConfig.locale.firstWeekOfDayIsSunday;
	const isIOS = inject<boolean>("isIOS");

	const search = ref(route.query.q as string || "");
	
	const frontingEntries = shallowRef<FrontingEntry[]>();
	const filteredFrontingEntries = shallowRef<FrontingEntryComplete[]>();

	const frontingEntriesDays = shallowRef<{date: string, backgroundColor: string}[]>();

	const isCalendarView = ref(true);
	const date = ref(dayjs().toISOString());

	const listener = async (event: Event) => {
		if(["frontingEntries", "members"].includes((event as DatabaseEvent).data.table)){
			await resetEntries();
			await populateHighlightedDays();
		}
	};

	watch(route, () => {
		search.value = route.query.q as string || "";
	});

	watch([search, frontingEntries], async () => {
		filteredFrontingEntries.value = await getFilteredFrontingEntries(search.value, frontingEntries.value);
	}, { immediate: true });

	watch([isCalendarView, date], async () => {
		await resetEntries();
	});

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await resetEntries();
		await populateHighlightedDays();
	});

	onUnmounted(async () => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	async function getEntries(_date: Date){
		const dateEntries = await getFrontingEntriesOfDay(_date, true);
		frontingEntries.value = dateEntries;
		return;
	}

	async function resetEntries(){
		frontingEntries.value = undefined;
		await getEntries(dayjs(date.value).toDate());
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

	async function populateHighlightedDays() {
		const days = await getFrontingEntriesDays();

		frontingEntriesDays.value = Array.from(days.entries()).map(([date, occurrences]) => {
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

	async function showModal(clickedFrontingEntry?: FrontingEntryComplete){
		const vnode = h(FrontingEntryEdit, {
			frontingEntry: clickedFrontingEntry,
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
					{{ $t("frontHistory:header") }}
				</IonTitle>
				<IonButtons slot="secondary">
					<IonButton @click="isCalendarView = !isCalendarView">
						<IonIcon slot="icon-only" :icon="isCalendarView ? listMD : calendarMD" />
					</IonButton>
				</IonButtons>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar :animated="true" :placeholder="$t('frontHistory:searchPlaceholder')"
					showCancelButton="focus" showClearButton="focus" :spellcheck="false" v-model="search" />
			</IonToolbar>
			<div class="container" v-if="isCalendarView">
				<IonDatetime presentation="date" :firstDayOfWeek="firstWeekOfDayIsSunday ? 0 : 1"
					v-model="date" :locale="appConfig.locale.language || 'en'"
					:highlightedDates="frontingEntriesDays"
					:datetime="dayjs().format('YYYY-MM-DDTHH:mm:ss')" />
			</div>
		</IonHeader>

		<SpinnerFullscreen v-if="!filteredFrontingEntries && !frontingEntries" />
		<IonContent v-else>
			<IonList :inset="isIOS">
				<template v-for="tuple in getGrouped(filteredFrontingEntries || [])" :key="tuple[0]">
					<IonItemDivider sticky>
						<IonLabel>{{
							tuple[0] === "currentlyFronting"
							? $t("frontHistory:currentlyFronting")
							: dayjs(tuple[0]).format("LL")
							}}</IonLabel>
					</IonItemDivider>
					<IonItem button v-for="entry in tuple[1]" :key="entry.uuid" @click="showModal(entry)">
						<MemberAvatar slot="start" :member="entry.member" />
						<FrontingEntryLabel :entry />
					</IonItem>
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
</style>