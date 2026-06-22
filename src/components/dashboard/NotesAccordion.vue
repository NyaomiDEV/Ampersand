<script setup lang="ts">
	import { IonAccordionGroup } from "@ionic/vue";
	import { onBeforeMount, shallowRef } from "vue";

	import downMD from "@material-symbols/svg-600/rounded/keyboard_arrow_down.svg";

	import { getNotesToDisplay } from "../../lib/db/tables/notes";
	import { Note } from "../../lib/db/entities";
	import MarkdownAccordion from "../MarkdownAccordion.vue";

	const notes = shallowRef<Note[]>();

	onBeforeMount(async () => {
		notes.value = await Array.fromAsync(getNotesToDisplay());
	});
</script>

<template>
	<IonAccordionGroup v-if="notes && notes.length" :multiple="true">
		<MarkdownAccordion
			v-for="note in notes"
			:key="note.uuid"
			:value="note.uuid"
			:toggle-icon="downMD"
			:header="note.title"
			:content="note.content"
		/>
	</IonAccordionGroup>
</template>