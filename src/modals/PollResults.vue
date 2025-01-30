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

	import { inject, onMounted, onUnmounted, shallowRef } from "vue";
	import MemberAvatar from "../components/member/MemberAvatar.vue";
	import Spinner from "../components/Spinner.vue";
	import type { Member, Poll } from "../lib/db/entities";
	import { getMembers } from "../lib/db/tables/members.ts";
	import { DatabaseEvents, DatabaseEvent } from '../lib/db/events.ts';

	const isIOS = inject<boolean>("isIOS");

	const props = defineProps<{
		poll: Poll
	}>();

	const members = shallowRef<Member[]>();

	const listener = async (event: Event) => {
		if((event as DatabaseEvent).data.table == "members")
			members.value = await getMembers();
	}

	onMounted(async () => {
		DatabaseEvents.addEventListener("updated", listener);
		members.value = await getMembers();
	});

	onUnmounted(() => {
		DatabaseEvents.removeEventListener("updated", listener);
	});
</script>

<template>
	<IonModal class="poll-results-modal" :breakpoints="[0,0.25,0.75,1]" initialBreakpoint="0.75">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("other:polls.resultsHeader") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<div v-if="!members" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; --spinner-size: 72px; --spinner-width: 5px">
			<Spinner />
		</div>
		<IonContent v-else>
			<IonList :inset="isIOS">
				<template v-for="choice in props.poll.entries">
					<IonItemDivider sticky>
						{{ choice.choice }} - {{ $t("other:polls.choice.desc", { count: choice.votes.length }) }}
					</IonItemDivider>
					<IonItem v-for="vote in choice.votes">
						<MemberAvatar slot="start" :member="members.find(x => vote.member === x.uuid)!" />
						<IonLabel>
							<h2>{{ members.find(x => vote.member === x.uuid)!.name }}</h2>
							<p>{{ vote.reason }}</p>
						</IonLabel>
					</IonItem>
				</template>
			</IonList>
		</IonContent>
	</IonModal>
</template>

<style scoped>
	ion-modal.poll-results-modal {
		--height: 100dvh;
		--border-radius: 16px;
	}
</style>