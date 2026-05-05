<script setup lang="ts">

	import { IonItem, IonLabel } from "@ionic/vue";
	import TagChip from "../tag/TagChip.vue";
	import { JournalPostComplete, Tag } from "../../lib/db/entities";
	import { formatDate, sortName } from "../../lib/util/misc";
	import { isReactive, onBeforeMount, shallowRef, watch, WatchStopHandle } from "vue";
	import { getTag, getTagsIndex } from "../../lib/db/tables/tags";
	import { useBlob } from "../../lib/util/blob";
	import { accessibilityConfig } from "../../lib/config";

	const { getObjectURL } = useBlob();

	import accountCircle from "@material-symbols/svg-600/outlined/account_circle-fill.svg";
	import AvatarStack from "../AvatarStack.vue";

	const tags = shallowRef<Tag[]>();

	const props = withDefaults(defineProps<{
		post: JournalPostComplete,
		showTags: boolean,
		showBorderColor?: boolean,
		showDateInDateTime: boolean
	}>(), {
		showBorderColor: true
	});

	function shouldShowTags(){
		return props.showTags && props.post.tags
			.filter(x => {
				const tagIndex = getTagsIndex().find(y => y.uuid === x);
				return !tagIndex?.isArchived && tagIndex?.viewInLists;
			}).length > 0;
	}

	async function updateTags() {
		if(props.showTags){
			tags.value = (await Promise.all(props.post.tags
				.filter(x => {
					const tagIndex = getTagsIndex().find(y => y.uuid === x);
					return !tagIndex?.isArchived && tagIndex?.viewInLists;
				})
				.map(x => getTag(x))))
				.sort(sortName)
				.filter(x => x.viewInLists);
		}
	}

	function getStyle(){
		const style: Record<string, string> = {};

		if(props.post.members.length){
			const colors: string[] = props.post.members
				.filter(x => x.color)
				.map(x => x.color)
				.map((x, i, a) => {
					const percent = (i + 1) / a.length;
					return `${x as string} 0 ${percent * 100}%`;
				});

			if(!colors.length) return;

			style["--data-gradient"] = `linear-gradient(225deg, ${colors.join(",")})`;
		}

		return style;
	}

	let watchHandle: WatchStopHandle | undefined;
	watch(props, () => {
		if (isReactive(props.post)){
			watchHandle = watch(props.post, async () => {
				await updateTags();
			});
		} else if (watchHandle) {
			watchHandle();
			watchHandle = undefined;
		}
	});

	onBeforeMount(async () => {
		await updateTags();
	});
</script>

<template>
	<IonItem
		button
		:style="getStyle()"
		:class="{
			'with-border-color': props.showBorderColor && accessibilityConfig.colorIndicatorPosition === 'list-item'
		}"
	>
		<AvatarStack
			slot="start"
			:avatars="props.post.members.map(member => ({
				image: member.image,
				clipShape: member.imageClip,
				color: member.color,
				icon: accountCircle
			}))"
		/>
		<IonLabel>
			<img v-if="props.post.cover" class="cover" :src="getObjectURL(props.post.cover)" />

			<!--<div v-if="props.post.members?.length" class="authors">
				<MemberChip v-for="member in props.post.members" :key="member.uuid" :member />
			</div>-->
			<h3 v-if="props.post.members.length">{{ props.post.members.map(x => x.name).join(", ") }}</h3>

			<h1>{{ props.post.title }}</h1>
			<h2 v-if="props.post.subtitle?.length">{{ props.post.subtitle }}</h2>

			<p v-if="formatDate(props.post.date, props.showDateInDateTime ? 'collapsed' : undefined) !== props.post.title">
				{{ formatDate(props.post.date, props.showDateInDateTime ? 'collapsed' : undefined) }}
			</p>
			
			<div v-if="shouldShowTags()" class="tags">
				<TagChip v-for="tag in tags" :key="tag.uuid" :tag="tag" />
			</div>
		</IonLabel>
	</IonItem>
</template>

<style scoped>
	ion-item.with-border-color::part(native) {
		padding-inline-start: calc(4px + var(--padding-start) + var(--ion-safe-area-left, 0px));
	}

	ion-item.with-border-color::part(native)::before {
		content: "\A";
		display: block;
		position: absolute;
		top: 0;
		left: 0;
		background: var(--data-gradient);
		height: 100%;
		width: 4px;
	}

	:dir(rtl) ion-item.with-border-color::part(native)::before{
		right: 0;
		left: unset;
	}

	img.cover {
		aspect-ratio: 1;
		object-fit: cover;
		height: 64px;
		border-radius: 16px;
		float: inline-end;
	}

	div.authors, div.tags {
		white-space: nowrap;
		overflow-x: scroll;
		overflow-y: hidden;
		scrollbar-width: none;
		height: 42px;
	}

	div.authors {
		margin-bottom: 12px;
	}

	div.tags {
		margin-top: 12px;
	}
</style>