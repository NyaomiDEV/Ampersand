<script setup lang="ts">
	import {
		IonChip,
		IonAvatar,
		IonLabel
	} from "@ionic/vue";

	import { inject } from "vue";
	import { Tag } from "../lib/db/entities/tags";

	const tags = inject<Tag[]>("tags");
	const props = defineProps<{
		tag: string
	}>();
</script>

<template>
	<IonChip>
		<IonAvatar>
			<div :style="{
				backgroundColor: tags?.find(x => x.uuid === props.tag)!.color
			}"></div>
		</IonAvatar>
		<IonLabel>
			{{ tags?.find(x => x.uuid === props.tag)!.name }}
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