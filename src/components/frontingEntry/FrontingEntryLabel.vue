<script setup lang="ts">
	import {
		IonLabel,
	} from "@ionic/vue";

	import { FrontingEntryComplete } from '../../lib/db/entities/frontingEntries';
	import dayjs from "dayjs";
	import RelativeTime from "dayjs/plugin/relativeTime";
	import LocalizedFormat from "dayjs/plugin/localizedFormat";
	import { onMounted, onUnmounted, ref } from "vue";
	import { formatWrittenTime } from "../../lib/util/misc";
	import { appConfig } from "../../lib/config";
	dayjs.extend(RelativeTime);
	dayjs.extend(LocalizedFormat);

	const props = defineProps<{
		entry: FrontingEntryComplete,
	}>();

	const twelveHour = appConfig.locale.twelveHourClock;

	const interval = ref(props.entry.endTime
		? formatWrittenTime(props.entry.endTime, props.entry.startTime)
		: formatWrittenTime(new Date(), props.entry.startTime)
	);

	const intervalRef = ref();

	function format(time: Date){
		return dayjs(time).format(`LL, ${twelveHour ? 'hh:mm A' : "HH:mm"}`)
	}

	onMounted(() => {
		if(!props.entry.endTime){
			intervalRef.value = setInterval(() => {
				interval.value = formatWrittenTime(new Date(), props.entry.startTime);
			}, 1000);
		}
	});

	onUnmounted(() => {
		clearInterval(intervalRef.value);
		intervalRef.value = undefined;
	});
</script>

<template>
	<IonLabel>
		<h3 style="float: right">
			{{ interval }}
		</h3>
		<h3>
			{{ format(props.entry.startTime) }}
			{{
				props.entry.endTime
				? " - " + format(props.entry.endTime)
				: ""
			}}
		</h3>
		<h2>
			{{ props.entry.member.name }}
		</h2>
		<p v-if="props.entry.customStatus">
			{{ props.entry.customStatus }}
		</p>
	</IonLabel>
</template>