<script setup lang="ts">
	import { IonItem, IonIcon, IonCheckbox } from "@ionic/vue";
	import { Tag } from "../../lib/db/entities";
	import TagLabel from "./TagLabel.vue";
	import TagColor from "./TagColor.vue";

	import archivedMD from "@material-symbols/svg-600/outlined/archive.svg";

	const props = defineProps<{
		tag: Tag,
		showIcons?: boolean,
		hasToggle?: "checkbox",
		toggleValue?: string,
		toggleChecked?: boolean,
		showEffects?: boolean,
		button?: boolean,
	}>();

	const emit = defineEmits<{
		"toggleUpdate": [boolean],
	}>();
</script>

<template>
	<IonItem
		:button="props.button"
		:class="{
			archived: props.showEffects && props.tag.isArchived,
		}"
	>
		<TagColor slot="start" :tag="props.tag" />
		<IonCheckbox
			v-if="props.hasToggle === 'checkbox'"
			:value="props.toggleValue"
			:checked="props.toggleChecked"
			@update:model-value="value => emit('toggleUpdate', value as boolean)"
		>
			<TagLabel :tag="props.tag">
				<template #before>
					<slot name="before" />
				</template>
				<slot />
			</TagLabel>
		</IonCheckbox>
		<TagLabel v-else :tag="props.tag">
			<template #before>
				<slot name="before" />
			</template>
			<slot />
		</TagLabel>
		<template v-if="props.showIcons">
			<IonIcon v-if="props.tag.isArchived" slot="end" :icon="archivedMD" />
		</template>
		<slot name="end" />
	</IonItem>
</template>

<style scoped>
	ion-item.archived > * {
		opacity: 0.5;
	}
</style>