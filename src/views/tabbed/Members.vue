<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonList,
		IonPage,
		IonSearchbar,
		IonTitle,
		IonToolbar,
		modalController,
		IonFab,
		IonFabButton,
		IonIcon
	} from '@ionic/vue';
	import { inject, ref } from 'vue';
	import { getFilteredMembers } from '../../lib/db/liveQueries';
	import { addOutline as addIOS } from "ionicons/icons";
	import addMD from "@material-design-icons/svg/outlined/add.svg";
	import MemberEdit from '../../modals/MemberEdit.vue';
	import MemberInList from '../../components/MemberInList.vue';

	const isIOS = inject<boolean>("isIOS");

	const search = ref("");
	const members = getFilteredMembers(search);

	async function addNew(){
		const modal = ref<HTMLIonModalElement>();
		modal.value = await modalController.create({
			component: MemberEdit,
			componentProps: {
				add: true,
				edit: true,
				self: modal
			}
		});

		await modal.value.present();
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

				<MemberInList v-for="member in members" :member :canDelete="true" :key="member.uuid"/>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="addNew">
					<IonIcon :ios="addIOS" :md="addMD" />
				</IonFabButton>
			</IonFab>
		</IonContent>
	</IonPage>
</template>
