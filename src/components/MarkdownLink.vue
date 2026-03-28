<script setup lang="ts">
	import { onMounted, shallowRef } from "vue";
	import { getAssets } from "../lib/db/tables/assets";
	import { Asset } from "../lib/db/entities";
	import { openUrl } from "@tauri-apps/plugin-opener";
	import { openFile } from "../lib/native/plugin";

	const props = defineProps<{
		href: string,
		title?: string
	}>();

	const asset = shallowRef<Asset>();

	async function onClick(e: Event){
		e.preventDefault();
		e.stopPropagation();

		try{
			if(asset.value){
				await openFile(asset.value.file);
				return;
			}

			await openUrl(props.href);
		}catch(_e){
			// whatever?
		}
	}

	onMounted(async () => {
		// then let's put the href to asset code
		if (props.href.startsWith("@")) {
			const friendlyNameMaybe = props.href.slice(1);
			for await (const x of getAssets()) {
				if (x.friendlyName === friendlyNameMaybe) {
					asset.value = x;
					break;
				}
			}
		}
	});
</script>

<template>
	<a href="#" :title="props.title" @click="onClick">
		<slot />
	</a>
</template>