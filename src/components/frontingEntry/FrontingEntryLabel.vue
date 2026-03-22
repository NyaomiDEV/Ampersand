<script setup lang="ts">
	import { FrontingEntryComplete } from "../../lib/db/entities";
	import dayjs from "dayjs";
	import { formatDate } from "../../lib/util/misc";

	const props = defineProps<{
		entry: FrontingEntryComplete,
	}>();

	function format(startTime: Date, endTime?: Date){
		if(!endTime) return formatDate(startTime, "expanded");

		const start = dayjs(startTime);
		const end = dayjs(endTime);

		if(end.valueOf() - start.endOf("day").valueOf() <= 0) // same day
			return `${formatDate(startTime)}~${formatDate(endTime)}`;
		
		return `${formatDate(startTime, "expanded")} - ${formatDate(endTime, "expanded")}`;
	}
</script>

<template>
	<p v-if="props.entry.influencing" class="influencing" style="color: inherit;">
		{{ $t("frontHistory:influencing", { influencedMember: props.entry.influencing.name }) }}
	</p>
	<p v-if="props.entry.customStatus" class="custom-status" style="color: inherit;">
		{{ props.entry.customStatus }}
	</p>
	<p>
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