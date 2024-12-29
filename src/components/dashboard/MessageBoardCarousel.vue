<script setup lang="ts">
	import { IonList, IonLabel, IonButton, IonListHeader } from '@ionic/vue';
	import { inject, onMounted, onUnmounted, ref, shallowRef, watch, WatchStopHandle } from 'vue';
	import { getBoardMessagesTable, toBoardMessageComplete } from '../../lib/db/tables/boardMessages';
	import { BoardMessageComplete } from '../../lib/db/entities';
	import BoardMessageEdit from "../../modals/BoardMessageEdit.vue";
	import { PartialBy } from '../../lib/types';

	import dayjs from 'dayjs';

	import { from, useObservable } from '@vueuse/rxjs';
	import { liveQuery } from 'dexie';
	import { getMembersTable } from '../../lib/db/tables/members';
	import { getFronting, getMainFronter } from '../../lib/db/tables/frontingEntries';
	import MessageBoardCard from '../MessageBoardCard.vue';

	const isIOS = inject<boolean>("isIOS");

	const emptyBoardMessage: PartialBy<BoardMessageComplete, "uuid" | "member"> = {
		title: "",
		body: "",
		date: new Date()
	}
	const boardMessage = shallowRef<PartialBy<BoardMessageComplete, "uuid" | "member">>({...emptyBoardMessage});
	const boardMessageEditModal = ref();

	const boardMessages = shallowRef<BoardMessageComplete[]>([]);

	let handle: WatchStopHandle;

	onMounted(() => {
		handle = watch([
			useObservable(from(liveQuery(() => getBoardMessagesTable().toArray()))),
			useObservable(from(liveQuery(() => getMembersTable().toArray()))),
		], async () => {
			boardMessages.value = await Promise.all(
				(
					await getBoardMessagesTable()
						.filter(x => dayjs(x.date).startOf('day').valueOf() === dayjs().startOf('day').valueOf())
						.toArray()
				).map(x => toBoardMessageComplete(x))
			);
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
	<IonListHeader>
		<IonLabel>{{ $t("dashboard:messageBoard.header") }}</IonLabel>
	</IonListHeader>

	<IonList :inset="isIOS">
		<MessageBoardCard :boardMessage v-for="boardMessage in boardMessages" :key="JSON.stringify(boardMessage)" @click="showModal(boardMessage)" />
	</IonList>

	<div>
		<IonButton @click="showModal()">{{ $t("dashboard:messageBoard.add") }}</IonButton>
		<IonButton fill="clear" router-link="/options/messageBoard">{{ $t("dashboard:messageBoard.view") }}</IonButton>
	</div>

	<BoardMessageEdit :boardMessage ref="boardMessageEditModal" />
</template>

<style scoped>
	div {
		display: flex;
		justify-content: center;
		gap: 16px;
	}

	.ios ion-list {
		background-color: transparent;
	}
</style>