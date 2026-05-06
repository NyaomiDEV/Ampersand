<script setup lang="ts">
	const props = defineProps<{
		siblingHeader?: boolean,
		compressVertical?: boolean
	}>();
</script>

<template>
	<div
		:class="{
			'theres-nothing-here': true,
			'sibling-header': props.siblingHeader,
			'compress-vertical': props.compressVertical
		}"
	>
		<slot v-if="$slots.default" />
		<span v-else>(╯°□°）╯︵ ┻━┻</span>
	</div>
</template>

<style scoped>
	div.theres-nothing-here {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: .25;

		&.compress-vertical {
			height: unset;
		}

		&.sibling-header {
			height: calc(100% - 120px);
			&:has(~ ion-fab) {
				height: calc(100% - 208px);
			}
		}

		&:has(~ ion-fab) {
			height: calc(100% - 88px);
		}

		> span {
			font-family: "JetBrains Mono", monospace;
			font-weight: bold;
			font-size: 2em;
			white-space: nowrap;
			text-overflow: unset;
			overflow: hidden;
			user-select: none;
			cursor: default;
		}
	}
</style>