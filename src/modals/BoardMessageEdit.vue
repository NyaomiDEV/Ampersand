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
		IonButton,
		alertController
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
	import { useTranslation } from "i18next-vue";

	const i18next = useTranslation();
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
	const memberTagModal = useTemplateRef("memberTagModal");

	function promptDeletion(): Promise<boolean> {
		return new Promise(async (resolve) => {
			const alert = await alertController.create({
				header: i18next.t("messageBoard:edit.delete.title"),
				subHeader: i18next.t("messageBoard:edit.delete.confirm"),
				buttons: [
					{
						text: i18next.t("other:alerts.cancel"),
						role: "cancel",
						handler: () => resolve(false)
					},
					{
						text: i18next.t("other:alerts.ok"),
						role: "confirm",
						handler: () => resolve(true)
					}
				]
			});

			await alert.present();
		});
	}

	async function save(){
		const uuid = boardMessage.value?.uuid;

		if(boardMessage.value.poll && boardMessage.value.poll.entries.length === 0) {
			boardMessage.value.poll.entries = [
				{
					choice: i18next.t("messageBoard:polls.defaultPollValues.yes"),
					votes: []
				},
				{
					choice: i18next.t("messageBoard:polls.defaultPollValues.no"),
					votes: []
				},
				{
					choice: i18next.t("messageBoard:polls.defaultPollValues.veto"),
					votes: []
				},
				{
					choice: i18next.t("messageBoard:polls.defaultPollValues.abstain"),
					votes: []
				}
			];
		}

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

	async function removeBoardMessage(){
		if(await promptDeletion()){
			await deleteBoardMessage(boardMessage.value.uuid!);
			try{
				await modalController.dismiss(null, "deleted");
			}catch(_){}
		}
	}
</script>

<template>
	<IonModal class="board-message-edit-modal" :breakpoints="[0,1]" initialBreakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("messageBoard:edit.header") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList inset>
					<IonItem button @click="memberSelectModal?.$el.present()">
						<template v-if="boardMessage.member">
							<MemberAvatar slot="start" :member="boardMessage.member" />
							<IonLabel>
								<h2>{{ boardMessage.member.name }}</h2>
								<p>{{ $t("messageBoard:edit.member") }}</p>
							</IonLabel>
						</template>
						<template v-else>
							<IonLabel>
								<h2>{{ $t("messageBoard:edit.member") }}</h2>
							</IonLabel>
						</template>
					</IonItem>

					<IonItem>
						<IonInput :fill="!isIOS ? 'outline' : undefined" :label="$t('messageBoard:edit.title')" labelPlacement="floating" v-model="boardMessage.title" />
					</IonItem>

					<IonItem>
						<IonTextarea :fill="!isIOS ? 'outline' : undefined" auto-grow :label="$t('messageBoard:edit.body')" labelPlacement="floating" v-model="boardMessage.body" />
					</IonItem>

					<IonItem>
					<IonButton fill="clear" @click="boardMessage.body += '<t:' + Math.floor(Date.now() / 1000) + ':f>'">
						{{ $t("other:addTimestamp") }}
					</IonButton>
					<IonButton fill="clear" @click="memberTagModal?.$el.present()">
						{{ $t("other:memberMention") }}
					</IonButton>
					</IonItem>

					<IonItem button :detail="false">
						<IonToggle v-model="boardMessage.isPinned">
							<IonLabel>
								{{ $t("messageBoard:edit.isPinned") }}
							</IonLabel>
						</IonToggle>
					</IonItem>

					<IonItem button v-if="!boardMessage.poll" @click="() => { boardMessage.poll = { multipleChoice: false, entries: [] } }">
						<IonIcon :ios="chartIOS" :md="chartMD" slot="start" aria-hidden="true"/>
						<IonLabel>
							{{ $t("messageBoard:edit.attachPoll") }}
						</IonLabel>
					</IonItem>

					<template v-if="boardMessage.poll">
						<IonItem>
							<IonLabel>
								<p>{{ $t("messageBoard:edit.pollEditWarning") }}</p>
							</IonLabel>
						</IonItem>

						<IonItem button :detail="false" @click="() => { boardMessage.poll = undefined }">
							<IonIcon :ios="trashIOS" :md="trashMD" slot="start" aria-hidden="true" color="danger"/>
							<IonLabel color="danger">
								<h3>{{ $t("messageBoard:edit.deleteAttachedPoll") }}</h3>
								<p>{{ $t("other:genericDeleteDesc") }}</p>
							</IonLabel>
						</IonItem>
						<IonItem button :detail="false">
							<IonToggle v-model="boardMessage.poll.multipleChoice">
								<IonLabel>
									{{ $t("messageBoard:edit.pollIsMultipleChoice") }}
								</IonLabel>
							</IonToggle>
						</IonItem>

						<IonItem v-for="entry in boardMessage.poll.entries" :key="boardMessage.poll.entries.indexOf(entry)">
							<IonInput :fill="!isIOS ? 'outline' : undefined" :label="$t('messageBoard:edit.pollChoice')" labelPlacement="floating" v-model="entry.choice" />
							<IonButton slot="end" shape="round" fill="outline" size="default" @click="() => boardMessage.poll!.entries.splice(boardMessage.poll!.entries.indexOf(entry), 1)">
								<IonIcon :ios="trashIOS" :md="trashMD" slot="icon-only" color="danger" />
							</IonButton>
						</IonItem>

						<IonItem button @click="() => { boardMessage.poll!.entries.push({ votes: [], choice: '' }) }">
							<IonIcon :ios="addIOS" :md="addMD" slot="start" aria-hidden="true"/>
							<IonLabel>
								{{ $t("messageBoard:edit.pollAddNewChoice") }}
							</IonLabel>
						</IonItem>
					</template>

					<IonItem button :detail="false" v-if="boardMessage.uuid" @click="removeBoardMessage">
						<IonIcon :ios="trashIOS" :md="trashMD" slot="start" aria-hidden="true" color="danger"/>
						<IonLabel color="danger">
							<h3>{{ $t("messageBoard:edit.delete.title") }}</h3>
							<p>{{ $t("other:genericDeleteDesc") }}</p>
						</IonLabel>
					</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="save" v-if="boardMessage.title.length > 0 && boardMessage.member">
					<IonIcon :ios="saveIOS" :md="saveMD" />
				</IonFabButton>
			</IonFab>

			<MemberSelect
				:customTitle="$t('messageBoard:edit.member')"
				:onlyOne="true"
				:discardOnSelect="true"
				:hideCheckboxes="true"
				:modelValue="boardMessage.member ? [boardMessage.member] : []"
				@update:modelValue="(e) => { if(e[0]) boardMessage.member = e[0] }"
				ref="memberSelectModal"
			/>

			<MemberSelect
				:onlyOne="true"
				:discardOnSelect="true"
				:hideCheckboxes="true"
				:modelValue="boardMessage.member ? [boardMessage.member] : []"
				@update:modelValue="(e) => { if(e[0] && boardMessage.body) boardMessage.body += '@<m:'+e[0].uuid+'>' }"
				ref="memberTagModal"
			/>

		</IonContent>
	</IonModal>
</template>

<style scoped>
	ion-modal.board-message-edit-modal {
		--height: 75dvh;
		--min-height: 600px;
		--border-radius: 16px;
	}
</style>