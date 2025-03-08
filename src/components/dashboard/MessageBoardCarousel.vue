<script setup lang="ts">
	import { IonList, IonLabel, IonButton, IonListHeader } from '@ionic/vue';
	import { h, inject, onBeforeMount, onUnmounted, shallowRef } from 'vue';
	import { getRecentBoardMessages } from '../../lib/db/tables/boardMessages';
	import type { BoardMessageComplete } from '../../lib/db/entities.d.ts';
	import BoardMessageEdit from "../../modals/BoardMessageEdit.vue";

	import MessageBoardCard from '../MessageBoardCard.vue';
	import { DatabaseEvents, DatabaseEvent } from '../../lib/db/events';
	import { addModal, removeModal } from '../../lib/modals.ts';

	const isIOS = inject<boolean>("isIOS");

	const boardMessages = shallowRef<BoardMessageComplete[]>();

	async function updateBoardMessages(){
		boardMessages.value = await Promise.all(
			(await getRecentBoardMessages()).sort((a,b) => {
				if(a.isPinned && !b.isPinned) return -1;
				if(!a.isPinned && b.isPinned) return 1;
				return a.date.getTime() - b.date.getTime();
			})
		);
	}

	const listener = async (event: Event) => {
		if(["members", "boardMessages"].includes((event as DatabaseEvent).data.table))
			await updateBoardMessages();
	}

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await updateBoardMessages();
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
		<MessageBoardCard :boardMessage v-for="boardMessage in boardMessages" :key="boardMessage.uuid" @click="showModal(boardMessage)" :hidePoll="!boardMessage.isPinned" />
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