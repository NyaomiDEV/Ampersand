<script setup lang="ts">
	import { ref, VNode, watch } from "vue";
	import { Marked } from "../../vendor/marked-vue/marked";

	const marked = new Marked();
	const vnodes = ref<VNode[]>();

	const props = defineProps<{
		markdown: string
	}>();

	watch(props, () => {
		vnodes.value = marked.parse(props.markdown, { async: false });
	}, { immediate: true });
</script>

<template>
	<component v-for="vnode in vnodes" :is="vnode"/>
</template>