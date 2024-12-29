<script setup lang="ts">
	import { IonContent, IonSearchbar, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonSegment, IonSegmentButton, IonLabel, IonFab, IonFabButton, IonIcon, IonItem } from '@ionic/vue';
	import { inject, onMounted, onUnmounted, Ref, ref, shallowRef, watch, WatchStopHandle } from 'vue';
	import { addOutline as addIOS } from "ionicons/icons";
	import addMD from "@material-design-icons/svg/outlined/add.svg";
	import TagEdit from "../../modals/TagEdit.vue";
	import { getFilteredTags } from '../../lib/db/search';
	import { getTagsTable } from '../../lib/db/tables/tags';
	import { Tag } from '../../lib/db/entities';
	import { PartialBy } from '../../lib/types';
	import TagColor from '../../components/tag/TagColor.vue';
	import TagLabel from '../../components/tag/TagLabel.vue';
	import { from, useObservable } from '@vueuse/rxjs';
	import { liveQuery } from 'dexie';

	const isIOS = inject<boolean>("isIOS");

	const type = ref("member");
	const search = ref("");
	const tags = shallowRef<Tag[]>([]);
	const filteredTags = getFilteredTags(search, type, tags);

	const tagEditModal = ref();

	const emptyTag: PartialBy<Tag, "uuid"> = {
		name: "",
		type: "member"
	};

	const tag: Ref<PartialBy<Tag, "uuid">> = ref({...emptyTag});

	const watchStopHandlers: WatchStopHandle[] = [];

	onMounted(() => {
		watchStopHandlers.push(
			watch(
				useObservable(from(liveQuery(() => getTagsTable().toArray()))),
				async () => tags.value = await getTagsTable().toArray(),
				{ immediate: true }
			)
		);
	});

	onUnmounted(() => {
		watchStopHandlers.forEach(x => x());
		watchStopHandlers.length = 0;
	});

	async function showModal(clickedTag?: Tag){
		if(clickedTag)
			tag.value = {...clickedTag};
		else {
			tag.value = {...emptyTag};
		}

		await tagEditModal.value.$el.present();
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>
					{{ $t("options:tagManagement.header") }}
				</IonTitle>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar
					:animated="true"
					:placeholder="$t('options:tagManagement.searchPlaceholder')"
					showCancelButton="focus"
					showClearButton="focus"
					:spellcheck="false"
					v-model="search"
				/>
			</IonToolbar>
			<IonToolbar>
				<IonSegment v-model="type" value="member">
					<IonSegmentButton value="member">
						<IonLabel>{{ $t("options:tagManagement.selector.member") }}</IonLabel>
					</IonSegmentButton>
					<IonSegmentButton value="journal">
						<IonLabel>{{ $t("options:tagManagement.selector.journal") }}</IonLabel>
					</IonSegmentButton>
				</IonSegment>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<IonList :inset="isIOS">
				<IonItem button v-for="tag in filteredTags" :key="JSON.stringify(tag)" @click="showModal(tag)">
					<TagColor slot="start" :tag />
					<TagLabel :tag />
				</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="showModal()">
					<IonIcon :ios="addIOS" :md="addMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>

		<TagEdit ref="tagEditModal" :tag />
	</IonPage>
</template>
