<script setup lang="ts">

	import { IonIcon } from "@ionic/vue";
	import loadingIndicator from "../assets/loading_indicator.svg";

	const props = withDefaults(defineProps<{
		size?: string,
		color?: string
	}>(), {
		size: "48px",
		color: "var(--ion-color-primary)"
	});
</script>

<template>
	<IonIcon :icon="loadingIndicator" class="spinner" />
</template>

<style scoped>
	.spinner {
		width: v-bind('props.size');
		height: v-bind('props.size');
		color: v-bind('props.color');
	}
</style>