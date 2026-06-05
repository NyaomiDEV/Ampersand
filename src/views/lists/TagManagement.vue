<script setup lang="ts">
	import { IonContent, IonSearchbar, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonSegment, IonSegmentButton, IonLabel, IonFab, IonFabButton, IonIcon, IonItemSliding, IonItemOptions, IonItemOption, IonButtons, IonButton } from "@ionic/vue";
	import { h, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from "vue";
	import { useRoute } from "vue-router";
	import { getFilterQueriesIndex } from "../../lib/db/tables/filterQueries.ts";

	import addMD from "@material-symbols/svg-600/rounded/add.svg";
	import copyMD from "@material-symbols/svg-600/rounded/content_copy.svg";
	import trashMD from "@material-symbols/svg-600/rounded/delete.svg";
	import moreMD from "@material-symbols/svg-600/rounded/more_vert.svg";

	import { getFilteredTags, removeTag } from "../../lib/db/tables/tags";
	import type { Tag } from "../../lib/db/entities.d.ts";
	import { DatabaseEvents, DatabaseEvent } from "../../lib/db/events";

	import Spinner from "../../components/Spinner.vue";
	import TagItem from "../../components/tag/TagItem.vue";
	import { promptOkCancel, toast } from "../../lib/util/misc.ts";
	import { useTranslation } from "i18next-vue";
	import VirtualList from "../../components/VirtualList.vue";
	import InfiniteLoader from "../../components/InfiniteLoader.vue";
	import TheresNothingHere from "../../components/TheresNothingHere.vue";
	import CollapsibleHeaderbar from "../../components/CollapsibleHeaderbar.vue";
	import FilterQuerySelect from "../../modals/FilterQuerySelect.vue";
	import FilterQueryEdit from "../../modals/FilterQueryEdit.vue";
	import { addModal, removeModal } from "../../lib/modals.ts";
	import Loading from "../../modals/Loading.vue";

	const route = useRoute();

	const isStandalone = route.path.startsWith("/lists/");

	const i18next = useTranslation();

	const list = useTemplateRef("list");
	const filterQuerySelect = useTemplateRef("filterQuerySelect");
	const loadingModal = useTemplateRef("loadingModal");

	const search = ref(route.query.q as string || "");
	watch(route, () => {
		if(route.name && ["TagManagement", "TagManagementTab"].includes(route.name.toString()) && route.query.q)
			search.value = route.query.q as string;
	}, { immediate: true });

	const type = ref<Tag["type"]>("member");
	const tags = shallowRef<Tag[]>();
	const iter = shallowRef<AsyncGenerator<Tag>>();
	const iterDone = ref(false);

	watch([search, type], async () => {
		await resetTags();
	});

	const listener = (event: Event) => {
		if((event as DatabaseEvent).data.table === "tags")
			void resetTags();
	};

	onMounted(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await resetTags();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	async function resetTags(){
		tags.value = undefined;
		iterDone.value = false;
		iter.value = getFilteredTags(type.value, search.value);
		await pollTags();
	}

	async function pollTags(cb?: () => void){
		if(!iter.value) return;

		let i = 0;
		const _tags: Tag[] = [];
		while(true) {
			const data = await iter.value.next();
			if(data.value) _tags.push(data.value);
			i++;
			if(data.done) iterDone.value = true;
			if(i >= 20 || data.done) break;
		}

		if(!tags.value)
			tags.value = _tags;
		else
			tags.value = [...tags.value, ..._tags];

		cb?.();
	}

	function closeSlidingItems() {
		const el: globalThis.HTMLIonListElement = list.value?.$el;
		if(!el) return;
		const items = el.querySelectorAll<globalThis.HTMLIonItemSlidingElement>("ion-item-sliding");
		items?.forEach(i => void i.closeOpened());
	}

	async function deleteTag(tag: Tag){
		try{
			if(await promptOkCancel(
				i18next.t("tagManagement:edit.delete.title"),
				undefined,
				i18next.t("tagManagement:edit.delete.confirm")
			)){
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				await loadingModal.value?.$el.present();

				const result = await removeTag(tag.uuid);
				if(!result.success) throw new Error(`E: ${result.err as Error}`);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				await loadingModal.value?.$el.dismiss();
			}
		}catch(e){
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.dismiss();

			await toast((e as Error).message);
		}
		closeSlidingItems();
	}

	async function copyID(tag: Tag){
		try{
			await window.navigator.clipboard.writeText(`@<t:${tag.uuid}>`);
			await toast(i18next.t("tagManagement:edit.tagIDCopiedToClipboard"));
			closeSlidingItems();
		}catch(_e){
			return;
		}
	}

	async function saveFilterQuery(){
		if(!search.value.length) return;
		const vnode = h(FilterQueryEdit, {
			filterQuery: { name: "", type: "tagManagement", query: search.value },
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
						{{ $t("tagManagement:header") }}
					</IonTitle>
				</IonToolbar>
				<IonToolbar>
					<IonSearchbar
						:animated="true"
						:placeholder="$t('tagManagement:searchPlaceholder')"
						show-cancel-button="focus"
						show-clear-button="focus"
						:spellcheck="false"
						:value="search"
						@ion-change="e => search = e.detail.value || ''"
					/>
					<IonButtons slot="end">
						<IonButton v-if="getFilterQueriesIndex().filter(x => x.type === 'tagManagement').length" @click="filterQuerySelect?.$el.present()">
							<IonIcon slot="icon-only" :icon="moreMD" />
						</IonButton>
						<IonButton v-if="search.length" @click="saveFilterQuery">
							<IonIcon slot="icon-only" :icon="addMD" />
						</IonButton>
					</IonButtons>
				</IonToolbar>
				<IonToolbar>
					<IonSegment v-model="type" value="member" scrollable>
						<IonSegmentButton value="member">
							<IonLabel>{{ $t("tagManagement:selector.member") }}</IonLabel>
						</IonSegmentButton>
						<IonSegmentButton value="journal">
							<IonLabel>{{ $t("tagManagement:selector.journal") }}</IonLabel>
						</IonSegmentButton>
						<IonSegmentButton value="asset">
							<IonLabel>{{ $t("tagManagement:selector.asset") }}</IonLabel>
						</IonSegmentButton>
					</IonSegment>
				</IonToolbar>
			</CollapsibleHeaderbar>

			<div v-if="!tags" class="spinner-container">
				<Spinner size="72px" />
			</div>
			<template v-else>
				<TheresNothingHere v-if="!tags.length" sibling-header />
				<IonList ref="list">
					<VirtualList :entries="tags" :min-size="56" :gap="2">
						<template #default="{ entry: tag }">
							<IonItemSliding>
								<TagItem
									:tag
									button
									show-effects
									show-icons
									:router-link="`/edit/tags?uuid=${tag.uuid}`"
								/>
								<IonItemOptions>
									<IonItemOption color="danger" @click="deleteTag(tag)">
										<IonIcon slot="icon-only" :icon="trashMD" />
									</IonItemOption>
									<IonItemOption color="tertiary" @click="copyID(tag)">
										<IonIcon slot="icon-only" :icon="copyMD" />
									</IonItemOption>
								</IonItemOptions>
							</IonItemSliding>
						</template>
					</VirtualList>
				</IonList>

				<InfiniteLoader v-if="!iterDone" @infinite="pollTags" />

				<IonFab slot="fixed" vertical="bottom" horizontal="end">
					<IonFabButton router-link="/edit/tags">
						<IonIcon :icon="addMD" />
					</IonFabButton>
				</IonFab>
			</template>

			<FilterQuerySelect ref="filterQuerySelect" type="tagManagement" @selected="search = $event.query" />

			<Loading ref="loadingModal" />
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