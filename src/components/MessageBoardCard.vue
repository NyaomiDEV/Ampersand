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
				<div class="flexbox">
					<div class="subheader">
						<h3 style="color:var(--ion-text-color-step-400)">{{ props.boardMessage.member.name }}</h3>
						<p>{{ dayjs(props.boardMessage.date).format(`LL, ${twelveHour ? 'hh:mm A' : "HH:mm"}`) }}</p>
					</div>
					<div class="contents">
						<h1>{{ props.boardMessage.title }}</h1>
						<h2>
							<p v-html="getMarkdownFor(props.boardMessage.body)"></p>
						</h2>
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
</style>