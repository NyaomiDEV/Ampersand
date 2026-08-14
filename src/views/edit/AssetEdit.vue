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

	import saveMD from "@material-symbols/svg-600/rounded/save.svg";
	import exportMD from "@material-symbols/svg-600/rounded/file_save.svg";
	import trashMD from "@material-symbols/svg-600/rounded/delete.svg";

	import { newAsset, deleteAsset, updateAsset, getAsset } from "../../lib/db/tables/assets";
	import { Asset, Tag, UUIDable } from "../../lib/db/entities";
	import { onBeforeMount, ref, shallowRef, useTemplateRef, watch } from "vue";
	import { PartialBy } from "../../lib/types";
	import { useRoute } from "vue-router";
	import { useTranslation } from "i18next-vue";
	import { formatDate, getCustomName, getDocumentFile, promptOkCancel, saveDocumentFile, saveImageFile, sortName, toast } from "../../lib/util/misc";
	import { useBlob } from "../../lib/util/blob";
	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import AssetItem from "../../components/asset/AssetItem.vue";
	import TagChip from "../../components/tag/TagChip.vue";
	import { getTags } from "../../lib/db/tables/tags";
	import TagListSelect from "../../modals/TagListSelect.vue";
	import Loading from "../../modals/Loading.vue";
	import { getFrontingAtIndex } from "../../lib/db/tables/frontingEntries.ts";
	import { defaultMember, getMember } from "../../lib/db/tables/members.ts";

	const { getObjectURL } = useBlob();

	const loading = ref(false);

	const emptyAsset: PartialBy<Asset, keyof UUIDable | "file"> = {
		friendlyName: "",
		tags: []
	};
	const asset = ref({ ...emptyAsset });
	const tags = shallowRef<Tag[]>([]);
	const tagSelectionModal = useTemplateRef("tagSelectionModal");
	const loadingModal = useTemplateRef("loadingModal");

	const route = useRoute();
	const router = useIonRouter();
	const i18next = useTranslation();

	const frontingAtCreationDate = ref<string>();

	async function updateFile() {
		const file = await getDocumentFile(undefined, true);
		if(file) asset.value.file = file;
	}

	async function exportFile(){
		if(!asset.value.file) return;

		const functionToBeCalled = isImage() ? saveImageFile : saveDocumentFile;

		try{
			await functionToBeCalled(asset.value.file);
		}catch(e){
			await toast((e as Error).message);
		}
	}

	function isImage() {
		switch(asset.value.file?.type.split("/")[0]){
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

		if(!_asset.file?.size) return;

		try{
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.present();

			if(!uuid){
				const result = await newAsset({
					..._asset as PartialBy<Asset, keyof UUIDable>
				});

				if(!result.success) throw new Error(`E: ${result.err || "failed"}`);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				await loadingModal.value?.$el.dismiss();
				router.back();
				return;
			}

			const result = await updateAsset(_asset as Asset);
			if(!result.success) throw new Error(`E: ${result.err || "failed"}`);

			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.dismiss();
			router.back();
		}catch(e){
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.dismiss();

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
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				await loadingModal.value?.$el.present();

				const result = await deleteAsset(asset.value.uuid!);
				if(!result.success) throw new Error(`E: ${result.err || "failed"}`);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				await loadingModal.value?.$el.dismiss();

				router.back();
			}
		}catch(e){
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.dismiss();

			await toast((e as Error).message);
		}
	}

	async function getPeopleFrontingAtCreation(){
		if(!asset.value?.dateCreated) return;

		const frontingIndex = getFrontingAtIndex(asset.value.dateCreated);
		const memberUUIDs = new Set(frontingIndex.map(x => x.member!));

		frontingAtCreationDate.value = (await Promise.all(
			memberUUIDs.values()
				.map(x => getMember(x).catch(_ => defaultMember(x)))
		))
			.map(x => getCustomName(x))
			.join(", ");
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

		await getPeopleFrontingAtCreation();

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
					default-href="/"
				/>
				<IonTitle>
					{{ !asset.uuid ? $t("assetManager:add.header") : $t("assetManager:edit.header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="loading" />
		<IonContent v-else>
			<img
				v-if="asset.file && isImage()"
				:src="getObjectURL(asset.file)"
				class="thumbnail"
			/>
			<IonList>
				<AssetItem
					v-if="asset.file?.size"
					:asset="asset as PartialBy<Asset, 'uuid'>"
					route-to-open-file
					:show-filename-and-type="true"
					:show-thumbnail="!isImage()"
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
						{{ !asset.file?.size ? $t("assetManager:add.attachment") : $t("assetManager:edit.attachment") }}
					</IonLabel>
				</IonItem>
				<IonItem button :detail="true" @click="tagSelectionModal?.$el.present()">
					<IonLabel>
						{{ $t("assetManager:edit.tags") }}
						<div v-if="tags?.length" class="asset-tags">
							<TagChip
								v-for="tag in asset.tags.map(x => tags.find(y => y.uuid === x)).filter(x => !!x).sort(sortName)"
								:key="tag.uuid"
								:tag
							/>
						</div>
					</IonLabel>
				</IonItem>
				<IonItem
					v-if="asset.file"
					button
					:detail="false"
					@click="exportFile"
				>
					<IonIcon
						slot="start"
						:icon="exportMD"
						aria-hidden="true"
					/>
					<IonLabel>
						{{ $t("assetManager:edit.export") }}
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
				<IonItem v-if="asset.dateCreated" :detail="false">
					<IonLabel>
						<p>
							{{ $t("other:creation.dateCreated", { dateCreated: formatDate(asset.dateCreated, "expanded") }) }}
						</p>
						<p v-if="frontingAtCreationDate?.length">
							{{ $t("other:creation.frontingAtCreationDate", { frontingAtCreationDate }) }}
						</p>
					</IonLabel>
				</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton :disabled="!asset.friendlyName.length || !asset.file?.name.length" @click="save">
					<IonIcon :icon="saveMD" />
				</IonFabButton>
			</IonFab>

			<TagListSelect
				ref="tagSelectionModal"
				type="asset"
				:model-value="asset.tags.map(uuid => tags.find(x => x.uuid === uuid)).filter(x => !!x)"
				@update:model-value="tags => { asset.tags = tags.map(x => x.uuid) }"
			/>

			<Loading ref="loadingModal" />
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