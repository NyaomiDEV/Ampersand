<script setup lang="ts">
	import { watch, shallowRef, VNode } from "vue";
	import { marked } from "../lib/markdown";
	import { openSQLFile } from "../lib/db/tables/files";
	import { UUID } from "../lib/db/entities";

	const props = defineProps<{
		markdown: string
	}>();

	const mdRef = shallowRef<VNode[]>();

	async function redirectClicks(evt: MouseEvent) {
		const tag = (evt.target as HTMLElement).closest("a");
		if(!tag || !(evt.currentTarget as HTMLElement).contains(tag)) return;

		const url = tag.href;

		if(url.startsWith("ampersand-file://")){
			evt.preventDefault();
			evt.stopPropagation();

			const fileID = url.substring(17) as UUID;

			await openSQLFile(fileID);
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