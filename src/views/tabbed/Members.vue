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
	import { inject, provide, Ref, ref } from 'vue';
	import { getFilteredMembers } from '../../lib/db/liveQueries';
	import { addOutline as addIOS } from "ionicons/icons";
	import addMD from "@material-design-icons/svg/outlined/add.svg";
	import MemberEdit from '../../modals/MemberEdit.vue';
	import MemberInList from '../../components/MemberInList.vue';
	import { Member } from '../../lib/db/entities/members';
	import { PartialBy } from '../../lib/db/types';

	const isIOS = inject<boolean>("isIOS");

	const search = ref("");
	const members = getFilteredMembers(search);

	const member: Ref<PartialBy<Member, "uuid"> | undefined> = ref();
	provide("member", member);

	const isOpen = ref(false);
	provide("isOpen", isOpen);

	function showModal(clickedMember?: Member){
		if(clickedMember)
			member.value = clickedMember;
		else {
			member.value = {
				name: "",
				isArchived: false,
				isCustomFront: false,
				tags: []
			};
		}

		isOpen.value = true;
	}
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
				<MemberInList v-for="member in members" :member :canDelete="true" :key="JSON.stringify(member)" @click="showModal(member)"/>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="showModal()">
					<IonIcon :ios="addIOS" :md="addMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>

		<MemberEdit />
	</IonPage>
</template>
