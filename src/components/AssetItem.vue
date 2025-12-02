<script setup lang="ts">
	import { IonThumbnail, IonLabel, IonItem, IonIcon } from "@ionic/vue";
	import { Asset } from "../lib/db/entities";
	import { getObjectURL } from "../lib/util/blob";
	import { PartialBy } from "../lib/types";

	import documentMD from "@material-symbols/svg-600/outlined/draft.svg";
	import { openSQLFile } from "../lib/db/tables/files";
	import { onBeforeMount, ref } from "vue";

	const props = defineProps<{
		asset: PartialBy<Asset, "id" | "file">,
		routeToEditPage?: boolean,
		routeToOpenFile?: boolean,
		showFilenameAndType?: boolean,
		showThumbnail?: boolean
	}>();

	const previewUri = ref();

	function canPreview(){
		if(props.asset.file){
			const file = props.asset.file;
			switch(file.friendlyName.split(".")[1].toLowerCase()){
				case "png":
				case "jpeg":
				case "gif":
				case "webp":
				case "svg":
					return true;
				default:
					break;
			}
		}
		return false;
	}

	async function open(){
		if(props.asset.file)
			await openSQLFile(props.asset.file);
	}

	onBeforeMount(async () => {
		if(props.asset.file && canPreview())
			previewUri.value = await getObjectURL(props.asset.file);
	});
</script>

<template>
	<IonItem
		button
		:router-link="props.routeToEditPage ? `/options/assetManager/edit/?uuid=${props.asset.id}` : undefined"
		@click="props.routeToOpenFile ? open() : undefined"
	>
		<template v-if="props.showThumbnail">
			<template v-if="props.asset.file && previewUri">
				<IonIcon v-if="props.asset.file.friendlyName.endsWith('.svg')" slot="start" :icon="previewUri" />		
				<IonThumbnail v-else slot="start">
					<img :src="previewUri" />
				</IonThumbnail>
			</template>
			<IonIcon v-else slot="start" :icon="documentMD" />
		</template>
		<IonLabel class="nowrap">
			<template v-if="props.showFilenameAndType">
				<h2>{{ asset.file?.friendlyName }}</h2>
				<p>{{ asset.file?.friendlyName?.split(".").pop()?.toUpperCase() }}</p>
			</template>
			<template v-else>
				{{ props.asset.friendlyName }}
			</template>
		</IonLabel>
	</IonItem>
</template>

<style scoped>
	ion-thumbnail {
		width: 48px;
		height: 48px;
		--border-radius: 16px;
	}

	ion-thumbnail img {
		object-fit: contain;
	}

	ion-icon {
		width: 48px;
		height: 48px;
	}
</style>