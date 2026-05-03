<script setup lang="ts">
	import { IonAccordionGroup, IonAccordion, IonItem, IonLabel } from "@ionic/vue";
	import { onBeforeMount, shallowRef } from "vue";

	import downMD from "@material-symbols/svg-600/outlined/keyboard_arrow_down.svg";

	import { getNotesToDisplay } from "../../lib/db/tables/notes";
	import Markdown from "../Markdown.vue";
	import { Note } from "../../lib/db/entities";

	const notes = shallowRef<Note[]>();

	onBeforeMount(async () => {
		notes.value = await Array.fromAsync(getNotesToDisplay());
	});
</script>

<template>
	<IonAccordionGroup v-if="notes && notes.length" :multiple="true">
		<IonAccordion
			v-for="note in notes"
			:key="note.uuid"
			:value="note.uuid"
			:toggle-icon="downMD"
		>
			<IonItem slot="header">
				<IonLabel>{{ note.title }}</IonLabel>
			</IonItem>
			<div slot="content" class="content">
				<Markdown :markdown="note.content" />
			</div>
		</IonAccordion>
	</IonAccordionGroup>
</template>