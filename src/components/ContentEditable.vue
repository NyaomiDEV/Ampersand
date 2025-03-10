<script setup lang="ts">
	import { ref, inject, onMounted, nextTick, useTemplateRef } from 'vue';
	import { IonLabel, IonTextarea } from '@ionic/vue';
	import Markdown from './Markdown.vue';
	
	const isIOS = inject<boolean>("isIOS");

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

	function clickHandler() {
		focused.value = true;
		nextTick(() => (textarea as any).$el.setFocus());
	}
</script>

<template>
	<IonLabel
		position="stacked"
		v-if="!focused && props.label"
		@click="clickHandler"
	>{{ props.label }}</IonLabel>
	<div class="preview" v-if="!focused" @click="clickHandler"><Markdown :markdown="model" /></div>
	<IonTextarea
		v-show="focused"
		v-model="model"
		:fill="!isIOS ? 'outline' : undefined"
		auto-grow
		:label="props.label"
		labelPlacement="floating"
		ref="textarea"
		@["ion-blur"]="focused = false"
	/>
</template>

<style scoped>
	ion-label {
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