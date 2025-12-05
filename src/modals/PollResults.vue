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

	import MemberAvatar from "../components/member/MemberAvatar.vue";
	import type { Member, PollEntry, Vote } from "../lib/db/entities";

	const props = defineProps<{
		pollVotes: Map<PollEntry, Vote[]>
	}>();
</script>

<template>
	<IonModal class="poll-results-modal" :breakpoints="[0,0.75,1]" initial-breakpoint="1">
		<IonHeader>
			<IonToolbar>
				<IonTitle>{{ $t("messageBoard:polls.resultsHeader") }}</IonTitle>
			</IonToolbar>
		</IonHeader>

		<IonContent>
			<IonList>
				<template v-for="choice in props.pollVotes.entries().filter(([_k,v]) => v.length)" :key="choice[0].choice">
					<IonItemDivider sticky>
						{{ choice[0].choice }} - {{ $t("messageBoard:polls.choice.desc", { count: choice[1].length }) }}
					</IonItemDivider>
					<IonItem v-for="vote in choice[1]" :key="vote.member.id">
						<MemberAvatar slot="start" :member="vote.member as Member" />
						<IonLabel>
							<h2>{{ vote.member.name }}</h2>
							<p>{{ vote.reason }}</p>
						</IonLabel>
					</IonItem>
				</template>
			</IonList>
		</IonContent>
	</IonModal>
</template>
