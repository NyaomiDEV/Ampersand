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
	} from "@ionic/vue";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import saveMD from "@material-symbols/svg-600/outlined/save.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";

	import { newAsset, deleteAsset, updateAsset, getAsset } from "../../lib/db/tables/assets";
	import { Asset } from "../../lib/db/entities";
	import { onBeforeMount, ref, watch } from "vue";
	import { PartialBy } from "../../lib/types";
	import { useRoute } from "vue-router";
	import { useTranslation } from "i18next-vue";
	import { getFiles, promptOkCancel } from "../../lib/util/misc";
	import { getObjectURL } from "../../lib/util/blob";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import AssetItem from "../../components/AssetItem.vue";

	const loading = ref(false);

	const emptyAsset: PartialBy<Asset, "id"> = {
		friendlyName: "",
		file: new File([], "")
	};
	const asset = ref({ ...emptyAsset });

	const route = useRoute();
	const router = useIonRouter();
	const i18next = useTranslation();

	async function updateFile() {
		const files = await getFiles();
		if (files.length > 0) 
			asset.value.file = files[0];
	}

	function showBigThumbnail(){
		switch(asset.value.file.type){
			case "image/png":
			case "image/jpeg":
			case "image/gif":
			case "image/webp":
				return true;
			default:
				break;
		}
		return false;
	}

	async function save(){
		const uuid = asset.value.id;
		const _asset = asset.value;

		if(!_asset.file.size) return;

		if(!uuid){
			await newAsset(_asset as PartialBy<Asset, "id">);
			router.back();
			return;
		}

		await updateAsset(uuid, _asset);
		router.back();
	}

	async function removeAsset(){
		if(await promptOkCancel(
			i18next.t("assetManager:edit.delete.title"),
			i18next.t("assetManager:edit.delete.confirm"),
		)){
			await deleteAsset(asset.value.id!);
			router.back();
		}
	}

	async function updateRoute(){
		if(route.name !== "AssetEdit") return;

		loading.value = true;

		if(route.query.uuid){
			const _asset = await getAsset(route.query.uuid as string);
			if(_asset)
				asset.value = _asset;
			else asset.value = { ...emptyAsset };
		} else asset.value = { ...emptyAsset };

		loading.value = false;
	}

	watch(route, updateRoute);
	onBeforeMount(updateRoute);
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton
					slot="start"
					:icon="backMD"
					default-href="/options/assetManager/"
				/>
				<IonTitle>
					{{ !asset.id ? $t("assetManager:add.header") : $t("assetManager:edit.header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="loading" />
		<IonContent v-else>
			<IonList>

				<img
					v-if="showBigThumbnail()"
					:src="getObjectURL(asset.file)"
					class="thumbnail"
				/>

				<AssetItem
					v-if="asset.file.size"
					:asset
					route-to-open-file
					:show-filename-and-type="true"
					:show-thumbnail="!showBigThumbnail()"
				/>

				<IonItem>
					<IonButton @click="updateFile">
						{{ !asset.file.size ? $t("assetManager:add.attachment") : $t("assetManager:edit.attachment") }}
					</IonButton>
				</IonItem>

				<IonItem>
					<IonInput
						v-model="asset.friendlyName"
						fill="outline"
						:label="$t('assetManager:edit.friendlyName')"
						label-placement="floating"
					/>
				</IonItem>

				<IonItem
					v-if="asset.id"
					button
					:detail="false"
					@click="removeAsset"
				>
					<IonIcon
						slot="start"
						:icon="trashMD"
						aria-hidden="true"
						color="danger"
					/>
					<IonLabel color="danger">
						<h3>{{ $t("assetManager:edit.delete.title") }}</h3>
						<p>{{ $t("other:genericDeleteDesc") }}</p>
					</IonLabel>
				</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton :disabled="!asset.friendlyName.length || !asset.file.name.length" @click="save">
					<IonIcon :icon="saveMD" />
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

	img.thumbnail {
		display: block;
		border-radius: 16px;
		margin: 16px auto;
		box-sizing: border-box;
		max-height: 50vh;
	}
</style>