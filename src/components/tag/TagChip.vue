<script setup lang="ts">
	import {
		IonChip,
	} from "@ionic/vue";

	import { Tag } from "../../lib/db/entities";

	import TagColor from "./TagColor.vue";
	import TagLabel from "./TagLabel.vue";

	const props = defineProps<{
		tag: Tag
	}>();
</script>

<template>
	<IonChip>
		<TagColor :tag="props.tag" />
		<TagLabel :tag="props.tag" />
	</IonChip>
</template>
