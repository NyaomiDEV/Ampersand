<script setup lang="ts">
	import {
		IonLabel,
	} from "@ionic/vue";

	import { FrontingEntryComplete } from '../../lib/db/entities/frontingEntries';
	import dayjs from "dayjs";
	import RelativeTime from "dayjs/plugin/relativeTime";
import { onMounted, onUnmounted, ref } from "vue";
import { formatWrittenTime } from "../../lib/util/misc";
	dayjs.extend(RelativeTime);

	const props = defineProps<{
		entry: FrontingEntryComplete,
	}>();

	const interval = ref(props.entry.endTime
		? formatWrittenTime(props.entry.endTime, props.entry.startTime)
		: formatWrittenTime(new Date(), props.entry.startTime)
	);

	const intervalRef = ref();

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
			{{ dayjs(props.entry.startTime).format("MMMM D, HH:mm") }}
			{{
				props.entry.endTime
				? " - " + dayjs(props.entry.endTime).format("MMMM D, HH:mm")
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