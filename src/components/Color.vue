<script setup lang="ts">
	import { useTemplateRef } from "vue";
	import { IonModal } from "@ionic/vue";
	import { ColorChangeDetail, ColorPicker } from "vue-accessible-color-picker";
	const colorModel = defineModel<string>();

	const vacp = useTemplateRef("vacp");

	const props = defineProps<{
		alpha?: boolean
	}>();

	function open(){
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		vacp.value?.$el.present();
	}
	
	function updateColor(e: ColorChangeDetail) {
		colorModel.value = props.alpha ? e.colors.hex : e.colors.hex.slice(0, 7);
	}
</script>

<template>
	<div class="color-container" @click="open">
		<slot />
		<div slot="end" class="color" />
	</div>
	<IonModal ref="vacp" class="color-modal">
		<ColorPicker
			:alpha-channel="props.alpha ? 'show' : 'hide'"
			:color="colorModel"
			:visible-formats="['hex', 'rgb', 'hsl']"
			default-format="hex"
			@color-change="updateColor"
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
		background-color: v-bind('colorModel?.slice(0, 7)');
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
