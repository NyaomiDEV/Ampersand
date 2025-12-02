<script setup lang="ts">

	import { IonItem, IonLabel } from "@ionic/vue";
	import MemberAvatar from "./member/MemberAvatar.vue";
	import TagChip from "./tag/TagChip.vue";
	import { JournalPost, Member, SQLFile, Tag } from "../lib/db/entities";
	import { formatDate } from "../lib/util/misc";
	import { isReactive, onBeforeMount, ref, shallowRef, watch, WatchStopHandle } from "vue";
	import { getObjectURL } from "../lib/util/blob";
	import { getJournalPostTagsForPost } from "../lib/db/tables/journalPostTags";

	const tags = shallowRef<Tag[]>();
	const coverUri = ref();

	const props = defineProps<{
		post: JournalPost
	}>();

	async function updateTags() {
		tags.value = (await Array.fromAsync(getJournalPostTagsForPost(props.post))).map(x => x.tag as Tag).filter(x => x.viewInLists);
	}

	async function updateCoverUri(){
		if(props.post.cover)
			coverUri.value = await getObjectURL(props.post.cover as SQLFile);
	}

	onBeforeMount(async () => {
		await updateTags();
	});

	let watchHandle: WatchStopHandle | undefined;
	watch(props, async () => {
		await updateTags();
		await updateCoverUri();
		if (isReactive(props.post)){
			watchHandle = watch(props.post, async () => {
				await updateTags();
				await updateCoverUri();
			});
		} else if (watchHandle) {
			watchHandle();
			watchHandle = undefined;
		}
	}, { immediate: true });

</script>

<template>
	<IonItem button>
		<MemberAvatar v-if="props.post.member" slot="start" :member="props.post.member as Member" />
		<IonLabel>
			<img v-if="props.post.cover" class="cover" :src="coverUri" />
			<p v-if="formatDate(props.post.date, 'collapsed') !== props.post.title">
				{{ formatDate(props.post.date, "collapsed") }}
			</p>
			<h3 v-if="props.post.member">{{ props.post.member.name }}</h3>
			<h1>{{ props.post.title }}</h1>
			<h2 v-if="props.post.subtitle?.length">{{ props.post.subtitle }}</h2>
			
			<div class="tags">
				<TagChip v-for="tag in tags" :key="tag.id" :tag="tag" />
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