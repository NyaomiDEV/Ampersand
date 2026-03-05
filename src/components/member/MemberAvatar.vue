<script setup lang="ts">
	import {
		IonAvatar,
		IonIcon,
	} from "@ionic/vue";

	import { Member } from "../../lib/db/entities";
	import { getObjectURL } from "../../lib/util/blob";
	import { PartialBy } from "../../lib/types";

	import accountCircle from "@material-symbols/svg-600/outlined/account_circle-fill.svg";
	import { isReactive, ref, watch, WatchStopHandle } from "vue";

	const props = defineProps<{
		member: PartialBy<Member, "uuid" | "dateCreated">,
	}>();

	const avatarColor = ref("var(--ion-color-primary)");

	function updateColor() {
		avatarColor.value = props.member.color?.slice(0, 7) ?? "var(--ion-color-primary)";
	}

	let watchHandle: WatchStopHandle | undefined;
	watch(props, () => {
		updateColor();
		if(isReactive(props.member))
			watchHandle = watch(props.member, updateColor);
		else
			if(watchHandle){
				watchHandle();
				watchHandle = undefined;
			}
	}, { immediate: true });
</script>

<template>
	<IonAvatar v-if="props.member.image" class="member-avatar with-outline">
		<img aria-hidden="true" :src="getObjectURL(props.member.image)" />
	</IonAvatar>
	<IonIcon v-else class="member-avatar" :icon="accountCircle" />
</template>

<style scoped>
	.member-avatar {
		width: 56px;
		height: 56px;
	}

	ion-avatar.with-outline {
		outline-width: 2px;
		outline-style: solid;
		outline-color: v-bind('avatarColor');
	}

	ion-icon {
		color: v-bind('avatarColor');
	}
</style>