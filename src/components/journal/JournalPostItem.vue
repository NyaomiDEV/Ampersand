<script setup lang="ts">

	import { IonItem, IonLabel } from "@ionic/vue";
	import Avatar from "../Avatar.vue";
	import TagChip from "../tag/TagChip.vue";
	import { JournalPostComplete, Tag } from "../../lib/db/entities";
	import { formatDate } from "../../lib/util/misc";
	import { isReactive, onBeforeMount, shallowRef, watch, WatchStopHandle } from "vue";
	import { getTag } from "../../lib/db/tables/tags";
	import { useBlob } from "../../lib/util/blob";
	import { accessibilityConfig } from "../../lib/config";

	const { getObjectURL } = useBlob();

	import accountCircle from "@material-symbols/svg-600/outlined/account_circle-fill.svg";

	const tags = shallowRef<Tag[]>();

	const props = withDefaults(defineProps<{
		post: JournalPostComplete,
		showBorderColor?: boolean
	}>(), {
		showBorderColor: true
	});

	async function updateTags() {
		tags.value = (await Promise.all(props.post.tags.map(async x => await getTag(x)))).filter(x => x?.viewInLists) as Tag[];
	}

	function getStyle(){
		const style: Record<string, string> = {};

		if(props.post.member?.color)
			style["--data-color"] = props.post.member.color;

		return style;
	}

	onBeforeMount(async () => {
		await updateTags();
	});

	let watchHandle: WatchStopHandle | undefined;
	watch(props, async () => {
		await updateTags();
		if (isReactive(props.post))
			watchHandle = watch(props.post, updateTags);
		else
			if (watchHandle) {
				watchHandle();
				watchHandle = undefined;
			}
	}, { immediate: true });

</script>

<template>
	<IonItem
		button
		:style="getStyle()"
		:class="{
			'with-border-color': props.showBorderColor && accessibilityConfig.colorIndicatorPosition === 'list-item'
		}"
	>
		<Avatar
			v-if="props.post.member"
			slot="start"
			:image="props.post.member.image"
			:clip-shape="props.post.member.imageClip"
			:color="props.post.member.color"
			:icon="accountCircle"
		/>
		<IonLabel>
			<img v-if="props.post.cover" class="cover" :src="getObjectURL(props.post.cover)" />
			<p v-if="formatDate(props.post.date, 'collapsed') !== props.post.title">
				{{ formatDate(props.post.date, "collapsed") }}
			</p>
			<h3 v-if="props.post.member">{{ props.post.member.name }}</h3>
			<h1>{{ props.post.title }}</h1>
			<h2 v-if="props.post.subtitle?.length">{{ props.post.subtitle }}</h2>
			
			<div class="tags">
				<TagChip v-for="tag in tags" :key="tag.uuid" :tag="tag" />
			</div>
		</IonLabel>
	</IonItem>
</template>

<style scoped>
	ion-item.with-border-color::part(native) {
		border-inline-start: 4px solid var(--data-color, transparent);
	}

	img.cover {
		aspect-ratio: 1;
		object-fit: cover;
		height: 64px;
		border-radius: 16px;
		float: inline-end;
	}

	div.tags {
		white-space: nowrap;
		overflow-x: scroll;
		overflow-y: hidden;
		scrollbar-width: none;
	}
</style>