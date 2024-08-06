<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonCard, IonCardHeader, IonCardContent, IonFab, IonFabButton, IonCardSubtitle, IonIcon, IonCardTitle, IonItem} from '@ionic/vue';
	import { inject, ref, shallowRef } from 'vue';
	import { BoardMessageComplete, boardMessages } from '../../lib/db/entities/boardMessages';
	import BoardMessageEdit from "../../modals/BoardMessageEdit.vue";
	import { getFronting, getMainFronter } from '../../lib/db/entities/frontingEntries';
	import { members } from '../../lib/db/entities/members';
	import { PartialBy } from '../../lib/db/types';

	import {
		addOutline as addIOS
	} from "ionicons/icons";

	import addMD from "@material-design-icons/svg/outlined/add.svg";
	import dayjs from 'dayjs';
	import LocalizedFormat from "dayjs/plugin/localizedFormat";
	dayjs.extend(LocalizedFormat);

	import { appConfig } from '../../lib/config';
	import MemberAvatar from '../../components/member/MemberAvatar.vue';
	import MemberLabel from '../../components/member/MemberLabel.vue';
	import { getMarkdownFor } from '../../lib/markdown';

	const isIOS = inject<boolean>("isIOS");
	const twelveHour = appConfig.locale.twelveHourClock;
	
	const emptyBoardMessage: PartialBy<BoardMessageComplete, "uuid" | "member"> = {
		title: "",
		body: "",
		date: new Date()
	}
	const boardMessage = shallowRef<PartialBy<BoardMessageComplete, "uuid" | "member">>(emptyBoardMessage);

	const boardMessageEditModal = ref();

	async function showModal(_boardMessage?: BoardMessageComplete){
		if(_boardMessage)
			boardMessage.value = {..._boardMessage};
		else {
			boardMessage.value = {...emptyBoardMessage};
		}
		boardMessageEditModal.value.$el.present();
	}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonBackButton slot="start" defaultHref="/options/" />
				<IonTitle>
					{{ $t("options:messageBoard.header") }}
				</IonTitle>
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<IonList :inset="isIOS">
				<IonCard button v-for="boardMessage in boardMessages.sort((a, b) => b.date.getTime() - a.date.getTime())" :key="JSON.stringify(boardMessage)" @click="showModal(boardMessage)">
					<IonCardHeader>
						<IonCardSubtitle>{{ dayjs(boardMessage.date).format(`LL, ${twelveHour ? 'hh:mm A' : "HH:mm"}`) }}</IonCardSubtitle>
						<IonCardTitle>{{ boardMessage.title }}</IonCardTitle>
					</IonCardHeader>
					<IonItem lines="none">
						<MemberAvatar slot="start" :member="boardMessage.member" />
						<MemberLabel :member="boardMessage.member" />
					</IonItem>
					<IonCardContent>
						<span v-html="getMarkdownFor(boardMessage.body)"></span>
					</IonCardContent>
				</IonCard>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="showModal()">
					<IonIcon :ios="addIOS" :md="addMD" />
				</IonFabButton>
			</IonFab>

			<BoardMessageEdit :boardMessage ref="boardMessageEditModal" />
		</IonContent>
	</IonPage>
</template>

<style scoped>

	ion-card ion-item {
		--background: transparent;
	}

</style>
