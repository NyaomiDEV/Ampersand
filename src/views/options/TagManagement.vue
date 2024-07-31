<script setup lang="ts">
	import { IonContent, IonSearchbar, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonSegment, IonSegmentButton, IonLabel, IonFab, IonFabButton, IonIcon, IonItem} from '@ionic/vue';
	import { inject, provide, Ref, ref } from 'vue';
	import { addOutline as addIOS } from "ionicons/icons";
	import addMD from "@material-design-icons/svg/outlined/add.svg";
	import TagEdit from "../../modals/TagEdit.vue";
	import { getFilteredTags } from '../../lib/db/liveQueries';
	import { Tag } from '../../lib/db/entities/tags';
	import { PartialBy } from '../../lib/db/types';
	import TagColor from '../../components/tag/TagColor.vue';
	import TagLabel from '../../components/tag/TagLabel.vue';

	const isIOS = inject<boolean>("isIOS");

	const type = ref("member");
	const search = ref("");
	const tags = getFilteredTags(search, type);

	const tagEditModal = ref();

	const tag: Ref<PartialBy<Tag, "uuid"> | undefined> = ref();
	provide("tag", tag);

	async function showModal(clickedTag?: Tag){
		if(clickedTag)
			tag.value = {...clickedTag};
		else {
			tag.value = {
				name: "",
				type: "member"
			};
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
		</IonHeader>
		
		<IonContent>
			<IonSegment v-model="type" value="member">
				<IonSegmentButton value="member">
					<IonLabel>{{ $t("options:tagManagement.selector.member") }}</IonLabel>
				</IonSegmentButton>
				<IonSegmentButton value="journal">
					<IonLabel>{{ $t("options:tagManagement.selector.journal") }}</IonLabel>
				</IonSegmentButton>
			</IonSegment>
			<IonList :inset="isIOS">
				<IonItem button v-for="tag in tags" :key="JSON.stringify(tag)" @click="showModal(tag)">
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

		<TagEdit ref="tagEditModal" />
	</IonPage>
</template>
