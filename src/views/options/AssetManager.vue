<script setup lang="ts">
	import { IonBackButton, IonContent, IonHeader, IonSearchbar, IonList, IonIcon, IonPage, IonTitle, IonToolbar, IonFab, IonFabButton } from '@ionic/vue';
	import { inject, onBeforeMount, onUnmounted, shallowRef } from 'vue';
	import AssetItem from '../../components/AssetItem.vue';
	import { Asset } from '../../lib/db/entities';
	import { getAssets } from '../../lib/db/tables/assets';
	import { DatabaseEvent, DatabaseEvents } from '../../lib/db/events';

	import {
		addOutline as addIOS
	} from "ionicons/icons";

	import addMD from "@material-symbols/svg-600/outlined/add.svg";


	const isIOS = inject<boolean>("isIOS");

	const assets = shallowRef<Asset[]>();

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
				/>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<IonList :inset="isIOS">
				<AssetItem :asset v-for="asset in assets" />
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton routerLink="/options/assetManager/edit">
					<IonIcon :ios="addIOS" :md="addMD" />
				</IonFabButton>
			</IonFab>

		</IonContent>
	</IonPage>
</template>