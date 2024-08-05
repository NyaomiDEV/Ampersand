<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonIcon,
		IonList,
		IonInput,
		IonFab,
		IonFabButton,
		IonLabel,
		IonItem,
		modalController,
		IonModal,
		IonTextarea
	} from "@ionic/vue";

	import {
		saveOutline as saveIOS
	} from "ionicons/icons";

	import saveMD from "@material-design-icons/svg/outlined/save.svg";

	import { getTable, BoardMessageComplete, newBoardMessage } from "../lib/db/entities/boardMessages";
	import { Ref, ShallowReactive, WatchStopHandle, inject, provide, ref, shallowReactive, toRaw, watch } from "vue";
	import { PartialBy } from "../lib/db/types";
	import MemberAvatar from "../components/member/MemberAvatar.vue";
	import MemberSelect from "./MemberSelect.vue";
	import { Member } from "../lib/db/entities/members";

	const boardMessage = inject<Ref<PartialBy<BoardMessageComplete, "uuid"> | undefined>>("boardMessage")!;

	const memberSelectModal = ref();
	const self = ref();

	const selectedMembers: ShallowReactive<Member[]> = shallowReactive([]);
	provide("selectedMembers", selectedMembers);

	const watchStopHandles: WatchStopHandle[] = [];

	async function save(){
		if(!boardMessage.value) return;

		const uuid = boardMessage.value?.uuid;
		const _boardMessage = toRaw(boardMessage.value);

		if(!uuid){
			await newBoardMessage({ ..._boardMessage, member: _boardMessage.member.uuid });
			await modalController.dismiss(null, "added");
	
			return;
		}

		await getTable().update(uuid, { ..._boardMessage, member: _boardMessage.member.uuid });

		try{
			await modalController.dismiss(null, "modified");
		}catch(_){}
		// catch an error because the type might get changed, causing the parent to be removed from DOM
		// however it's safe for us to ignore
	}

	function present() {
		watchStopHandles.forEach(x => x());
		watchStopHandles.length = 0;

		if(!boardMessage.value) return;

		selectedMembers.length = 0;
		selectedMembers.push(boardMessage.value.member);

		watchStopHandles.push(
			watch(selectedMembers, () => {
				if(selectedMembers.length)
					boardMessage.value!.member = selectedMembers[0];
			}, {immediate: false}),
		);
	}
</script>

<template>
	<IonModal class="board-message-edit-modal" ref="self" @willPresent="present" :breakpoints="[0,1]" initialBreakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("options:messageBoard.edit.header") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList inset>
					<IonItem button lines="none" @click="memberSelectModal.$el.present()">
						<MemberAvatar slot="start" :member="boardMessage!.member" />
						<IonLabel>
							<h2>{{ boardMessage!.member.name }}</h2>
							<p>{{ $t("options:messageBoard.edit.member") }}</p>
						</IonLabel>
					</IonItem>
					<IonItem lines="none">
						<IonInput mode="md" fill="outline" :label="$t('options:messageBoard.edit.title')" labelPlacement="floating" v-model="boardMessage!.title" />
					</IonItem>

					<IonItem lines="none">
						<IonTextarea mode="md" fill="outline" auto-grow :label="$t('options:messageBoard.edit.body')" labelPlacement="floating" v-model="boardMessage!.body" />
					</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="save" v-if="boardMessage!.title.length > 0">
					<IonIcon :ios="saveIOS" :md="saveMD" />
				</IonFabButton>
			</IonFab>
			<MemberSelect :onlyOne="true" ref="memberSelectModal" />
		</IonContent>
	</IonModal>
</template>

<style scoped>
	ion-modal.board-message-edit-modal {
		--height: 75dvh;
		--min-height: 600px;
		--border-radius: 16px;
	}

	ion-content {
		--padding-bottom: 80px;
	}

	ion-input, ion-textarea {
		margin: 16px 0;
	}
</style>