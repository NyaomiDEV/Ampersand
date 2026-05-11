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
		<div
			v-for="entry in console"
			:key="entry.date.valueOf()"
			:class="[entry.severity]"
		>
			<div class="date">
				{{ entry.date.toISOString() }}
			</div>
			<div class="content">
				<span v-for="[i, obj] in entry.data.map(mapData).entries()" :key="i">
					{{ obj }}
				</span>
			</div>
			<div v-if="entry.stack" class="stack">
				<span v-for="parsedStack in entry.stack" :key="parsedStack.code + parsedStack.location + parsedStack.row + parsedStack.col">
					{{ parsedStack.code }} (at {{ parsedStack.location }}:{{ parsedStack.row }}:{{ parsedStack.col }})
				</span>
			</div>
		</div>
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

		> div {
			padding: 8px 16px;
			margin: 0;
			display: grid;
			grid-template-columns: 0.5fr 1fr 1fr;
			gap: 8px;
			border-radius: 4px;
			background-color: rgb(var(--md3-surface-container));
			color: rgb(var(--md3-on-surface-container));

			> div {
				display: block;
				width: 100%;
			}

			> div.stack > span {
				display: block;
				margin-bottom: .5em;

				&::before {
					content: "- ";
				}
			}

			&.info {
				color: rgb(var(--md3-on-primary-container));
				background-color: rgb(var(--md3-primary-container));
			}

			&.debug {
				color: rgb(var(--md3-on-secondary-container));
				background-color: rgb(var(--md3-secondary-container));
			}

			&.warn {
				color: rgb(var(--md3-on-tertiary-container));
				background-color: rgb(var(--md3-tertiary-container));
			}

			&.error {
				color: rgb(var(--md3-on-error-container));
				background-color: rgb(var(--md3-error-container));
			}

			> div:not(.stack) > span:has(~ span),
			> div:not(.stack) > span ~ span {
				display: inline-block;
				padding: 2px;
				border-radius: 2px;
				border: 1px solid;
				margin: 1px;
			}
		}
	}
</style>