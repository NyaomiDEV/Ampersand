<script setup lang="ts">
	import { IonContent, IonHeader, IonList, IonPage, IonTitle, IonToolbar, IonBackButton, IonCard, IonCardHeader, IonCardContent, IonFab, IonFabButton, IonCardSubtitle, IonIcon, IonCardTitle, IonItem, IonSearchbar} from '@ionic/vue';
	import { inject, onMounted, onUnmounted, ref, shallowRef, watch, WatchStopHandle } from 'vue';
	import { BoardMessage, BoardMessageComplete, getBoardMessagesTable } from '../../lib/db/entities/boardMessages';
	import BoardMessageEdit from "../../modals/BoardMessageEdit.vue";
	import { getFronting, getMainFronter } from '../../lib/db/entities/frontingEntries';
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
	import { from, useObservable } from '@vueuse/rxjs';
	import { liveQuery } from 'dexie';
	import { getMembersTable } from '../../lib/db/entities/members';
	import { getFilteredBoardMessages } from '../../lib/db/search';

	const props = defineProps<{
		q?: string
	}>();

	const isIOS = inject<boolean>("isIOS");
	const twelveHour = appConfig.locale.twelveHourClock;
	
	const emptyBoardMessage: PartialBy<BoardMessageComplete, "uuid" | "member"> = {
		title: "",
		body: "",
		date: new Date()
	}
	const boardMessage = shallowRef<PartialBy<BoardMessageComplete, "uuid" | "member">>({...emptyBoardMessage});
	const boardMessageEditModal = ref();

	const boardMessages = shallowRef<BoardMessage[]>([]);
	const search = ref(props.q || "");
	const filteredBoardMessages = getFilteredBoardMessages(search, boardMessages);

	let handle: WatchStopHandle;

	onMounted(() => {
		handle = watch([
			useObservable(from(liveQuery(() => getBoardMessagesTable().toArray()))),
			useObservable(from(liveQuery(() => getMembersTable().toArray()))),
		], async () => {
			boardMessages.value = await getBoardMessagesTable().toArray();
		}, { immediate: true });
	});

	onUnmounted(() => {
		handle();
	});

	async function showModal(_boardMessage?: BoardMessageComplete){
		if(_boardMessage)
			boardMessage.value = {..._boardMessage};
		else {
			boardMessage.value = {
				...emptyBoardMessage,
				date: new Date(),
				member: await getMainFronter() || (await getFronting())[0]
			};
		}
		await boardMessageEditModal.value.$el.present();
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
			<IonToolbar>
				<IonSearchbar :animated="true" :placeholder="$t('options:messageBoard.searchPlaceholder')"
					showCancelButton="focus" showClearButton="focus" :spellcheck="false" v-model="search" />
			</IonToolbar>
		</IonHeader>
		
		<IonContent>
			<IonList :inset="isIOS">
				<IonCard button v-for="boardMessage in filteredBoardMessages.sort((a, b) => b.date.getTime() - a.date.getTime())" :key="JSON.stringify(boardMessage)" @click="showModal(boardMessage)">
					<IonCardHeader>
						<IonCardSubtitle>{{ dayjs(boardMessage.date).format(`LL, ${twelveHour ? 'hh:mm A' : "HH:mm"}`) }}</IonCardSubtitle>
						<IonCardTitle>{{ boardMessage.title }}</IonCardTitle>
					</IonCardHeader>
					<IonItem>
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
