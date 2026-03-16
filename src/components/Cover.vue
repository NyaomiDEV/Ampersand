<script setup lang="ts">
	import { getObjectURL } from "../lib/util/blob";

	const props = defineProps<{
		cover?: File,
	}>();
</script>

<template>
	<img v-if="props.cover" aria-hidden="true" :src="getObjectURL(props.cover)" />
</template>
