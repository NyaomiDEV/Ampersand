<script setup lang="ts">
	import { IonList, IonLabel, IonButton, IonListHeader } from "@ionic/vue";
	import { h, onBeforeMount, onUnmounted, shallowRef } from "vue";
	import { getRecentBoardMessages } from "../../lib/db/tables/boardMessages";
	import type { BoardMessageComplete } from "../../lib/db/entities.d.ts";
	import BoardMessageEdit from "../../modals/BoardMessageEdit.vue";

	import MessageBoardCard from "../MessageBoardCard.vue";
	import { DatabaseEvents, DatabaseEvent } from "../../lib/db/events";
	import { addModal, removeModal } from "../../lib/modals.ts";
	import { appConfig } from "../../lib/config/index.ts";

	const boardMessages = shallowRef<BoardMessageComplete[]>();

	async function updateBoardMessages(){
		boardMessages.value = (await getRecentBoardMessages(appConfig.dashboardSettings.messageBoardCarousel.settings.maxDays));
	}

	const listener = (event: Event) => {
		if(["members", "boardMessages"].includes((event as DatabaseEvent).data.table))
			void updateBoardMessages();
	};

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
		// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
		await (modal.el as any).present();
	}
</script>

<template>
	<IonListHeader>
		<IonLabel>{{ $t("dashboard:messageBoard.header") }}</IonLabel>
	</IonListHeader>

	<IonList>
		<MessageBoardCard
			v-for="boardMessage in boardMessages"
			:key="boardMessage.uuid"
			:board-message
			:hide-poll="!boardMessage.isPinned"
			show-date-in-date-time
			@click="showModal(boardMessage)"
		/>
	</IonList>

	<div>
		<IonButton size="small" @click="showModal()">{{ $t("dashboard:messageBoard.add") }}</IonButton>
		<IonButton size="small" fill="clear" router-link="/options/messageBoard">{{ $t("dashboard:messageBoard.view") }}</IonButton>
	</div>
</template>

<style scoped>
	div {
		display: flex;
		justify-content: center;
		gap: 16px;
	}
</style>