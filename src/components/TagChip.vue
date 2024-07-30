<script setup lang="ts">
	import {
		IonChip,
		IonAvatar,
		IonLabel
	} from "@ionic/vue";

	import { Tag } from "../lib/db/entities/tags";

	const props = defineProps<{
		tag: Tag
	}>();
</script>

<template>
	<IonChip>
		<IonAvatar v-if="props.tag.color">
			<div :style="{
				backgroundColor: props.tag.color
			}"></div>
		</IonAvatar>
		<IonLabel>
			{{ props.tag.name }}
		</IonLabel>
	</IonChip>
</template>

<style scoped>
	div {
		width: 100%;
		height: 100%;
		border-radius: 100%;
		aspect-ratio: 1;
	}
</style>