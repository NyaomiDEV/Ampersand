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

	import addMD from "@material-symbols/svg-600/rounded/add.svg";
	import saveMD from "@material-symbols/svg-600/rounded/save.svg";
	import chartMD from "@material-symbols/svg-600/rounded/bar_chart.svg";
	import trashMD from "@material-symbols/svg-600/rounded/delete.svg";
	import fileMD from "@material-symbols/svg-600/rounded/attach_file_add.svg";
	import imageMD from "@material-symbols/svg-600/rounded/add_photo_alternate.svg";
	import personAddMD from "@material-symbols/svg-600/rounded/person_add.svg";
	import clockAddMD from "@material-symbols/svg-600/rounded/more_time.svg";

	import { BoardMessage, BoardMessageComplete, Member, UUIDable } from "../lib/db/entities";
	import { updateBoardMessage, deleteBoardMessage, newBoardMessage } from "../lib/db/tables/boardMessages";
	import { onMounted, ref, toRaw, useTemplateRef } from "vue";
	import { PartialBy } from "../lib/types";
	import MemberSelect from "./MemberSelect.vue";
	import DatePopupPicker from "../components/DatePopupPicker.vue";
	import { useTranslation } from "i18next-vue";
	import { formatDate, getCustomName, promptOkCancel, sortName, toast } from "../lib/util/misc";
	import MemberChip from "../components/member/MemberChip.vue";
	import Loading from "./Loading.vue";
	import { getFrontingAtIndex } from "../lib/db/tables/frontingEntries.ts";
	import { defaultMember, getMember } from "../lib/db/tables/members.ts";
	import { quickAddAsset } from "../lib/db/tables/assets.ts";

	const i18next = useTranslation();

	const props = defineProps<{
		boardMessage?: PartialBy<BoardMessageComplete, keyof UUIDable>,
		dateOverride?: Date
	}>();

	const emptyBoardMessage: PartialBy<BoardMessageComplete, keyof UUIDable> = {
		members: [],
		title: "",
		body: "",
		date: props.dateOverride || new Date(),
		isPinned: false,
		isArchived: false
	};
	const boardMessage = ref(props.boardMessage || { ...emptyBoardMessage });
	const pollAtBeginning = structuredClone(toRaw(boardMessage.value.poll));

	const memberSelectModal = useTemplateRef("memberSelectModal");
	const memberTagModal = useTemplateRef("memberTagModal");
	const loadingModal = useTemplateRef("loadingModal");

	const bodyTextarea = useTemplateRef("bodyTextarea");

	const frontingAtCreationDate = ref<string>();

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
		)
			boardMessage.value.poll.entries.forEach(x => { x.votes = []; });

		const _boardMessage = toRaw(boardMessage.value);

		try{
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.present();

			if(!_boardMessage.title.length)
				_boardMessage.title = formatDate(_boardMessage.date, "collapsed");

			if(!uuid){
				const result = await newBoardMessage({
					..._boardMessage,
					members: _boardMessage.members.map(x => x.uuid)
				});
				if(!result.success) throw new Error(`E: ${result.err || "failed"}`);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				await loadingModal.value?.$el.dismiss();

				await modalController.dismiss(null, "added");	
				return;
			}

			const result = await updateBoardMessage({
				..._boardMessage,
				members: _boardMessage.members.map(x => x.uuid)
			} as BoardMessage);

			if(!result.success) throw new Error(`E: ${result.err || "failed"}`);

			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.dismiss();

			await modalController.dismiss(null, "modified").catch(() => false);		
		}catch(e){
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.dismiss();

			await toast((e as Error).message);
		}
	}

	async function removeBoardMessage(){
		try{
			if(await promptOkCancel(
				i18next.t("messageBoard:edit.delete.title"),
				undefined,
				i18next.t("messageBoard:edit.delete.confirm")
			)){
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				await loadingModal.value?.$el.present();

				const result = await deleteBoardMessage(boardMessage.value.uuid!);
				if(!result.success) throw new Error(`E: ${result.err || "failed"}`);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				await loadingModal.value?.$el.dismiss();

				await modalController.dismiss(null, "deleted").catch(() => false);
			}
		}catch(e){
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			await loadingModal.value?.$el.dismiss();

			await toast((e as Error).message);
		}
	}

	async function addTimestampInBody(){
		try {
			const htmlEl = bodyTextarea.value?.$el as globalThis.HTMLIonTextareaElement;
			const input = await htmlEl.getInputElement();

			const start = input.selectionStart;
			const end = input.selectionEnd;

			const before = boardMessage.value.body.slice(0, start);
			const after = boardMessage.value.body.slice(end);

			boardMessage.value.body = `${before}<t:${Math.floor(Date.now() / 1000)}:f>${after}`;
		}catch(e){
			await toast((e as Error).message);
		}
	}

	async function tagMemberInBody(member: Member){
		try {
			const htmlEl = bodyTextarea.value?.$el as globalThis.HTMLIonTextareaElement;
			const input = await htmlEl.getInputElement();

			const start = input.selectionStart;
			const end = input.selectionEnd;

			const before = boardMessage.value.body.slice(0, start);
			const after = boardMessage.value.body.slice(end);

			boardMessage.value.body = `${before}@<m:${member.uuid}>${after}`;
		}catch(e){
			await toast((e as Error).message);
		}
	}

	async function addAssetInBody(type: "image" | "file"){
		try {
			const asset = await quickAddAsset(type);
			if(!asset.success) throw new Error(`E: ${asset.err || "failed"}`);

			boardMessage.value.body += `${type === "image" ? "!" : ""}[](@${asset.detail.friendlyName})`;
		}catch(e){
			await toast((e as Error).message);
		}
	}

	async function getPeopleFrontingAtCreation(){
		if(!boardMessage.value?.dateCreated) return;

		const frontingIndex = getFrontingAtIndex(boardMessage.value.dateCreated);
		const memberUUIDs = new Set(frontingIndex.map(x => x.member!));

		frontingAtCreationDate.value = (await Promise.all(
			memberUUIDs.values()
				.map(x => getMember(x).catch(_ => defaultMember(x)))
		))
			.map(x => getCustomName(x))
			.join(", ");
	}

	onMounted(getPeopleFrontingAtCreation);
