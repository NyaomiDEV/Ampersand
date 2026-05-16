<script setup lang="ts">
	import { IonContent, IonSearchbar, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonSegment, IonSegmentButton, IonLabel, IonFab, IonFabButton, IonIcon, IonItemSliding, IonItemOptions, IonItemOption, IonItem } from "@ionic/vue";
	import { h, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from "vue";
	import { useRoute } from "vue-router";

	import addMD from "@material-symbols/svg-600/rounded/add.svg";
	import trashMD from "@material-symbols/svg-600/rounded/delete.svg";

	import PeopleMD from "@material-symbols/svg-600/rounded/group.svg";
	import JournalMD from "@material-symbols/svg-600/rounded/book.svg";
	import SystemMD from "@material-symbols/svg-600/rounded/groups.svg";
	import FrontHistoryMD from "@material-symbols/svg-600/rounded/show_chart.svg";
	import MessageBoardMD from "@material-symbols/svg-600/rounded/newsmode.svg";
	import TagMD from "@material-symbols/svg-600/rounded/sell.svg";
	import CustomFieldsMD from "@material-symbols/svg-600/rounded/format_list_bulleted_add.svg";
	import NotesMD from "@material-symbols/svg-600/rounded/note_stack.svg";
	import FolderMD from "@material-symbols/svg-600/rounded/folder_open.svg";

	import type { FilterQuery, FilterQueryType } from "../../lib/db/entities";
	import { DatabaseEvents, DatabaseEvent } from "../../lib/db/events.ts";

	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import { promptOkCancel, toast } from "../../lib/util/misc.ts";
	import { useTranslation } from "i18next-vue";
	import VirtualList from "../../components/VirtualList.vue";
	import InfiniteLoader from "../../components/InfiniteLoader.vue";
	import TheresNothingHere from "../../components/TheresNothingHere.vue";
	import CollapsibleHeaderbar from "../../components/CollapsibleHeaderbar.vue";
	import { deleteFilterQuery, getFilteredFilterQueries } from "../../lib/db/tables/filterQueries.ts";
	import FilterQueryEdit from "../../modals/FilterQueryEdit.vue";
	import { addModal, removeModal } from "../../lib/modals.ts";

	const route = useRoute();

	const isStandalone = route.path.startsWith("/lists/");

	const i18next = useTranslation();

	const list = useTemplateRef("list");

	const search = ref(route.query.q as string || "");
	watch(route, () => {
		if(route.name && ["FilterQueries", "FilterQueriesTab"].includes(route.name.toString()) && route.query.q)
			search.value = route.query.q as string;
	}, { immediate: true });

	const type = ref<FilterQueryType>("members");
	const filterQueries = shallowRef<FilterQuery[]>();
	const iter = shallowRef<AsyncGenerator<FilterQuery>>();
	const iterDone = ref(false);

	watch([search, type], async () => {
		await resetFilterQueries();
	});

	const listener = (event: Event) => {
		if((event as DatabaseEvent).data.table === "filterQueries")
			void resetFilterQueries();
	};

	onMounted(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await resetFilterQueries();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	async function resetFilterQueries(){
		filterQueries.value = undefined;
		iterDone.value = false;
		iter.value = getFilteredFilterQueries(type.value, search.value);
		await pollFilterQueries();
	}

	async function pollFilterQueries(cb?: () => void){
		if(!iter.value) return;

		let i = 0;
		const _filterQueries: FilterQuery[] = [];
		while(true) {
			const data = await iter.value.next();
			if(data.value) _filterQueries.push(data.value);
			i++;
			if(data.done) iterDone.value = true;
			if(i >= 20 || data.done) break;
		}

		if(!filterQueries.value)
			filterQueries.value = _filterQueries;
		else
			filterQueries.value = [...filterQueries.value, ..._filterQueries];

		if(cb)
			cb();
	}

	function closeSlidingItems() {
		const el: globalThis.HTMLIonListElement = list.value?.$el;
		if(!el) return;
		const items = el.querySelectorAll<globalThis.HTMLIonItemSlidingElement>("ion-item-sliding");
		items?.forEach(i => void i.closeOpened());
	}

	async function showModal(clickedFilterQuery?: FilterQuery){
		const vnode = h(FilterQueryEdit, {
			filterQuery: clickedFilterQuery,
			onDidDismiss: () => removeModal(vnode)
		});

		const modal = await addModal(vnode);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
		await (modal.el as any).present();
	}

	async function removeFilterQuery(filterQuery: FilterQuery){
		try{
			if(await promptOkCancel(
				i18next.t("filterQueries:edit.delete.title"),
				undefined,
				i18next.t("filterQueries:edit.delete.confirm")
			)){
				const result = await deleteFilterQuery(filterQuery.uuid);
				if(!result.success) throw new Error(`E: ${result.err as Error}`);
			}
		}catch(e){
			await toast((e as Error).message);
		}
		closeSlidingItems();
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
						{{ $t("filterQueries:header") }}
					</IonTitle>
				</IonToolbar>
				<IonToolbar>
					<IonSearchbar
						:animated="true"
						:placeholder="$t('filterQueries:searchPlaceholder')"
						show-cancel-button="focus"
						show-clear-button="focus"
						:spellcheck="false"
						:value="search"
						@ion-change="e => search = e.detail.value || ''"
					/>
				</IonToolbar>
				<IonToolbar>
					<IonSegment v-model="type" value="members" scrollable>
						<IonSegmentButton value="members">
							<IonIcon :icon="PeopleMD" :aria-label="$t('members:header')" />
						</IonSegmentButton>
						<IonSegmentButton value="journal">
							<IonIcon :icon="JournalMD" :aria-label="$t('journal:header')" />
						</IonSegmentButton>
						<IonSegmentButton value="frontHistory">
							<IonIcon :icon="FrontHistoryMD" :aria-label="$t('frontHistory:header')" />
						</IonSegmentButton>
						<IonSegmentButton value="messageBoard">
							<IonIcon :icon="MessageBoardMD" :aria-label="$t('messageBoard:header')" />
						</IonSegmentButton>
						<IonSegmentButton value="systems">
							<IonIcon :icon="SystemMD" :aria-label="$t('systems:header')" />
						</IonSegmentButton>
						<IonSegmentButton value="tagManagement">
							<IonIcon :icon="TagMD" :aria-label="$t('tagManagement:header')" />
						</IonSegmentButton>
						<IonSegmentButton value="assetManager">
							<IonIcon :icon="FolderMD" :aria-label="$t('assetManager:header')" />
						</IonSegmentButton>
						<IonSegmentButton value="notes">
							<IonIcon :icon="NotesMD" :aria-label="$t('notes:header')" />
						</IonSegmentButton>
						<IonSegmentButton value="customFields">
							<IonIcon :icon="CustomFieldsMD" :aria-label="$t('customFields:header')" />
						</IonSegmentButton>
					</IonSegment>
				</IonToolbar>
			</CollapsibleHeaderbar>
		
			<SpinnerFullscreen v-if="!filterQueries" />
			<template v-else>
				<TheresNothingHere v-if="!filterQueries.length" sibling-header />
				<IonList ref="list">
					<VirtualList :entries="filterQueries" :min-size="56" :gap="2">
						<template #default="{ entry: filterQuery }">
							<IonItemSliding>
								<IonItem
									button
									detail
									@click="showModal(filterQuery)"
								>
									<IonLabel>
										{{ filterQuery.name }}
									</IonLabel>
								</IonItem>
								<IonItemOptions>
									<IonItemOption color="danger" @click="removeFilterQuery(filterQuery)">
										<IonIcon slot="icon-only" :icon="trashMD" />
									</IonItemOption>
								</IonItemOptions>
							</IonItemSliding>
						</template>
					</VirtualList>
				</IonList>

				<InfiniteLoader v-if="!iterDone" @infinite="pollFilterQueries" />

				<IonFab slot="fixed" vertical="bottom" horizontal="end">
					<IonFabButton @click="showModal()">
						<IonIcon :icon="addMD" />
					</IonFabButton>
				</IonFab>
			</template>
		</IonContent>
	</IonPage>
</template>