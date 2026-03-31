<script setup lang="ts">
	import { onMounted, onUnmounted, useTemplateRef } from "vue";
	import Spinner from "./Spinner.vue";

	const emit = defineEmits<{
		infinite: [() => void]
	}>();

	let isBusy = false;
	const infinite = useTemplateRef("infinite");
	const observer = new IntersectionObserver((entries) => {
		const entry = entries[0];
		if(entry.isIntersecting && !isBusy){
			isBusy = true;
			const cb = () => { isBusy = false; };
			emit("infinite", cb);
		}
	}, {
		threshold: 0.5
	});

	onMounted(() => {
		if(infinite.value)
			observer.observe(infinite.value);
	});

	onUnmounted(() => {
		observer.disconnect();
	});
</script>

<template>
	<div ref="infinite" class="infinite">
		<Spinner />
	</div>
</template>

<style scoped>
	div.infinite {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 56px;
		padding: 16px;
	}
</style>