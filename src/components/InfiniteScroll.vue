<script setup lang="ts">
	import { onMounted, shallowRef, useTemplateRef } from 'vue';
	import Spinner from './Spinner.vue';

	const props = defineProps<{
		callback: () => Promise<void>
	}>();

	const scroll = useTemplateRef("scroll");
	const entry = shallowRef<IntersectionObserverEntry>();

	async function callback(entries: IntersectionObserverEntry[]){
		if(entries[0])
			entry.value = entries[0];

		await checkAndRun();
	}

	let calling = false;
	async function checkAndRun(){
		if(calling) return;

		if(entry.value?.isIntersecting){
			calling = true;
			await props.callback();
			setTimeout(() => {
				calling = false;
				checkAndRun();
			}, 500);
		}
	}

	onMounted(() => {
		if(!scroll.value) return;

		const observer = new IntersectionObserver(callback, {
			root: scroll.value?.parentElement,
			threshold: 0.1
		});

		observer.observe(scroll.value);
	});
</script>

<template>
	<div class="infinite-scroll" ref="scroll">
		<Spinner size="24px" />
	</div>
</template>

<style scoped>
	.infinite-scroll {
		padding: 8px;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>