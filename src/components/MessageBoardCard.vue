<script setup lang="ts">

	import { IonCard, IonItem, IonLabel } from "@ionic/vue";
	import MemberAvatar from "./member/MemberAvatar.vue";
	import { BoardMessageComplete } from "../lib/db/entities";
	import dayjs from 'dayjs';
	import LocalizedFormat from "dayjs/plugin/localizedFormat";
	dayjs.extend(LocalizedFormat);
	import { getMarkdownFor } from "../lib/markdown";
	import { appConfig } from "../lib/config";

	const twelveHour = appConfig.locale.twelveHourClock;

	const props = defineProps<{
		boardMessage: BoardMessageComplete
	}>();

</script>

<template>
	<IonCard button>
		<IonItem>
			<MemberAvatar slot="start" :member="props.boardMessage.member" />
			<IonLabel>
				<p style="float:right">{{ dayjs(props.boardMessage.date).format(`LL, ${twelveHour ? 'hh:mm A' : "HH:mm"}`) }}</p>
				<h3 style="color:var(--ion-text-color-step-400)">{{ props.boardMessage.member.name }}</h3>
				<h1>{{ props.boardMessage.title }}</h1>
				<h2 style="margin-top: .75rem">
					<p v-html="getMarkdownFor(props.boardMessage.body)"></p>
				</h2>
			</IonLabel>
		</IonItem>
	</IonCard>
</template>

<style scoped>
	ion-card ion-item {
		--background: transparent;
	}
</style>