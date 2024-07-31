<script setup lang="ts">
	import {
		IonItem,
		IonAvatar,
		IonLabel,
	} from "@ionic/vue";

	import { FrontingEntryComplete } from '../lib/db/entities/frontingEntries';
	import { getBlobURL } from '../lib/util/blob';
	import dayjs from "dayjs";
	import RelativeTime from "dayjs/plugin/relativeTime";
	dayjs.extend(RelativeTime);

	const props = defineProps<{
		entry: FrontingEntryComplete,
	}>();

</script>

<template>
	<IonItem button @click="(e) => $emit('entryClicked', e)">
		<IonAvatar slot="start" v-if="props.entry.member.image">
			<img aria-hidden="true" :src="getBlobURL(props.entry.member.image)" />
		</IonAvatar>
		<IonLabel>
			<h3 style="float: right">
				{{
					props.entry.endTime
					? dayjs(props.entry.startTime).from(props.entry.endTime, true)
					: dayjs(props.entry.startTime).fromNow(true)
				}}
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
	</IonItem>
</template>