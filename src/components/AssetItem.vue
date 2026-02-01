<script setup lang="ts">
	import { IonThumbnail, IonLabel, IonItem, IonIcon } from "@ionic/vue";
	import { Asset } from "../lib/db/entities";
	import { getObjectURL } from "../lib/util/blob";
	import { PartialBy } from "../lib/types";

	import documentMD from "@material-symbols/svg-600/outlined/draft.svg";
	import { openFile } from "../lib/native/plugin";

	const props = defineProps<{
		asset: PartialBy<Asset, "uuid">,
		routeToEditPage?: boolean,
		routeToOpenFile?: boolean,
		showFilenameAndType?: boolean,
		showThumbnail?: boolean
	}>();

	function canPreview(){
		if(props.asset.file.size){
			const file = props.asset.file;
			switch(file.type){
				case "image/png":
				case "image/jpeg":
				case "image/gif":
				case "image/webp":
				case "image/svg+xml":
					return true;
				default:
					break;
			}
		}
		return false;
	}

	async function open(){
		await openFile(props.asset.file);
	}
</script>

<template>
	<IonItem
		button
		:router-link="props.routeToEditPage ? `/options/assetManager/edit/?uuid=${props.asset.uuid}` : undefined"
		@click="props.routeToOpenFile ? open() : undefined"
	>
		<template v-if="props.showThumbnail">
			<template v-if="canPreview()">
				<IonIcon v-if="props.asset.file.type === 'image/svg+xml'" slot="start" :icon="getObjectURL(props.asset.file)" />		
				<IonThumbnail v-else slot="start">
					<img :src="getObjectURL(props.asset.file)" />
				</IonThumbnail>
			</template>
			<IonIcon v-else slot="start" :icon="documentMD" />
		</template>
		<IonLabel class="nowrap">
			<template v-if="props.showFilenameAndType">
				<h2>{{ asset.file.name }}</h2>
				<p>{{ asset.file.type?.split("/")[1]?.replace(/^x-/, '').toUpperCase() }}</p>
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