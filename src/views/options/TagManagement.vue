<script setup lang="ts">
	import { IonContent, IonSearchbar, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonSegment, IonSegmentButton, IonLabel, IonFab, IonFabButton, IonIcon, IonItemSliding, IonItemOptions, IonItemOption } from "@ionic/vue";
	import { onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from "vue";
	import { useRoute } from "vue-router";

	import addMD from "@material-symbols/svg-600/outlined/add.svg";
	import copyMD from "@material-symbols/svg-600/outlined/content_copy.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";

	import { getFilteredTags, removeTag } from "../../lib/db/tables/tags";
	import type { Tag } from "../../lib/db/entities.d.ts";
	import { DatabaseEvents, DatabaseEvent } from "../../lib/db/events";

	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import TagItem from "../../components/tag/TagItem.vue";
	import { promptOkCancel, toast } from "../../lib/util/misc.ts";
	import { useTranslation } from "i18next-vue";
	import VirtualList from "../../components/VirtualList.vue";
	import InfiniteLoader from "../../components/InfiniteLoader.vue";
	import TheresNothingHere from "../../components/TheresNothingHere.vue";

	const route = useRoute();
	const i18next = useTranslation();

	const list = useTemplateRef("list");

	const search = ref(route.query.q as string || "");
	watch(route, () => {
		if(route.name === "TagManagement" && route.query.q)
			search.value = route.query.q as string;
	});

	const type = ref<Tag["type"]>("member");
	const tags = shallowRef<Tag[]>();
	const iter = shallowRef<AsyncGenerator<Tag>>();
	const iterDone = ref(false);

	watch([search, type], async () => {
		await resetTags();
	});

	const listener = (event: Event) => {
		if((event as DatabaseEvent).data.table === "tags")
			void resetTags();
	};

	onMounted(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await resetTags();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	async function resetTags(){
		tags.value = undefined;
		iterDone.value = false;
		iter.value = getFilteredTags(type.value, search.value);
		await pollTags();
	}

	async function pollTags(cb?: () => void){
		if(!iter.value) return;

		let i = 0;
		const _tags: Tag[] = [];
		while(true) {
			const data = await iter.value.next();
			if(data.value) _tags.push(data.value);
			i++;
			if(data.done) iterDone.value = true;
			if(i >= 20 || data.done) break;
		}

		if(!tags.value)
			tags.value = _tags;
		else
			tags.value = [...tags.value, ..._tags];

		if(cb)
			cb();
	}

	function closeSlidingItems() {
		const el: globalThis.HTMLIonListElement = list.value?.$el;
		if(!el) return;
		const items = el.querySelectorAll<globalThis.HTMLIonItemSlidingElement>("ion-item-sliding");
		items?.forEach(i => void i.closeOpened());
	}

	async function deleteTag(tag: Tag){
		try{
			if(await promptOkCancel(
				i18next.t("tagManagement:edit.delete.title"),
				undefined,
				i18next.t("tagManagement:edit.delete.confirm")
			)){
				const result = await removeTag(tag.uuid);
				if(!result.success) throw new Error(`E: ${result.err as Error}`);
			}
		}catch(e){
			await toast((e as Error).message);
		}
		closeSlidingItems();
	}

	async function copyID(tag: Tag){
		try{
			await window.navigator.clipboard.writeText(`@<t:${tag.uuid}>`);
			await toast(i18next.t("tagManagement:edit.tagIDCopiedToClipboard"));
			closeSlidingItems();
		}catch(_e){
			return;
		}
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton
					slot="start"
					default-href="/options/"
				/>
				<IonTitle>
					{{ $t("tagManagement:header") }}
				</IonTitle>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar
					:animated="true"
					:placeholder="$t('tagManagement:searchPlaceholder')"
					show-cancel-button="focus"
					show-clear-button="focus"
					:spellcheck="false"
					:value="search"
					@ion-change="e => search = e.detail.value || ''"
				/>
			</IonToolbar>
			<IonToolbar>
				<IonSegment v-model="type" value="member">
					<IonSegmentButton value="member">
						<IonLabel>{{ $t("tagManagement:selector.member") }}</IonLabel>
					</IonSegmentButton>
					<IonSegmentButton value="journal">
						<IonLabel>{{ $t("tagManagement:selector.journal") }}</IonLabel>
					</IonSegmentButton>
					<IonSegmentButton value="asset">
						<IonLabel>{{ $t("tagManagement:selector.asset") }}</IonLabel>
					</IonSegmentButton>
				</IonSegment>
			</IonToolbar>
		</IonHeader>
		
		<SpinnerFullscreen v-if="!tags" />
		<IonContent v-else>
			<TheresNothingHere v-if="!tags.filter(x => x.type === type).length" />
			<IonList ref="list">
				<VirtualList :entries="tags.filter(x => x.type === type)" :min-size="56" :gap="2">
					<template #default="{ entry: tag }">
						<IonItemSliding>
							<TagItem
								:tag
								button
								show-effects
								show-icons
								:router-link="`/options/tagManagement/edit?uuid=${tag.uuid}`"
							/>
							<IonItemOptions>
								<IonItemOption color="danger" @click="deleteTag(tag)">
									<IonIcon slot="icon-only" :icon="trashMD" />
								</IonItemOption>
								<IonItemOption color="tertiary" @click="copyID(tag)">
									<IonIcon slot="icon-only" :icon="copyMD" />
								</IonItemOption>
							</IonItemOptions>
						</IonItemSliding>
					</template>
				</VirtualList>
			</IonList>

			<InfiniteLoader v-if="!iterDone" @infinite="pollTags" />

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton router-link="/options/tagManagement/edit">
					<IonIcon :icon="addMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>