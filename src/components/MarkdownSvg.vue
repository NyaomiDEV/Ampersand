<script setup lang="ts">
	import { onBeforeMount, ref } from "vue";
	import { getAssets } from "../lib/db/tables/assets";
	import Svg from "./Svg.vue";
	import { useBlob } from "../lib/util/blob";
	import { securityConfig } from "../lib/config";

	const { getObjectURL } = useBlob();

	const props = defineProps<{
		src: string,
		fill?: string,
		stroke?: string,
		strokeWidth?: string,
		color?: string
	}>();

	const source = ref<string>();

	onBeforeMount(async () => {
		if (props.src.startsWith("@")) {
			const [assetNameMaybe, ...parts] = props.src.slice(1).split("#");
			for await (const x of getAssets()) {
				if (x.friendlyName === assetNameMaybe) {
					source.value = getObjectURL(x.file) + (parts.length ? `#${parts.join("#")}` : "");
					break;
				}
			}
		} else {
			if (!securityConfig.allowRemoteContent)
				source.value = "#";
			else
				source.value = props.src;
		}
	});
</script>

<template>
	<Svg
		:src="source"
		class="markdown-svg"
		:fill="props.fill"
		:stroke="props.stroke"
		:stroke-width="props.strokeWidth"
		:color="props.color"
	/>
</template>