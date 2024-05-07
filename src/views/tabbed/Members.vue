<script setup lang="ts">
	import { IonContent, IonHeader, IonLabel, IonList, IonPage, IonSearchbar, IonTitle, IonToolbar } from '@ionic/vue';
	import { inject, ref } from 'vue';
	import { getFilteredMembers } from '../../lib/db/liveQueries';
	import MemberInList from '../../components/MemberInList.vue';

	const isIOS = inject<boolean>("isIOS");

	const search = ref("");
	const members = getFilteredMembers(search);
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
					:debounce="1000"
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

				<!-- FIXME: Remove this when modal is done -->
				<IonLabel>
					TODO: Member add/edit modal. If you want to test this view, add a member through Testing Grounds
				</IonLabel>

				<MemberInList v-for="member in members" :member />
			</IonList>
		</IonContent>
	</IonPage>
</template>
