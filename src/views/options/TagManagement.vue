<script setup lang="ts">
	import { IonContent, IonSearchbar, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonSegment, IonSegmentButton, IonLabel, IonFab, IonFabButton, IonIcon, IonItem, IonItemSliding, IonItemOptions, IonItemOption } from "@ionic/vue";
	import { onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from "vue";
	import { useRoute } from "vue-router";

	import addMD from "@material-symbols/svg-600/outlined/add.svg";
	import copyMD from "@material-symbols/svg-600/outlined/content_copy.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";

	import { getFilteredTags, removeTag } from "../../lib/db/tables/tags";
	import type { Tag } from "../../lib/db/entities.d.ts";
	import { DatabaseEvents, DatabaseEvent } from "../../lib/db/events";

	import SpinnerFullscreen from "../../components/SpinnerFullscreen.vue";
	import TagColor from "../../components/tag/TagColor.vue";
	import TagLabel from "../../components/tag/TagLabel.vue";
	import { promptOkCancel, toast } from "../../lib/util/misc.ts";
	import { useTranslation } from "i18next-vue";

	const route = useRoute();
	const i18next = useTranslation();

	const list = useTemplateRef("list");

	const search = ref(route.query.q as string || "");
	watch(route, () => {
		if(route.name === "TagManagement" && route.query.q)
			search.value = route.query.q as string;
	});

	const type = ref("member");

	const tags = shallowRef<Tag[]>();
	watch([search, type], async () => {
		tags.value = (await Array.fromAsync(getFilteredTags(search.value))).filter(x => x.type === type.value).sort((a, b) => a.name.localeCompare(b.name));
	}, { immediate: true });

	const listener = (event: Event) => {
		if((event as DatabaseEvent).data.table === "tags")
			void Array.fromAsync(getFilteredTags(search.value)).then(res => tags.value = res.filter(x => x.type === type.value).sort((a, b) => a.name.localeCompare(b.name)));
	};

	onMounted(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		tags.value = (await Array.fromAsync(getFilteredTags(search.value))).filter(x => x.type === type.value).sort((a, b) => a.name.localeCompare(b.name));
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	function closeSlidingItems() {
		const el: globalThis.HTMLIonListElement = list.value?.$el;
		if(!el) return;
		const items = el.querySelectorAll<globalThis.HTMLIonItemSlidingElement>("ion-item-sliding");
		items?.forEach(i => void i.closeOpened());
	}

	async function deleteTag(tag: Tag){
		if(await promptOkCancel(
			i18next.t("tagManagement:edit.delete.title"),
			undefined,
			i18next.t("tagManagement:edit.delete.confirm")
		))
			await removeTag(tag.uuid);
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
				</IonSegment>
			</IonToolbar>
		</IonHeader>
		
		<SpinnerFullscreen v-if="!tags" />
		<IonContent v-else>
			<IonList ref="list">
				<IonItemSliding
					v-for="tag in tags"
					:key="tag.uuid"
				>
					<IonItem
						button
						:router-link="`/options/tagManagement/edit?uuid=${tag.uuid}`"
					>
						<TagColor slot="start" :tag />
						<TagLabel :tag />
					</IonItem>
					<IonItemOptions>
						<IonItemOption color="danger" @click="deleteTag(tag)">
							<IonIcon slot="icon-only" :icon="trashMD" />
						</IonItemOption>
						<IonItemOption color="tertiary" @click="copyID(tag)">
							<IonIcon slot="icon-only" :icon="copyMD" />
						</IonItemOption>
					</IonItemOptions>
				</IonItemSliding>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton router-link="/options/tagManagement/edit">
					<IonIcon :icon="addMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>
