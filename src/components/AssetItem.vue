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

	async function generatePreview(){
		if(props.asset.file){
			const file = props.asset.file;
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

	async function open(){
		if(props.asset.file)
			await openSQLFile(props.asset.file);
	}

	onBeforeMount(async () => {
		await generatePreview();
	});
</script>

<template>
	<IonItem
		button
		:router-link="props.routeToEditPage ? `/options/assetManager/edit/?uuid=${props.asset.id}` : undefined"
		@click="props.routeToOpenFile ? open() : undefined"
	>
		<template v-if="props.showThumbnail">
			<IonThumbnail v-if="previewUri" slot="start">
				<img :src="previewUri" />
			</IonThumbnail>
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