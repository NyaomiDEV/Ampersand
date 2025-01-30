<script setup lang="ts">
	import { defineComponent, ref, h, watch } from 'vue';
	import { marked } from '../lib/markdown';
import { openUrl } from '@tauri-apps/plugin-opener';

	const props = defineProps<{
		markdown: string
	}>();

	const rendererComponent = defineComponent(async () => {
			const mdRef = ref(await marked.parse(props.markdown));
			watch(props, async () => {
				mdRef.value = await marked.parse(props.markdown);
			});
			return () => h(
				'div',
				{
					class: "markdown-content",
					onClick(evt) {
						evt.preventDefault();
						const tag = (evt.target as HTMLElement).closest("a");
						if(tag && (evt.currentTarget as HTMLElement).contains(tag)){
							const url = tag.href;
							if(!('isTauri' in window)){
								open(url, "_blank");
							} else {
								openUrl(url);
							}
						}
					}
				},
				mdRef.value
			);
		}
	);
</script>

<template>
	<Suspense>
		<component :is="rendererComponent" />
	</Suspense>
</template>