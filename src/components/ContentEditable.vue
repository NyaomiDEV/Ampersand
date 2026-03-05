<script setup lang="ts">
	import { ref, onMounted, nextTick, useTemplateRef } from "vue";
	import { IonLabel, IonTextarea } from "@ionic/vue";
	import Markdown from "./Markdown.vue";
	
	const props = defineProps<{
		label?: string
	}>();
	const model = defineModel<string>({ default: "" });
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
		<template v-if="!focused && model.length">
			<IonLabel
				v-if="props.label"
				class="content-editable"
				position="stacked"
				@click="clickHandler"
			>
				{{ props.label }}
			</IonLabel>

			<div class="preview" @click="clickHandler">
				<Markdown :markdown="model" />
			</div>
		</template>

		<IonTextarea
			v-show="focused || !model.length"
			fill="solid"
			ref="textarea"
			v-model="model"
			auto-grow
			:label="props.label"
			label-placement="floating"
			@ion-blur="focused = false"
			@ion-focus="focused = true"
		/>
	</div>
</template>

<style scoped>
	
	div.content-editable-wrapper {
		width: 100%;
	}

	div.preview {
		width: 100%;
		min-height: 2.5em;
	}
</style>