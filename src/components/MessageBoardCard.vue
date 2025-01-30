<script setup lang="ts">

	import { alertController, IonButton, IonCard, IonItem, IonLabel } from "@ionic/vue";
	import MemberAvatar from "./member/MemberAvatar.vue";
	import { BoardMessageComplete, Member, PollEntry } from "../lib/db/entities";
	import dayjs from 'dayjs';
	import LocalizedFormat from "dayjs/plugin/localizedFormat";
	dayjs.extend(LocalizedFormat);
	import Markdown from "./Markdown.vue";
	import { appConfig } from "../lib/config";
	import MemberSelect from "../modals/MemberSelect.vue";
	import { addModal, removeModal } from "../lib/modals";
	import { h, toRaw } from "vue";
	import { updateBoardMessage } from "../lib/db/tables/boardMessages";
	import PollResults from "../modals/PollResults.vue";
	import { useTranslation } from "i18next-vue";

	const i18next = useTranslation();

	const twelveHour = appConfig.locale.twelveHourClock;

	const props = defineProps<{
		boardMessage: BoardMessageComplete,
		hidePoll?: boolean
	}>();

	function showReasonAlert(): Promise<string | undefined>{
		return new Promise(async (resolve) => {
			const alert = await alertController.create({
				header: i18next.t("other:polls.voteCast.reason"),
				buttons: [
					{
						text: i18next.t("other:alerts.cancel"),
						role: "cancel",
						handler: () => resolve(undefined)
					},
					{
						text: i18next.t("other:alerts.ok"),
						role: "confirm",
						handler: (e) => resolve(e.reason)
					}
				],
				inputs: [
					{
						name: "reason",
						type: "text",
						placeholder: i18next.t("other:polls.voteCast.reasonHint")
					}
				]
			});

			await alert.present();
		});
	}

	function showRetractCastAlert(): Promise<boolean>{
		return new Promise(async (resolve) => {
			const alert = await alertController.create({
				header: i18next.t("other:polls.voteCast.retractConfirmation"),
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

	function getVoter(): Promise<Member | undefined> {
		return new Promise(async resolve => {
			let member: Member | undefined;
			const vnode = h(MemberSelect, {
				onlyOne: true,
				discardOnSelect: true,
				customTitle: i18next.t("other:polls.voteCast.voter"),
				onDidDismiss: () => {
					removeModal(vnode);
					resolve(member);
				},
				"onUpdate:modelValue": v => { if(v[0]) member = v[0] },
			});

			const modal = await addModal(vnode);
			await (modal.el as any).present();
		})
	}

	async function showPollResults(){
			const vnode = h(PollResults, {
				onDidDismiss: () => removeModal(vnode),
				poll: props.boardMessage.poll!
			});

			const modal = await addModal(vnode);
			await (modal.el as any).present();
	}

	async function voteFor(choice: PollEntry){
		if(!props.boardMessage.poll) return;
		const voter = await getVoter();
		if(!voter) return;

		const poll = toRaw(props.boardMessage.poll);
		const _choice = poll.entries.find(x => choice === x);

		if(_choice?.votes.map(x => x.member).includes(voter.uuid)){
			const confirmation = await showRetractCastAlert();

			if(confirmation){
				const index = _choice.votes.findIndex(x => x.member === voter.uuid);
				_choice.votes.splice(index, 1);
			}
		} else {
			_choice?.votes.push({
				member: voter.uuid,
				reason: await showReasonAlert()
			});

			if(!poll.multipleChoice){
				poll.entries
					.filter(x => choice !== x)
					.forEach(x => {
						const index = x.votes.findIndex(x => x.member === voter.uuid);
						if(index > -1) x.votes.splice(index, 1)
					});
			}
		}

		await updateBoardMessage(props.boardMessage.uuid, { poll });
	}

	function calcPercentageVoted(choice: PollEntry){
		if(!props.boardMessage.poll) return 0;
		const allVotes = props.boardMessage.poll?.entries.reduce((i, x) => i + x.votes.length, 0);
		if(allVotes === 0) return 0;
		return choice.votes.length / allVotes;
	}

</script>

<template>
	<IonCard button :class="{filled: props.boardMessage.isPinned}">
		<IonItem>
			<MemberAvatar slot="start" :member="props.boardMessage.member" />
			<IonLabel>
				<div class="flexbox">
					<div class="subheader">
						<h3 style="color:var(--ion-text-color-step-400)">{{ props.boardMessage.member.name }}</h3>
						<p>{{ dayjs(props.boardMessage.date).format(`LL, ${twelveHour ? 'hh:mm A' : "HH:mm"}`) }}</p>
					</div>
					<div class="contents">
						<h1>{{ props.boardMessage.title }}</h1>
						<h2>
							<Markdown :markdown="props.boardMessage.body" />
						</h2>
						<p class="contains-poll" v-if="props.boardMessage.poll && props.hidePoll">
							{{ $t("other:polls.boardMessageContainsPoll") }}
						</p>
					</div>
					<div class="poll" v-if="props.boardMessage.poll && !props.hidePoll" @click="(e) => e.stopPropagation()">
						<IonItem button v-for="choice in props.boardMessage.poll.entries" @click="voteFor(choice)">
							<IonLabel>
								<h3>{{ choice.choice }}</h3>
								<p>{{ $t("other:polls.choice.desc", { count: choice.votes.length }) }} - {{ calcPercentageVoted(choice) * 100 }}%</p>
							</IonLabel>
						</IonItem>
						<IonButton @click="showPollResults">{{ $t("other:polls.resultsButton") }}</IonButton>
					</div>
				</div>
			</IonLabel>
		</IonItem>
	</IonCard>
</template>

<style scoped>
	ion-card ion-item {
		--background: transparent;
	}

	ion-card ion-list {
		--background: transparent;
	}

	ion-card ion-label .flexbox {
		display: flex;
		flex-direction: column;
		gap: .25em;
	}

	ion-card ion-label .subheader {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}

	ion-card ion-label .contents {
		display: flex;
		flex-direction: column;
		gap: .25em;
	}

	ion-card ion-label .contents h1 {
		font-size: 1.30em;
		margin-bottom: 0;
	}

	ion-card ion-label .contents p.contains-poll {
		opacity: .5;
	}

	ion-card ion-label .poll {
		display: flex;
		flex-direction: column;
		gap: .25em;
		border-radius: 16px;
		border: 1px solid var(--ion-text-color-step-800);
		overflow: hidden;
	}

	ion-card ion-label .poll ion-item {
		--inner-padding-bottom: 4px;
		--inner-padding-top: 4px;
		--min-height: none;
	}

	ion-card ion-label .poll ion-item ion-label {
		margin: 8px 0px;
	}
</style>