<script setup lang="ts">
	import { onMounted, ref } from 'vue';
	const input = ref<HTMLInputElement>();
	const model = defineModel<string>();
	
	onMounted(() => {
		model.value = input.value!.value;
	});

	function open(){
		input.value!.click();
	}
</script>

<template>
	<amp-color @click="open">
		<slot></slot>
		<div class="color" :style="{backgroundColor: model}" @click="open" slot="end">
			<input type="color" ref="input" v-model="model">
		</div>
	</amp-color>
</template>

<style scoped>
	amp-color {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-direction: row;
		min-height: var(--min-height);
		position: relative;
		max-width: 100%;
		flex: 1 1 0px;
		outline: none;
		cursor: pointer;
		user-select: none;
		z-index: 2;
	}

	amp-color :deep(ion-label) {
		margin-inline: 0px 16px;
		margin-top: 10px;
		margin-bottom: 10px;
	}

	input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	div.color {
		border-radius: 50%;
		width: 36px;
		aspect-ratio: 1;
	}
</style>
