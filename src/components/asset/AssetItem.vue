<script setup lang="ts">
	import { IonThumbnail, IonLabel, IonItem, IonIcon } from "@ionic/vue";
	import { Asset, Tag } from "../../lib/db/entities";
	import { useBlob } from "../../lib/util/blob";
	import { PartialBy } from "../../lib/types";

	import documentMD from "@material-symbols/svg-600/outlined/draft.svg";
	import { openFile } from "../../lib/native/plugin";
	import { isReactive, onBeforeMount, shallowRef, watch, WatchStopHandle } from "vue";
	import { getTag } from "../../lib/db/tables/tags";
	import TagChip from "../tag/TagChip.vue";

	const { getObjectURL } = useBlob();

	const tags = shallowRef<Tag[]>();

	const props = defineProps<{
		asset: PartialBy<Asset, "uuid">,
		routeToEditPage?: boolean,
		routeToOpenFile?: boolean,
		showFilenameAndType?: boolean,
		showThumbnail?: boolean,
		showTags?: boolean,
		detail?: boolean
	}>();

	async function updateTags(){
		if(props.showTags){
			tags.value = (await Promise.all(props.asset.tags.map(async x => await getTag(x))))
				.filter(x => x.viewInLists && !x.isArchived)
				.sort((a, b) => a.name.localeCompare(b.name));
		}
	}

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

	let watchHandle: WatchStopHandle | undefined;
	watch(props, async () => {
		await updateTags();
		if(isReactive(props.asset))
			watchHandle = watch(props.asset, updateTags);
		else
			if(watchHandle){
				watchHandle();
				watchHandle = undefined;
			}
	});

	onBeforeMount(updateTags);
</script>

<template>
	<IonItem
		button
		:router-link="props.routeToEditPage ? `/options/assetManager/edit/?uuid=${props.asset.uuid}` : undefined"
		:detail="$props.detail"
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
			<div
				v-if="props.showTags"
				class="chips"
				@pointerdown="(e) => e.stopPropagation()"
				@touchstart="(e) => e.stopPropagation()"
			>
				<TagChip v-for="tag in tags" :key="tag.uuid" :tag="tag" />
			</div>
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

	div.chips {
		white-space: nowrap;
		overflow-x: scroll;
		scrollbar-width: none;
	}
</style>