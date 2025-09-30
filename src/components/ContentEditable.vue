<script setup lang="ts">
	import { ref, onMounted, nextTick, useTemplateRef } from "vue";
	import { IonLabel, IonTextarea } from "@ionic/vue";
	import Markdown from "./Markdown.vue";
	
	const props = defineProps<{
		label?: string
	}>();
	const model = defineModel<string>({default: ""});
	const focused = ref(false);
	const textarea = useTemplateRef("textarea");

	onMounted(() => {
		if(model.value === undefined)
			model.value = "";
	});

	async function clickHandler() {
		focused.value = true;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
		await nextTick(() => (textarea.value as any).$el.setFocus());
	}
</script>

<template>
	<div class="content-editable-wrapper">
		<IonLabel
			v-if="!focused && props.label"
			class="content-editable"
			position="stacked"
			@click="clickHandler"
		>
			{{ props.label }}
		</IonLabel>

		<div v-if="!focused" class="preview" @click="clickHandler">
			<Markdown :markdown="model" />
		</div>

		<IonTextarea
			v-show="focused"
			ref="textarea"
			v-model="model"
			fill="outline"
			auto-grow
			:label="props.label"
			label-placement="floating"
			@ion-blur="focused = false"
		/>
	</div>
</template>

<style scoped>
	
	div.content-editable-wrapper {
		width: 100%;
	}

	ion-label.content-editable {
		padding-inline-start: 21px;
	}

	div.preview {
		width: 100%;
		min-height: 2em;
		border-radius: 4px;
		padding-left: 16px;
		padding-right: 16px;
		border-bottom: .5px solid var(--ion-text-color-step-600);
	}
</style>