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
	import { Asset, Tag } from "../../lib/db/entities";
	import { onBeforeMount, ref, shallowRef, useTemplateRef, watch } from "vue";
	import { PartialBy } from "../../lib/types";
	import { useRoute } from "vue-router";
	import { useTranslation } from "i18next-vue";
	import { getDocumentFile, promptOkCancel, toast } from "../../lib/util/misc";
	import { useBlob } from "../../lib/util/blob";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import AssetItem from "../../components/asset/AssetItem.vue";
	import TagChip from "../../components/tag/TagChip.vue";
	import { getTags } from "../../lib/db/tables/tags";
	import TagListSelect from "../../modals/TagListSelect.vue";

	const { getObjectURL } = useBlob();

	const loading = ref(false);

	const emptyAsset: PartialBy<Asset, "uuid"> = {
		friendlyName: "",
		file: new File([], ""),
		tags: []
	};
	const asset = ref({ ...emptyAsset });
	const tags = shallowRef<Tag[]>([]);
	const tagSelectionModal = useTemplateRef("tagSelectionModal");

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

		try{
			if(!uuid){
				const result = await newAsset(_asset);
				if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);
				router.back();
				return;
			}

			const result = await updateAsset(_asset as Asset);
			if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);

			router.back();
		}catch(e){
			await toast((e as Error).message);
		}
	}

	async function removeAsset(){
		try{
			if(await promptOkCancel(
				i18next.t("assetManager:edit.delete.title"),
				undefined,
				i18next.t("assetManager:edit.delete.confirm"),
			)){
				const result = await deleteAsset(asset.value.uuid!);
				if(!result.success) throw new Error(`E: ${result.err as Error || "failed"}`);
				router.back();
			}
		}catch(e){
			await toast((e as Error).message);
		}
	}

	async function updateRoute(){
		if(route.name !== "AssetEdit") return;

		loading.value = true;

		tags.value = (await Array.fromAsync(getTags("asset")));

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
				<IonItem button :detail="true" @click="tagSelectionModal?.$el.present()">
					<IonLabel>
						{{ $t("assetManager:edit.tags") }}
						<div v-if="tags?.length" class="asset-tags">
							<TagChip
								v-for="tag in asset.tags.map(x => tags.find(y => y.uuid === x)!)"
								:key="tag.uuid"
								:tag
							/>
						</div>
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

			<TagListSelect
				ref="tagSelectionModal"
				type="asset"
				:model-value="asset.tags.map(uuid => tags.find(x => x.uuid === uuid)!)"
				@update:model-value="tags => { asset.tags = tags.map(x => x.uuid) }"
			/>
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