<script setup lang="ts">
	import { IonContent, IonSearchbar, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonSegment, IonSegmentButton, IonLabel, IonFab, IonFabButton, IonIcon} from '@ionic/vue';
	import { inject, provide, Ref, ref } from 'vue';
	import { addOutline as addIOS } from "ionicons/icons";
	import addMD from "@material-design-icons/svg/outlined/add.svg";
	import TagEdit from "../../modals/TagEdit.vue";
	import TagInList from "../../components/TagInList.vue";
	import { getFilteredTags } from '../../lib/db/liveQueries';
	import { Tag } from '../../lib/db/entities/tags';
import { PartialBy } from '../../lib/db/types';

	const isIOS = inject<boolean>("isIOS");

	const type = ref("member");
	const search = ref("");
	const tags = getFilteredTags(search, type);

	const isOpen = ref(false);
	provide("isOpen", isOpen);

	const tag: Ref<PartialBy<Tag, "uuid"> | undefined> = ref();
	provide("tag", tag);

	function showModal(clickedTag?: Tag){
		if(clickedTag)
			tag.value = clickedTag;
		else {
			tag.value = {
				name: "",
				type: "member"
			};
		}

		isOpen.value = true;
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
				<TagInList v-for="tag in tags" :tag :key="JSON.stringify(tag)" @click="showModal(tag)"/>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="showModal()">
					<IonIcon :ios="addIOS" :md="addMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>

		<TagEdit />
	</IonPage>
</template>
