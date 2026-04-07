<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonList,
		IonModal,
		IonItemDivider,
	} from "@ionic/vue";

	import { onBeforeMount, onUnmounted, shallowRef } from "vue";
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";
	import type { Member, Poll } from "../lib/db/entities";
	import { defaultMember, getMember } from "../lib/db/tables/members.ts";
	import { DatabaseEvents, DatabaseEvent } from "../lib/db/events.ts";

	import MemberItem from "../components/member/MemberItem.vue";

	const props = defineProps<{
		poll: Poll
	}>();

	const members = shallowRef<Member[]>();

	async function getPollMembers(){
		const pollMemberUUIDs = props.poll.entries.map(x => x.votes.map(x => x.member)).flat(1);

		members.value = (await Promise.all(
			pollMemberUUIDs.map(async x => await getMember(x).catch(() => defaultMember(x)))
		));
	}

	const listener = (event: Event) => {
		if((event as DatabaseEvent).data.table === "members")
			void getPollMembers();
	};

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		await getPollMembers();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});
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
			<IonList>
				<template v-for="choice in props.poll.entries.filter(x => x.votes.length)" :key="choice.choice">
					<IonItemDivider sticky>
						{{ choice.choice }} - {{ $t("messageBoard:polls.choice.desc", { count: choice.votes.length }) }}
					</IonItemDivider>
					<MemberItem
						v-for="vote in choice.votes"
						:key="vote.member"
						button
						:member="members.find(x => vote.member === x.uuid) || defaultMember()"
						:show-cover="false"
						:show-role="false"
						:show-pronouns="false"
					>
						<p>{{ vote.reason }}</p>
					</MemberItem>
				</template>
			</IonList>
		</IonContent>
	</IonModal>
</template>
