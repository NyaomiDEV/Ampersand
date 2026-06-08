<script setup lang="ts">
	import { IonContent, IonSearchbar, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonSegment, IonSegmentButton, IonLabel, IonFab, IonFabButton, IonIcon, IonItemSliding, IonItemOptions, IonItemOption, IonItem } from "@ionic/vue";
	import { h, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from "vue";
	import { useRoute } from "vue-router";

	import addMD from "@material-symbols/svg-600/rounded/add.svg";
	import trashMD from "@material-symbols/svg-600/rounded/delete.svg";

	import type { FilterQuery, FilterQueryType } from "../../lib/db/entities";
	import { DatabaseEvents, DatabaseEvent } from "../../lib/db/events.ts";

	import Spinner from "../../components/Spinner.vue";
	import { promptOkCancel, toast } from "../../lib/util/misc.ts";
	import { useTranslation } from "i18next-vue";
	import VirtualList from "../../components/VirtualList.vue";
	import InfiniteLoader from "../../components/InfiniteLoader.vue";
	import TheresNothingHere from "../../components/TheresNothingHere.vue";
	import CollapsibleHeaderbar from "../../components/CollapsibleHeaderbar.vue";
	import { deleteFilterQuery, getFilteredFilterQueries } from "../../lib/db/tables/filterQueries.ts";
	import FilterQueryEdit from "../../modals/FilterQueryEdit.vue";
	import { addModal, removeModal } from "../../lib/modals.ts";
	import { lists } from "../../router/lists.ts";

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

		cb?.();
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
				if(!result.success) throw new Error(`E: ${result.err}`);
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
							<IonIcon :icon="lists.members.icon" :aria-label="$t('members:header')" />
						</IonSegmentButton>
						<IonSegmentButton value="journal">
							<IonIcon :icon="lists.journal.icon" :aria-label="$t('journal:header')" />
						</IonSegmentButton>
						<IonSegmentButton value="frontHistory">
							<IonIcon :icon="lists.frontHistory.icon" :aria-label="$t('frontHistory:header')" />
						</IonSegmentButton>
						<IonSegmentButton value="messageBoard">
							<IonIcon :icon="lists.messageBoard.icon" :aria-label="$t('messageBoard:header')" />
						</IonSegmentButton>
						<IonSegmentButton value="systems">
							<IonIcon :icon="lists.systems.icon" :aria-label="$t('systems:header')" />
						</IonSegmentButton>
						<IonSegmentButton value="tagManagement">
							<IonIcon :icon="lists.tagManagement.icon" :aria-label="$t('tagManagement:header')" />
						</IonSegmentButton>
						<IonSegmentButton value="assetManager">
							<IonIcon :icon="lists.assetManager.icon" :aria-label="$t('assetManager:header')" />
						</IonSegmentButton>
						<IonSegmentButton value="notes">
							<IonIcon :icon="lists.notes.icon" :aria-label="$t('notes:header')" />
						</IonSegmentButton>
						<IonSegmentButton value="customFields">
							<IonIcon :icon="lists.customFields.icon" :aria-label="$t('customFields:header')" />
						</IonSegmentButton>
					</IonSegment>
				</IonToolbar>
			</CollapsibleHeaderbar>
		
			<div v-if="!filterQueries" class="spinner-container">
				<Spinner size="72px" />
			</div>
			<template v-else>
				<TheresNothingHere v-if="!filterQueries.length" sibling-header />
				<IonList ref="list">
					<VirtualList :entries="filterQueries" :min-size="86" :gap="2">
						<template #default="{ entry: filterQuery }">
							<IonItemSliding>
								<IonItem
									button
									detail
									@click="showModal(filterQuery)"
								>
									<IonLabel>
										<h2>{{ filterQuery.name }}</h2>
										<p>{{ filterQuery.query }}</p>
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

<style scoped>
	.spinner-container {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
	}
</style>