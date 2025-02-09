<script setup lang="ts">
	import {
		IonLabel,
	} from "@ionic/vue";

	import { FrontingEntryComplete } from '../../lib/db/entities';
	import dayjs from "dayjs";
	import { onMounted, onUnmounted, ref } from "vue";
	import { formatDate, formatWrittenTime } from "../../lib/util/misc";

	const props = defineProps<{
		entry: FrontingEntryComplete,
	}>();

	const interval = ref(props.entry.endTime
		? formatWrittenTime(props.entry.endTime, props.entry.startTime)
		: formatWrittenTime(new Date(), props.entry.startTime)
	);

	let intervalRef: number;

	function format(startTime: Date, endTime?: Date){
		if(!endTime) return formatDate(startTime, "expanded");

		const start = dayjs(startTime);
		const end = dayjs(endTime);

		if(end.valueOf() - start.endOf('day').valueOf() <= 0) // same day
			return formatDate(startTime) + "~" + formatDate(endTime);
		
		return formatDate(startTime, "expanded") + " - " + formatDate(endTime, "expanded");
	}

	onMounted(() => {
		if(!props.entry.endTime){
			intervalRef = setInterval(() => {
				interval.value = formatWrittenTime(new Date(), props.entry.startTime);
			}, 1000);
		}
	});

	onUnmounted(() => {
		clearInterval(intervalRef);
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
		<p class="custom-status" v-if="props.entry.customStatus" style="color: inherit;">
			{{ props.entry.customStatus }}
		</p>
		<p>
			{{ format(props.entry.startTime, props.entry.endTime) }}
		</p>
	</IonLabel>
</template>

<style scoped>
	h2, p.custom-status {
		text-wrap: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
	}
</style>