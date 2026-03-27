<script setup lang="ts">
	import { watch, shallowRef, VNode } from "vue";
	import { useMarked } from "../lib/markdown";
	import { openUrl } from "@tauri-apps/plugin-opener";
	import { openFile } from "../lib/native/plugin";
	import { useBlob } from "../lib/util/blob";

	const marked = useMarked(useBlob());

	const props = defineProps<{
		markdown: string
	}>();

	const mdRef = shallowRef<VNode[]>();

	async function redirectClicks(evt: MouseEvent) {
		const tag = (evt.target as HTMLElement).closest("a");
		if(!tag || !(evt.currentTarget as HTMLElement).contains(tag)) return;

		evt.preventDefault();
		evt.stopPropagation();
		const url = tag.href;

		try{
			if(!url.startsWith("blob:")){
				await openUrl(url);
				return;
			}

			await openFile(url);
		}catch(_e){
			// whatever?
		}
	}

	watch(props, async () => {
		mdRef.value = await marked.parse(
			props.markdown.replace(/^[\u200B-\u200F\uFEFF]/,"")
		) as VNode[];
	}, { immediate: true });
</script>

<template>
	<div class="markdown-content" @click="redirectClicks">
		<component :is="vnode" v-for="vnode in mdRef" :key="vnode.key" />
	</div>
</template>