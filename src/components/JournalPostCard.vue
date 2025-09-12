<script setup lang="ts">

	import { IonCard } from "@ionic/vue";
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
	<IonCard button>
		<div class="card-inner">
			<MemberAvatar :member="props.post.member" />
			<div class="flexbox">
				<div class="subheader">
					<span>{{ props.post.member.name }}</span>
					<p>{{ formatDate(props.post.date, "collapsed") }}</p>
				</div>
				<div class="flexbox-inner">
					<div class="contents">
						<h1>{{ props.post.title }}</h1>
						<h2 v-if="props.post.subtitle?.length">{{ props.post.subtitle }}</h2>
						<div class="tags">
							<TagChip v-for="tag in tags" :key="tag.uuid" :tag="tag" />
						</div>
					</div>
					<img v-if="props.post.cover" class="cover" :src="getObjectURL(props.post.cover)" />
				</div>
			</div>
		</div>
	</IonCard>
</template>

<style scoped>
	ion-card ion-item {
		--background: transparent;
	}

	ion-card ion-list {
		--background: transparent;
	}

	ion-card .card-inner {
		display: flex;
		flex-direction: row;
		align-items: top;
		gap: 16px;
		padding: 16px;
	}

	ion-card .card-inner > ion-avatar {
		width: 40px;
		height: 40px;
		align-self: flex-start;
		flex-shrink: 0;
		flex-grow: 0;
	}

	ion-card .flexbox {
		display: flex;
		flex-direction: column;
		gap: .5em;
		width: 100%;
	}

	ion-card .flexbox-inner {
		display: flex;
		gap: .25em;
		width: 100%;
		align-items: center;
	}

	ion-card .subheader {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}

	ion-card .subheader * {
		margin: 0;
	}

	ion-card .subheader span {
		font-size: 1.1em;
		color: var(--ion-text-color-step-400);
	}

	ion-card .subheader p {
		text-align: right;
	}

	ion-card .contents {
		display: flex;
		flex-direction: column;
		gap: .25em;
		width: 100%;
	}

	ion-card .contents > h1 {
		font-size: 1.5em;
		margin: 0;
	}

	ion-card .contents > h2 {
		font-size: 1.25em;
		margin: 0;
	}

	img.cover {
		aspect-ratio: 1;
		object-fit: cover;
		height: 64px;
		border-radius: 16px;
	}
</style>