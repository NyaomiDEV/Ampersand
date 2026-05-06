<script setup lang="ts">
	import { IonContent, IonList, IonPage, IonTitle, IonToolbar, IonSearchbar, IonFab, IonFabButton, IonIcon, IonLabel, IonItemDivider, useIonRouter, IonBackButton, IonItemSliding, IonItemOptions, IonItemOption } from "@ionic/vue";
	import { onBeforeMount, onUnmounted, ref, shallowRef, useTemplateRef, watch } from "vue";
	import { useRoute } from "vue-router";
	import CollapsibleHeaderbar from "../components/CollapsibleHeaderbar.vue";
	import Spinner from "../components/Spinner.vue";
	import JournalPostItem from "../components/journal/JournalPostItem.vue";

	import addMD from "@material-symbols/svg-600/outlined/add.svg";
	import copyMD from "@material-symbols/svg-600/outlined/content_copy.svg";

	import { JournalPostComplete } from "../lib/db/entities";
	import dayjs from "dayjs";
	import { DatabaseEvent, DatabaseEvents } from "../lib/db/events";
	import { getJournalPostsDays, getJournalPostsOfDay } from "../lib/db/tables/journalPosts";
	import { useTranslation } from "i18next-vue";
	import { promptOkCancel, toast } from "../lib/util/misc";
	import DatetimeUtc, { DatetimeParts } from "../components/DatetimeUtc.vue";
	import TheresNothingHere from "../components/TheresNothingHere.vue";

	const isStandalone = ref(false);

	const route = useRoute();
	const router = useIonRouter();

	const i18next = useTranslation();

	const posts = shallowRef<JournalPostComplete[]>();

	const postsDays = shallowRef<{ date: string, backgroundColor: string; }[]>();

	const date = ref(new Date());

	const search = ref(route.query.q as string || "");

	const parts = ref<DatetimeParts>();

	const list = useTemplateRef("list");

	const listener = (event: Event) => {
		if (["members", "journalPosts"].includes((event as DatabaseEvent).data.table))
			void resetEntries().then(() => populateHighlightedDays(parts.value));
	};

	watch(route, () => {
		if(route.name?.toString().endsWith("Journal") && route.query.q)
			search.value = route.query.q as string;

		if(route.path.startsWith("/s/")) isStandalone.value = true;
		else isStandalone.value = false;
	}, { immediate: true });

	watch([search, parts], async () => {
		await populateHighlightedDays(parts.value);
	});

	watch([date, search], async () => {
		await resetEntries();
	}, { immediate: true });

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await resetEntries();
		await populateHighlightedDays(parts.value);
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	async function getEntries(_date: Date) {
		posts.value = await Array.fromAsync(getJournalPostsOfDay(_date, true, search.value));
	}

	async function resetEntries() {
		posts.value = undefined;
		await getEntries(date.value);
	}

	function getGrouped(entries: JournalPostComplete[]) {
		const map = new Map<string, JournalPostComplete[]>();

		for(const entry of entries.filter(x => x.isPinned)){
			const collection = map.get("pinnedPosts");
			if(!collection)
				map.set("pinnedPosts", [entry]);
			else
				collection.push(entry);
		}

		for (const entry of entries.filter(x => !x.isPinned)) {
			const key = dayjs(entry.date).startOf("day").toISOString();

			const collection = map.get(key);
			if (!collection)
				map.set(key, [entry]);
			else
				collection.push(entry);
		}

		return [...map.entries()].sort((a, b) => a[0] === "pinnedPosts" ? -1 : dayjs(b[0]).valueOf() - dayjs(a[0]).valueOf());
	}

	async function populateHighlightedDays(parts?: DatetimeParts) {
		let startDay = dayjs().startOf("month").startOf("day").toDate();
		let endDay = dayjs().endOf("month").startOf("day").toDate();
		if(parts){
			startDay = dayjs().year(parts.year).month(parts.month - 1).startOf("month").startOf("day").toDate();
			endDay = dayjs().year(parts.year).month(parts.month - 1).endOf("month").startOf("day").toDate();
		}

		const days = await getJournalPostsDays(search.value, startDay, endDay);

		postsDays.value = Array.from(days.entries()).map(([date, occurrences]) => {
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

	async function openPost(post: JournalPostComplete){
		if(post.isPrivate){
			if(!await promptOkCancel(
				i18next.t("journal:private"),
				undefined,
				i18next.t("journal:alertSubheader")
			))
				return;
		}

		if(post.contentWarning?.length){
			if(!await promptOkCancel(
				i18next.t("journal:contentWarning"),
				i18next.t("journal:alertSubheader"),
				post.contentWarning
			))
				return;
		}

		router.push(`/journal/edit/?uuid=${post.uuid}`);
	}

	function closeSlidingItems() {
		const el: globalThis.HTMLIonListElement = list.value?.$el;
		if(!el) return;
		const items = el.querySelectorAll<globalThis.HTMLIonItemSlidingElement>("ion-item-sliding");
		items?.forEach(i => void i.closeOpened());
	}

	async function copyID(post: JournalPostComplete){
		try{
			await window.navigator.clipboard.writeText(`@<j:${post.uuid}>`);
			await toast(i18next.t("journal:edit.postIDcopiedToClipboard"));
			closeSlidingItems();
		}catch(_e){
			return;
		}
	}
</script>

<template>
	<IonPage>
		<IonContent :scroll-events="true">
			<CollapsibleHeaderbar class="size-large">
				<IonToolbar>
					<IonBackButton
						v-if="route.name === 'StandaloneJournal'"
						slot="start"
						default-href="/"
					/>
					<IonTitle>
						{{ $t("journal:header") }}
					</IonTitle>
				</IonToolbar>
				<IonToolbar>
					<IonSearchbar
						:animated="true"
						:placeholder="$t('journal:searchPlaceholder')"
						show-cancel-button="focus"
						show-clear-button="focus"
						:spellcheck="false"
						:value="search"
						@ion-change="e => search = e.detail.value || ''"
					/>
				</IonToolbar>
			</CollapsibleHeaderbar>
			<DatetimeUtc
				v-model="date"
				presentation="date"
				:highlighted-dates="postsDays"
				@parts="parts = $event"
			/>
			<div v-if="posts === undefined" class="spinner-container">
				<Spinner size="72px" />
			</div>
			<TheresNothingHere v-else-if="!posts.length" compress-vertical />
			<IonList v-else ref="list">
				<template v-for="tuple in getGrouped(posts)" :key="tuple[0]">
					<IonItemDivider sticky>
						<IonLabel>
							{{
								tuple[0] === "pinnedPosts"
									? $t("journal:pinnedPosts")
									: dayjs(tuple[0]).format("LL")
							}}
						</IonLabel>
					</IonItemDivider>
					<IonItemSliding
						v-for="post in tuple[1]"
						:key="post.uuid"
					>
						<JournalPostItem
							show-tags
							:post
							:show-date-in-date-time="tuple[0] === 'pinnedPosts'"
							@click="openPost(post)"
						/>
						<IonItemOptions>
							<IonItemOption color="tertiary" @click="copyID(post)">
								<IonIcon slot="icon-only" :icon="copyMD" />
							</IonItemOption>
						</IonItemOptions>
					</IonItemSliding>
				</template>
			</IonList>

			<IonFab
				v-if="!isStandalone"
				slot="fixed"
				vertical="bottom"
				horizontal="end"
			>
				<IonFabButton :router-link="`/journal/edit/?date=${dayjs(date).toISOString()}`">
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
		margin: 16px;
		--background: rgb(var(--md3-surface-container));
		--background-rgb: var(--md3-surface-container);
		--wheel-fade-background-rgb: var(--md3-surface-container);
	}
</style>