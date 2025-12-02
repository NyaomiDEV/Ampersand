<script setup lang="ts">
	import {
		IonChip,
		IonLabel,
	} from "@ionic/vue";

	import { Member } from "../../lib/db/entities";

	import MemberAvatar from "./MemberAvatar.vue";

	const props = defineProps<{
		member: Member,
		clickable?: boolean
	}>();

	const routerLink = props.clickable ? `/members/edit?disallowEditing=true&uuid=${props.member.id}` : undefined;
</script>

<template>
	<IonChip :router-link @click="(e) => e.stopPropagation()">
		<MemberAvatar :member="props.member" />
		<IonLabel class="nowrap">
			{{ props.member.name }}
		</IonLabel>
	</IonChip>
</template>
