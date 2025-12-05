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
	import { Asset, SQLFile, UUID } from "../../lib/db/entities";
	import { onBeforeMount, ref, watch } from "vue";
	import { PartialBy } from "../../lib/types";
	import { useRoute } from "vue-router";
	import { useTranslation } from "i18next-vue";
	import { promptOkCancel } from "../../lib/util/misc";
	import { getObjectURL } from "../../lib/util/blob";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import AssetItem from "../../components/AssetItem.vue";
	import { uploadFile } from "../../lib/db/tables/files";

	const loading = ref(false);

	const emptyAsset: PartialBy<Asset, "id" | "file"> = {
		friendlyName: "",
	};
	const asset = ref({ ...emptyAsset });

	const assetThumbnailUri = ref();

	const route = useRoute();
	const router = useIonRouter();
	const i18next = useTranslation();

	async function updateFile() {
		const file = await uploadFile();
		asset.value.file = file;
	}

	async function generatePreview(){
		if(asset.value.file){
			const file = asset.value.file as SQLFile;
			switch(file.friendlyName.split(".")[1].toLowerCase()){
				case "png":
				case "jpeg":
				case "jpg":
				case "gif":
				case "webp":
					return await getObjectURL(file);
				default:
					break;
			}
		}
		return;
	}

	async function save(){
		const uuid = asset.value.id;
		const _asset = asset.value;

		if(!_asset.file) return;

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
			const _asset = await getAsset(route.query.uuid as UUID);
			if(_asset)
				asset.value = _asset;
			else asset.value = { ...emptyAsset };
		} else asset.value = { ...emptyAsset };

		assetThumbnailUri.value = await generatePreview();

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
					v-if="assetThumbnailUri"
					:src="assetThumbnailUri"
					class="thumbnail"
				/>

				<AssetItem
					v-if="asset.file"
					:asset
					route-to-open-file
					:show-filename-and-type="true"
					:show-thumbnail="!assetThumbnailUri"
				/>

				<IonItem>
					<IonButton @click="updateFile">
						{{ !asset.file ? $t("assetManager:add.attachment") : $t("assetManager:edit.attachment") }}
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
				<IonFabButton :disabled="!asset.friendlyName.length || !asset.file" @click="save">
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