<script setup lang="ts">
	import { IonCard, IonCardContent, IonLabel } from "@ionic/vue";
	import Avatar from "../Avatar.vue";
	import PresenceRating from "../PresenceRating.vue";
	import { appConfig, accessibilityConfig } from "../../lib/config";
	import { formatWrittenTime } from "../../lib/util/misc";
	import { FrontingEntryComplete } from "../../lib/db/entities";
	import { useBlob } from "../../lib/util/blob";
	import accountCircle from "@material-symbols/svg-600/outlined/account_circle-fill.svg";
	import { onMounted, onUnmounted, ref } from "vue";

	const { getObjectURL } = useBlob();

	const props = defineProps<{
		fronting: FrontingEntryComplete,
		influenced?: boolean
	}>();

	const now = ref(new Date());
	let interval: number;

	onMounted(() => {
		if(!appConfig.hideFrontingTimer)
			interval = setInterval(() => now.value = new Date(), 1000);
	});

	onUnmounted(() => {
		clearInterval(interval);
	});

	function getMostRecentPresence(frontingEntry: FrontingEntryComplete){
		if(!frontingEntry.presence) return [undefined, undefined];

		const presenceVal = Array.from(frontingEntry.presence.entries());

		return presenceVal.sort((a, b) => a[0].valueOf() - b[0].valueOf()).pop() || [undefined, undefined];
	}

	function getStyle(frontingEntry: FrontingEntryComplete){
		const style: Record<string, string> = {};

		if(frontingEntry.member.cover)
			style["--data-cover"] = `url(${getObjectURL(frontingEntry.member.cover)})`;

		return style;
	}
</script>

<template>
	<IonCard
		button
		:class="{
			influenced: props.influenced,
			outlined: !fronting.isMainFronter,
			influencing: !!fronting.influencing,
			compact: accessibilityConfig.disableCovers
		}"
		:style="getStyle(fronting)"
	>
		<IonCardContent>
			<Avatar
				:image="fronting.member.image"
				:clip-shape="fronting.member.imageClip"
				:color="fronting.member.color"
				:icon="accountCircle"
			/>
			<IonLabel>
				<h2>
					{{ fronting.member.name }}
				</h2>
				<p v-if="!appConfig.hideFrontingTimer">
					{{ formatWrittenTime(now, fronting.startTime) }}
				</p>
					
				<p v-if="fronting.influencing">
					{{ $t("dashboard:fronterInfluencing", { influencedMember: fronting.influencing.name }) }}
				</p>
				<p v-if="fronting.customStatus">
					{{ fronting.customStatus }}
				</p>
				<p v-if="fronting.presence?.size">
					<PresenceRating :rating="getMostRecentPresence(fronting)[1] ?? 0" />
				</p>
			</IonLabel>
		</IonCardContent>
	</IonCard>
</template>


<style scoped>
	ion-card {
		width: 160px;
		flex: none;
		position: relative;

		* {
			z-index: 1;
		}

		&.influencing {
			opacity: .5;
		}

		&.influenced {
			outline: 2px solid var(--ion-color-primary) !important;
		}

		&:not(.compact)::before {
			content: '\A';
			background-image: var(--data-cover);
			background-position: center;
			background-size: cover;
			width: 100%;
			height: 100%;
			display: block;
			position: absolute;
			z-index: 0;
			top: 0;
			left: 0;
			opacity: .25;
		}

		.avatar {
			display: block;
			margin: 16px auto;
			width: 48px;
			height: 48px;
		}

		ion-card-content {
			text-align: center;
			background-color: transparent;

			h2 {
				line-height: 1.5em;
			}
		}
	}
</style>