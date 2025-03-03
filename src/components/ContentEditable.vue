<script setup lang="ts">
	import { ref, inject } from 'vue';
	import { IonLabel, IonTextarea } from '@ionic/vue';
	import Markdown from './Markdown.vue';
	
	const isIOS = inject<boolean>("isIOS");

	const props = defineProps<{
		label?: string
	}>();
	const model = defineModel<string>({default: ""});
	const focused = ref(false);
</script>

<template>
	<IonLabel position="stacked" v-if="!focused && props.label">{{ props.label }}</IonLabel>
	<div v-if="!focused" @click="() => {
		focused = true;
		$nextTick(() => ($refs.textarea as any).$el.setFocus());
	}"><Markdown :markdown="model" /></div>
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

<style>
	div.preview {
		width: 100%;
	}
</style>