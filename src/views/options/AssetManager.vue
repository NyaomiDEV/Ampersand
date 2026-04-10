<script setup lang="ts">
	import { IonBackButton, IonContent, IonHeader, IonSearchbar, IonList, IonIcon, IonPage, IonTitle, IonToolbar, IonFab, IonFabButton } from "@ionic/vue";
	import { onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
	import AssetItem from "../../components/asset/AssetItem.vue";
	import { Asset } from "../../lib/db/entities";
	import { getFilteredAssets } from "../../lib/db/tables/assets";
	import { DatabaseEvent, DatabaseEvents } from "../../lib/db/events";
	import { useRoute } from "vue-router";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";

	import addMD from "@material-symbols/svg-600/outlined/add.svg";
	import VirtualList from "../../components/VirtualList.vue";
	import InfiniteLoader from "../../components/InfiniteLoader.vue";

	const route = useRoute();

	const search = ref(route.query.q as string || "");
	watch(route, () => {
		if(route.name === "AssetManager" && route.query.q)
			search.value = route.query.q as string;
	});

	const assets = shallowRef<Asset[]>();
	const iter = shallowRef<AsyncGenerator<Asset>>();
	const iterDone = ref(false);

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
		<IonHeader>
			<IonToolbar>
				<IonBackButton
					slot="start"
					default-href="/options/"
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
			</IonToolbar>
		</IonHeader>
		
		<SpinnerFullscreen v-if="!assets" />
		<IonContent v-else>
			<IonList>
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
				<IonFabButton router-link="/options/assetManager/edit/">
					<IonIcon :icon="addMD" />
				</IonFabButton>
			</IonFab>

		</IonContent>
	</IonPage>
</template>