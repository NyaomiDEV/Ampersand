<script setup lang="ts">
	import { onMounted, ref } from "vue";
	import { useBlob } from "../lib/util/blob";
	import { securityConfig } from "../lib/config";
	import { getAsset, getAssetsIndex } from "../lib/db/tables/assets";
	import { getExtension } from "../lib/mime";
	import { fetchImage } from "../lib/util/fetchImage";

	const { getObjectURL } = useBlob();

	const props = defineProps<{
		src: string
		alt?: string,
		title?: string,
		width?: number,
		height?: number
	}>();

	const source = ref<string>("#");
	const alt = ref<string>(props.alt || "");

	onMounted(async () => {
		// then let's put the href to asset code
		if (props.src.startsWith("@")) {
			const friendlyNameMaybe = props.src.slice(1);
			for (const x of getAssetsIndex()) {
				if (x.friendlyName === friendlyNameMaybe) {
					const asset = await getAsset(x.uuid);
					source.value = getObjectURL(asset.file);
					break;
				}
			}
		} else {
			if (securityConfig.allowRemoteContent) {
				const res = (await fetchImage(props.src));
				source.value = getObjectURL(new File([res.blob], `markdownimg_${Date.now()}.${getExtension(res.blob.type)}`));
				if(res.extras.alt && !alt.value.length) alt.value = res.extras.alt;
			}
		}
	});
</script>

<template>
	<img
		:src="source"
		:title="props.title"
		:alt="alt"
		:width="props.width"
		:height="props.height"
	/>
</template>