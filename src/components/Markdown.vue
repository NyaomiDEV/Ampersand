<script setup lang="ts">
	import { defineComponent, h, watch, shallowRef } from "vue";
	import { marked } from "../lib/markdown";
	import { openSQLFile } from "../lib/db/tables/files";
	import { UUID } from "../lib/db/entities";

	const props = defineProps<{
		markdown: string
	}>();

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

	const rendererComponent = defineComponent(async () => {
		const mdRef = shallowRef(await marked.parse(props.markdown));
		watch(props, async () => {
			mdRef.value = await marked.parse(props.markdown);
		});
		return () => h(
			"div",
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