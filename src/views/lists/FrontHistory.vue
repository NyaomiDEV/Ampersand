<script setup lang="ts">
	import { IonContent, IonList, IonPage, IonTitle, IonLabel, IonToolbar, IonBackButton, IonItemDivider, IonIcon, IonSearchbar, IonFabButton, IonFab, IonButtons, IonButton, IonListHeader } from "@ionic/vue";
	import { h, onBeforeMount, onUnmounted, ref, shallowRef, useTemplateRef, watch } from "vue";
	import type { FrontingEntry, FrontingEntryComplete } from "../../lib/db/entities.d.ts";
	import { getFrontingEntriesOfDay, getFrontingEntriesDays, toFrontingEntryComplete, getFilteredFrontingEntries } from "../../lib/db/tables/frontingEntries";
	import Spinner from "../../components/Spinner.vue";
	import FrontingEntryEdit from "../../modals/FrontingEntryEdit.vue";
	import dayjs from "dayjs";
	import { getFilterQueriesIndex } from "../../lib/db/tables/filterQueries.ts";

	import addMD from "@material-symbols/svg-600/rounded/add.svg";
	import moreMD from "@material-symbols/svg-600/rounded/more_vert.svg";
	import calendarMD from "@material-symbols/svg-600/rounded/calendar_month.svg";
	import listMD from "@material-symbols/svg-600/rounded/list.svg";

	import { DatabaseEvents, DatabaseEvent } from "../../lib/db/events";
	import { addModal, removeModal } from "../../lib/modals.ts";
	import { useRoute } from "vue-router";
	import { useTranslation } from "i18next-vue";
	import DatetimeUtc, { DatetimeParts } from "../../components/DatetimeUtc.vue";
	import FrontingEntryItem from "../../components/frontingEntry/FrontingEntryItem.vue";
	import TheresNothingHere from "../../components/TheresNothingHere.vue";
	import CollapsibleHeaderbar from "../../components/CollapsibleHeaderbar.vue";
	import FilterQuerySelect from "../../modals/FilterQuerySelect.vue";
	import FilterQueryEdit from "../../modals/FilterQueryEdit.vue";
	import InfiniteLoader from "../../components/InfiniteLoader.vue";
	import VirtualList from "../../components/VirtualList.vue";

	const route = useRoute();
	
	const isStandalone = route.path.startsWith("/lists/");

	const showCalendar = ref(true);

	const i18next = useTranslation();

	const search = ref(route.query.q as string || "");
	const parts = ref<DatetimeParts>();

	const frontingEntries = shallowRef<FrontingEntryComplete[]>();
	const iter = shallowRef<AsyncGenerator<FrontingEntry>>();
	const iterDone = ref(false);

	const frontingEntriesDays = shallowRef<{ date: string, backgroundColor: string }[]>();

	const date = ref(new Date());

	const filterQuerySelect = useTemplateRef("filterQuerySelect");

	const listener = (event: Event) => {
		if(["frontingEntries", "members"].includes((event as DatabaseEvent).data.table))
			void resetEntries().then(() => populateHighlightedDays(parts.value));
	};

	watch(route, () => {
		if(route.name && ["FrontHistory", "FrontHistoryTab"].includes(route.name.toString()) && route.query.q)
			search.value = route.query.q as string;
	}, { immediate: true });

	watch([search, parts], async () => {
		await populateHighlightedDays(parts.value);
	});

	watch([date, search, showCalendar], async () => {
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

	async function resetEntries(){
		frontingEntries.value = undefined;
		iterDone.value = false;
		if(showCalendar.value)
			iter.value = getFrontingEntriesOfDay(date.value, search.value);
		else
			iter.value = getFilteredFrontingEntries(search.value);

		await pollEntries();
	}

	async function pollEntries(cb?: () => void){
		if(!iter.value) return;

		let i = 0;
		const _entrs: FrontingEntry[] = [];
		while(true) {
			const data = await iter.value.next();
			if(data.value) _entrs.push(data.value);
			i++;
			if(data.done) iterDone.value = true;
			if(i >= 20 || data.done) break;
		}

		if(!frontingEntries.value)
			frontingEntries.value = await toFrontingEntryComplete(_entrs);
		else
			frontingEntries.value = [...frontingEntries.value, ...await toFrontingEntryComplete(_entrs)];

		cb?.();
	}

	function getGrouped(entries: FrontingEntryComplete[]){
		const map = new Map<string, FrontingEntryComplete[]>();

		for(const entry of entries){
			if(!entry.endTime){
				const collection = map.get("currentlyFronting");
				if(!collection)
					map.set("currentlyFronting", [entry]);
				else
					collection.push(entry);
			} else if(dayjs(date.value).startOf("day").valueOf() === dayjs(entry.startTime).startOf("day").valueOf()) {
				const collection = map.get("frontedThatDay");
				if(!collection)
					map.set("frontedThatDay", [entry]);
				else
					collection.push(entry);
			} else {			
				const collection = map.get("wasFronting");
				if(!collection)
					map.set("wasFronting", [entry]);
				else
					collection.push(entry);
			}
		}

		return [...map.entries()].sort((a, _b) => {
			if(a[0] === "currentlyFronting") return -2;
			if(a[0] === "wasFronting") return -1;
			if(a[0] === "frontedThatDay") return 0;
			return 1;
		});
	}

	function getLabel(name: string){
		switch(name){
			case "currentlyFronting":
				return i18next.t("frontHistory:currentlyFronting");
			case "wasFronting":
				return i18next.t("frontHistory:wasFronting");
			case "frontedThatDay":
				return i18next.t("frontHistory:frontedThatDay");
		}
		return "";
	}

	async function populateHighlightedDays(parts?: DatetimeParts) {
		let startDay = dayjs().startOf("month").startOf("day").toDate();
		let endDay = dayjs().endOf("month").endOf("day").toDate();
		if(parts){
			startDay = dayjs().year(parts.year).month(parts.month - 1).startOf("month").startOf("day").toDate();
			endDay = dayjs().year(parts.year).month(parts.month - 1).endOf("month").endOf("day").toDate();
		}

		const days = await getFrontingEntriesDays(search.value, startDay, endDay);

		frontingEntriesDays.value = Array.from(days.entries()).map(([date, occurrences]) => {
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

	async function showModal(clickedFrontingEntry?: FrontingEntryComplete){
		const vnode = h(FrontingEntryEdit, {
			frontingEntry: clickedFrontingEntry,
			overrideStartTime: date.value,
			overrideEndTime: date.value,
			onDidDismiss: () => removeModal(vnode)
		});

		const modal = await addModal(vnode);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
		await (modal.el as any).present();
	}

	async function saveFilterQuery(){
		if(!search.value.length) return;
		const vnode = h(FilterQueryEdit, {
			filterQuery: { name: "", type: "frontHistory", query: search.value },
			onDidDismiss: () => removeModal(vnode)
		});

		const modal = await addModal(vnode);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
		await (modal.el as any).present();
	}
</script>

<template>
	<IonPage>
		<IonContent>
			<CollapsibleHeaderbar class="size-large">
				<IonToolbar>
					<IonBackButton
						v-if="isStandalone"
						slot="start"
						default-href="/"
					/>
					<IonTitle>
						{{ $t("frontHistory:header") }}
					</IonTitle>
					<IonButtons slot="secondary">
						<IonButton @click="showCalendar = !showCalendar">
							<IonIcon slot="icon-only" :icon="showCalendar ? listMD : calendarMD" />
						</IonButton>
					</IonButtons>
				</IonToolbar>
				<IonToolbar>
					<IonSearchbar
						:animated="true"
						:placeholder="$t('frontHistory:searchPlaceholder')"
						show-cancel-button="focus"
						show-clear-button="focus"
						:spellcheck="false"
						:value="search"
						@ion-change="e => search = e.detail.value || ''"
					/>
					<IonButtons slot="end">
						<IonButton v-if="getFilterQueriesIndex().filter(x => x.type === 'frontHistory').length" @click="filterQuerySelect?.$el.present()">
							<IonIcon slot="icon-only" :icon="moreMD" />
						</IonButton>
						<IonButton v-if="search.length" @click="saveFilterQuery">
							<IonIcon slot="icon-only" :icon="addMD" />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</CollapsibleHeaderbar>

			<DatetimeUtc
				v-if="showCalendar"
				v-model="date"
				presentation="date"
				:highlighted-dates="frontingEntriesDays"
				@parts="parts = $event"
			/>

			<div v-if="frontingEntries === undefined" class="spinner-container">
				<Spinner size="72px" />
			</div>
			
			<TheresNothingHere v-else-if="!frontingEntries.length" compress-vertical />

			<template v-else-if="!showCalendar">
				<IonListHeader>
					{{ $t("frontHistory:currentlyFronting") }}
				</IonListHeader>
				<IonList class="currently-fronting">
					<VirtualList :entries="frontingEntries.filter(x => !x.endTime)" :min-size="86" :gap="2">
						<template #default="{ entry }">
							<FrontingEntryItem
								:entry="entry"
								button
								show-date-complete
								:presence-average="!entry.endTime"
								@click="showModal(entry)"
							/>
						</template>
					</VirtualList>
				</IonList>
				<IonList>
					<VirtualList :entries="frontingEntries.filter(x => x.endTime)" :min-size="86" :gap="2">
						<template #default="{ entry }">
							<FrontingEntryItem
								:entry="entry"
								button
								show-date-complete
								:presence-average="!entry.endTime"
								@click="showModal(entry)"
							/>
						</template>
					</VirtualList>
				</IonList>

				<InfiniteLoader v-if="!iterDone && !showCalendar" @infinite="pollEntries" />
			</template>

			<template v-else>
				<IonList>
					<template v-for="tuple in getGrouped(frontingEntries)" :key="tuple[0]">
						<IonItemDivider sticky>
							<IonLabel>{{ getLabel(tuple[0]) }}</IonLabel>
						</IonItemDivider>
						<FrontingEntryItem
							v-for="entry in tuple[1]"
							:key="entry.uuid"
							:entry="entry"
							button
							:show-date-complete="false"
							:presence-average="tuple[0] !== 'currentlyFronting'"
							@click="showModal(entry)"
						/>
					</template>
				</IonList>
			</template>


			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="showModal()">
					<IonIcon :icon="addMD" />
				</IonFabButton>
			</IonFab>

			<FilterQuerySelect ref="filterQuerySelect" type="frontHistory" @selected="search = $event.query" />
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

	.currently-fronting {
		margin-bottom: 32px;
	}

	ion-datetime {
		margin: 16px;
		--background: rgb(var(--md3-surface-container));
		--background-rgb: var(--md3-surface-container);
		--wheel-fade-background-rgb: var(--md3-surface-container);
	}
</style>