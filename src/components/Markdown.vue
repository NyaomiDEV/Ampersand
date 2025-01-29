<script setup lang="ts">
	import { defineComponent, ref, watch } from 'vue';
	import { marked } from '../lib/markdown';

	const props = defineProps<{
		markdown: string
	}>();

	const rendererComponent = defineComponent(async () => {
			const mdRef = ref(await marked.parse(props.markdown));
			watch(props, async () => {
				mdRef.value = await marked.parse(props.markdown);
			});
			return () => mdRef.value;
		}
	);
</script>

<template>
	<Suspense>
		<component :is="rendererComponent" />
	</Suspense>
</template>