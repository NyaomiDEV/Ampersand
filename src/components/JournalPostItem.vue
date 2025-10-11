<script setup lang="ts">

	import { IonItem, IonLabel } from "@ionic/vue";
	import MemberAvatar from "./member/MemberAvatar.vue";
	import TagChip from "./tag/TagChip.vue";
	import { JournalPostComplete, Tag } from "../lib/db/entities";
	import { formatDate } from "../lib/util/misc";
	import { isReactive, onBeforeMount, shallowRef, watch, WatchStopHandle } from "vue";
	import { getTag } from "../lib/db/tables/tags";
	import { getObjectURL } from "../lib/util/blob";

	const tags = shallowRef<Tag[]>();

	const props = defineProps<{
		post: JournalPostComplete
	}>();

	async function updateTags() {
		tags.value = (await Promise.all(props.post.tags.map(async x => await getTag(x)))).filter(x => x?.viewInLists) as Tag[];
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
	<IonItem button>
		<MemberAvatar slot="start" :member="props.post.member" />
		<IonLabel>
			<p style="float: right">{{ formatDate(props.post.date, "collapsed") }}</p>
			<p>{{ props.post.member.name }}</p>

			<img v-if="props.post.cover" class="cover" :src="getObjectURL(props.post.cover)" />
			<h1>{{ props.post.title }}</h1>
			<h2 v-if="props.post.subtitle?.length">{{ props.post.subtitle }}</h2>
			
			<div class="tags">
				<TagChip v-for="tag in tags" :key="tag.uuid" :tag="tag" />
			</div>
		</IonLabel>
	</IonItem>
</template>

<style scoped>
	ion-card .card-inner {
		display: flex;
		flex-direction: row;
		align-items: top;
		gap: 16px;
		padding: 16px;
	}

	ion-item ion-avatar {
		width: 56px;
		height: 56px;
	}

	img.cover {
		aspect-ratio: 1;
		object-fit: cover;
		height: 64px;
		border-radius: 16px;
		float: right;
	}

	div.tags {
		white-space: nowrap;
		overflow-x: scroll;
		overflow-y: hidden;
		scrollbar-width: none;
	}
</style>