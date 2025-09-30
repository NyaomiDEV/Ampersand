<script setup lang="ts">
	import {
		IonContent,
		IonHeader,
		IonToolbar,
		IonTitle,
		IonList,
		IonItem,
		IonModal,
		IonItemDivider,
		IonLabel,
	} from "@ionic/vue";

	import { onBeforeMount, onUnmounted, shallowRef } from "vue";
	import MemberAvatar from "../components/member/MemberAvatar.vue";
	import SpinnerFullscreen from "../components/SpinnerFullscreen.vue";
	import type { Member, Poll } from "../lib/db/entities";
	import { defaultMember, getMembers } from "../lib/db/tables/members.ts";
	import { DatabaseEvents, DatabaseEvent } from "../lib/db/events.ts";

	const props = defineProps<{
		poll: Poll
	}>();

	const members = shallowRef<Member[]>();

	const listener = (event: Event) => {
		if((event as DatabaseEvent).data.table === "members")
			void Array.fromAsync(getMembers()).then(res => members.value = res);
	};

	onBeforeMount(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		members.value = await Array.fromAsync(getMembers());
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
					<IonItem v-for="vote in choice.votes" :key="vote.member">
						<MemberAvatar slot="start" :member="members.find(x => vote.member === x.uuid) || defaultMember()" />
						<IonLabel>
							<h2>{{ (members.find(x => vote.member === x.uuid) || defaultMember()).name }}</h2>
							<p>{{ vote.reason }}</p>
						</IonLabel>
					</IonItem>
				</template>
			</IonList>
		</IonContent>
	</IonModal>
</template>
