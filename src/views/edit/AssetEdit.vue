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
		IonThumbnail
	} from "@ionic/vue";

	import {
		saveOutline as saveIOS,
		trashBinOutline as trashIOS,
		documentOutline as documentIOS
	} from "ionicons/icons";

	import saveMD from "@material-symbols/svg-600/outlined/save.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";
	import documentMD from "@material-symbols/svg-600/outlined/draft.svg";

	import { getAssets, newAsset, deleteAsset, updateAsset } from '../../lib/db/tables/assets';
	import { Asset } from "../../lib/db/entities";
	import { inject, onBeforeMount, ref, watch } from "vue";
	import { PartialBy } from "../../lib/types";
	import { useRoute } from "vue-router";
	import { useTranslation } from "i18next-vue";
	import { getFiles } from "../../lib/util/misc";
	import { getBlobURL } from "../../lib/util/blob";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";

	const isIOS = inject<boolean>("isIOS");
	const loading = ref(false);

	const emptyAsset: PartialBy<Asset, "uuid" | "file"> = {
		friendlyName: ""
	};
	const asset = ref({...emptyAsset});

	const route = useRoute();
	const router = useIonRouter();
	const i18next = useTranslation();

	const preview = ref();

	async function updateFile() {
		const files = await getFiles();
		if (files.length > 0) {
			asset.value.file = files[0];

			preview.value = await generatePreview();
		}
	}

	async function save(){
		const uuid = asset.value.uuid;
		const _asset = asset.value;

		if(!_asset.file) return;

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
				header: i18next.t("options:assetManager.edit.actions.delete.title"),
				subHeader: i18next.t("options:assetManager.edit.actions.delete.confirm"),
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
		loading.value = true;

		if(route.query.uuid){
			const _asset = (await getAssets()).find(x => x.uuid === route.query.uuid);
			if(_asset)
				asset.value = _asset;
			else asset.value = {...emptyAsset};
		} else asset.value = {...emptyAsset};

		loading.value = false;
	}

	function generatePreview(){
		if(asset.value.file){
			const file: File = asset.value.file;
			switch(file.type){
				case "image/png":
				case "image/jpeg":
				case "image/gif":
				case "image/webp":
					return getBlobURL(file);
				default:
					break;
			}
		}
		return;
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
					{{ !asset.uuid ? $t("options:assetManager.add.header") : $t("options:assetManager.edit.header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="loading" />
		<IonContent v-else>
			<IonList :inset="isIOS">

				<IonItem v-if="asset.file">
					<IonThumbnail v-if="preview" slot="start">
						<img :src="preview" />
					</IonThumbnail>
					<IonIcon v-else slot="start" :ios="documentIOS" :md="documentMD" />
					<IonLabel>
						<h2>{{ asset.file.name }}</h2>
						<p>{{ asset.file.type.split("/")[1].replace(/^x-/, '') }}</p>
					</IonLabel>
				</IonItem>

				<IonItem>
					<IonButton @click="updateFile">
						{{ !asset.file ? $t("options:assetManager.add.attachment") : $t("options:assetManager.edit.attachment") }}
					</IonButton>
				</IonItem>

				<IonItem>
					<IonInput :fill="!isIOS ? 'outline' : undefined" :label="$t('options:assetManager.edit.friendlyName')" labelPlacement="floating" v-model="asset.friendlyName" />
				</IonItem>

				<IonItem button v-if="asset.uuid" @click="removeAsset">
					<IonIcon :ios="trashIOS" :md="trashMD" slot="start" aria-hidden="true" color="danger"/>
					<IonLabel color="danger">
						<h3>{{ $t("options:assetManager.delete.title") }}</h3>
						<p>{{ $t("options:assetManager.delete.desc") }}</p>
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
		margin-top: 16px;
	}

	ion-item ion-icon {
		width: 36px;
		height: 36px;
		margin-inline-start: 16px;
	}

	ion-thumbnail {
		--border-radius: 16px;
	}

	.md ion-input {
		margin: 16px 0;
	}
</style>