<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonList,
		IonModal,
		IonItemDivider,
		alertController,
		IonItemSliding,
		IonItemOptions,
		IonItemOption,
		IonIcon,
	} from "@ionic/vue";

	import { onBeforeMount, onBeforeUpdate, ref, shallowRef, toRaw, useTemplateRef, watch } from "vue";
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";
	import type { Member, Poll, PollEntry, Vote } from "../lib/db/entities";
	import { useTranslation } from "i18next-vue";
	import { defaultMember, getMember } from "../lib/db/tables/members.ts";
	import { promptOkCancel } from "../lib/util/misc.ts";

	import MemberItem from "../components/member/MemberItem.vue";

	import pencilMD from "@material-symbols/svg-600/rounded/edit.svg";
	import trashMD from "@material-symbols/svg-600/rounded/delete.svg";

	const props = defineProps<{ poll: Poll }>();
	const emit = defineEmits<{ poll: [Poll] }>();

	const poll = ref<Poll>(structuredClone(toRaw(props.poll)));
	watch(() => props.poll, () => poll.value = structuredClone(toRaw(props.poll)), { immediate: true });

	const i18next = useTranslation();
	const list = useTemplateRef("list");

	const members = shallowRef<Member[]>();

	async function getPollMembers(){
		const pollMemberUUIDs = poll.value.entries.map(x => x.votes.map(x => x.member)).flat(1);

		members.value = (await Promise.all(
			pollMemberUUIDs.map(async x => await getMember(x).catch(() => defaultMember(x)))
		));
	}

	function showEditAlert(oldBody?: string): Promise<string | undefined>{
		return new Promise((resolve) => {
			void (async () => {
				const alert = await alertController.create({
					header: i18next.t("messageBoard:polls.reason"),
					buttons: [
						{
							text: i18next.t("other:alerts.cancel"),
							role: "cancel",
							handler: () => resolve(undefined)
						},
						{
							text: i18next.t("other:alerts.ok"),
							role: "confirm",
							handler: (e) => resolve(e.comment.length ? e.comment : null)
						}
					],
					inputs: [
						{
							name: "comment",
							type: "textarea",
							attributes: {
								rows: 4
							},
							value: oldBody,
							placeholder: i18next.t("messageBoard:polls.reasonHint")
						}
					]
				});

				await alert.present();
			})();
		});
	}

	function closeSlidingItems() {
		const el: globalThis.HTMLIonListElement = list.value?.$el;
		if(!el) return;
		const items = el.querySelectorAll<globalThis.HTMLIonItemSlidingElement>("ion-item-sliding");
		items?.forEach(i => void i.closeOpened());
	}

	async function retractVote(entry: PollEntry, vote: Vote){
		closeSlidingItems();
		if(await promptOkCancel(i18next.t("messageBoard:polls.voteCast.retractConfirmation"))){
			const _index = entry.votes.findIndex(x => x.member === vote.member);
			if(_index < 0) return;

			entry.votes.splice(_index, 1);

			emit("poll", structuredClone(toRaw(poll.value)));
		}
	}

	async function modifyReason(vote: Vote){
		closeSlidingItems();
		const newBody = await showEditAlert(vote.reason);
		if(!newBody) return;

		vote.reason = newBody;
		emit("poll", structuredClone(toRaw(poll.value)));
	}

	onBeforeMount(getPollMembers);
	onBeforeUpdate(getPollMembers);
</script>

<template>
	<IonModal class="poll-results-modal" :breakpoints="[0,0.75,1]" initial-breakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("messageBoard:polls.resultsHeader") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<SpinnerFullscreen v-if="!members" />
		<IonContent v-else>
			<IonList ref="list">
				<template v-for="choice in poll.entries.filter(x => x.votes.length)" :key="choice.choice">
					<IonItemDivider sticky>
						{{ choice.choice }} - {{ $t("messageBoard:polls.choice.desc", { count: choice.votes.length }) }}
					</IonItemDivider>
					<IonItemSliding
						v-for="vote in choice.votes"
						:key="vote.member"
					>
						<MemberItem
							button
							:member="members.find(x => vote.member === x.uuid) || defaultMember()"
							:show-cover="false"
							:show-role="false"
							:show-pronouns="false"
						>
							<p class="reason">{{ vote.reason }}</p>
						</MemberItem>
						<IonItemOptions>
							<IonItemOption color="secondary" @click="modifyReason(vote)">
								<IonIcon slot="icon-only" :icon="pencilMD" />
							</IonItemOption>
							<IonItemOption color="danger" @click="retractVote(choice, vote)">
								<IonIcon slot="icon-only" :icon="trashMD" />
							</IonItemOption>
						</IonItemOptions>
					</IonItemSliding>
				</template>
			</IonList>
		</IonContent>
	</IonModal>
</template>

<style scoped>
	p.reason {
		text-wrap: wrap !important;
		overflow: visible !important;
	}
</style>