<script setup lang="ts">
	import { IonBackButton, IonContent, IonHeader, IonSearchbar, IonList, IonIcon, IonPage, IonTitle, IonToolbar, IonFab, IonFabButton } from '@ionic/vue';
	import { inject, onBeforeMount, onUnmounted, ref, shallowRef, watch } from 'vue';
	import AssetItem from '../../components/AssetItem.vue';
	import { Asset } from '../../lib/db/entities';
	import { getAssets } from '../../lib/db/tables/assets';
	import { DatabaseEvent, DatabaseEvents } from '../../lib/db/events';
	import { useRoute } from 'vue-router';
	import { getFilteredAssets } from '../../lib/search';

	import {
		addOutline as addIOS
	} from "ionicons/icons";

	import addMD from "@material-symbols/svg-600/outlined/add.svg";

	const route = useRoute();

	const isIOS = inject<boolean>("isIOS");

	const search = ref(route.query.q as string || "");
	watch(route, () => {
		search.value = route.query.q as string || "";
	});

	const assets = shallowRef<Asset[]>();
	const filteredAssets = getFilteredAssets(search, assets);

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
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>
					{{ $t("options:assetManager.header") }}
				</IonTitle>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar
					:animated="true"
					:placeholder="$t('options:assetManager.searchPlaceholder')"
					showCancelButton="focus"
					showClearButton="focus"
					:spellcheck="false"
					v-model="search"
				/>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<IonList :inset="isIOS">
				<AssetItem :asset v-for="asset in filteredAssets" />
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton routerLink="/options/assetManager/edit/">
					<IonIcon :ios="addIOS" :md="addMD" />
				</IonFabButton>
			</IonFab>

		</IonContent>
	</IonPage>
</template>