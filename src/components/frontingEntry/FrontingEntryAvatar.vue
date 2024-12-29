<script setup lang="ts">
	import {
		IonAvatar,
	} from "@ionic/vue";

	import { FrontingEntryComplete } from '../../lib/db/entities';
	import { getBlobURL } from '../../lib/util/blob';

	const props = defineProps<{
		entry: FrontingEntryComplete,
	}>();
</script>

<template>
	<IonAvatar slot="start" v-if="props.entry.member.image">
		<img aria-hidden="true" :src="getBlobURL(props.entry.member.image)" />
	</IonAvatar>
</template>