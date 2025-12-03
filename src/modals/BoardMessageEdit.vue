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
	} from "@ionic/vue";

	import addMD from "@material-symbols/svg-600/outlined/add.svg";
	import saveMD from "@material-symbols/svg-600/outlined/save.svg";
	import chartMD from "@material-symbols/svg-600/outlined/bar_chart.svg";
	import trashMD from "@material-symbols/svg-600/outlined/delete.svg";

	import { BoardMessage, PollEntry } from "../lib/db/entities";
	import { updateBoardMessage, deleteBoardMessage, newBoardMessage } from "../lib/db/tables/boardMessages";
	import { onBeforeMount, ref, shallowRef, toRaw, useTemplateRef } from "vue";
	import { PartialBy } from "../lib/types";
	import MemberAvatar from "../components/member/MemberAvatar.vue";
	import MemberSelect from "./MemberSelect.vue";
	import { useTranslation } from "i18next-vue";
	import { formatDate, promptOkCancel } from "../lib/util/misc";
	import { getPollEntriesForPoll } from "../lib/db/tables/pollEntries";
	import { deletePoll, newPoll } from "../lib/db/tables/polls";

	const i18next = useTranslation();

	const props = defineProps<{
		boardMessage?: PartialBy<BoardMessage, "id" | "member">
	}>();

	const emptyBoardMessage: PartialBy<BoardMessage, "id" | "member"> = {
		title: "",
		body: "",
		date: new Date(),
		isPinned: false,
		isArchived: false
	};
	const boardMessage = ref(props.boardMessage || { ...emptyBoardMessage });

	const pollEntries = shallowRef<PollEntry[]>();
	
	const memberSelectModal = useTemplateRef("memberSelectModal");
	const memberTagModal = useTemplateRef("memberTagModal");

	async function createPoll(){
		boardMessage.value.poll = await newPoll({
			multipleChoice: false,
		});
	}

	async function removePoll() {
		if(boardMessage.value.poll){
			await deletePoll(boardMessage.value.poll.id);
			boardMessage.value.poll = undefined;
		}
	}

	async function getPollEntries(){
		if(boardMessage.value.poll)
			pollEntries.value = (await Array.fromAsync(getPollEntriesForPoll(boardMessage.value.poll)));
	}

	// TODO: Finish this

	async function save(){
		const id = boardMessage.value?.id;

		if(boardMessage.value.poll && pollChoices.value.length === 0) {
			pollChoices.value = [
				i18next.t("messageBoard:polls.defaultPollValues.yes"),
				i18next.t("messageBoard:polls.defaultPollValues.no"),
				i18next.t("messageBoard:polls.defaultPollValues.veto"),
				i18next.t("messageBoard:polls.defaultPollValues.abstain"),
			];
		}

		// Reset the voters if the poll part has changed
		if(
			pollChoicesAtBeginning.value && boardMessage.value.poll &&
			(
				wasMultipleChoiceAtBeginning !== boardMessage.value.poll.multipleChoice ||
				pollAtBeginning.entries.map((x, i) => String(i + x.choice)).join("") !==
				boardMessage.value.poll.entries.map((x, i) => String(i + x.choice)).join("")
			)
		)
			boardMessage.value.poll.entries.forEach(x => { x.votes = []; });

		const _boardMessage = toRaw(boardMessage.value);

		if(!_boardMessage.title.length)
			_boardMessage.title = formatDate(_boardMessage.date, "collapsed");

		if(!id){
			await newBoardMessage({ ..._boardMessage });
			await modalController.dismiss(null, "added");
	
			return;
		}

		await updateBoardMessage(id, { ..._boardMessage });

		try{
			await modalController.dismiss(null, "modified");
		}catch(_){ /* empty */ }
		// catch an error because the type might get changed, causing the parent to be removed from DOM
		// however it's safe for us to ignore
	}

	async function removeBoardMessage(){
		if(await promptOkCancel(
			i18next.t("messageBoard:edit.delete.title"),
			i18next.t("messageBoard:edit.delete.confirm")
		)){
			await deleteBoardMessage(boardMessage.value.id!);
			try{
				await modalController.dismiss(null, "deleted");
			}catch(_){ /* empty */ }
		}
	}

	onBeforeMount(async () => {
		await getPollEntries();
	});
</script>

