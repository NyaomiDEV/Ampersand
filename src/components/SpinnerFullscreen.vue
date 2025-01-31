<script setup lang="ts">
	import Spinner from './Spinner.vue';
</script>

<template>
	<div class="spinner-fullscreen">
		<Spinner />
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
		--spinner-size: 72px;
		--spinner-width: 5px;
	}
</style>