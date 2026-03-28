<script setup lang="ts">
	import { IonCard, IonCardContent, IonLabel } from "@ionic/vue";
	import Color from "colorjs.io";
	import Avatar from "../Avatar.vue";
	import PresenceRating from "../PresenceRating.vue";
	import { appConfig, accessibilityConfig } from "../../lib/config";
	import { FrontingEntryComplete, Member } from "../../lib/db/entities";
	import { useBlob } from "../../lib/util/blob";
	import accountCircle from "@material-symbols/svg-600/outlined/account_circle-fill.svg";
	import FrontingEntryInterval from "./FrontingEntryInterval.vue";

	const { getObjectURL } = useBlob();

	const props = withDefaults(defineProps<{
		entry: FrontingEntryComplete,
		influencedBy?: Member[],
		showBorderColor?: boolean,
		showCover?: boolean
	}>(), {
		showCover: true,
		showBorderColor: true
	});

	function getMostRecentPresence(){
		if(!props.entry.presence) return [undefined, undefined];

		const presenceVal = Array.from(props.entry.presence.entries());

		return presenceVal.sort((a, b) => a[0].valueOf() - b[0].valueOf()).pop() || [undefined, undefined];
	}

	function getStyle(){
		const style: Record<string, string> = {};

		if(props.entry.member.cover)
			style["--data-cover"] = `url(${getObjectURL(props.entry.member.cover)})`;

		if(props.entry.member.color)
			style["--data-color"] = props.entry.member.color;

		if(props.influencedBy?.length){
			const _colors = props.influencedBy.map(x => x.color);
			let color = new Color(_colors.pop()!);

			while(_colors.length)
				color = color.range(_colors.pop()!)(.5);

			style["--data-influencing-color"] = color.toString({ format: "hex" });
		}

		return style;
	}
</script>

<template>
	<IonCard
		button
		:class="{
			influenced: props.influencedBy?.length,
			outlined: !props.entry.isMainFronter,
			influencing: !!props.entry.influencing,
			compact: !props.showCover || accessibilityConfig.disableCovers,
			'with-border-color': props.showBorderColor && accessibilityConfig.colorIndicatorPosition === 'list-item'
		}"
		:style="getStyle()"
	>
		<IonCardContent>
			<Avatar
				:image="props.entry.member.image"
				:clip-shape="props.entry.member.imageClip"
				:color="props.entry.member.color"
				:icon="accountCircle"
			/>
			<IonLabel>
				<h2>
					{{ props.entry.member.name }}
				</h2>
				<p v-if="!appConfig.hideFrontingTimer" :entry="props.entry">
					<FrontingEntryInterval v-slot="{ interval }" :entry="props.entry">
						{{ interval }}
					</FrontingEntryInterval>
				</p>
					
				<p v-if="props.entry.influencing">
					{{ $t("dashboard:fronterInfluencing", { influencedMember: props.entry.influencing.name }) }}
				</p>
				<p v-if="props.entry.customStatus">
					{{ props.entry.customStatus }}
				</p>
				<p v-if="props.entry.presence?.size">
					<PresenceRating :rating="getMostRecentPresence()[1] ?? 0" />
				</p>
			</IonLabel>
		</IonCardContent>
	</IonCard>
</template>


<style scoped>
	ion-card {
		width: 160px;
		flex: none;

		&::part(native){
			height: 100%;
			position: relative;

			* {
				z-index: 1;
			}
		}

		&.influencing {
			opacity: .5;
		}

		&.with-border-color::part(native) {
			border-top: 4px solid var(--data-color);
		}

		&.influenced::part(native) {
			background-color: color-mix(in srgb, transparent 85%, var(--data-influencing-color) 15%);
		}

		&:not(.compact)::part(native)::before {
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
			opacity: .25;
		}

		.avatar {
			display: block;
			margin: 16px auto;
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