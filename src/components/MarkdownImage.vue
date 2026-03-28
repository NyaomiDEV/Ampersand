<script setup lang="ts">
	import { onMounted, ref } from "vue";
	import { useBlob } from "../lib/util/blob";
	import { securityConfig } from "../lib/config";
	import { getAssets } from "../lib/db/tables/assets";
	import { fetch } from "@tauri-apps/plugin-http";
	import { getExtension } from "../lib/mime";

	const { getObjectURL } = useBlob();

	const props = defineProps<{
		src: string
		alt?: string,
		title?: string,
		width?: string,
		height?: string
	}>();

	const source = ref<string>("#");

	onMounted(async () => {
		// then let's put the href to asset code
		if (props.src.startsWith("@")) {
			const friendlyNameMaybe = props.src.slice(1);
			for await (const x of getAssets()) {
				if (x.friendlyName === friendlyNameMaybe) {
					source.value = getObjectURL(x.file);
					break;
				}
			}
		} else {
			if (securityConfig.allowRemoteContent) {
				const blob = await (await fetch(props.src)).blob();
				source.value = getObjectURL(new File([blob], `markdownimg_${Date.now()}.${getExtension(blob.type)}`));
			}
		}
	});
</script>

<template>
	<img
		:src="source"
		:title="props.title"
		:alt="props.alt"
		:width="props.width"
		:height="props.height"
	/>
</template>