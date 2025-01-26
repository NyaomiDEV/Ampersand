<script setup lang="ts">
	import { Marked } from "../../vendor/marked-vue/marked";

	const marked = new Marked();

	const props = defineProps<{
		markdown: string
	}>();
</script>

<template>
	<component :is="() => marked.parse(props.markdown, { async: false })"/>
</template>