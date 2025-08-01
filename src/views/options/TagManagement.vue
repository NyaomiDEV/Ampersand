<script setup lang="ts">
	import { IonContent, IonSearchbar, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonSegment, IonSegmentButton, IonLabel, IonFab, IonFabButton, IonIcon, IonItem } from '@ionic/vue';
	import { inject, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
	import { useRoute } from 'vue-router';

	import { addOutline as addIOS } from "ionicons/icons";

	import backMD from "@material-symbols/svg-600/outlined/arrow_back.svg";
	import addMD from "@material-symbols/svg-600/outlined/add.svg";

	import { getFilteredTags } from '../../lib/search.ts';
	import { getTags } from '../../lib/db/tables/tags';
	import type { Tag } from '../../lib/db/entities.d.ts';
	import { DatabaseEvents, DatabaseEvent } from '../../lib/db/events';

	import SpinnerFullscreen from '../../components/SpinnerFullscreen.vue';
	import TagColor from '../../components/tag/TagColor.vue';
	import TagLabel from '../../components/tag/TagLabel.vue';

	const route = useRoute();

	const isIOS = inject<boolean>("isIOS");

	const search = ref(route.query.q as string || "");
	watch(route, () => {
		search.value = route.query.q as string || "";
	});

	const type = ref("member");

	const tags = shallowRef<Tag[]>();
	const filteredTags = shallowRef<Tag[]>();
	watch([search, tags, type], async () => {
		filteredTags.value = getFilteredTags(search.value, tags.value?.filter(x => x.type === type.value));
	}, {immediate: true});

	const listener = async (event: Event) => {
		if((event as DatabaseEvent).data.table === "tags")
			tags.value = await getTags();
	}

	onMounted(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		tags.value = await getTags();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" :text="isIOS ? $t('other:back') : undefined" :icon="!isIOS ? backMD : undefined" defaultHref="/options/" />
				<IonTitle>
					{{ $t("tagManagement:header") }}
				</IonTitle>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar
					:animated="true"
					:placeholder="$t('tagManagement:searchPlaceholder')"
					showCancelButton="focus"
					showClearButton="focus"
					:spellcheck="false"
					v-model="search"
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
			<IonList :inset="isIOS">
				<IonItem button v-for="tag in filteredTags" :key="tag.uuid" :routerLink="'/options/tagManagement/edit?uuid='+tag.uuid">
					<TagColor slot="start" :tag />
					<TagLabel :tag />
				</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton routerLink="/options/tagManagement/edit">
					<IonIcon :ios="addIOS" :md="addMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>
