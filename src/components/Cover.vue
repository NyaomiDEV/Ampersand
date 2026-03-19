<script setup lang="ts">
	import { useBlob } from "../lib/util/blob";

	const { getObjectURL } = useBlob();

	const props = defineProps<{
		cover?: File,
	}>();
</script>

<template>
	<img v-if="props.cover" aria-hidden="true" :src="getObjectURL(props.cover)" />
</template>
