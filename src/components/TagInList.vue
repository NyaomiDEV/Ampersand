<script setup lang="ts">
	import {
		IonItem,
		IonLabel,
	} from "@ionic/vue";

	import { Tag } from '../lib/db/entities/tags';
	import TagEdit from "../modals/TagEdit.vue";
	import { provide, ref } from "vue";

	const props = defineProps<{
		tag: Tag
	}>();

	const tag = props.tag;
	const isOpen = ref(false);
	provide("isOpen", isOpen);
</script>

<template>
	<IonItem button @click="isOpen = true">
		<IonLabel>
			{{ tag.name }}
		</IonLabel>
	</IonItem>

	<TagEdit :add="false" :tag="tag" />
</template>
