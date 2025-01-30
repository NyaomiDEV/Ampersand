<script setup lang="ts">
	import { IonList, IonLabel, IonButton, IonListHeader } from '@ionic/vue';
	import { h, inject, onBeforeMount, onUnmounted, shallowRef } from 'vue';
	import { getBoardMessages, toBoardMessageComplete } from '../../lib/db/tables/boardMessages';
	import type { BoardMessageComplete } from '../../lib/db/entities.d.ts';
	import BoardMessageEdit from "../../modals/BoardMessageEdit.vue";

	import dayjs from 'dayjs';

	import MessageBoardCard from '../MessageBoardCard.vue';
	import { DatabaseEvents, DatabaseEvent } from '../../lib/db/events';
	import { addModal, removeModal } from '../../lib/modals.ts';

	const isIOS = inject<boolean>("isIOS");

	const boardMessages = shallowRef<BoardMessageComplete[]>([]);

	const listener = async (event: Event) => {
		if(["members", "boardMessages"].includes((event as DatabaseEvent).data.table)){
			boardMessages.value = await Promise.all(
				(await getBoardMessages())
					.filter(x => x.isPinned ? true : dayjs().startOf('day').valueOf() - dayjs(x.date).startOf('day').valueOf() < 3 * 24 * 60 * 60 * 1000)
					.sort((a,b) => {
						if(a.isPinned && !b.isPinned) return -1;
						if(!a.isPinned && b.isPinned) return 1;
						return a.date.getTime() - b.date.getTime();
					})
					.map(x => toBoardMessageComplete(x))
			);
		}
	}

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		boardMessages.value = await Promise.all(
			(await getBoardMessages())
				.filter(x => x.isPinned ? true : dayjs().startOf('day').valueOf() - dayjs(x.date).startOf('day').valueOf() < 3 * 24 * 60 * 60 * 1000)
				.sort((a,b) => {
						if(a.isPinned && !b.isPinned) return -1;
						if(!a.isPinned && b.isPinned) return 1;
						return a.date.getTime() - b.date.getTime();
				})
				.map(x => toBoardMessageComplete(x))
		);
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});

	async function showModal(clickedBoardMessage?: BoardMessageComplete){
		const vnode = h(BoardMessageEdit, {
			boardMessage: clickedBoardMessage,
			onDidDismiss: () => removeModal(vnode)
		});

		const modal = await addModal(vnode);
		await (modal.el as any).present();
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