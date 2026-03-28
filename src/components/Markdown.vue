<script setup lang="ts">
	import { watch, shallowRef, VNode } from "vue";
	import { useMarked } from "../lib/markdown";
	import { useBlob } from "../lib/util/blob";

	const marked = useMarked(useBlob());

	const props = defineProps<{
		markdown: string
	}>();

	const mdRef = shallowRef<VNode[]>();

	watch(props, async () => {
		mdRef.value = await marked.parse(
			props.markdown.replace(/^[\u200B-\u200F\uFEFF]/,"")
		) as VNode[];
	}, { immediate: true });
</script>

<template>
	<div class="markdown-content">
		<component :is="vnode" v-for="vnode in mdRef" :key="vnode.key" />
	</div>
</template>