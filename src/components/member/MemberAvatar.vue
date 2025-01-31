<script setup lang="ts">
	import {
		IonAvatar,
	} from "@ionic/vue";

	import { Member } from '../../lib/db/entities';
	import { getObjectURL } from '../../lib/util/blob';
	import { PartialBy } from "../../lib/types";

	import accountCircle from "@material-symbols/svg-600/outlined/account_circle.svg";

	const props = defineProps<{
		member: PartialBy<Member, "uuid">,
	}>();
</script>

<template>
	<IonAvatar class="with-outline">
		<img aria-hidden="true" :src="props.member.image ? getObjectURL(props.member.image) : accountCircle" />
	</IonAvatar>
</template>

<style scoped>
	ion-avatar.with-outline {
		outline-width: 2px;
		outline-style: solid;
		outline-color: v-bind('props.member.color');
	}
</style>