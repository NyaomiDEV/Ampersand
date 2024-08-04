<script setup lang="ts">
	import {
		IonAvatar,
	} from "@ionic/vue";

	import { Member } from '../../lib/db/entities/members';
	import { getBlobURL } from '../../lib/util/blob';

	const props = defineProps<{
		member: Member,
	}>();
</script>

<template>
	<IonAvatar class="with-outline" :style="{ outlineColor: props.member.color, opacity: props.member.isArchived ? 0.5 : 1}" v-if="props.member.image">
		<img aria-hidden="true" :src="getBlobURL(props.member.image)" />
	</IonAvatar>
</template>

<style scoped>
	ion-avatar.with-outline {
		outline-width: 2px;
		outline-style: solid;
	}
</style>