<script setup lang="ts">
	import { IonContent, IonList, IonPage, IonTitle, IonToolbar, IonSearchbar, IonFab, IonFabButton, IonIcon, useIonRouter, IonBackButton, IonItemSliding, IonItemOptions, IonItemOption, IonButtons, IonButton } from "@ionic/vue";
	import { h, onBeforeMount, onUnmounted, ref, shallowRef, useTemplateRef, watch } from "vue";
	import { useRoute } from "vue-router";
	import CollapsibleHeaderbar from "../../components/CollapsibleHeaderbar.vue";
	import Spinner from "../../components/Spinner.vue";
	import JournalPostItem from "../../components/journal/JournalPostItem.vue";

	import addMD from "@material-symbols/svg-600/rounded/add.svg";
	import copyMD from "@material-symbols/svg-600/rounded/content_copy.svg";
	import moreMD from "@material-symbols/svg-600/rounded/more_vert.svg";

	import { JournalPost, JournalPostComplete } from "../../lib/db/entities";
	import dayjs from "dayjs";
	import { DatabaseEvent, DatabaseEvents } from "../../lib/db/events";
	import { getJournalPostsDays, getJournalPostsOfDay, toJournalPostComplete } from "../../lib/db/tables/journalPosts";
	import { useTranslation } from "i18next-vue";
	import { promptOkCancel, toast } from "../../lib/util/misc";
	import DatetimeUtc, { DatetimeParts } from "../../components/DatetimeUtc.vue";
	import TheresNothingHere from "../../components/TheresNothingHere.vue";
	import FilterQuerySelect from "../../modals/FilterQuerySelect.vue";
	import FilterQueryEdit from "../../modals/FilterQueryEdit.vue";
	import { getFilterQueriesIndex } from "../../lib/db/tables/filterQueries.ts";
	import { addModal, removeModal } from "../../lib/modals.ts";
	import VirtualList from "../../components/VirtualList.vue";
	import InfiniteLoader from "../../components/InfiniteLoader.vue";

	const route = useRoute();
	const router = useIonRouter();

	const isStandalone = route.path.startsWith("/lists/");

	const i18next = useTranslation();

	const posts = shallowRef<JournalPostComplete[]>();
	const iter = shallowRef<AsyncGenerator<JournalPost>>();
	const iterDone = ref(false);

	const postsDays = shallowRef<{ date: string, backgroundColor: string; }[]>();

	const date = ref(new Date());

	const search = ref(route.query.q as string || "");

	const parts = ref<DatetimeParts>();

	const list = useTemplateRef("list");
	const filterQuerySelect = useTemplateRef("filterQuerySelect");

	const listener = (event: Event) => {
		if (["members", "journalPosts"].includes((event as DatabaseEvent).data.table))
			void resetPosts().then(() => populateHighlightedDays(parts.value));
	};

	watch(route, () => {
		if(route.name && ["Journal", "JournalTab"].includes(route.name.toString()) && route.query.q)
			search.value = route.query.q as string;
	}, { immediate: true });

	watch([search, parts], async () => {
		await populateHighlightedDays(parts.value);
	}, { immediate: true });

	watch([date, search], async () => {
		await resetPosts();
	}, { immediate: true });

	onBeforeMount(() => {
		DatabaseEvents.addEventListener("updated", listener);
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	async function resetPosts() {
		posts.value = undefined;
		iterDone.value = false;
		iter.value = getJournalPostsOfDay(date.value, true, search.value);
		await pollPosts();
	}

	async function pollPosts(cb?: () => void){
		if(!iter.value) return;

		let i = 0;
		const _posts: JournalPost[] = [];
		while(true) {
			const data = await iter.value.next();
			if(data.value) _posts.push(data.value);
			i++;
			if(data.done) iterDone.value = true;
			if(i >= 20 || data.done) break;
		}

		if(!posts.value)
			posts.value = await toJournalPostComplete(_posts);
		else
			posts.value = [...posts.value, ...await toJournalPostComplete(_posts)];

		if(cb)
			cb();
	}

	async function populateHighlightedDays(parts?: DatetimeParts) {
		let startDay = dayjs().startOf("month").startOf("day").toDate();
		let endDay = dayjs().endOf("month").endOf("day").toDate();
		if(parts){
			startDay = dayjs().year(parts.year).month(parts.month - 1).startOf("month").startOf("day").toDate();
			endDay = dayjs().year(parts.year).month(parts.month - 1).endOf("month").endOf("day").toDate();
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

		router.push(`/edit/journal/?uuid=${post.uuid}`);
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

	async function saveFilterQuery(){
		if(!search.value.length) return;
		const vnode = h(FilterQueryEdit, {
			filterQuery: { name: "", type: "journal", query: search.value },
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
					<IonButtons slot="end">
						<IonButton v-if="getFilterQueriesIndex().filter(x => x.type === 'journal').length" @click="filterQuerySelect?.$el.present()">
							<IonIcon slot="icon-only" :icon="moreMD" />
						</IonButton>
						<IonButton v-if="search.length" @click="saveFilterQuery">
							<IonIcon slot="icon-only" :icon="addMD" />
						</IonButton>
					</IonButtons>
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
			<template v-else>
				<TheresNothingHere v-if="!posts.length" compress-vertical />
				<IonList v-else ref="list">
					<VirtualList :entries="posts" :gap="2" :min-size="116">
						<template #default="{ entry: post }">
							<IonItemSliding>
								<JournalPostItem
									show-tags
									:post
									show-date-in-date-time
									show-effects
									@click="openPost(post)"
								/>
								<IonItemOptions>
									<IonItemOption color="tertiary" @click="copyID(post)">
										<IonIcon slot="icon-only" :icon="copyMD" />
									</IonItemOption>
								</IonItemOptions>
							</IonItemSliding>
						</template>
					</VirtualList>
				</IonList>

				<InfiniteLoader v-if="!iterDone" @infinite="pollPosts" />
			</template>

			<IonFab
				slot="fixed"
				vertical="bottom"
				horizontal="end"
			>
				<IonFabButton :router-link="`/edit/journal/?date=${dayjs(date).toISOString()}`">
					<IonIcon :icon="addMD" />
				</IonFabButton>
			</IonFab>

			<FilterQuerySelect ref="filterQuerySelect" type="journal" @selected="search = $event.query" />
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