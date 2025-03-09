<script setup lang="ts">
	import { IonBackButton, IonContent, IonHeader, IonSearchbar, IonList, IonIcon, IonPage, IonTitle, IonToolbar, IonFab, IonFabButton } from '@ionic/vue';
	import { inject, onBeforeMount, onUnmounted, ref, shallowRef, watch } from 'vue';
	import AssetItem from '../../components/AssetItem.vue';
	import { Asset } from '../../lib/db/entities';
	import { getAssets } from '../../lib/db/tables/assets';
	import { DatabaseEvent, DatabaseEvents } from '../../lib/db/events';
	import { useRoute } from 'vue-router';
	import { getFilteredAssets } from '../../lib/search';
	import SpinnerFullscreen from '../../components/SpinnerFullscreen.vue';

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import addMD from "@material-symbols/svg-600/outlined/add.svg";

	const route = useRoute();

	const isIOS = inject<boolean>("isIOS");

	const search = ref(route.query.q as string || "");
	watch(route, () => {
		search.value = route.query.q as string || "";
	});

	const assets = shallowRef<Asset[]>();
	const filteredAssets = shallowRef<Asset[]>();
	watch([assets, search], () => {
		filteredAssets.value = getFilteredAssets(search.value, assets.value);
	}, { immediate: true });

	const listener = async (event: Event) => {
		if(["assets"].includes((event as DatabaseEvent).data.table)){
			assets.value = await getAssets();
		}
	}

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		assets.value = await getAssets();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" :text="isIOS ? $t('other:back') : undefined" :icon="!isIOS ? backMD : undefined" defaultHref="/options/" />
				<IonTitle>
					{{ $t("assetManager:header") }}
				</IonTitle>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar
					:animated="true"
					:placeholder="$t('assetManager:searchPlaceholder')"
					showCancelButton="focus"
					showClearButton="focus"
					:spellcheck="false"
					v-model="search"
				/>
			</IonToolbar>
		</IonHeader>
		
		<SpinnerFullscreen v-if="!assets" />
		<IonContent v-else>
			<IonList :inset="isIOS">
				<AssetItem routeToEditPage :asset v-for="asset in filteredAssets" :key="asset.uuid" />
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton routerLink="/options/assetManager/edit/">
					<IonIcon :icon="addMD" />
				</IonFabButton>
			</IonFab>

		</IonContent>
	</IonPage>
</template>