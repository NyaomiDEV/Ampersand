<script setup lang="ts">
	import { IonList, IonLabel, IonButton, IonListHeader } from '@ionic/vue';
	import { inject, onBeforeMount, onUnmounted, ref, shallowRef } from 'vue';
	import { getBoardMessages, toBoardMessageComplete } from '../../lib/db/tables/boardMessages';
	import type { BoardMessageComplete } from '../../lib/db/entities.d.ts';
	import BoardMessageEdit from "../../modals/BoardMessageEdit.vue";
	import { PartialBy } from '../../lib/types';

	import dayjs from 'dayjs';

	import { getFronting, getMainFronter } from '../../lib/db/tables/frontingEntries';
	import MessageBoardCard from '../MessageBoardCard.vue';
	import { DatabaseEvents, DatabaseEvent } from '../../lib/db/events';

	const isIOS = inject<boolean>("isIOS");

	const emptyBoardMessage: PartialBy<BoardMessageComplete, "uuid" | "member"> = {
		title: "",
		body: "",
		date: new Date()
	}
	const boardMessage = shallowRef<PartialBy<BoardMessageComplete, "uuid" | "member">>({...emptyBoardMessage});
	const boardMessageEditModal = ref();

	const boardMessages = shallowRef<BoardMessageComplete[]>([]);

	const listener = async (event: Event) => {
		if(["members", "boardMessages"].includes((event as DatabaseEvent).data.table)){
			boardMessages.value = await Promise.all(
				(await getBoardMessages())
					.filter(x => dayjs(x.date).startOf('day').valueOf() === dayjs().startOf('day').valueOf())
					.map(x => toBoardMessageComplete(x))
			);
		}
	}

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		boardMessages.value = await Promise.all(
			(await getBoardMessages())
				.filter(x => dayjs(x.date).startOf('day').valueOf() === dayjs().startOf('day').valueOf())
				.map(x => toBoardMessageComplete(x))
		);
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
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