<script setup lang="ts">
	import { watch, ref } from "vue";
	import { getAssets } from "../lib/db/tables/assets";
	import { useAssetFonts } from "../lib/assetFonts";

	const props = defineProps<{
		fontFamily: string,
		fontVariation: string
	}>();

	const fontTypes = [
		"application/font-woff",
		"application/octet-stream"
	];

	const fontFamily = ref(props.fontFamily);
	let isUsingCustomFont = false;

	watch(props, async () => {
		// then let's put the href to asset code
		if (props.fontFamily.startsWith("@")) {
			const friendlyNameMaybe = props.fontFamily.slice(1);
			for await (const x of getAssets()) {
				if (x.friendlyName === friendlyNameMaybe && fontTypes.includes(x.file.type)) {
					useAssetFonts.appendFont(x.friendlyName, x.file);
					isUsingCustomFont = true;
					fontFamily.value = x.friendlyName;
					break;
				}
			}
		} else {
			if(isUsingCustomFont){
				isUsingCustomFont = false;
				useAssetFonts.deleteFont(fontFamily.value);
			}
			fontFamily.value = props.fontFamily;
		}
	}, { immediate: true });
</script>

<template>
	<span
		class="font-family"
		:style="{
			'--markdown-font-variation-settings': fontVariation,
			'--markdown-font-family': fontFamily
		}"
	>
		<slot />
	</span>
</template>