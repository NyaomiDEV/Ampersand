<script setup lang="ts">
	import {
		IonLabel,
	} from "@ionic/vue";

	import { FrontingEntryComplete } from '../../lib/db/entities/frontingEntries';
	import dayjs from "dayjs";
	import RelativeTime from "dayjs/plugin/relativeTime";
	import LocalizedFormat from "dayjs/plugin/localizedFormat";
	import Duration from "dayjs/plugin/duration";
	import { onMounted, onUnmounted, ref } from "vue";
	import { formatWrittenTime } from "../../lib/util/misc";
	import { appConfig } from "../../lib/config";
	dayjs.extend(RelativeTime);
	dayjs.extend(LocalizedFormat);
	dayjs.extend(Duration);

	const props = defineProps<{
		entry: FrontingEntryComplete,
	}>();

	const twelveHour = appConfig.locale.twelveHourClock;

	const interval = ref(props.entry.endTime
		? formatWrittenTime(props.entry.endTime, props.entry.startTime)
		: formatWrittenTime(new Date(), props.entry.startTime)
	);

	const intervalRef = ref();

	function format(startTime: Date, endTime?: Date){
		const start = dayjs(startTime);

		if(!endTime) return start.format(`LL, ${twelveHour ? 'hh:mm A' : "HH:mm"}`);
		const end = dayjs(endTime);

		if(end.valueOf() - start.endOf('day').valueOf() <= 0) // same day
			return start.format(`${twelveHour ? 'hh:mm A' : "HH:mm"}`) + "~" + end.format(twelveHour ? 'hh:mm A' : "HH:mm");
		
		return start.format(`${twelveHour ? 'hh:mm A' : "HH:mm"}`) + " - " + end.format(`LL, ${twelveHour ? 'hh:mm A' : "HH:mm"}`);
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
		<h2>
			{{ props.entry.member.name }}
		</h2>
		<p v-if="props.entry.customStatus" style="color: inherit;">
			{{ props.entry.customStatus }}
		</p>
		<p>
			{{ format(props.entry.startTime, props.entry.endTime) }}
		</p>
	</IonLabel>
</template>