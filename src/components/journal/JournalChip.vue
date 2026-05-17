<script setup lang="ts">
	import {
		IonChip,
		IonLabel,
		IonIcon
	} from "@ionic/vue";

	import { JournalPost } from "../../lib/db/entities";
	import { lists } from "../../router/lists";

	const props = defineProps<{
		post: JournalPost,
		clickable?: boolean
	}>();

	const routerLink = props.clickable ? `/edit/journal?uuid=${props.post.uuid}` : undefined;
</script>

<template>
	<IonChip :router-link @click="(e) => e.stopPropagation()">
		<IonIcon :icon="lists.journal.icon" />
		<IonLabel class="nowrap">
			{{ props.post.title }}
		</IonLabel>
	</IonChip>
</template>
