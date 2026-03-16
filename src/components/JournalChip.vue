<script setup lang="ts">
	import {
		IonChip,
		IonLabel,
		IonIcon
	} from "@ionic/vue";

	import { JournalPost } from "../lib/db/entities";

	import journalMD from "@material-symbols/svg-600/outlined/book.svg";

	const props = defineProps<{
		post: JournalPost,
		clickable?: boolean
	}>();

	const routerLink = props.clickable ? `/journal/edit?uuid=${props.post.uuid}` : undefined;
</script>

<template>
	<IonChip :router-link @click="(e) => e.stopPropagation()">
		<IonIcon :icon="journalMD" />
		<IonLabel class="nowrap">
			{{ props.post.title }}
		</IonLabel>
	</IonChip>
</template>
