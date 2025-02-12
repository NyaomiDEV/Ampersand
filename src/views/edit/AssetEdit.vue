<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonIcon,
		IonList,
		IonInput,
		IonButton,
		IonFab,
		IonFabButton,
		IonLabel,
		IonItem,
		IonPage,
		IonBackButton,
		useIonRouter,
		alertController,
	} from "@ionic/vue";

	import {
		saveOutline as saveIOS,
		trashBinOutline as trashIOS,
	} from "ionicons/icons";

	import saveMD from "@material-symbols/svg-600/outlined/save.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";

	import { getAssets, newAsset, deleteAsset, updateAsset } from '../../lib/db/tables/assets';
	import { Asset } from "../../lib/db/entities";
	import { inject, onBeforeMount, ref, watch } from "vue";
	import { PartialBy } from "../../lib/types";
	import { useRoute } from "vue-router";
	import { useTranslation } from "i18next-vue";
	import { getFiles } from "../../lib/util/misc";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import AssetItem from "../../components/AssetItem.vue";

	const isIOS = inject<boolean>("isIOS");
	const loading = ref(false);

	const emptyAsset: PartialBy<Asset, "uuid"> = {
		friendlyName: "",
		file: new File([], "")
	};
	const asset = ref({...emptyAsset});

	const route = useRoute();
	const router = useIonRouter();
	const i18next = useTranslation();

	async function updateFile() {
		const files = await getFiles();
		if (files.length > 0) {
			asset.value.file = files[0];
		}
	}

	async function save(){
		const uuid = asset.value.uuid;
		const _asset = asset.value;

		if(!_asset.file.size) return;

		if(!uuid){
			await newAsset(_asset as PartialBy<Asset, "uuid">);
			router.back();
			return;
		}

		await updateAsset(uuid, _asset);
		router.back();
	}

	function promptDeletion(): Promise<boolean> {
		return new Promise(async (resolve) => {
			const alert = await alertController.create({
				header: i18next.t("assetManager:edit.delete.title"),
				subHeader: i18next.t("assetManager:edit.delete.confirm"),
				buttons: [
					{
						text: i18next.t("other:alerts.cancel"),
						role: "cancel",
						handler: () => resolve(false)
					},
					{
						text: i18next.t("other:alerts.ok"),
						role: "confirm",
						handler: () => resolve(true)
					}
				]
			});

			await alert.present();
		});
	}

	async function removeAsset(){
		if(await promptDeletion()){
			await deleteAsset(asset.value.uuid!);
		}
	}

	async function updateRoute(){
		if(route.name !== "AssetEdit") return;

		loading.value = true;

		if(route.query.uuid){
			const _asset = (await getAssets()).find(x => x.uuid === route.query.uuid);
			if(_asset)
				asset.value = _asset;
			else asset.value = {...emptyAsset};
		} else asset.value = {...emptyAsset};

		loading.value = false;
	}

	watch(route, updateRoute);
	onBeforeMount(updateRoute);
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/assetManager/" />
				<IonTitle>
					{{ !asset.uuid ? $t("assetManager:add.header") : $t("assetManager:edit.header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="loading" />
		<IonContent v-else>
			<IonList :inset="isIOS">

				<AssetItem v-if="asset.file.size" :asset routeToOpenFile :showFilenameAndType="true" />

				<IonItem>
					<IonButton @click="updateFile">
						{{ !asset.file.size ? $t("assetManager:add.attachment") : $t("assetManager:edit.attachment") }}
					</IonButton>
				</IonItem>

				<IonItem>
					<IonInput :fill="!isIOS ? 'outline' : undefined" :label="$t('assetManager:edit.friendlyName')" labelPlacement="floating" v-model="asset.friendlyName" />
				</IonItem>

				<IonItem button detail="false" v-if="asset.uuid" @click="removeAsset">
					<IonIcon :ios="trashIOS" :md="trashMD" slot="start" aria-hidden="true" color="danger"/>
					<IonLabel color="danger">
						<h3>{{ $t("assetManager:edit.delete.title") }}</h3>
						<p>{{ $t("other:genericDeleteDesc") }}</p>
					</IonLabel>
				</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="save" v-if="asset.friendlyName.length > 0">
					<IonIcon :ios="saveIOS" :md="saveMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>

<style scoped>
	ion-button {
		width: 100%;
	}

	ion-thumbnail {
		--border-radius: 16px;
	}
</style>