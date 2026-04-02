<script setup lang="ts">
	import { store as console } from "../lib/console";
</script>

<template>
	<div class="console">
		<p
			v-for="entry in console"
			:key="entry.date.valueOf()"
			:class="[entry.severity]"
		>
			<span class="date">
				{{ entry.date.toISOString() }}
			</span>
			<span class="content">
				{{ JSON.stringify(entry.data) }}
			</span>
		</p>
	</div>
</template>

<style scoped>
	div.console {
		display: flex;
		flex-direction: column;
		gap: 2px;
		width: 100%;
		max-height: 800px;
		overflow-x: hidden;
		overflow-y: scroll;
	}

	.console p {
		padding: 8px 16px;
		margin: 0;
		display: grid;
		grid-template-columns: 1fr 3fr;
		gap: 2px;
		border-radius: 4px;
		background-color: rgb(var(--md3-surface-container));

		&.info {
			color: rgb(var(--md3-primary));
			background-color: rgb(var(--md3-primary-container));
		}

		&.debug {
			color: rgb(var(--md3-secondary));
			background-color: rgb(var(--md3-secondary-container));
		}

		&.warn {
			color: rgb(var(--md3-tertiary));
			background-color: rgb(var(--md3-tertiary-container));
		}

		&.error {
			color: rgb(var(--md3-error));
			background-color: rgb(var(--md3-error-container));
		}
	}
</style>