<template>
	<IonModal class="board-message-edit-modal" :breakpoints="[0,1]" initial-breakpoint="1">
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
						<IonButton
							slot="end"
							shape="round"
							fill="outline"
							size="default"
							@click="(e) => { e.stopPropagation(); boardMessage.member = undefined; }"
						>
							<IonIcon
								slot="icon-only"
								:icon="trashMD"
								color="danger"
							/>
						</IonButton>
					</template>
					<template v-else>
						<IonLabel>
							<h2>{{ $t("messageBoard:edit.member") }}</h2>
						</IonLabel>
					</template>
				</IonItem>

				<IonItem>
					<IonInput
						v-model="boardMessage.title"
						fill="outline"
						:label="$t('messageBoard:edit.title')"
						label-placement="floating"
					/>
				</IonItem>

				<IonItem>
					<IonTextarea
						v-model="boardMessage.body"
						fill="outline"
						auto-grow
						:label="$t('messageBoard:edit.body')"
						label-placement="floating"
					/>
				</IonItem>

				<IonItem>
					<IonButton fill="clear" @click="boardMessage.body = `${boardMessage.body}<t:${Math.floor(Date.now() / 1000)}:f>`">
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

				<IonItem button :detail="false">
					<IonToggle v-model="boardMessage.isArchived">
						<IonLabel>
							{{ $t("messageBoard:edit.isArchived") }}
						</IonLabel>
					</IonToggle>
				</IonItem>

				<IonItem v-if="!poll" button @click="createPoll">
					<IonIcon
						slot="start"
						:icon="chartMD"
						aria-hidden="true"
					/>
					<IonLabel>
						{{ $t("messageBoard:edit.attachPoll") }}
					</IonLabel>
				</IonItem>

				<template v-else>
					<IonItem>
						<IonLabel>
							<p>{{ $t("messageBoard:edit.pollEditWarning") }}</p>
						</IonLabel>
					</IonItem>

					<IonItem button :detail="false" @click="removePoll">
						<IonIcon
							slot="start"
							:icon="trashMD"
							aria-hidden="true"
							color="danger"
						/>
						<IonLabel color="danger">
							<h3>{{ $t("messageBoard:edit.deleteAttachedPoll") }}</h3>
							<p>{{ $t("other:genericDeleteDesc") }}</p>
						</IonLabel>
					</IonItem>
					<IonItem button :detail="false">
						<IonToggle v-model="poll.multipleChoice">
							<IonLabel>
								{{ $t("messageBoard:edit.pollIsMultipleChoice") }}
							</IonLabel>
						</IonToggle>
					</IonItem>

					<IonItem v-for="entry in poll.choices" :key="poll.choices.indexOf(entry)">
						<IonInput
							v-model="entry"
							fill="outline"
							:label="$t('messageBoard:edit.pollChoice')"
							label-placement="floating"
						/>
						<IonButton
							slot="end"
							shape="round"
							fill="outline"
							size="default"
							@click="() => boardMessage.poll!.entries.splice(boardMessage.poll!.entries.indexOf(entry), 1)"
						>
							<IonIcon
								slot="icon-only"
								:icon="trashMD"
								color="danger"
							/>
						</IonButton>
					</IonItem>

					<IonItem button @click="() => { pollChoices.push('') }">
						<IonIcon
							slot="start"
							:icon="addMD"
							aria-hidden="true"
						/>
						<IonLabel>
							{{ $t("messageBoard:edit.pollAddNewChoice") }}
						</IonLabel>
					</IonItem>
				</template>

				<IonItem
					v-if="boardMessage.id"
					button
					:detail="false"
					@click="removeBoardMessage"
				>
					<IonIcon
						slot="start"
						:icon="trashMD"
						aria-hidden="true"
						color="danger"
					/>
					<IonLabel color="danger">
						<h3>{{ $t("messageBoard:edit.delete.title") }}</h3>
						<p>{{ $t("other:genericDeleteDesc") }}</p>
					</IonLabel>
				</IonItem>
			</IonList>

			<IonFab slot="fixed" vertical="bottom" horizontal="end">
				<IonFabButton @click="save">
					<IonIcon :icon="saveMD" />
				</IonFabButton>
			</IonFab>

			<MemberSelect
				ref="memberSelectModal"
				:custom-title="$t('messageBoard:edit.member')"
				:only-one="true"
				:discard-on-select="true"
				:hide-checkboxes="true"
				:always-emit="true"
				:model-value="boardMessage.member ? [boardMessage.member] : []"
				@update:model-value="(e) => { if(e[0]) boardMessage.member = e[0] }"
			/>

			<MemberSelect
				ref="memberTagModal"
				:only-one="true"
				:discard-on-select="true"
				:hide-checkboxes="true"
				:always-emit="true"
				:model-value="[]"
				@update:model-value="(e) => { if(e[0]) boardMessage.body = `${boardMessage.body || ''}@<m:${e[0].id}>` }"
			/>

		</IonContent>
	</IonModal>
</template>
