<script setup lang="ts">
	import { watch } from "vue";
	import { getAsset, getAssetsIndex } from "../lib/db/tables/assets";
	import { useAssetFonts } from "../lib/assetFonts";

	const { appendFont, deleteAllFonts } = useAssetFonts();

	const props = defineProps<{
		fontFamily: string,
		fontFeature: string,
		fontVariation: string
	}>();

	watch(props, async () => {
		const fontTypes = [
			"application/font-woff",
			"application/octet-stream"
		];

		if (props.fontFamily.startsWith("@")) {
			const assetIndex = getAssetsIndex().find(x => x.friendlyName === props.fontFamily.slice(1));
			if(!assetIndex) return;

			const asset = await getAsset(assetIndex.uuid);
			if(fontTypes.includes(asset.file.type))
				appendFont(props.fontFamily, asset.file);
		} else
			deleteAllFonts();
	}, { immediate: true });
</script>

<template>
	<span
		class="font-family"
		:style="{
			'--markdown-font-feature-settings': fontFeature,
			'--markdown-font-variation-settings': fontVariation,
			'--markdown-font-family': `'${fontFamily}'`
		}"
	>
		<slot />
	</span>
</template>