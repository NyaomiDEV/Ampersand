<script setup lang="ts">
	import {
		IonChip,
		IonIcon
	} from "@ionic/vue";

	import { Tag } from "../../lib/db/entities";

	import TagColor from "./TagColor.vue";
	import TagLabel from "./TagLabel.vue";
	import TagDescription from "../../modals/TagDescription.vue";
	import { h } from "vue";
	import { addModal, removeModal } from "../../lib/modals";

	import tagMD from "@material-symbols/svg-600/outlined/sell.svg";

	const props = defineProps<{
		tag: Tag
		clickable?: boolean
	}>();

	async function click(e: Event){
		if(!props.clickable) return;
		e.stopPropagation();
		await showModal();
	}

	async function showModal(){
		const vnode = h(TagDescription, {
			tag: props.tag,
			onDidDismiss: () => {
				removeModal(vnode);
			},
		});

		const modal = await addModal(vnode);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
		await (modal.el as any).present();
	}
</script>

<template>
	<IonChip @click="click">
		<IonIcon v-if="!props.tag.color" :icon="tagMD" />
		<TagColor :tag="props.tag" />
		<TagLabel :tag="props.tag" />
	</IonChip>
</template>
