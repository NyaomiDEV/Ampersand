<script setup lang="ts">
	import {
		IonItem,
		IonLabel,
	} from "@ionic/vue";

	import { Tag } from '../lib/db/entities/tags';

	const props = defineProps<{
		tag: Tag
	}>();

	const tag = props.tag;
</script>

<template>
	<IonItem button>
		<IonLabel>
			{{ tag.name }}
		</IonLabel>
	</IonItem>
</template>
