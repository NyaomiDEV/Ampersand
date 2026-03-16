<script setup lang="ts">
	import {
		IonChip,
		IonLabel,

	} from "@ionic/vue";

	import { Member } from "../../lib/db/entities";

	import Avatar from "../Avatar.vue";

	import accountCircle from "@material-symbols/svg-600/outlined/account_circle-fill.svg";

	const props = defineProps<{
		member: Member,
		clickable?: boolean
	}>();

	const routerLink = props.clickable ? `/members/edit?uuid=${props.member.uuid}` : undefined;
</script>

<template>
	<IonChip :router-link @click="(e) => e.stopPropagation()">
		<Avatar
			:image="props.member.image"
			:clip-shape="props.member.imageClip"
			:color="props.member.color"
			:icon="accountCircle"
		/>
		<IonLabel class="nowrap">
			{{ props.member.name }}
		</IonLabel>
	</IonChip>
</template>

<style scoped>
	.avatar {
		width: 24px;
		height: 24px;
		margin-right: 8px;
	}
</style>