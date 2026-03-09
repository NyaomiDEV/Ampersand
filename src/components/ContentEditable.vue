<script setup lang="ts">
	import { ref, onMounted, nextTick, useTemplateRef } from "vue";
	import { IonLabel, IonTextarea } from "@ionic/vue";
	import Markdown from "./Markdown.vue";
	
	const props = defineProps<{
		label?: string
		fill?: "solid" | "outline";
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


			<div :class="{ preview: true, solid: props.fill === 'solid', outline: props.fill === 'outline' }" @click="clickHandler">
				<IonLabel
					v-if="props.label"
					class="content-editable"
					position="stacked"
					@click="clickHandler"
				>
					{{ props.label }}
				</IonLabel>
				<Markdown :markdown="model" />
			</div>
		</template>

		<IonTextarea
			v-show="focused || !model.length"
			ref="textarea"
			v-model="model"
			:fill="props.fill"
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

	div.preview.solid {
		border-radius: var(--md3-corner-extra-small-top);
    	border-bottom: 1px solid rgb(var(--md3-on-surface));
		background: rgb(var(--md3-surface-container-highest));
		padding: 0 16px 14px 16px;

	}

</style>