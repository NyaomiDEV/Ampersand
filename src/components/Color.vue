<script setup lang="ts">
	import { ref } from 'vue';
	import { IonModal } from '@ionic/vue';
	import { ColorPicker } from 'vue-accessible-color-picker';
	const model = defineModel<string>();
	
	const colorModal = ref<{$el: HTMLIonModalElement}>();

	const props = defineProps<{
		alpha?: boolean
	}>();

	function open(){
		colorModal.value?.$el.present();
	}
</script>

<template>
	<div class="color-container" @click="open">
		<slot></slot>
		<div class="color" :style="{backgroundColor: model}" slot="end">
		</div>
	</div>
	<IonModal class="color-modal" ref="colorModal">
		<ColorPicker
			:alpha-channel="props.alpha ? 'show' : 'hide'"
			:color="model"
			@color-change="(e) => model = e.colors.hex"
			:visible-formats="['hex', 'rgb', 'hsl']"
			default-format="hex"
		/>
	</IonModal>
</template>

<style scoped>
	@import url('vue-accessible-color-picker/styles');
	div.color-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-direction: row;
		min-height: var(--min-height);
		position: relative;
		max-width: 100%;
		flex: 1 1 0px;
		outline: none;
		cursor: pointer;
		user-select: none;
		z-index: 2;
	}

	div.color-container :deep(ion-label) {
		margin-inline: 0px 16px;
		margin-top: 10px;
		margin-bottom: 10px;
	}

	div.color {
		border: 2.5px solid var(--ion-text-color-step-400);
		border-radius: 50%;
		width: 36px;
		aspect-ratio: 1;
	}

	ion-modal.color-modal {
		--backdrop-opacity: var(--ion-backdrop-opacity, 0.32) !important;
		--border-radius: 16px;
		--width: unset;
		--height: unset;
		--vacp-color-background: transparent;
		--vacp-color-background-input: var(--ion-toolbar-background);
		--vacp-color-border: var(--ion-background-color-step-150);
	}

	ion-modal.color-modal::part(content) {
		position: absolute;
		top: calc(var(--device-inset-top, 0px) + 64px);
	}

	ion-modal.color-modal div.vacp-color-picker {
		margin: 16px;
	}
</style>
