<script setup lang="ts">
	import { onMounted, onUnmounted, ref, watch } from "vue";
	import { formatWrittenTime } from "../../lib/util/misc";
	import { appConfig } from "../../lib/config";
	import { FrontingEntryComplete } from "../../lib/db/entities";

	const props = defineProps<{
		entry: FrontingEntryComplete,
	}>();

	const interval = ref("");
	updateInterval();

	let intervalRef: number;
	function updateInterval(){
		interval.value = props.entry.endTime
			? formatWrittenTime(props.entry.endTime, props.entry.startTime)
			: formatWrittenTime(new Date(), props.entry.startTime);
	}
	watch(props, updateInterval);

	onMounted(() => {
		if(!props.entry.endTime && !appConfig.hideFrontingTimer)
			intervalRef = setInterval(updateInterval, 1000);
	});

	onUnmounted(() => {
		if(!props.entry.endTime && !appConfig.hideFrontingTimer)
			clearInterval(intervalRef);
	});
</script>

<template>
	<slot :interval="interval" />
</template>