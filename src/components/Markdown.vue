<script setup lang="ts">
	import { defineComponent, h, watch, shallowRef } from 'vue';
	import { marked } from '../lib/markdown';
	import { openUrl } from '@tauri-apps/plugin-opener';
	import { getFile } from '../lib/util/blob';
	import { isTauri } from '../lib/mode';
	import { openFile } from '../lib/native/opener';

	const props = defineProps<{
		markdown: string
	}>();

	async function redirectClicks(evt: MouseEvent) {
		const tag = (evt.target as HTMLElement).closest("a");
		if(!tag || !(evt.currentTarget as HTMLElement).contains(tag)) return;

		evt.preventDefault();
		const url = tag.href;

		if(!isTauri()){
			window.open(url, "_blank");
			return;
		}

		try{
			if(!url.startsWith("blob:")){
				await openUrl(url);
				return;
			}

			const file = await getFile(url);
			if(!file) return;

			await openFile(file);
		}catch(e){
			// whatever?
		}
	}

	const rendererComponent = defineComponent(async () => {
			const mdRef = shallowRef(await marked.parse(props.markdown));
			watch(props, async () => {
				mdRef.value = await marked.parse(props.markdown);
			});
			return () => h(
				'div',
				{
					class: "markdown-content",
					onClick: redirectClicks
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