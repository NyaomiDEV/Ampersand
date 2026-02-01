<script setup lang="ts">
	import { watch, shallowRef, VNode } from "vue";
	import { marked } from "../lib/markdown";
	import { openUrl } from "@tauri-apps/plugin-opener";
	import { getFile } from "../lib/util/blob";
	import { openFile } from "../lib/native/plugin";

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

			const file = getFile(url);
			if(!file) return;

			await openFile(file);
		}catch(_e){
			// whatever?
		}
	}

	watch(props, async () => {
		mdRef.value = await marked.parse(props.markdown) as VNode[];
	}, { immediate: true });
</script>

<template>
	<div class="markdown-content" @click="redirectClicks">
		<component :is="vnode" v-for="vnode in mdRef" :key="vnode.key" />
	</div>
</template>