<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonSearchbar, IonFab, IonFabButton, IonIcon, IonButton, IonButtons, IonLabel, IonDatetime, IonItemDivider, useIonRouter, alertController, IonBackButton } from '@ionic/vue';
	import { inject, onBeforeMount, onUnmounted, ref, shallowRef, watch } from 'vue';
	import { useRoute } from 'vue-router';
	import SpinnerFullscreen from '../components/SpinnerFullscreen.vue';
	import JournalPostCard from '../components/JournalPostCard.vue';

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import calendarMD from "@material-symbols/svg-600/outlined/calendar_month.svg";
	import listMD from "@material-symbols/svg-600/outlined/list.svg";
	import addMD from "@material-symbols/svg-600/outlined/add.svg";

	import { JournalPost, JournalPostComplete } from '../lib/db/entities';
	import dayjs from 'dayjs';
	import { DatabaseEvent, DatabaseEvents } from '../lib/db/events';
	import { getJournalPostsDays, getJournalPostsOfDay } from '../lib/db/tables/journalPosts';
	import { appConfig } from '../lib/config';
	import { getFilteredJournalPosts } from '../lib/search';
	import { useTranslation } from 'i18next-vue';

	const route = useRoute();
	const router = useIonRouter();

	const i18next = useTranslation();

	const firstWeekOfDayIsSunday = appConfig.locale.firstWeekOfDayIsSunday;
	const isIOS = inject<boolean>("isIOS");

	const posts = shallowRef<JournalPost[]>();
	const filteredPosts = shallowRef<JournalPostComplete[]>();

	const postsDays = shallowRef<{ date: string, backgroundColor: string; }[]>();

	const isCalendarView = ref(true);
	const date = ref(dayjs().toISOString());

	const search = ref(route.query.q as string || "");

	const listener = async (event: Event) => {
		if (["members", "journalPosts"].includes((event as DatabaseEvent).data.table)) {
			await resetEntries();
			await populateHighlightedDays();
		}
	}

	watch(route, () => {
		search.value = route.query.q as string || "";
	});

	watch([search, posts], async () => {
		filteredPosts.value = await getFilteredJournalPosts(search.value, posts.value);
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

	async function getEntries(_date: Date) {
		const dateEntries = await getJournalPostsOfDay(_date);
		posts.value = dateEntries;
		return;
		}


	async function resetEntries() {
		posts.value = undefined;
		await getEntries(dayjs(date.value).toDate())
	}

	function getGrouped(entries: JournalPostComplete[]) {
		const map = new Map<string, JournalPostComplete[]>();

		for (const entry of entries.sort((a, b) => b.date.getTime() - a.date.getTime())) {
			const key = dayjs(entry.date).startOf('day').toISOString();

			const collection = map.get(key);
			if (!collection)
				map.set(key, [entry]);
			else
				collection.push(entry);
		}

		return [...map.entries()].sort((a, b) => dayjs(b[0]).valueOf() - dayjs(a[0]).valueOf());
	}

	async function populateHighlightedDays() {
		postsDays.value = (await getJournalPostsDays()).map(x => ({
			date: dayjs(x).format("YYYY-MM-DD"),
			backgroundColor: "var(--ion-background-color-step-200)"
		}));
	}

	function prompt(header: string, subHeader: string, message?: string): Promise<boolean> {
		return new Promise(async (resolve) => {
			const alert = await alertController.create({
				header,
				subHeader,
				message,
				buttons: [
					{
						text: i18next.t("other:alerts.cancel"),
						role: "cancel",
						handler: () => resolve(false)
					},
					{
						text: i18next.t("other:alerts.ok"),
						role: "confirm",
						handler: () => resolve(true)
					}
				]
			});

			await alert.present();
		});
	}

	async function openPost(post: JournalPostComplete){
		if(post.isPrivate){
			if(!await prompt(
				i18next.t("journal:private"),
				i18next.t("journal:alertSubheader")
			))
				return;
		}

		if(post.contentWarning?.length){
			if(!await prompt(
				i18next.t("journal:contentWarning"),
				i18next.t("journal:alertSubheader"),
				post.contentWarning
			))
				return;
		}

		router.push(`/journal/edit/?uuid=${post.uuid}`);
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" :text="isIOS ? $t('other:back') : undefined" :icon="!isIOS ? backMD : undefined" />
				<IonTitle>
					{{ $t("journal:header") }}
				</IonTitle>
				<IonButtons slot="secondary">
					<IonButton @click="isCalendarView = !isCalendarView">
						<IonIcon slot="icon-only" :icon="isCalendarView ? listMD : calendarMD" />
					</IonButton>
				</IonButtons>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar :animated="true" :placeholder="$t('journal:searchPlaceholder')" showCancelButton="focus"
					showClearButton="focus" :spellcheck="false" v-model="search" />
			</IonToolbar>
			<div class="container" v-if="isCalendarView">
				<IonDatetime presentation="date" :firstDayOfWeek="firstWeekOfDayIsSunday ? 0 : 1" v-model="date"
					:locale="appConfig.locale.language || 'en'" :highlightedDates="postsDays"
					:datetime="dayjs().format('YYYY-MM-DDTHH:mm:ss')" />
			</div>
		</IonHeader>

		<SpinnerFullscreen v-if="!filteredPosts && !posts" />
		<IonContent v-else>
			<IonList :inset="isIOS">
				<template v-for="tuple in getGrouped(filteredPosts || [])" :key="tuple[0]">
					<IonItemDivider sticky>
						<IonLabel>{{ dayjs(tuple[0]).format("LL") }}</IonLabel>
					</IonItemDivider>
					<JournalPostCard :post v-for="post in tuple[1]" :key="post.uuid" @click="openPost(post)" />
				</template>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton routerLink="/journal/edit/">
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