</script>

<template>
	<IonModal class="board-message-edit-modal" :breakpoints="[0,1]" initial-breakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("messageBoard:edit.header") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList>
				<IonItem
					button
					detail
					@click="memberSelectModal?.$el.present()"
				>
					<IonLabel>
						<h2>{{ $t("messageBoard:edit.member") }}</h2>
						<p>
							<MemberChip v-for="member in boardMessage.members.toSorted(sortName)" :key="member.uuid" :member />
						</p>
					</IonLabel>
				</IonItem>
				<IonItem button :detail="true" @click="($refs.datePicker as any)?.$el.present()">
					<IonLabel>
						<h2>{{ $t("messageBoard:edit.date") }}</h2>
						<p>{{ formatDate(boardMessage.date, "expanded") }}</p>
					</IonLabel>
					<DatePopupPicker
						ref="datePicker"
						v-model="boardMessage.date"
						show-default-buttons
						:title="$t('messageBoard:edit.date')"
					/>
				</IonItem>
			</IonList>

			<IonList class="surface">
				<IonItem>
					<IonInput
						v-model="boardMessage.title"
						fill="solid"
						:label="$t('messageBoard:edit.title')"
						label-placement="floating"
					/>
				</IonItem>

				<IonItem>
					<IonTextarea
						ref="bodyTextarea"
						v-model="boardMessage.body"
						fill="solid"
						auto-grow
						:label="$t('messageBoard:edit.body')"
						label-placement="floating"
					/>
				</IonItem>

				<IonItem>
					<IonButton fill="clear" :aria-label="$t('other:addTimestamp')" @click="addTimestampInBody">
						<IonIcon slot="icon-only" :icon="clockAddMD" />
					</IonButton>
					<IonButton fill="clear" :aria-label="$t('other:memberMention')" @click="memberTagModal?.$el.present()">
						<IonIcon slot="icon-only" :icon="personAddMD" />
					</IonButton>
					<IonButton fill="clear" @click="addAssetInBody('file')">
						<IonIcon slot="icon-only" :icon="fileMD" />
					</IonButton>
					<IonButton fill="clear" @click="addAssetInBody('image')">
						<IonIcon slot="icon-only" :icon="imageMD" />
					</IonButton>
				</IonItem>
			</IonList>
			
			<IonList class="grid-2">
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

				<IonItem
					v-if="!boardMessage.poll"
					button
					class="take-row"
					@click="() => { boardMessage.poll = { multipleChoice: false, entries: [{ votes: [], choice: '' }] } }"
				>
					<IonIcon
						slot="start"
						:icon="chartMD"
						aria-hidden="true"
					/>
					<IonLabel>
						{{ $t("messageBoard:edit.attachPoll") }}
					</IonLabel>
				</IonItem>
			</IonList>

			<template v-if="boardMessage.poll">
				<IonList>
					<IonItem>
						<IonLabel>
							<p>{{ $t("messageBoard:edit.pollEditWarning") }}</p>
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
						<IonInput
							v-model="entry.choice"
							fill="solid"
							:label="$t('messageBoard:edit.pollChoice')"
							label-placement="floating"
						/>
						<IonButton
							slot="end"
							shape="round"
							fill="outline"
							size="small"
							@click="() => boardMessage.poll!.entries.splice(boardMessage.poll!.entries.indexOf(entry), 1)"
						>
							<IonIcon
								slot="icon-only"
								:icon="trashMD"
								color="danger"
							/>
						</IonButton>
					</IonItem>

					<IonItem button @click="() => { boardMessage.poll!.entries.push({ votes: [], choice: '' }) }">
						<IonIcon
							slot="start"
							:icon="addMD"
							aria-hidden="true"
						/>
						<IonLabel>
							{{ $t("messageBoard:edit.pollAddNewChoice") }}
						</IonLabel>
					</IonItem>
					<IonItem button :detail="false" @click="() => { boardMessage.poll = undefined }">
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
				</IonList>
			</template>
			<IonList>
				<IonItem
					v-if="boardMessage.uuid"
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
				<IonItem v-if="boardMessage.dateCreated" :detail="false">
					<IonLabel>
						<p>
							{{ $t("other:creation.dateCreated", { dateCreated: formatDate(boardMessage.dateCreated, "expanded") }) }}
						</p>
						<p v-if="frontingAtCreationDate?.length">
							{{ $t("other:creation.frontingAtCreationDate", { frontingAtCreationDate }) }}
						</p>
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
				v-model="boardMessage.members"
				:custom-title="$t('messageBoard:edit.member')"
				:always-emit="true"
			/>

			<MemberSelect
				ref="memberTagModal"
				:only-one="true"
				:discard-on-select="true"
				:hide-checkboxes="true"
				:always-emit="true"
				:model-value="[]"
				@update:model-value="(e) => { if(e[0]) void tagMemberInBody(e[0]) }"
			/>

			<Loading ref="loadingModal" />
		</IonContent>
	</IonModal>
</template>

<style scoped>
	.grid-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
	}

	.take-row {
		grid-column: 1 / span 2;
	}

	.grid-2 ion-item::part(native) {
		height: 100%;
	}
</style>
