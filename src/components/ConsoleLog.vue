<script setup lang="ts">
	import { store as console } from "../lib/console";
	
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function mapData(x: any){
		switch(typeof x){
			case "string":
			case "number":
			case "bigint":
			case "boolean":
			case "symbol":
				return x.toString().replace(/(?:\x1B[@-Z\\-_]|[\x80-\x9A\x9C-\x9F]|(?:\x1B\[|\x9B)[0-?]*[ -/]*[@-~])/, "");
			case "undefined":
				return "undefined";
			case "function":
				return (x as () => unknown).toString();
			case "object":
				if(x instanceof Error)
					return `${x.name}: ${x.message}`;
				return JSON.stringify(x);
		}
	}
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
				<span v-for="[i, obj] in entry.data.map(mapData).entries()" :key="i">
					{{ obj }}
				</span>
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