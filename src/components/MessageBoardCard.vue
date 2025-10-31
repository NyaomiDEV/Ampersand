<script setup lang="ts">

	import { alertController, IonButton, IonItem, IonLabel } from "@ionic/vue";
	import MemberAvatar from "./member/MemberAvatar.vue";
	import { BoardMessageComplete, Member, PollEntry } from "../lib/db/entities";
	import Markdown from "./Markdown.vue";
	import MemberSelect from "../modals/MemberSelect.vue";
	import { addModal, removeModal } from "../lib/modals";
	import { h, ref, toRaw } from "vue";
	import { updateBoardMessage } from "../lib/db/tables/boardMessages";
	import PollResults from "../modals/PollResults.vue";
	import { useTranslation } from "i18next-vue";
	import { formatDate, promptOkCancel } from "../lib/util/misc";

	const i18next = useTranslation();

	const props = defineProps<{
		boardMessage: BoardMessageComplete,
		hidePoll?: boolean
	}>();

	const isPollHidden = ref(props.hidePoll);

	/* Wait for Firefox and Safari to implement field-sizing in CSS and then use that instead of rows: 4 */

	function showReasonAlert(): Promise<string | undefined>{
		return new Promise((resolve) => {
			void (async () => {
				const alert = await alertController.create({
					header: i18next.t("messageBoard:polls.voteCast.reason"),
					buttons: [
						{
							text: i18next.t("other:alerts.cancel"),
							role: "cancel",
							handler: () => resolve(undefined)
						},
						{
							text: i18next.t("other:alerts.ok"),
							role: "confirm",
							handler: (e) => resolve(e.reason.length ? e.reason : null)
						}
					],
					inputs: [
						{
							name: "reason",
							type: "textarea",
							attributes: {
								rows: 4
							},
							placeholder: i18next.t("messageBoard:polls.voteCast.reasonHint")
						}
					]
				});

				await alert.present();
			})();
		});
	}

	function getVoter(): Promise<Member | undefined> {
		return new Promise(resolve => {
			void (async () => {
				let member: Member | undefined;
				const vnode = h(MemberSelect, {
					onlyOne: true,
					discardOnSelect: true,
					hideCheckboxes: true,
					customTitle: i18next.t("messageBoard:polls.voteCast.voter"),
					onDidDismiss: () => {
						removeModal(vnode);
						resolve(member);
					},
					"onUpdate:modelValue": v => { if(v[0]) member = v[0]; },
				});

				const modal = await addModal(vnode);
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
				await (modal.el as any).present();
			})();
		});
	}

	async function showPollResults(){
		const vnode = h(PollResults, {
			onDidDismiss: () => removeModal(vnode),
			poll: props.boardMessage.poll!
		});

		const modal = await addModal(vnode);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
		await (modal.el as any).present();
	}

	async function voteFor(choice: PollEntry){
		if(!props.boardMessage.poll) return;
		const voter = await getVoter();
		if(!voter) return;

		const poll = toRaw(props.boardMessage.poll);
		const _choice = poll.entries.find(x => choice === x);

		if(_choice?.votes.map(x => x.member).includes(voter.uuid)){
			const confirmation = await promptOkCancel(i18next.t("messageBoard:polls.voteCast.retractConfirmation"));

			if(confirmation){
				const index = _choice.votes.findIndex(x => x.member === voter.uuid);
				_choice.votes.splice(index, 1);
			}
		} else {
			const reason = await showReasonAlert();
			if(reason === undefined) return;

			_choice?.votes.push({
				member: voter.uuid,
				reason: reason ?? undefined
			});

			if(!poll.multipleChoice){
				poll.entries
					.filter(x => choice !== x)
					.forEach(x => {
						const index = x.votes.findIndex(x => x.member === voter.uuid);
						if(index > -1) x.votes.splice(index, 1);
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
	<IonItem button :class="{ card: true, filled: props.boardMessage.isPinned, archived: props.boardMessage.isArchived }">
		<div class="card-inner">
			<MemberAvatar v-if="props.boardMessage.member" :member="props.boardMessage.member" />
			<div class="flexbox">
				<div class="subheader">
					<span v-if="props.boardMessage.member">{{ props.boardMessage.member.name }}</span>
					<p v-if="formatDate(props.boardMessage.date, 'collapsed') !== props.boardMessage.title">
						{{ formatDate(props.boardMessage.date, "collapsed") }}
					</p>
				</div>
				<div class="contents">
					<h1>{{ props.boardMessage.title }}</h1>
					<Markdown :markdown="props.boardMessage.body" />
					<IonButton
						v-if="props.boardMessage.poll && isPollHidden"
						fill="clear"
						@click="(e) => {e.stopPropagation(); isPollHidden = false}"
					>
						{{ $t("messageBoard:polls.boardMessageContainsPoll") }}
					</IonButton>
				</div>
				<div v-if="props.boardMessage.poll && !isPollHidden" class="poll" @click="(e) => e.stopPropagation()">
					<IonItem
						v-for="choice in props.boardMessage.poll.entries"
						:key="choice.choice"
						button
						:detail="false"
						@click="voteFor(choice)"
					>
						<IonLabel>
							<h3>{{ choice.choice }}</h3>
							<p>
								{{ $t("messageBoard:polls.choice.desc", { count: choice.votes.length }) }} - {{
									Math.floor(calcPercentageVoted(choice) * 100) }}%
							</p>
							<div
								class="percentage"
								:style="{ '--vote-percentage': `${Math.max(0.005, calcPercentageVoted(choice)) * 100}%` }"
							/>
						</IonLabel>
					</IonItem>
					<IonButton @click="showPollResults">{{ $t("messageBoard:polls.resultsButton") }}</IonButton>
					<IonButton
						v-if="props.boardMessage.poll && props.hidePoll && !isPollHidden"
						fill="clear"
						@click="(e) => {e.stopPropagation(); isPollHidden = true}"
					>
						{{ $t("messageBoard:polls.collapsePoll") }}
					</IonButton>
				</div>
			</div>
		</div>
	</IonItem>
</template>

<style scoped>
	ion-item.card {
		--background: var(--ion-background-color-step-100);
		margin: 8px calc(16px + var(--ion-safe-area-right, 0px)) 8px calc(16px + var(--ion-safe-area-left, 0px));
	}

	ion-item.card::part(native) {
		border-radius: 12px;
		box-shadow: var(--md3-elevation-1);

		/* remove inner padding */
		padding-left: var(--padding-start, 0px);
		--inner-padding-end: calc(-1 * var(--ion-safe-area-right, 0px));
	}

	ion-item.filled {
		--background: var(--ion-background-color-step-200);
	}

	ion-item.archived {
		opacity: 0.5;
	}

	ion-item ion-item {
		--background: transparent;
	}

	ion-item ion-list {
		--background: transparent;
	}

	.card-inner {
		display: flex;
		flex-direction: row;
		align-items: top;
		gap: 16px;
		padding: 16px;
		width: 100%;
	}

	.card-inner > ion-avatar {
		width: 40px;
		height: 40px;
		align-self: flex-start;
		flex-shrink: 0;
		flex-grow: 0;
	}

	.flexbox {
		display: flex;
		flex-direction: column;
		gap: .25em;
		width: 100%;
	}

	.subheader {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}

	.subheader * {
		margin: 0;
	}

	.subheader span {
		font-size: 1.1em;
		color: var(--ion-text-color-step-400);
	}

	.subheader p {
		text-align: right;
	}

	.contents {
		display: flex;
		flex-direction: column;
		gap: .25em;
	}

	.contents > * {
		margin: 0;
	}

	.contents > h1 {
		font-size: 1.30em;
		margin-bottom: 0;
	}

	.poll {
		display: flex;
		flex-direction: column;
		gap: .5rem;
		overflow: hidden;
	}

	.poll ion-item {
		--inner-padding-bottom: 4px;
		--inner-padding-top: 4px;
		--inner-padding-end: 0px;
		--min-height: none;
		border: 1px solid var(--ion-text-color-step-700);
		border-radius: 16px;
	}

	.percentage {
		display: block;
		box-sizing: border-box;
		margin: 8px 0px 0px 0px;
		width: var(--vote-percentage);
		transition: width .25s ease-in-out;
		height: 4px;
		background-color: var(--ion-color-primary);
		border-radius: 4px;
	}

	.poll ion-item ion-label {
		margin: 8px 0px;
	}
</style>