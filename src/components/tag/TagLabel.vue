<script setup lang="ts">
	import {
		IonLabel,
	} from "@ionic/vue";

	import { Tag } from '../../lib/db/entities';

	const props = defineProps<{
		tag: Tag
	}>();
</script>

<template>
	<IonLabel>
		{{ props.tag.name }}
	</IonLabel>
</template>
