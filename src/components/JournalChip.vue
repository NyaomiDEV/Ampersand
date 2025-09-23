<script setup lang="ts">
	import {
		IonChip,
		IonLabel,
	} from "@ionic/vue";

	import { JournalPost } from "../lib/db/entities";

	const props = defineProps<{
		post: JournalPost,
		clickable?: boolean
	}>();

	const routerLink = props.clickable ? "/journal/edit?disallowEditing=true&uuid=" + props.post.uuid : undefined;
</script>

<template>
	<IonChip :router-link @click="(e) => e.stopPropagation()">
		<IonLabel class="nowrap">
			{{ props.post.title }}
		</IonLabel>
	</IonChip>
</template>
