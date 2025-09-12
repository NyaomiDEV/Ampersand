<script setup lang="ts">
	import { IonBackButton, IonContent, IonHeader, IonSearchbar, IonList, IonIcon, IonPage, IonTitle, IonToolbar, IonFab, IonFabButton } from "@ionic/vue";
	import { inject, onBeforeMount, onUnmounted, ref, shallowRef, watch } from "vue";
	import AssetItem from "../../components/AssetItem.vue";
	import { Asset } from "../../lib/db/entities";
	import { getFilteredAssets } from "../../lib/db/tables/assets";
	import { DatabaseEvent, DatabaseEvents } from "../../lib/db/events";
	import { useRoute } from "vue-router";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import addMD from "@material-symbols/svg-600/outlined/add.svg";

	const route = useRoute();

	const isIOS = inject<boolean>("isIOS");

	const search = ref(route.query.q as string || "");
	watch(route, () => {
		if(route.query.q)
			search.value = route.query.q as string;
	});

	const assets = shallowRef<Asset[]>();
	watch(search, async () => {
		assets.value = await Array.fromAsync(getFilteredAssets(search.value));
	});

	const listener = (event: Event) => {
		if(["assets"].includes((event as DatabaseEvent).data.table))
			void Array.fromAsync(getFilteredAssets(search.value)).then(res => assets.value = res);
	};

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		assets.value = await Array.fromAsync(getFilteredAssets(search.value));
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
					:text="isIOS ? $t('other:back') : undefined"
					:icon="!isIOS ? backMD : undefined"
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
					@ion-change="e => search = e.detail.value || ''"
				/>
			</IonToolbar>
		</IonHeader>
		
		<SpinnerFullscreen v-if="!assets" />
		<IonContent v-else>
			<IonList :inset="isIOS">
				<AssetItem
					v-for="asset in assets"
					:key="asset.uuid"
					route-to-edit-page
					:asset
				/>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton router-link="/options/assetManager/edit/">
					<IonIcon :icon="addMD" />
				</IonFabButton>
			</IonFab>

		</IonContent>
	</IonPage>
</template>