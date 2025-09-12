<script setup lang="ts">
	import Spinner from "./Spinner.vue";
</script>

<template>
	<div class="spinner-fullscreen">
		<Spinner size="72px" />
	</div>
</template>

<style scoped>
	div.spinner-fullscreen {
		background-color: var(--ion-background-color);
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>