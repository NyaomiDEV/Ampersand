<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonList,
		IonPage,
		IonSearchbar,
		IonTitle,
		IonToolbar,
		IonFab,
		IonFabButton,
		IonIcon
	} from '@ionic/vue';
	import { inject, onMounted, provide, ref } from 'vue';
	import { getFilteredMembers } from '../../lib/db/liveQueries';
	import { addOutline as addIOS } from "ionicons/icons";
	import addMD from "@material-design-icons/svg/outlined/add.svg";
	import MemberEdit from '../../modals/MemberEdit.vue';
	import MemberInList from '../../components/MemberInList.vue';
	import { Tag, getTable as getTagsTable } from '../../lib/db/entities/tags';

	const isIOS = inject<boolean>("isIOS");

	const tags = ref<Tag[]>([]);
	provide("tags", tags);

	onMounted(loadTags);
	async function loadTags(){
		tags.value = await getTagsTable().toArray();
	}

	const search = ref("");
	const members = getFilteredMembers(search);

	const isOpen = ref(false);
	provide("isOpen", isOpen);
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonTitle>
					{{ $t("members:header") }}
				</IonTitle>
			</IonToolbar>
			<IonToolbar>
				<IonSearchbar
					:animated="true"
					:placeholder="$t('members:searchPlaceholder')"
					showCancelButton="focus"
					showClearButton="focus"
					:spellcheck="false"
					v-model="search"
				/>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<IonList :inset="isIOS">

				<MemberInList v-for="member in members" :member :canDelete="true" :key="member.uuid"/>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="isOpen = true">
					<IonIcon :ios="addIOS" :md="addMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>

		<MemberEdit :edit="true" :add="true" />
	</IonPage>
</template>
