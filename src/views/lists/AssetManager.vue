<script setup lang="ts">
	import { IonBackButton, IonContent, IonSearchbar, IonList, IonIcon, IonPage, IonTitle, IonToolbar, IonFab, IonFabButton, IonButtons, IonButton } from "@ionic/vue";
	import { h, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from "vue";
	import AssetItem from "../../components/asset/AssetItem.vue";
	import { Asset } from "../../lib/db/entities";
	import { getFilteredAssets } from "../../lib/db/tables/assets";
	import { DatabaseEvent, DatabaseEvents } from "../../lib/db/events";
	import { useRoute } from "vue-router";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import { getFilterQueriesIndex } from "../../lib/db/tables/filterQueries.ts";

	import addMD from "@material-symbols/svg-600/rounded/add.svg";
	import moreMD from "@material-symbols/svg-600/rounded/more_vert.svg";

	import VirtualList from "../../components/VirtualList.vue";
	import InfiniteLoader from "../../components/InfiniteLoader.vue";
	import TheresNothingHere from "../../components/TheresNothingHere.vue";
	import CollapsibleHeaderbar from "../../components/CollapsibleHeaderbar.vue";
	import FilterQuerySelect from "../../modals/FilterQuerySelect.vue";
	import FilterQueryEdit from "../../modals/FilterQueryEdit.vue";
	import { addModal, removeModal } from "../../lib/modals.ts";

	const route = useRoute();

	const isStandalone = route.path.startsWith("/lists/");

	const search = ref(route.query.q as string || "");
	watch(route, () => {
		if(route.name && ["AssetManager", "AssetManagerTab"].includes(route.name.toString()) && route.query.q)
			search.value = route.query.q as string;
	}, { immediate: true });

	const assets = shallowRef<Asset[]>();
	const iter = shallowRef<AsyncGenerator<Asset>>();
	const iterDone = ref(false);

	const filterQuerySelect = useTemplateRef("filterQuerySelect");

	watch(search, async () => {
		await resetAssets();
	});

	const listener = (event: Event) => {
		if(["assets"].includes((event as DatabaseEvent).data.table))
			void resetAssets();
	};

	async function resetAssets(){
		assets.value = undefined;
		iterDone.value = false;
		iter.value = getFilteredAssets(search.value);
		await pollAssets();
	}

	async function pollAssets(cb?: () => void){
		if(!iter.value) return;

		let i = 0;
		const _assets: Asset[] = [];
		while(true) {
			const data = await iter.value.next();
			if(data.value) _assets.push(data.value);
			i++;
			if(data.done) iterDone.value = true;
			if(i >= 20 || data.done) break;
		}

		if(!assets.value)
			assets.value = _assets;
		else
			assets.value = [...assets.value, ..._assets];

		if(cb)
			cb();
	}

	async function saveFilterQuery(){
		if(!search.value.length) return;
		const vnode = h(FilterQueryEdit, {
			filterQuery: { name: "", type: "assetManager", query: search.value },
			onDidDismiss: () => removeModal(vnode)
		});

		const modal = await addModal(vnode);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
		await (modal.el as any).present();
	}

	onMounted(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await resetAssets();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});
</script>

<template>
	<IonPage>
		<SpinnerFullscreen v-if="!assets" />
		<IonContent v-else>
			<CollapsibleHeaderbar class="size-large">
				<IonToolbar>
					<IonBackButton
						v-if="isStandalone"
						slot="start"
						default-href="/"
					/>
					<IonTitle>
						{{ $t("assetManager:header") }}
					</IonTitle>
				</IonToolbar>
				<IonToolbar>
					<IonSearchbar
						:animated="true"
						:placeholder="$t('assetManager:searchPlaceholder')"
						show-cancel-button="focus"
						show-clear-button="focus"
						:spellcheck="false"
						:value="search"
						@ion-change="e => search = e.detail.value || ''"
					/>
					<IonButtons slot="end">
						<IonButton v-if="getFilterQueriesIndex().filter(x => x.type === 'assetManager').length" @click="filterQuerySelect?.$el.present()">
							<IonIcon slot="icon-only" :icon="moreMD" />
						</IonButton>
						<IonButton v-if="search.length" @click="saveFilterQuery">
							<IonIcon slot="icon-only" :icon="addMD" />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</CollapsibleHeaderbar>

			<TheresNothingHere v-if="!assets.length" sibling-header />
			<IonList v-else>
				<VirtualList :entries="assets" :min-size="72" :gap="2">
					<template #default="{ entry: asset }">
						<AssetItem
							route-to-edit-page
							show-thumbnail
							show-tags
							:asset
						/>
					</template>
				</VirtualList>
			</IonList>

			<InfiniteLoader v-if="!iterDone" @infinite="pollAssets" />

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton router-link="/edit/asset/">
					<IonIcon :icon="addMD" />
				</IonFabButton>
			</IonFab>

			<FilterQuerySelect ref="filterQuerySelect" type="assetManager" @selected="search = $event.query" />
		</IonContent>
	</IonPage>
</template>