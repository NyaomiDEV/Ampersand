<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonSearchbar, IonFab, IonFabButton, IonIcon, IonLabel, IonDatetime, IonItemDivider, useIonRouter, alertController, IonBackButton } from '@ionic/vue';
	import { inject, onBeforeMount, onUnmounted, ref, shallowRef, watch } from 'vue';
	import { useRoute } from 'vue-router';
	import Spinner from '../components/Spinner.vue';
	import JournalPostCard from '../components/JournalPostCard.vue';

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import addMD from "@material-symbols/svg-600/outlined/add.svg";

	import { JournalPostComplete } from '../lib/db/entities';
	import dayjs from 'dayjs';
	import { DatabaseEvent, DatabaseEvents } from '../lib/db/events';
	import { getJournalPostsDays, getJournalPostsOfDay } from '../lib/db/tables/journalPosts';
	import { appConfig } from '../lib/config';
	import { useTranslation } from 'i18next-vue';

	const route = useRoute();
	const router = useIonRouter();

	const i18next = useTranslation();

	const firstWeekOfDayIsSunday = appConfig.locale.firstWeekOfDayIsSunday;
	const isIOS = inject<boolean>("isIOS");

	const posts = shallowRef<JournalPostComplete[]>();

	const postsDays = shallowRef<{ date: string, backgroundColor: string; }[]>();

	const date = ref(dayjs().toISOString());

	const search = ref(route.query.q as string || "");

	const listener = async (event: Event) => {
		if (["members", "journalPosts"].includes((event as DatabaseEvent).data.table)) {
			await resetEntries();
			await populateHighlightedDays();
		}
	}

	watch(route, () => {
		if(route.query.q)
			search.value = route.query.q as string;
	});

	watch(search, async () => {
		await populateHighlightedDays();
	});

	watch([date, search], async () => {
		await resetEntries();
	}, { immediate: true });

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await resetEntries();
		await populateHighlightedDays();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	async function getEntries(_date: Date) {
		posts.value = await Array.fromAsync(getJournalPostsOfDay(_date, true, search.value));
	}

	async function resetEntries() {
		posts.value = undefined;
		await getEntries(dayjs(date.value).toDate())
	}

	function getGrouped(entries: JournalPostComplete[]) {
		const map = new Map<string, JournalPostComplete[]>();

		for(const entry of entries.filter(x => x.isPinned).sort((a, b) => b.date.getTime() - a.date.getTime())){
			const collection = map.get("pinnedPosts");
			if(!collection)
				map.set("pinnedPosts", [entry])
			else
				collection.push(entry)
		}

		for (const entry of entries.filter(x => !x.isPinned).sort((a, b) => b.date.getTime() - a.date.getTime())) {
			const key = dayjs(entry.date).startOf('day').toISOString();

			const collection = map.get(key);
			if (!collection)
				map.set(key, [entry]);
			else
				collection.push(entry);
		}

		return [...map.entries()].sort((a, b) => a[0] === "pinnedPosts" ? -1 : dayjs(b[0]).valueOf() - dayjs(a[0]).valueOf());
	}

	async function populateHighlightedDays() {
		const days = await getJournalPostsDays(search.value);

		postsDays.value = Array.from(days.entries()).map(([date, occurrences]) => {
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
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar :animated="true" :placeholder="$t('journal:searchPlaceholder')" showCancelButton="focus"
					showClearButton="focus" :spellcheck="false" v-model="search" />
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonDatetime presentation="date" :firstDayOfWeek="firstWeekOfDayIsSunday ? 0 : 1" 
			    v-model="date" :locale="appConfig.locale.language || 'en'" :highlightedDates="postsDays"
				:datetime="dayjs().format('YYYY-MM-DDTHH:mm:ss')" />
			<div class="spinner-container" v-if="posts === undefined">
				<Spinner size="72px" />
			</div>
			<IonList :inset="isIOS" v-else>
				<template v-for="tuple in getGrouped(posts)" :key="tuple[0]">
					<IonItemDivider sticky>
						<IonLabel>{{
							tuple[0] === "pinnedPosts"
							? $t("journal:pinnedPosts")
							: dayjs(tuple[0]).format("LL")
							}}</IonLabel>
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