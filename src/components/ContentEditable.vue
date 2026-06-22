<script setup lang="ts">
	import { onMounted, nextTick, useTemplateRef, shallowRef } from "vue";
	import { IonLabel, IonTextarea } from "@ionic/vue";
	import Markdown from "./Markdown.vue";
	
	const props = defineProps<{
		label?: string
		fill?: "solid" | "outline";
	}>();
	const model = defineModel<string>({ default: "" });
	const focused = shallowRef(false);
	const textarea = useTemplateRef("textarea");
	const frontmatter = shallowRef();

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
				<div class="content">
					<table v-if="frontmatter">
						<tr v-for="[key, value] in Object.entries(frontmatter)" :key="key">
							<td>{{ key }}</td>
							<td>{{ value }}</td>
						</tr>
					</table>
					<Markdown :markdown="model" @frontmatter="(fm) => frontmatter = fm" />
				</div>
			</div>
		</template>

		<IonTextarea
			v-show="focused || !model.length"
			ref="textarea"
			v-model="model"
			:fill="props.fill"
			auto-grow
			:label="props.label"
			label-placement="stacked"
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
		line-height: normal;
		color: rgb(var(--md3-on-surface-variant));
		display: flex;
		flex-direction: column;
		padding: 0 16px;

		> .content {
			margin: 8px 0 0 0;
			padding: 0 0 8px 0;

			> table {
				width: 100%;
				border-bottom: 1px solid rgb(var(--md3-on-surface));
				margin-bottom: 1em;

				td {
					padding-inline: .5em;
					padding-block: .25em;
				}
			}
		}

		&.solid {
			background: rgb(var(--md3-surface-container-highest));
			border-radius: var(--md3-corner-extra-small-top);
			border-bottom: 1px solid rgb(var(--md3-on-surface-variant));

			&:hover {
				background: rgb(var(--md3-surface-container-highest));
				border-bottom-color: rgb(var(--md3-on-surface));
			}

			&:focus {
				border-bottom-width: 3px;
				border-bottom-color: rgb(var(--md3-primary));
			}
		}
	}

</style>