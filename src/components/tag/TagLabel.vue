<script setup lang="ts">
	import {
		IonLabel,
	} from "@ionic/vue";

	import { Tag } from "../../lib/db/entities";

	const props = defineProps<{
		tag: Tag
	}>();
</script>

<template>
	<IonLabel>
		<slot name="before" />
		<h2>
			{{ props.tag.name }}
		</h2>
		<slot />
	</IonLabel>
</template>
