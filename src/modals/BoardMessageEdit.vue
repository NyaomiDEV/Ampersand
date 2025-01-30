<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonIcon,
		IonToggle,
		IonList,
		IonInput,
		IonFab,
		IonFabButton,
		IonLabel,
		IonItem,
		modalController,
		IonModal,
		IonTextarea,
		IonButton
	} from "@ionic/vue";

	import {
		addOutline as addIOS,
		saveOutline as saveIOS,
		statsChartOutline as chartIOS,
		trashBinOutline as trashIOS
	} from "ionicons/icons";

	import addMD from "@material-symbols/svg-600/outlined/add.svg";
	import saveMD from "@material-symbols/svg-600/outlined/save.svg";
	import chartMD from "@material-symbols/svg-600/outlined/bar_chart.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";

	import { BoardMessageComplete } from "../lib/db/entities";
	import { updateBoardMessage, deleteBoardMessage, newBoardMessage } from "../lib/db/tables/boardMessages";
	import { inject, ref, toRaw, useTemplateRef } from "vue";
	import { PartialBy } from "../lib/types";
	import MemberAvatar from "../components/member/MemberAvatar.vue";
	import MemberSelect from "./MemberSelect.vue";

	const isIOS = inject<boolean>("isIOS");

	const props = defineProps<{
		boardMessage?: PartialBy<BoardMessageComplete, "uuid" | "member">
	}>();

	const emptyBoardMessage: PartialBy<BoardMessageComplete, "uuid" | "member"> = {
		title: "",
		body: "",
		date: new Date()
	}
	const boardMessage = ref(props.boardMessage || {...emptyBoardMessage});
	const pollAtBeginning = structuredClone(toRaw(boardMessage.value.poll));

	const memberSelectModal = useTemplateRef("memberSelectModal");

	async function save(){
		const uuid = boardMessage.value?.uuid;

		if(boardMessage.value.poll && boardMessage.value.poll.entries.length === 0)
			boardMessage.value.poll = undefined;

		// Reset the voters if the poll part has changed
		if(
			pollAtBeginning && boardMessage.value.poll &&
			(
				pollAtBeginning.multipleChoice !== boardMessage.value.poll.multipleChoice ||
				pollAtBeginning.entries.map((x, i) => String(i + x.choice)).join("") !==
				boardMessage.value.poll.entries.map((x, i) => String(i + x.choice)).join("")
			)
		){
			boardMessage.value.poll.entries.forEach(x => { x.votes = [] });
		}

		const _boardMessage = toRaw(boardMessage.value);

		if(!_boardMessage.member) return;

		if(!uuid){
			await newBoardMessage({ ..._boardMessage, member: _boardMessage.member.uuid });
			await modalController.dismiss(null, "added");
	
			return;
		}

		await updateBoardMessage(uuid, {
			..._boardMessage,
			member: _boardMessage.member.uuid
		});

		try{
			await modalController.dismiss(null, "modified");
		}catch(_){}
		// catch an error because the type might get changed, causing the parent to be removed from DOM
		// however it's safe for us to ignore
	}

	async function _deleteBoardMessage(){
		if(!boardMessage.value.uuid) return;

		await deleteBoardMessage(boardMessage.value.uuid);

		try{
			await modalController.dismiss(null, "deleted");
		}catch(_){}
	}
</script>

<template>
	<IonModal class="board-message-edit-modal" :breakpoints="[0,1]" initialBreakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("options:messageBoard.edit.header") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList inset>
					<IonItem button @click="memberSelectModal?.$el.present()">
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

					<IonItem button>
						<IonToggle v-model="boardMessage.isPinned">
							<IonLabel>
								{{ $t("options:messageBoard.edit.isPinned") }}
							</IonLabel>
						</IonToggle>
					</IonItem>

					<IonItem button v-if="!boardMessage.poll" @click="() => { boardMessage.poll = { multipleChoice: false, entries: [] } }">
						<IonIcon :ios="chartIOS" :md="chartMD" slot="start" aria-hidden="true"/>
						<IonLabel>
							{{ $t("options:messageBoard.edit.attachPoll") }}
						</IonLabel>
					</IonItem>

					<template v-if="boardMessage.poll">
						<IonItem>
							<IonLabel>
								<p>{{ $t("options:messageBoard.edit.pollEditWarning") }}</p>
							</IonLabel>
						</IonItem>

						<IonItem button @click="() => { boardMessage.poll = undefined }">
							<IonIcon :ios="trashIOS" :md="trashMD" slot="start" aria-hidden="true" color="danger"/>
							<IonLabel color="danger">
								<h3>{{ $t("options:messageBoard.edit.deleteAttachedPoll") }}</h3>
								<p>{{ $t("options:messageBoard.edit.delete.desc") }}</p>
							</IonLabel>
						</IonItem>
						<IonItem button>
							<IonToggle v-model="boardMessage.poll.multipleChoice">
								<IonLabel>
									{{ $t("options:messageBoard.edit.pollIsMultipleChoice") }}
								</IonLabel>
							</IonToggle>
						</IonItem>

						<IonItem v-for="entry in boardMessage.poll.entries">
							<IonInput :fill="!isIOS ? 'outline' : undefined" :label="$t('options:messageBoard.edit.pollChoice')" labelPlacement="floating" v-model="entry.choice" />
							<IonButton slot="end" shape="round" fill="outline" size="default" @click="() => boardMessage.poll!.entries.splice(boardMessage.poll!.entries.indexOf(entry), 1)">
								<IonIcon :ios="trashIOS" :md="trashMD" slot="icon-only" color="danger" />
							</IonButton>
						</IonItem>

						<IonItem button @click="() => { boardMessage.poll!.entries.push({ votes: [], choice: '' }) }">
							<IonIcon :ios="addIOS" :md="addMD" slot="start" aria-hidden="true"/>
							<IonLabel>
								{{ $t("options:messageBoard.edit.pollAddNewChoice") }}
							</IonLabel>
						</IonItem>
					</template>

					<IonItem button v-if="boardMessage.uuid" @click="_deleteBoardMessage">
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
			<MemberSelect :custom-title="$t('options:messageBoard.edit.member')" :onlyOne="true" :modelValue="boardMessage.member ? [boardMessage.member] : []" @update:modelValue="(e) => { if(e[0]) boardMessage.member = e[0] }" ref="memberSelectModal" />
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