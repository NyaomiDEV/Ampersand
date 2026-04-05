<script setup lang="ts">
	import { setupAssetFonts } from "../lib/assetFonts";
	import { useBlob } from "../lib/util/blob";

	const blob = useBlob();
	const { fonts } = setupAssetFonts(blob);
</script>

<template>
	<span v-for="font in fonts" :key="font[0]">
		<component :is="'style'">
			{{ font[1].atRule }}
		</component>
	</span>
</template>