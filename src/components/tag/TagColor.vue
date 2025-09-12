<script setup lang="ts">
	import {
		IonAvatar
	} from "@ionic/vue";

	import { Tag } from "../../lib/db/entities";

	const props = defineProps<{
		tag: Tag
	}>();
</script>

<template>
	<IonAvatar v-if="props.tag.color">
		<div
			:style="{
				backgroundColor: props.tag.color
			}"
		/>
	</IonAvatar>
</template>

<style scoped>
	div {
		position: relative;
		top: 15%;
		left: 15%;
		width: 75%;
		height: 75%;
		border-radius: 100%;
		aspect-ratio: 1;
	}
</style>