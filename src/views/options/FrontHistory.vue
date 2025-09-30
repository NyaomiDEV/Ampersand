<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonLabel, IonToolbar, IonBackButton, IonItem, IonItemDivider, IonDatetime, IonIcon, IonSearchbar, IonFabButton, IonFab } from "@ionic/vue";
	import { h, onBeforeMount, onUnmounted, ref, shallowRef, watch } from "vue";
	import MemberAvatar from "../../components/member/MemberAvatar.vue";
	import FrontingEntryLabel from "../../components/frontingEntry/FrontingEntryLabel.vue";
	import type { FrontingEntryComplete } from "../../lib/db/entities.d.ts";
	import { getFrontingEntriesOfDay, getFrontingEntriesDays } from "../../lib/db/tables/frontingEntries";
	import Spinner from "../../components/Spinner.vue";
	import FrontingEntryEdit from "../../modals/FrontingEntryEdit.vue";
	import dayjs from "dayjs";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import addMD from "@material-symbols/svg-600/outlined/add.svg";
	import commentMD from "@material-symbols/svg-600/outlined/comment.svg";

	import { appConfig } from "../../lib/config";
	import { DatabaseEvents, DatabaseEvent } from "../../lib/db/events";
	import { addModal, removeModal } from "../../lib/modals.ts";
	import { useRoute } from "vue-router";
	import { useTranslation } from "i18next-vue";

	const route = useRoute();
	const i18next = useTranslation();

	const firstWeekOfDayIsSunday = appConfig.locale.firstWeekOfDayIsSunday;

	const search = ref(route.query.q as string || "");

	const frontingEntries = shallowRef<FrontingEntryComplete[]>();

	const frontingEntriesDays = shallowRef<{date: string, backgroundColor: string}[]>();

	const date = ref(dayjs().toISOString());

	const listener = (event: Event) => {
		if(["frontingEntries", "members"].includes((event as DatabaseEvent).data.table))
			void resetEntries().then(() => populateHighlightedDays());
	};

	watch(route, () => {
		if(route.query.q)
			search.value = route.query.q as string;
	});

	watch(search, () => {
		populateHighlightedDays();
	});

	watch([date, search], async () => {
		await resetEntries();
	}, { immediate: true });

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await resetEntries();
		populateHighlightedDays();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	async function getEntries(){
		frontingEntries.value = await Array.fromAsync(getFrontingEntriesOfDay(dayjs(date.value).toDate(), search.value));
	}

	async function resetEntries(){
		frontingEntries.value = undefined;
		await getEntries();
	}

	function getGrouped(entries: FrontingEntryComplete[]){
		const map = new Map<string, FrontingEntryComplete[]>();

		for(const entry of entries.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())){
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

	function populateHighlightedDays() {
		const days = getFrontingEntriesDays(search.value);

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
					{{ $t("frontHistory:header") }}
				</IonTitle>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar
					:animated="true"
					:placeholder="$t('frontHistory:searchPlaceholder')"
					show-cancel-button="focus"
					show-clear-button="focus"
					:spellcheck="false"
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
				:highlighted-dates="frontingEntriesDays"
				:datetime="dayjs().format('YYYY-MM-DDTHH:mm:ss')"
			/>
			<div v-if="frontingEntries === undefined" class="spinner-container">
				<Spinner size="72px" />
			</div>
			<IonList v-else>
				<template v-for="tuple in getGrouped(frontingEntries)" :key="tuple[0]">
					<IonItemDivider sticky>
						<IonLabel>{{ getLabel(tuple[0]) }}</IonLabel>
					</IonItemDivider>
					<IonItem
						v-for="entry in tuple[1]"
						:key="entry.uuid"
						button
						:class="{'main-fronter': entry.isMainFronter, 'influencing': !!entry.influencing}"
						@click="showModal(entry)"
					>
						<MemberAvatar slot="start" :member="entry.member" />
						<IonIcon v-if="entry.comment?.length" slot="end" :icon="commentMD" />
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

	ion-item.main-fronter {
		--background: var(--ion-background-color-step-150);
	}

	ion-item.influencing {
		opacity: .5;
	}
</style>