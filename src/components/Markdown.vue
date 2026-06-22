<script setup lang="ts">
	import { watch, shallowRef, VNode } from "vue";
	import { extractFrontmatter, useMarked } from "../lib/markdown";

	const marked = useMarked();

	const props = defineProps<{
		markdown: string
	}>();

	const emit = defineEmits<{
		frontmatter: [object]
	}>();

	const mdRef = shallowRef<VNode[]>();

	watch(props, async () => {
		const { frontmatter, body } = extractFrontmatter(props.markdown);

		if(frontmatter)
			emit("frontmatter", frontmatter);

		mdRef.value = await marked.parse(
			body.replace(/^[\u200B-\u200F\uFEFF]/,"")
		) as VNode[];
	}, { immediate: true });
</script>

<template>
	<div class="markdown-content">
		<component :is="vnode" v-for="vnode in mdRef" :key="vnode.key" />
	</div>
</template>