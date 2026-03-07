<script setup lang="ts">
	import {
		IonList,
		IonItem,
		IonModal,
		IonLabel,
		IonHeader,
		IonToolbar,
		IonTitle
	} from "@ionic/vue";

	import Markdown from "../components/Markdown.vue";
	import { Tag } from "../lib/db/entities";

	const props = defineProps<{
		tag: Tag
	}>();

</script>

<template>
	<IonModal class="tag-description-modal">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ props.tag.name }}</IonTitle>
			</IonToolbar>
		</IonHeader>
		<IonList>
			<IonItem>
				<IonLabel>
					<Markdown v-if="props.tag.description" :markdown="props.tag.description" />
				</IonLabel>
			</IonItem>
		</IonList>
	</IonModal>
</template>

<style scoped>
	.presence-add-modal {
		--border-radius: 16px;
		--height: fit-content;
	}

	.presence-add-modal::part(content) {
		padding: 8px 0px 16px 0px;
		box-sizing: border-box;
	}

	ion-button {
		float: right;
		margin-inline: 16px;
	}
</style>

<style scoped>
	.tag-description-modal {
		--border-radius: 16px;
		--height: fit-content;
	}

	.tag-description-modal::part(content) {
		padding: 8px 0px 16px 0px;
		box-sizing: border-box;
	}
</style>