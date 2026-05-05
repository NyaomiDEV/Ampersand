<script setup lang="ts">
	import { FrontingEntryComplete } from "../../lib/db/entities";
	import dayjs from "dayjs";
	import { formatDate } from "../../lib/util/misc";
	import PresenceRating from "../PresenceRating.vue";

	const props = defineProps<{
		entry: FrontingEntryComplete,
		showDate: boolean
	}>();

	function format(startTime: Date, endTime?: Date){
		if(!endTime) return formatDate(startTime, "expanded");

		const start = dayjs(startTime);
		const end = dayjs(endTime);

		if(end.valueOf() - start.endOf("day").valueOf() <= 0) // same day
			return `${formatDate(startTime)}~${formatDate(endTime)}`;
		
		return `${formatDate(startTime, "expanded")} - ${formatDate(endTime, "expanded")}`;
	}

	function getMostRecentPresence(){
		if(!props.entry.presence) return [undefined, undefined];

		const presenceVal = Array.from(props.entry.presence.entries());

		return presenceVal.sort((a, b) => a[0].valueOf() - b[0].valueOf()).pop() || [undefined, undefined];
	}
</script>

<template>
	<p v-if="props.entry.influencing" class="influencing" style="color: inherit;">
		{{ $t("frontHistory:influencing", { influencedMember: props.entry.influencing.name }) }}
	</p>
	<p v-if="props.entry.customStatus" class="custom-status" style="color: inherit;">
		{{ props.entry.customStatus }}
	</p>
	<p v-if="props.entry.presence?.size">
		<PresenceRating :rating="getMostRecentPresence()[1] ?? 0" />
	</p>
	<p v-if="props.showDate">
		{{ format(props.entry.startTime, props.entry.endTime) }}
	</p>
</template>

<style scoped>
	h2, p.custom-status {
		text-wrap: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
	}

	p.custom-status {
		text-wrap: wrap;
	}
</style>