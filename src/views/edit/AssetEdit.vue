<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonIcon,
		IonList,
		IonInput,
		IonFab,
		IonFabButton,
		IonLabel,
		IonItem,
		IonPage,
		IonBackButton,
		useIonRouter,
	} from "@ionic/vue";

	import saveMD from "@material-symbols/svg-600/outlined/save.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";

	import { newAsset, deleteAsset, updateAsset, getAsset } from "../../lib/db/tables/assets";
	import { Asset } from "../../lib/db/entities";
	import { onBeforeMount, ref, watch } from "vue";
	import { PartialBy } from "../../lib/types";
	import { useRoute } from "vue-router";
	import { useTranslation } from "i18next-vue";
	import { getDocumentFile, promptOkCancel } from "../../lib/util/misc";
	import { useBlob } from "../../lib/util/blob";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import AssetItem from "../../components/AssetItem.vue";

	const { getObjectURL } = useBlob();

	const loading = ref(false);

	const emptyAsset: PartialBy<Asset, "uuid"> = {
		friendlyName: "",
		file: new File([], "")
	};
	const asset = ref({ ...emptyAsset });

	const route = useRoute();
	const router = useIonRouter();
	const i18next = useTranslation();

	async function updateFile() {
		const file = await getDocumentFile(undefined, true);
		if(file) asset.value.file = file;
	}

	function showBigThumbnail(){
		switch(asset.value.file.type.split("/")[0]){
			case "image":
				return true;
			default:
				break;
		}
		return false;
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

	async function removeAsset(){
		if(await promptOkCancel(
			i18next.t("assetManager:edit.delete.title"),
			undefined,
			i18next.t("assetManager:edit.delete.confirm"),
		)){
			await deleteAsset(asset.value.uuid!);
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
					default-href="/options/assetManager/"
				/>
				<IonTitle>
					{{ !asset.uuid ? $t("assetManager:add.header") : $t("assetManager:edit.header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="loading" />
		<IonContent v-else>
			<img
				v-if="showBigThumbnail()"
				:src="getObjectURL(asset.file)"
				class="thumbnail"
			/>
			<IonList>
				<AssetItem
					v-if="asset.file.size"
					:asset
					route-to-open-file
					:show-filename-and-type="true"
					:show-thumbnail="!showBigThumbnail()"
					:detail="true"
				/>
			</IonList>
			<IonList class="surface">
				<IonItem>
					<IonInput
						v-model="asset.friendlyName"
						fill="solid"
						:label="$t('assetManager:edit.friendlyName')"
						label-placement="floating"
					/>
				</IonItem>
			</IonList>
			<IonList>
				<IonItem :detail="true" button @click="updateFile">
					<IonLabel>
						{{ !asset.file.size ? $t("assetManager:add.attachment") : $t("assetManager:edit.attachment") }}
					</IonLabel>
				</IonItem>
				<IonItem
					v-if="asset.uuid"
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