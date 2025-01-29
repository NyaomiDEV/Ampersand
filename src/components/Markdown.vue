<script setup lang="ts">
	import { defineComponent, ref, h, watch } from 'vue';
	import { marked } from '../lib/markdown';

	const props = defineProps<{
		markdown: string
	}>();

	const rendererComponent = defineComponent(async () => {
			const mdRef = ref(await marked.parse(props.markdown));
			watch(props, async () => {
				mdRef.value = await marked.parse(props.markdown);
			});
			return () => h('div', {class: "markdown-content"}, mdRef.value);
		}
	);
</script>

<template>
	<Suspense>
		<component :is="rendererComponent" />
	</Suspense>
</template>