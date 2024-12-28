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
		saveOutline as saveIOS,
		trashBinOutline as trashIOS
	} from "ionicons/icons";

	import saveMD from "@material-design-icons/svg/outlined/save.svg";
	import trashMD from "@material-design-icons/svg/outlined/delete.svg";

	import { getBoardMessagesTable, BoardMessageComplete, newBoardMessage } from "../lib/db/entities/boardMessages";
	import { inject, ref, shallowReactive, toRaw } from "vue";
	import { PartialBy } from "../lib/db/types";
	import MemberAvatar from "../components/member/MemberAvatar.vue";
	import MemberSelect from "./MemberSelect.vue";
	import { Member } from "../lib/db/entities/members";

	const isIOS = inject<boolean>("isIOS");

	const props = defineProps<{
		boardMessage: PartialBy<BoardMessageComplete, "uuid" | "member">
	}>();

	const boardMessage = ref(props.boardMessage);

	const memberSelectModal = ref();
	const self = ref();

	async function save(){
		const uuid = boardMessage.value?.uuid;
		const _boardMessage = toRaw(boardMessage.value);

		if(!_boardMessage.member) return;

		if(!uuid){
			await newBoardMessage({ ..._boardMessage, member: _boardMessage.member.uuid });
			await modalController.dismiss(null, "added");
	
			return;
		}

		await getBoardMessagesTable().update(uuid, {
			..._boardMessage,
			member: _boardMessage.member.uuid
		});

		try{
			await modalController.dismiss(null, "modified");
		}catch(_){}
		// catch an error because the type might get changed, causing the parent to be removed from DOM
		// however it's safe for us to ignore
	}

	async function deleteBoardMessage(){
		if(!boardMessage.value.uuid) return;

		await getBoardMessagesTable().delete(boardMessage.value.uuid);

		try{
			await modalController.dismiss(null, "deleted");
		}catch(_){}
	}

	const selectedMembers = shallowReactive<Member[]>([]);

	function present() {
		boardMessage.value = props.boardMessage;

		console.log(boardMessage.value);

		selectedMembers.length = 0;

		if(boardMessage.value.member)
			selectedMembers.push(boardMessage.value.member);
	}

	function updateSelectedMember(members: Member[]){
		if(selectedMembers.length)
			boardMessage.value.member = members[0];
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
					<IonItem button @click="memberSelectModal.$el.present()">
						<template v-if="boardMessage.member">
							<MemberAvatar slot="start" :member="boardMessage.member" />
							<IonLabel>
								<h2>{{ boardMessage.member.name }}</h2>
								<p>{{ $t("options:messageBoard.edit.member") }}</p>
							</IonLabel>
						</template>
						<template v-else>
							<IonLabel>
								<h2>{{ $t("options:messageBoard.edit.member") }}</h2>
							</IonLabel>
						</template>
					</IonItem>
					<IonItem>
						<IonInput :fill="!isIOS ? 'outline' : undefined" :label="$t('options:messageBoard.edit.title')" labelPlacement="floating" v-model="boardMessage.title" />
					</IonItem>

					<IonItem>
						<IonTextarea :fill="!isIOS ? 'outline' : undefined" auto-grow :label="$t('options:messageBoard.edit.body')" labelPlacement="floating" v-model="boardMessage.body" />
					</IonItem>

					<IonItem button v-if="boardMessage.uuid" @click="deleteBoardMessage">
						<IonIcon :ios="trashIOS" :md="trashMD" slot="start" aria-hidden="true" color="danger"/>
						<IonLabel color="danger">
							<h3>{{ $t("options:messageBoard.edit.delete.title") }}</h3>
							<p>{{ $t("options:messageBoard.edit.delete.desc") }}</p>
						</IonLabel>
					</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="save" v-if="boardMessage.title.length > 0 && boardMessage.member">
					<IonIcon :ios="saveIOS" :md="saveMD" />
				</IonFabButton>
			</IonFab>
			<MemberSelect :selectedMembers :onlyOne="true" @selectedMembers="updateSelectedMember" ref="memberSelectModal" />
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

	.md ion-input, .md ion-textarea {
		margin: 16px 0;
	}
</style>